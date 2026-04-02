/**
 * Himalayas API — GET https://himalayas.app/jobs/api/search?q={cargo}&limit=20
 * Vagas remotas internacionais.
 */

const TIMEOUT_MS = 8_000;

function toIsoDate(epochSeconds) {
  if (!epochSeconds) return null;
  const d = new Date(epochSeconds * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

module.exports = async function himalayasService(cargo) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(cargo)}&limit=20`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Patuve/1.0" },
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const json = await res.json();
    const jobs = Array.isArray(json.jobs) ? json.jobs : [];

    return jobs
      .filter((j) => j.url && String(j.url).startsWith("https://"))
      .map((j) => ({
        titulo: String(j.title ?? "Vaga sem titulo"),
        empresa: j.companyName ? String(j.companyName) : null,
        localizacao: "Remoto",
        tipo_contrato: null,
        modalidade: "Remoto",
        descricao_curta: String(j.description ?? "").replace(/<[^>]+>/g, "").slice(0, 200),
        link_direto: String(j.url),
        fonte: "Himalayas",
        data_publicacao: toIsoDate(j.createdAt),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
