/**
 * Formata a data de candidatura (ISO string) para exibição no card.
 * Ex: "2024-07-28T14:30:00Z" → "Candidatado em 28/07"
 */
export function formatarDataCandidatura(isoString: string): string {
  const date = new Date(isoString);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `Candidatado em ${d}/${m}`;
}

/**
 * Formata a data de publicação da vaga (DD/MM/AAAA) para exibição relativa.
 * Ex: "28/07/2024" → "Publicada há 3 dias"
 */
export function formatarPublicacao(dataPublicacao: string | null): string {
  if (!dataPublicacao) return "";
  const parts = dataPublicacao.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) return "";
  const [, d, m, y] = parts;
  const date = new Date(+y, +m - 1, +d);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Publicada hoje";
  if (diffDays === 1) return "Publicada ontem";
  if (diffDays < 7) return `Publicada há ${diffDays} dias`;
  return `Publicada em ${d}/${m}`;
}
