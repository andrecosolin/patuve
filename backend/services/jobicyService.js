/**
 * Jobicy API — GET https://jobicy.com/api/v2/remote-jobs?tag={cargo}&count=20
 * Vagas remotas internacionais.
 */

const TIMEOUT_MS = 8_000;

function toIsoDate(str) {
  if (!str) return null;
  // Format: "2024-01-15 00:00:00"
  const match = String(str).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

module.exports = async function jobicyService(cargo) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(cargo)}&count=20`;
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
        titulo: String(j.jobTitle ?? "Vaga sem titulo"),
        empresa: j.companyName ? String(j.companyName) : null,
        localizacao: String(j.jobGeo ?? "Remoto"),
        tipo_contrato: null,
        modalidade: "Remoto",
        descricao_curta: String(j.jobExcerpt ?? "").replace(/<[^>]+>/g, "").slice(0, 200),
        link_direto: String(j.url),
        fonte: "Jobicy",
        data_publicacao: toIsoDate(j.pubDate),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
