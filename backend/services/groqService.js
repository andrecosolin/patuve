/**
 * Groq — LLaMA 3.3 70B para busca de vagas.
 * Rápido (~3-5s), sem web search — gera vagas baseadas em conhecimento do modelo.
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

const TIMEOUT_MS = 30_000;

module.exports = async function groqService(cargo, cidade) {
  const client = getClient();
  if (!client) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const prompt = `Você é um especialista em recrutamento no Brasil. Gere uma lista de vagas realistas de "${cargo}" em "${cidade}" no formato JSON.

Baseie-se em vagas típicas que existem nos seguintes sites:
- linkedin.com/jobs
- gupy.io
- catho.com.br
- vagas.com.br
- infojobs.com.br
- indeed.com.br
- sine.com.br
- trampos.co
- programathor.com.br
- remotar.com.br
- olx.com.br/empregos

Retorne APENAS um array JSON válido com até 15 vagas, sem texto antes ou depois, sem markdown:
[
  {
    "titulo": "título exato da vaga",
    "empresa": "nome da empresa ou null",
    "localizacao": "${cidade} ou Remoto",
    "link_direto": "https://url-do-site-de-vagas.com.br/vaga/exemplo",
    "fonte": "nome do site",
    "data_publicacao": null
  }
]

Regras:
- Use URLs reais dos sites listados acima (domínios corretos)
- Os links devem parecer páginas reais de vaga (não invente slugs aleatórios)
- Varie as fontes entre os sites listados
- Inclua empresas reais conhecidas quando possível
- Retorne APENAS o JSON`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    }, { signal: controller.signal });

    const texto = completion.choices[0]?.message?.content ?? "[]";
    const limpo = texto.replace(/```json|```/g, "").trim();

    const start = limpo.indexOf("[");
    const end = limpo.lastIndexOf("]");
    if (start === -1 || end === -1) return [];

    const parsed = JSON.parse(limpo.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn(`[groq] Erro: ${err.message}`);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
};
