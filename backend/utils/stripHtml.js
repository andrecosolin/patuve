/**
 * Remove tags HTML e entidades do texto de descrição de vagas.
 */

const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&ndash;": "-",
  "&mdash;": "-",
  "&bull;": "•",
  "&hellip;": "...",
};

function stripHtml(raw) {
  if (!raw) return "";
  return String(raw)
    // Remove scripts e styles com conteúdo
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // Remove todas as tags HTML
    .replace(/<[^>]+>/g, " ")
    // Converte entidades nomeadas conhecidas
    .replace(/&[a-z]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? " ")
    // Converte entidades numéricas (ex: &#160;)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Colapsa espaços/quebras de linha em espaço único
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

module.exports = stripHtml;
