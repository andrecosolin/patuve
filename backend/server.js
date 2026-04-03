const { createHash, randomUUID } = require("crypto");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { filtrarVagas } = require("./utils/filtrosVagas");
const { validarVagas, ordenarPorFonte } = require("./services/validadorVagas");
const { traduzirCargo } = require("./utils/traduzirCargo");
const joobleService = require("./services/joobleService");
const himalayasService = require("./services/himalayasService");
const remoteokService = require("./services/remoteokService");
const jobicyService = require("./services/jobicyService");
const themuseService = require("./services/themuseService");
const arbeitnowService = require("./services/arbeitnowService");
const groqService = require("./services/groqService");

function ordenarPorData(vagas) {
  return [...vagas].sort((a, b) => {
    // Vagas sem data vão para o final
    if (!a.data_publicacao && !b.data_publicacao) return 0;
    if (!a.data_publicacao) return 1;
    if (!b.data_publicacao) return -1;
    // Compara ISO YYYY-MM-DD diretamente como string (ordem lexicográfica = ordem cronológica)
    return b.data_publicacao.localeCompare(a.data_publicacao);
  });
}

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Railway usa proxy reverso
const port = process.env.PORT ?? 3015;

const MAX_SEARCH_TIME_MS = 55_000;
const CACHE_TTL_MS = 30 * 60 * 1000;

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

function nowIso() {
  return new Date().toISOString();
}

function createServerError(message, code = "API_ERROR", status = 500) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
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

const EXPANSOES_SIGLAS = {
  // Tecnologia
  "\\bQA\\b": "QA Quality Assurance Analista de Qualidade Tester",
  "\\bDev\\b": "Desenvolvedor Developer Programador",
  "\\bUI\\b": "UI Design Interface",
  "\\bUX\\b": "UX User Experience Design",
  "\\bBI\\b": "BI Business Intelligence Analista de Dados",
  "\\bDBA\\b": "DBA Administrador de Banco de Dados Database",
  "\\bSRE\\b": "SRE Site Reliability Engineer DevOps",
  "\\bML\\b": "ML Machine Learning Inteligencia Artificial",
  "\\bTI\\b": "TI Tecnologia da Informacao Informatica",
  "\\bPO\\b": "PO Product Owner Dono do Produto",
  "\\bSM\\b": "SM Scrum Master Agile Coach",
  "\\bTA\\b": "TA Tech Lead Lider Tecnico",
  // Negocios e gestao
  "\\bRH\\b": "RH Recursos Humanos Gestao de Pessoas People",
  "\\bCS\\b": "CS Customer Success Sucesso do Cliente",
  "\\bSDR\\b": "SDR Sales Development Representative Pre-vendas Prospeccao",
  "\\bBDR\\b": "BDR Business Development Representative Desenvolvimento de Negocios",
  "\\bCRM\\b": "CRM Customer Relationship Management Relacionamento com Cliente",
  "\\bMKT\\b": "MKT Marketing",
  "\\bCOO\\b": "COO Chief Operating Officer Diretor de Operacoes",
  "\\bCFO\\b": "CFO Chief Financial Officer Diretor Financeiro",
  "\\bCTO\\b": "CTO Chief Technology Officer Diretor de Tecnologia",
  "\\bCEO\\b": "CEO Chief Executive Officer Diretor Executivo",
  // Financeiro e contabil
  "\\bDP\\b": "DP Departamento Pessoal Folha de Pagamento RH",
  "\\bFP\\b": "FP Financeiro Contas a Pagar Contas a Receber",
  "\\bCONT\\b": "CONT Contabilidade Contador Fiscal",
  // Saude
  "\\bTEC\\b": "Tecnico Tecnologo",
  "\\bENF\\b": "Enfermeiro Enfermagem Tecnico de Enfermagem",
  "\\bFISIO\\b": "Fisioterapeuta Fisioterapia Reabilitacao",
  // Industria e logistica
  "\\bPCP\\b": "PCP Planejamento e Controle da Producao Producao Industrial",
  "\\bSGQ\\b": "SGQ Sistema de Gestao da Qualidade Qualidade Industrial ISO",
  "\\bSST\\b": "SST Saude e Seguranca do Trabalho CIPA",
  "\\bWMS\\b": "WMS Warehouse Management System Logistica Estoque",
};

const EXPANSOES_CONTRATO = {
  PJ: "PJ Pessoa Juridica Freelancer Autonomo",
  CLT: "CLT Carteira Assinada Emprego Formal",
  Estagio: "Estagio Trainee Aprendiz",
  Freelance: "Freelance Autonomo PJ Projeto",
};

function expandirSiglas(cargo, tipoContrato) {
  let cargoExpandido = cargo;
  for (const [padrao, expansao] of Object.entries(EXPANSOES_SIGLAS)) {
    cargoExpandido = cargoExpandido.replace(new RegExp(padrao, "i"), expansao);
  }

  const contratoExpandido = EXPANSOES_CONTRATO[tipoContrato] ?? tipoContrato;
  return { cargoExpandido, contratoExpandido };
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


const FONTES_CONHECIDAS = [
  "LinkedIn", "Gupy", "Indeed", "Catho", "InfoJobs", "Vagas.com", "trampos.co",
  "Jooble", "Himalayas", "RemoteOK", "Jobicy", "The Muse", "Arbeitnow",
  "GeekHunter", "99jobs", "Programathor", "Remotar",
];

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

function normalizeDataPublicacao(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // Formato ISO YYYY-MM-DD (esperado)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Formato legado DD/MM/AAAA — converte para YYYY-MM-DD
  const legado = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (legado) return `${legado[3]}-${legado[2]}-${legado[1]}`;
  return null;
}

function normalizeVagas(rawArray) {
  if (!Array.isArray(rawArray)) {
    return [];
  }

  return rawArray
    .filter((item) => item && typeof item.link_direto === "string" && /^https?:\/\//i.test(item.link_direto))
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
      data_publicacao: normalizeDataPublicacao(item.data_publicacao),
    }));
}


function deduplicarPorLink(vagas) {
  const seen = new Set();
  return vagas.filter((v) => {
    const key = String(v.link_direto ?? "").toLowerCase().replace(/\/+$/, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


function extrairResultado(settled, nome) {
  if (settled.status === "fulfilled") {
    const vagas = Array.isArray(settled.value) ? settled.value : [];
    console.log(`[pipeline] ${nome}: ${vagas.length} vagas`);
    return { vagas, falhou: false };
  }
  console.log(`[pipeline] ${nome}: falhou — ${settled.reason?.message ?? "erro desconhecido"}`);
  return { vagas: [], falhou: true };
}

async function buscarVagasComPipeline(filters) {
  const startedAt = Date.now();
  const deadline = startedAt + MAX_SEARCH_TIME_MS;

  let vagasBrutas = [];
  let vagasFiltradas = [];
  let vagasValidadas = [];
  let vagasFinais = [];
  let removidasFiltro = 0;
  let removidasLink = 0;

  // Tradução do cargo para as APIs internacionais
  const { cargoEn, cargoPt } = traduzirCargo(filters.cargo);
  console.log(`[pipeline] Cargo original: "${cargoPt}"`);
  if (cargoEn !== cargoPt.toLowerCase().trim()) {
    console.log(`[pipeline] Cargo traduzido: "${cargoEn}"`);
  }

  // ETAPA 1 — Groq gera sinônimos em paralelo com APIs internacionais
  const [sinonimosResult, ...apisResults] = await Promise.allSettled([
    groqService(cargoPt),
    himalayasService(cargoEn),
    remoteokService(cargoEn),
    jobicyService(cargoEn),
    themuseService(cargoEn),
    arbeitnowService(cargoEn),
  ]);

  const sinonimos = sinonimosResult.status === "fulfilled" ? sinonimosResult.value : [cargoPt];
  console.log(`[pipeline] Groq sinonimos: ${JSON.stringify(sinonimos)}`);

  // ETAPA 2 — Jooble busca cada sinônimo + cidade em PT-BR
  const joobleResults = await Promise.allSettled(
    sinonimos.map((s) => joobleService(s, filters.cidade))
  );

  const nomesApis = ["Himalayas", "RemoteOK", "Jobicy", "TheMuse", "Arbeitnow"];
  let fontesFalharam = 0;
  const todasBrutas = [];

  // Coleta resultados do Jooble
  let totalJooble = 0;
  for (const r of joobleResults) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      totalJooble += r.value.length;
      todasBrutas.push(...r.value);
    } else if (r.status === "rejected") {
      fontesFalharam++;
    }
  }
  console.log(`[pipeline] Jooble: ${totalJooble} vagas (${sinonimos.length} buscas)`);

  // Coleta resultados das APIs internacionais
  for (let i = 0; i < apisResults.length; i++) {
    const { vagas, falhou } = extrairResultado(apisResults[i], nomesApis[i]);
    if (falhou) fontesFalharam++;
    todasBrutas.push(...vagas);
  }

  const parcial = fontesFalharam > 0;
  console.log(`[pipeline] Resultado parcial: ${parcial ? `sim (${fontesFalharam} fonte(s) falharam)` : "nao"}`);
  console.log(`[pipeline] Total bruto: ${todasBrutas.length} vagas`);

  vagasBrutas = normalizeVagas(deduplicarPorLink(todasBrutas));
  console.log(`[pipeline] Apos dedup: ${vagasBrutas.length} vagas`);

  // ETAPA 2 — Filtragem
  const filtered = filtrarVagas(vagasBrutas);
  vagasFiltradas = filtered.vagas;
  removidasFiltro = filtered.removidas;
  console.log(`[pipeline] Apos filtros: ${vagasFiltradas.length} vagas (removidas: ${removidasFiltro})`);

  // ETAPA 3 — Validacao de links (com o tempo restante)
  if (remainingMs(deadline) > 0) {
    const validationStartedAt = Date.now();
    try {
      const validated = await withTimeout(
        () => validarVagas(vagasFiltradas),
        remainingMs(deadline),
        "validacao de links"
      );
      vagasValidadas = validated.vagas;
      removidasLink = validated.removidas;
      console.log(`[pipeline] Apos validacao links: ${vagasValidadas.length} vagas (removidas: ${removidasLink}) em ${Date.now() - validationStartedAt}ms`);
    } catch {
      // Timeout na validacao: mantém vagas sem validar (beneficio da duvida)
      vagasValidadas = vagasFiltradas;
      removidasLink = 0;
      console.log(`[pipeline] Validacao de links encerrada por timeout — mantendo ${vagasValidadas.length} vagas`);
    }
  } else {
    vagasValidadas = vagasFiltradas;
    removidasLink = 0;
  }

  vagasFinais = ordenarPorData(vagasValidadas);

  const meta = {
    total_encontradas: vagasBrutas.length,
    total_validas: vagasFinais.length,
    removidas_filtro: removidasFiltro,
    removidas_link_invalido: removidasLink,
    tempo_busca_ms: Date.now() - startedAt,
    parcial,
  };

  console.log(
    `[pipeline] Final: ${vagasFinais.length} vagas em ${meta.tempo_busca_ms}ms | cargo="${filters.cargo}" cidade="${filters.cidade}" parcial=${parcial}`
  );

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

    if (meta.total_validas === 0) {
      return res.status(504).json({
        erro: "busca_timeout",
        mensagem: "A busca demorou demais. Tente novamente.",
      });
    }

    const payload = { vagas, meta };

    setCacheEntry(cacheKey, payload);

    return res.json({ ...payload, cache: false });
  } catch (error) {
    const mappedError = error?.code
      ? error
      : createServerError(error?.message ?? "Falha ao buscar vagas. Tente novamente em instantes.");

    const status = mappedError?.status ?? 500;
    const code = mappedError?.code ?? "API_ERROR";
    const message = code === "EMPTY_RESPONSE"
      ? "A busca nao retornou vagas validas."
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

