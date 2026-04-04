/**
 * Jooble API — POST https://jooble.org/api/{key}
 * Retorna vagas do agregador global Jooble.
 */

const stripHtml = require("../utils/stripHtml");

const TIMEOUT_MS = 8_000;

function toIsoDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function mapModalidade(type) {
  if (!type) return null;
  const t = String(type).toLowerCase();
  if (t.includes("remote")) return "Remoto";
  if (t.includes("hybrid")) return "Hibrido";
  if (t.includes("office") || t.includes("presencial")) return "Presencial";
  return null;
}

module.exports = async function joobleService(cargo, cidade) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];

  const isRemoto = /remoto|remote/i.test(cidade ?? "");

  // Para buscas locais: força ", Brasil" no final para reduzir resultados americanos
  const keywords = isRemoto
    ? cargo
    : `${cargo} ${cidade}, Brasil`.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, resultsOnPage: 20 }),
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const json = await res.json();
    const jobs = Array.isArray(json.jobs) ? json.jobs : [];

    return jobs
      .filter((j) => j.link && /^https?:\/\//i.test(String(j.link)))
      .map((j) => ({
        titulo: String(j.title ?? "Vaga sem titulo"),
        empresa: j.company ? String(j.company) : null,
        localizacao: cidade || String(j.location ?? "Brasil"),
        tipo_contrato: null,
        modalidade: mapModalidade(j.type),
        descricao_curta: stripHtml(j.snippet).slice(0, 200),
        link_direto: String(j.link),
        fonte: "Jooble",
        data_publicacao: toIsoDate(j.updated),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
