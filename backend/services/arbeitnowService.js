/**
 * Arbeitnow API — GET https://arbeitnow.com/api/job-board-api
 * Filtra resultados pelo cargo buscado.
 */

const TIMEOUT_MS = 8_000;

function toIsoDate(epoch) {
  if (!epoch) return null;
  const d = new Date(epoch * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

module.exports = async function arbeitnowService(cargo) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "Patuve/1.0" },
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    const cargoLower = cargo.toLowerCase();

    return data
      .filter((j) => {
        const title = String(j.title ?? "").toLowerCase();
        const tags = Array.isArray(j.tags) ? j.tags.join(" ").toLowerCase() : "";
        return title.includes(cargoLower) || tags.includes(cargoLower);
      })
      .filter((j) => j.url && String(j.url).startsWith("https://"))
      .map((j) => ({
        titulo: String(j.title ?? "Vaga sem titulo"),
        empresa: j.company_name ? String(j.company_name) : null,
        localizacao: j.remote ? "Remoto" : String(j.location ?? "Brasil"),
        tipo_contrato: null,
        modalidade: j.remote ? "Remoto" : null,
        descricao_curta: String(j.description ?? "").replace(/<[^>]+>/g, "").slice(0, 200),
        link_direto: String(j.url),
        fonte: "Arbeitnow",
        data_publicacao: toIsoDate(j.created_at),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
