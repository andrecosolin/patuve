/**
 * Groq — LLaMA 3.3 70B para gerar sinônimos do cargo.
 * NÃO retorna vagas — apenas variações do título para ampliar buscas.
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
 * Retorna array de sinônimos/variações do cargo em português.
 * Ex: "Motorista" → ["Motorista", "Motorista entregador", "Motorista de caminhão", "Motorista CNH E"]
 * @param {string} cargo
 * @returns {Promise<string[]>}
 */
module.exports = async function groqSinonimos(cargo) {
  const client = getClient();
  if (!client) return [cargo];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Liste até 5 variações e sinônimos do cargo "${cargo}" usados em anúncios de emprego no Brasil.
Retorne APENAS um array JSON com strings, sem explicação:
["variação 1", "variação 2", "variação 3"]`,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
    }, { signal: controller.signal });

    const texto = completion.choices[0]?.message?.content ?? "[]";
    const limpo = texto.replace(/```json|```/g, "").trim();
    const start = limpo.indexOf("[");
    const end = limpo.lastIndexOf("]");
    if (start === -1 || end === -1) return [cargo];

    const parsed = JSON.parse(limpo.slice(start, end + 1));
    const sinonimos = Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string" && s.trim()).slice(0, 5)
      : [cargo];

    // Garante que o cargo original está incluído
    if (!sinonimos.some((s) => s.toLowerCase() === cargo.toLowerCase())) {
      sinonimos.unshift(cargo);
    }

    return sinonimos;
  } catch {
    return [cargo];
  } finally {
    clearTimeout(timer);
  }
};
