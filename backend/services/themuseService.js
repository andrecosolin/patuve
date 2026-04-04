/**
 * The Muse API — GET https://www.themuse.com/api/public/jobs?page=0&location=Flexible+%2F+Remote
 * Filtra resultados pelo cargo buscado.
 */

const stripHtml = require("../utils/stripHtml");

const TIMEOUT_MS = 8_000;

function toIsoDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

module.exports = async function themuseService(cargo) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = "https://www.themuse.com/api/public/jobs?page=0&location=Flexible+%2F+Remote";
    const res = await fetch(url, {
      headers: { "User-Agent": "Patuve/1.0" },
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const json = await res.json();
    const results = Array.isArray(json.results) ? json.results : [];
    const cargoLower = cargo.toLowerCase();

    return results
      .filter((j) => {
        const name = String(j.name ?? "").toLowerCase();
        const cats = Array.isArray(j.categories) ? j.categories.map((c) => String(c.name ?? "").toLowerCase()).join(" ") : "";
        return name.includes(cargoLower) || cats.includes(cargoLower);
      })
      .filter((j) => j.refs?.landing_page && String(j.refs.landing_page).startsWith("https://"))
      .map((j) => ({
        titulo: String(j.name ?? "Vaga sem titulo"),
        empresa: j.company?.name ? String(j.company.name) : null,
        localizacao: Array.isArray(j.locations) && j.locations.length > 0 ? String(j.locations[0].name) : "Remoto",
        tipo_contrato: null,
        modalidade: "Remoto",
        descricao_curta: stripHtml(j.contents).slice(0, 200),
        link_direto: String(j.refs.landing_page),
        fonte: "The Muse",
        data_publicacao: toIsoDate(j.publication_date),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
