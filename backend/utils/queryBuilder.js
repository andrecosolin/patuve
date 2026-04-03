/**
 * Query Builder inteligente usando Groq (LLaMA 3.3).
 * Prepara queries otimizadas para cada API antes da busca.
 */

const Groq = require("groq-sdk");

let groqClient = null;

function getClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) return null;
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const TIMEOUT_MS = 10_000;

/**
 * @param {string} cargo
 * @param {string} cidade
 * @returns {Promise<{pt_query: string, en_query: string, is_remote: boolean, adzuna_country: string, tags: string[]}>}
 */
module.exports = async function buildQuery(cargo, cidade) {
  const fallback = {
    pt_query: cargo,
    en_query: cargo,
    is_remote: /remoto|remote/i.test(cidade),
    adzuna_country: "br",
    tags: [cargo],
  };

  const client = getClient();
  if (!client) return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Atue como um Especialista em Engenharia de Dados de Recrutamento.
O usuário enviou a busca: "${cargo}" e a localidade: "${cidade}".

Sua missão é gerar um objeto JSON otimizado para múltiplas APIs de vagas.

1. Detecção de Idioma: Identifique se a busca está em PT ou EN.
2. Tradução Técnica:
   - Se em PT, gere o termo equivalente em EN para APIs globais (ex: "Desenvolvedor" -> "Software Developer")
   - Se em EN, mantenha o original e gere o termo em PT para Jooble
3. Expansão de Keywords:
   - tags: 3 termos em EN para APIs tech (RemoteOK, Jobicy, Himalayas)
   - pt_query: termo principal em PT-BR para Jooble e Adzuna
4. Filtro de Localidade:
   - Se cidade for "Remoto", "Remote" ou vazia, is_remote: true
   - Caso contrário, is_remote: false

Retorne APENAS este JSON sem texto adicional:
{
  "pt_query": "termo em português",
  "en_query": "termo em inglês",
  "is_remote": false,
  "adzuna_country": "br",
  "tags": ["keyword1", "keyword2", "keyword3"]
}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }, { signal: controller.signal });

    const texto = completion.choices[0]?.message?.content ?? "{}";
    const limpo = texto.replace(/```json|```/g, "").trim();
    const start = limpo.indexOf("{");
    const end = limpo.lastIndexOf("}");
    if (start === -1 || end === -1) return fallback;

    const parsed = JSON.parse(limpo.slice(start, end + 1));

    return {
      pt_query: String(parsed.pt_query || cargo),
      en_query: String(parsed.en_query || cargo),
      is_remote: Boolean(parsed.is_remote),
      adzuna_country: String(parsed.adzuna_country || "br"),
      tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : [cargo],
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
};
