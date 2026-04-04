/**
 * Retorna o label exibido no card após o usuário abrir a vaga.
 */
export function formatarDataCandidatura(_isoString: string): string {
  return "Visualizada";
}

/**
 * Formata a data de publicação da vaga para exibição relativa.
 * Aceita YYYY-MM-DD (formato atual) e DD/MM/AAAA (legado).
 * Ex: "2024-07-28" → "Publicada há 3 dias"
 */
export function formatarPublicacao(dataPublicacao: string | null): string {
  if (!dataPublicacao) return "";

  let date: Date;
  const iso = dataPublicacao.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const legado = dataPublicacao.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (iso) {
    const [, y, m, d] = iso;
    date = new Date(+y, +m - 1, +d);
  } else if (legado) {
    const [, d, m, y] = legado;
    date = new Date(+y, +m - 1, +d);
  } else {
    return "";
  }

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Publicada hoje";
  if (diffDays === 1) return "Publicada ontem";
  if (diffDays < 7) return `Publicada há ${diffDays} dias`;
  return `Publicada em ${d}/${m}`;
}
