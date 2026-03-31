const { createHash, randomUUID } = require("crypto");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Anthropic = require("@anthropic-ai/sdk");

const { filtrarVagas } = require("./utils/filtrosVagas");
const { validarVagas, ordenarPorFonte } = require("./services/validadorVagas");

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3015;

const MAX_SEARCH_TIME_MS = 55_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_MS_FOR_RETRY = 2_500;

const inMemoryCache = new Map();

// helmet com crossOriginResourcePolicy desabilitado para compatibilidade com apps mobile
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());

app.use(express.json());

const limiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisicoes. Tente novamente em 1 minuto.", code: "RATE_LIMIT" },
});

let anthropicClient = null;

function nowIso() {
  return new Date().toISOString();
}

function createServerError(message, code = "API_ERROR", status = 500) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function getClient() {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw createServerError("ANTHROPIC_API_KEY nao configurada no ambiente.", "INVALID_API_KEY", 500);
    }

    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return anthropicClient;
}

function normalizeFilters(filters) {
  return {
    cargo: String(filters.cargo ?? "").trim(),
    cidade: String(filters.cidade ?? "").trim(),
    tipoContrato: String(filters.tipoContrato ?? "Ambos").trim(),
    nivel: String(filters.nivel ?? "Todos").trim(),
    modalidade: String(filters.modalidade ?? "Todas").trim(),
  };
}

function buildCacheKey(filters) {
  const normalized = normalizeFilters(filters);
  return createHash("md5").update(JSON.stringify(normalized).toLowerCase()).digest("hex");
}

function getCacheEntry(key) {
  const entry = inMemoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    inMemoryCache.delete(key);
    return null;
  }

  return entry;
}

function setCacheEntry(key, payload) {
  inMemoryCache.set(key, {
    data: payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of inMemoryCache.entries()) {
    if (now > entry.expiresAt) {
      inMemoryCache.delete(key);
    }
  }
}

setInterval(cleanupExpiredCache, 60_000).unref();

function buildPrompt({ cargo, cidade, tipoContrato, nivel, modalidade }) {
  const filtrosAtivos = [
    tipoContrato !== "Ambos" && `tipo de contrato ${tipoContrato}`,
    nivel !== "Todos" && `nivel ${nivel}`,
    modalidade !== "Todas" && `modalidade ${modalidade}`,
  ].filter(Boolean);

  const muitosFiltros = filtrosAtivos.length > 2;
  const contextoFiltros = muitosFiltros
    ? `Prefira ${filtrosAtivos.join(", ")} mas inclua variacoes proximas quando necessario.`
    : filtrosAtivos.length > 0
      ? `Considere como filtros principais: ${filtrosAtivos.join(" | ")}.`
      : "";

  return `Voce e especialista em busca de vagas de emprego no Brasil.
Busque vagas ATIVAS e RECENTES (ultimos 30 dias) para "${cargo}" em "${cidade}".
${contextoFiltros}

Regras de qualidade:
- Foque em links diretos e unicos da vaga (https://)
- Priorize: linkedin.com/jobs, gupy.io, indeed.com.br, catho.com.br, infojobs.com.br, vagas.com, trampos.co
- Nao use paginas de busca generica
- Retorne ate 10 vagas com estes campos:
  titulo, empresa, localizacao, tipo_contrato, modalidade, descricao_curta, link_direto, fonte, data_publicacao
- descricao_curta: ate 200 caracteres
- data_publicacao: formato OBRIGATORIO "DD/MM/AAAA" (ex: "28/07/2025") ou null se nao encontrada — NUNCA retorne datas relativas como "há 2 dias" ou formato ISO

Retorne APENAS um JSON array valido, sem texto adicional.`;
}

function buildRetryPrompt(cargo, cidade, count) {
  return `Foram encontradas apenas ${count} vagas validas.
Busque mais vagas de "${cargo}" em "${cidade}" e cidades proximas no Brasil.
Aceite variacoes de titulo e modalidade proximas.
Retorne APENAS JSON array com links diretos.`;
}

const TOOLS = [
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 8,
    user_location: {
      type: "approximate",
      country: "BR",
      timezone: "America/Sao_Paulo",
    },
  },
];

async function callClaude(messages) {
  return getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages,
    tools: TOOLS,
  });
}

async function runUntilDone(initialMessages) {
  let messages = initialMessages;
  let response = await callClaude(messages);

  while (response.stop_reason === "pause_turn") {
    messages = [...messages, { role: "assistant", content: response.content }];
    response = await callClaude(messages);
  }

  return { response, messages };
}

function withTimeout(task, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(createServerError(`Tempo limite atingido em ${label}.`, "SEARCH_TIMEOUT", 504));
    }, timeoutMs);

    task()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function remainingMs(deadline) {
  return Math.max(0, deadline - Date.now());
}

function extractText(response) {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function extractJsonArray(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");

  if (start === -1 || end === -1) {
    throw createServerError("Nenhum array JSON encontrado na resposta do modelo.", "EMPTY_RESPONSE", 502);
  }

  return JSON.parse(text.slice(start, end + 1));
}

const FONTES_CONHECIDAS = ["LinkedIn", "Gupy", "Indeed", "Catho", "InfoJobs", "Vagas.com", "trampos.co"];

function normalizeFonte(raw) {
  const source = String(raw ?? "");
  return FONTES_CONHECIDAS.find((fonte) => source.toLowerCase().includes(fonte.toLowerCase())) ?? "Outro";
}

function normalizeTipoContrato(raw) {
  if (!raw) return null;

  const source = String(raw);
  if (/est[aá]gio/i.test(source)) return "Estagio";
  return ["CLT", "PJ", "Freelance", "Trainee"].find((tipo) => source.toLowerCase().includes(tipo.toLowerCase())) ?? null;
}

function normalizeModalidade(raw) {
  if (!raw) return null;

  const source = String(raw);
  if (/h[ií]brido/i.test(source)) return "Hibrido";
  if (/remoto/i.test(source)) return "Remoto";
  if (/presencial/i.test(source)) return "Presencial";
  return null;
}

function normalizeVagas(rawArray) {
  if (!Array.isArray(rawArray)) {
    return [];
  }

  return rawArray
    .filter((item) => item && typeof item.link_direto === "string" && item.link_direto.startsWith("https://"))
    .map((item) => ({
      id: item.id ? String(item.id) : randomUUID(),
      titulo: String(item.titulo ?? "Vaga sem titulo"),
      empresa: item.empresa ? String(item.empresa) : null,
      localizacao: String(item.localizacao ?? "Brasil"),
      tipo_contrato: normalizeTipoContrato(item.tipo_contrato),
      modalidade: normalizeModalidade(item.modalidade),
      descricao_curta: String(item.descricao_curta ?? "").slice(0, 200),
      link_direto: String(item.link_direto),
      fonte: normalizeFonte(item.fonte),
      data_publicacao: item.data_publicacao ? String(item.data_publicacao) : null,
    }));
}

function mapAnthropicError(error) {
  const sourceCode = error?.error?.type ?? error?.code;

  if (sourceCode === "authentication_error") {
    return createServerError("A chave da API da Anthropic e invalida ou nao tem permissao.", "INVALID_API_KEY", 401);
  }

  if (sourceCode === "billing_error") {
    return createServerError("A conta Anthropic esta sem creditos para concluir a busca.", "API_ERROR", 402);
  }

  if (sourceCode === "timeout_error") {
    return createServerError("A Anthropic demorou demais para responder.", "API_ERROR", 504);
  }

  return createServerError(error?.message ?? "Falha ao consultar a Anthropic.", sourceCode ?? "API_ERROR", error?.status ?? 500);
}

async function buscarVagasComPipeline(filters) {
  const startedAt = Date.now();
  const deadline = startedAt + MAX_SEARCH_TIME_MS;

  let messages = [];
  let response = null;
  let vagasBrutas = [];
  let vagasFiltradas = [];
  let vagasValidadas = [];
  let vagasFinais = [];
  let removidasFiltro = 0;
  let removidasLink = 0;
  let timedOut = false;

  const runAnthropicStep = async (label, task) => {
    const started = Date.now();
    console.log(`[${nowIso()}] [pipeline] Inicio da chamada Anthropic (${label})`);
    const result = await task();
    console.log(`[${nowIso()}] [pipeline] Fim da chamada Anthropic (${label}) em ${Date.now() - started}ms`);
    return result;
  };

  try {
    const firstPass = await runAnthropicStep("busca IA", () =>
      withTimeout(() => runUntilDone([{ role: "user", content: buildPrompt(filters) }]), remainingMs(deadline), "busca IA")
    );
    messages = firstPass.messages;
    response = firstPass.response;
    vagasBrutas = normalizeVagas(extractJsonArray(extractText(response)));

    if (vagasBrutas.length < 5 && remainingMs(deadline) > MIN_MS_FOR_RETRY) {
      try {
        const retryPass = await runAnthropicStep("retry IA", () =>
          withTimeout(
            () =>
              runUntilDone([
                ...messages,
                { role: "assistant", content: response.content },
                { role: "user", content: buildRetryPrompt(filters.cargo, filters.cidade, vagasBrutas.length) },
              ]),
            remainingMs(deadline),
            "retry IA"
          )
        );

        const retryVagas = normalizeVagas(extractJsonArray(extractText(retryPass.response)));
        if (retryVagas.length > vagasBrutas.length) {
          vagasBrutas = retryVagas;
        }
      } catch (retryError) {
        if (retryError?.code === "SEARCH_TIMEOUT") {
          timedOut = true;
        } else {
          console.warn(`[pipeline] Retry falhou: ${retryError.message}`);
        }
      }
    }

    const filtered = filtrarVagas(vagasBrutas);
    vagasFiltradas = filtered.vagas;
    removidasFiltro = filtered.removidas;

    if (remainingMs(deadline) > 0) {
      const validationStartedAt = Date.now();
      console.log(`[${nowIso()}] [pipeline] Inicio da validacao de links`);
      try {
        const validated = await withTimeout(
          () => validarVagas(vagasFiltradas),
          remainingMs(deadline),
          "validacao de links"
        );
        vagasValidadas = validated.vagas;
        removidasLink = validated.removidas;
        console.log(`[${nowIso()}] [pipeline] Fim da validacao de links em ${Date.now() - validationStartedAt}ms`);
      } catch (validationError) {
        timedOut = validationError?.code === "SEARCH_TIMEOUT";
        console.log(`[${nowIso()}] [pipeline] Fim da validacao de links com falha em ${Date.now() - validationStartedAt}ms`);
        // Timeout/erro na validacao: mantem vagas filtradas (beneficio da duvida)
        vagasValidadas = vagasFiltradas;
        removidasLink = 0;
      }
    } else {
      timedOut = true;
      vagasValidadas = vagasFiltradas;
      removidasLink = 0;
    }

    vagasFinais = ordenarPorFonte(vagasValidadas);
  } catch (error) {
    if (error?.code === "SEARCH_TIMEOUT") {
      timedOut = true;
      if (vagasValidadas.length > 0) {
        vagasFinais = ordenarPorFonte(vagasValidadas);
      } else if (vagasFiltradas.length > 0) {
        vagasFinais = ordenarPorFonte(vagasFiltradas);
      } else {
        vagasFinais = ordenarPorFonte(vagasBrutas);
      }
    } else {
      throw error;
    }
  }

  const totalEncontradas = vagasBrutas.length;
  const meta = {
    total_encontradas: totalEncontradas,
    total_validas: vagasFinais.length,
    removidas_filtro: removidasFiltro,
    removidas_link_invalido: removidasLink,
    tempo_busca_ms: Date.now() - startedAt,
    timed_out: timedOut,
  };

  console.log(
    `[${nowIso()}] [pipeline] cargo="${filters.cargo}" cidade="${filters.cidade}" validas=${meta.total_validas} tempo_ms=${meta.tempo_busca_ms} timeout=${timedOut}`
  );
  console.log(`[${nowIso()}] [pipeline] Motivo do encerramento: ${timedOut ? "timeout" : "sucesso"}`);

  return { vagas: vagasFinais, meta };
}

app.get("/", (_req, res) => {
  res.json({ app: "Patuvê Backend", status: "ok" });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.post("/buscar-vagas", limiter, async (req, res) => {
  try {
    const normalized = normalizeFilters(req.body ?? {});

    if (!normalized.cargo || !normalized.cidade) {
      return res.status(400).json({ error: "Os campos 'cargo' e 'cidade' sao obrigatorios.", code: "API_ERROR" });
    }

    const cacheKey = buildCacheKey(normalized);
    const cachedEntry = getCacheEntry(cacheKey);

    if (cachedEntry) {
      return res.json({ ...cachedEntry.data, cache: true });
    }

    const { vagas, meta } = await buscarVagasComPipeline(normalized);

    if (meta.timed_out && meta.total_validas === 0) {
      return res.status(504).json({
        erro: "busca_timeout",
        mensagem: "A busca demorou demais. Tente novamente.",
      });
    }

    const payload = { vagas, meta };

    setCacheEntry(cacheKey, payload);

    return res.json({ ...payload, cache: false });
  } catch (error) {
    const mappedError = error?.error?.type
      ? mapAnthropicError(error)
      : error?.code
        ? error
        : createServerError(error?.message ?? "Falha ao buscar vagas. Tente novamente em instantes.");

    const status = mappedError?.status ?? 500;
    const code = mappedError?.code ?? "API_ERROR";
    const message =
      code === "INVALID_API_KEY"
        ? "A chave da API da Anthropic e invalida ou nao tem permissao."
        : code === "EMPTY_RESPONSE"
          ? "A IA nao retornou vagas validas para esta busca."
          : mappedError?.message ?? "Falha ao buscar vagas. Tente novamente em instantes.";

    console.error("[buscar-vagas] Erro:", mappedError?.message ?? error);
    return res.status(status).json({
      error: message,
      code,
      details: process.env.NODE_ENV === "development" ? mappedError?.message : undefined,
    });
  }
});

app.listen(port, () => {
  console.log(`[patuve] Servidor rodando em http://localhost:${port}`);
});

