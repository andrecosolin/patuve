/**
 * RemoteOK API — GET https://remoteok.com/api?tag={cargo}
 * O primeiro elemento do array é metadata — deve ser ignorado.
 */

const stripHtml = require("../utils/stripHtml");

const TIMEOUT_MS = 8_000;

function toIsoDate(epoch) {
  if (!epoch) return null;
  const d = new Date(epoch * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

module.exports = async function remoteokService(cargo) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `https://remoteok.com/api?tag=${encodeURIComponent(cargo)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Patuve/1.0" },
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2) return [];

    // Primeiro elemento é metadata
    const jobs = json.slice(1);

    return jobs
      .filter((j) => j.url && String(j.url).startsWith("https://"))
      .map((j) => ({
        titulo: String(j.position ?? "Vaga sem titulo"),
        empresa: j.company ? String(j.company) : null,
        localizacao: "Remoto",
        tipo_contrato: null,
        modalidade: "Remoto",
        descricao_curta: stripHtml(j.description).slice(0, 200),
        link_direto: String(j.url),
        fonte: "RemoteOK",
        data_publicacao: toIsoDate(j.epoch),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
