/**
 * Adzuna API — GET https://api.adzuna.com/v1/api/jobs/br/search/1
 * Agrega vagas de múltiplos portais brasileiros.
 */

const TIMEOUT_MS = 8_000;

module.exports = async function adzunaService(cargo, cidade) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.log("[adzuna] Chaves nao configuradas, pulando...");
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "20",
      what: cargo,
      where: cidade,
      content_type: "application/json",
    });

    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/br/search/1?${params}`,
      { signal: controller.signal }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const results = Array.isArray(json.results) ? json.results : [];

    return results
      .filter((v) => v.redirect_url && String(v.redirect_url).startsWith("https://"))
      .map((v) => ({
        titulo: String(v.title ?? "Vaga sem titulo"),
        empresa: v.company?.display_name ? String(v.company.display_name) : null,
        localizacao: String(v.location?.display_name ?? cidade ?? "Brasil"),
        tipo_contrato: null,
        modalidade: null,
        descricao_curta: String(v.description ?? "").replace(/<[^>]+>/g, "").slice(0, 200),
        link_direto: String(v.redirect_url),
        fonte: "Adzuna",
        data_publicacao: v.created ? String(v.created).slice(0, 10) : null,
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};
