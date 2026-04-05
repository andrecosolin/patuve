/**
 * Filtro geográfico: remove vagas estrangeiras quando a busca é por cidade brasileira.
 */

const { isCidadeBrasileira } = require("./cidadesBR");

// Artigos/preposições/palavras comuns que só existem em inglês
const PALAVRAS_INGLES = /\b(the|and|for|with|our|your|you|we|are|have|will|this|that|from|its|been|can|may|must|shall|should|would|could|an\s|at\s|by\s|is\s|of\s|on\s|or\s|to\s)\b/i;
// Acentos e palavras que provam que é português
const MARCAS_PORTUGUES = /[ãâáéêíóôúç]|\b(de|em|para|com|na|no|do|da|das|dos|vaga|empresa|cargo|remoto|híbrido|hibrido|presencial|requisitos|experiência|experiencia|nivel|júnior|junior|pleno|sênior|senior)\b/i;

/**
 * Retorna true se o texto parece ser em inglês (sem marcas de português).
 */
function pareceIngles(titulo, descricao) {
  const texto = `${titulo ?? ""} ${descricao ?? ""}`;
  if (MARCAS_PORTUGUES.test(texto)) return false;
  return PALAVRAS_INGLES.test(texto);
}

// Siglas de estados americanos (e canadenses) que não existem como siglas brasileiras
const SIGLAS_ESTADOS_EUA = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
  // Canadá
  "ON","QC","BC","AB","MB","SK","NS","NB","NL","PE","NT","YT","NU",
]);

function temSiglaAmericana(localizacao) {
  // Detecta padrões como "Toledo, OH" ou "San Paulo, TX"
  const match = String(localizacao).match(/,\s*([A-Z]{2})\s*$/);
  return match ? SIGLAS_ESTADOS_EUA.has(match[1]) : false;
}

// Localizações genéricas aceitas sempre — não indicam país estrangeiro
const LOCALIZACOES_NEUTRAS = /^(remoto|remote|brasil|brazil|home\s*office|anywhere|worldwide|global)$/i;

function filtrarPorPais(vagas, cidadeUsuario, isRemoto) {
  // Filtro sempre ativo — app serve apenas mercado brasileiro
  // Para buscas remotas: aceita "Remote"/"Remoto"/"Brasil" mas descarta cidades estrangeiras explícitas

  let removidas = 0;
  const resultado = vagas.filter((vaga) => {
    if (!vaga.localizacao) {
      vaga.localizacao = cidadeUsuario;
      return true;
    }

    // Descarta vagas em inglês sem nenhuma marca de português
    if (pareceIngles(vaga.titulo, vaga.descricao_curta)) {
      console.log(`[filtroGeo] Removida por idioma (inglês): ${vaga.titulo}`);
      removidas++;
      return false;
    }

    const loc = String(vaga.localizacao).trim();

    // Localização neutra (Remote, Brasil, Home Office...) — sempre aceita
    if (LOCALIZACOES_NEUTRAS.test(loc)) return true;

    // Descarta imediatamente se termina em sigla americana/canadense
    if (temSiglaAmericana(loc)) {
      removidas++;
      return false;
    }

    const cidadeVaga = loc.split(",")[0].trim();
    const ehBR = isCidadeBrasileira(cidadeVaga);

    if (ehBR === false) {
      removidas++;
      return false;
    }

    // Indeterminado: em busca remota aceita (pode ser empresa BR sem cidade), em busca local descarta
    if (ehBR === null) {
      if (isRemoto) return true;
      removidas++;
      return false;
    }

    return true;
  });

  if (removidas > 0) {
    console.log(`[filtroGeo] ${removidas} vaga(s) estrangeira(s) removida(s).`);
  }

  return resultado;
}

module.exports = { filtrarPorPais, pareceIngles };
