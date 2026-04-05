/**
 * Filtro geográfico: remove vagas estrangeiras quando a busca é por cidade brasileira.
 */

const { isCidadeBrasileira } = require("./cidadesBR");

// Acentos e palavras que provam que é português (sem "senior"/"junior" que também são inglês)
const MARCAS_PORTUGUES = /[ãâáéêíóôúç]|\b(de|em|para|com|na|no|do|da|das|dos|vaga|empresa|cargo|remoto|híbrido|hibrido|presencial|requisitos|experiência|experiencia|nivel|pleno|oportunidade|desenvolvedor|analista|gerente|coordenador|engenheiro|estágio|estagio)\b/i;

// Título começa com "Remote " (inglês) — em PT seria "Remoto"
const TITULO_INGLES_REMOTE = /^remote\s+[a-z]/i;

// Artigos/preposições/verbos que só aparecem em inglês
const TEXTO_INGLES = /\b(the |and |for |with |our |you |we are |is a |is an |will be |looking for |years of |we offer |must have )\b/i;

// Termos de cargo tipicamente ingleses
const CARGO_INGLES = /\b(payroll|staffing|workforce|account executive|account manager|customer success|employee relations|client services|onboarding specialist|sales development|compliance officer|accounting advisor|tax advisor|bookkeeping|cpa firm)\b/i;

// Sinais inequívocos de vaga americana (presentes mesmo em descrição truncada)
const SINAIS_EUA = /\(u\.s\.\)|\bu\.s\b|\busa\b|salary:\s*\$|\$\d{2,3}[,k]|\bwork from home\b|\bis hiring\b|\bremote \(u/i;

/**
 * Retorna true se o texto parece ser em inglês (sem marcas de português).
 */
function pareceIngles(titulo, descricao) {
  const tituloStr = String(titulo ?? "");
  const texto = `${tituloStr} ${descricao ?? ""}`;
  if (MARCAS_PORTUGUES.test(texto)) return false;
  return (
    TITULO_INGLES_REMOTE.test(tituloStr) ||
    TEXTO_INGLES.test(texto) ||
    CARGO_INGLES.test(texto) ||
    SINAIS_EUA.test(texto)
  );
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

// Cidades que existem tanto no Brasil quanto nos EUA (sem estado explícito são ambíguas)
const CIDADES_AMBIGUAS = new Set([
  "colorado", "washington", "california", "califórnia",
  "florida", "flórida", "indiana", "columbia", "nevada",
  "virginia", "georgia", "carolina",
  // Toledo/PR existe mas "Toledo" sem estado também é Toledo/OH
  "toledo",
]);

// Estados brasileiros por extenso — confirma que a localização é BR
// Sem \b final em palavras acentuadas (á, ã, etc. não são \w no JS)
const ESTADOS_BR = /(acre|alagoas|amapá|amapa|amazonas|bahia|ceará|ceara|espirito santo|goiás|goias|maranhão|maranhao|mato grosso|minas gerais|pará|para\b|paraíba|paraiba|paraná|parana\b|pernambuco|piauí|piaui|rio de janeiro|rio grande|rondônia|rondonia|roraima|santa catarina|são paulo|sao paulo|sergipe|tocantins)/i;

/**
 * Retorna true se a localização é ambígua (cidade homônima BR/EUA) e sem estado explícito.
 * "Colorado" → true (ambígua)
 * "Colorado, Paraná" → false (estado BR presente)
 * "Toledo, OH" → já descartada antes por sigla americana
 */
function ehCidadeAmbiguaSemEstado(localizacao) {
  const loc = String(localizacao);
  const cidade = loc.split(",")[0].trim().toLowerCase();

  if (!CIDADES_AMBIGUAS.has(cidade)) return false;

  // Tem estado/cidade brasileira no restante → não é ambígua
  const resto = loc.includes(",") ? loc.slice(loc.indexOf(",") + 1) : "";
  if (ESTADOS_BR.test(resto)) return false;

  // Só tem o nome da cidade, sem estado → ambígua
  return true;
}

function filtrarPorPais(vagas, cidadeUsuario, isRemoto) {
  // Filtro sempre ativo — app serve apenas mercado brasileiro

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

    // Cidade ambígua sem estado explícito → rejeita (ex: "Colorado" sem "Paraná")
    if (ehCidadeAmbiguaSemEstado(loc)) {
      console.log(`[filtroGeo] Removida por cidade ambígua sem estado: ${loc} | ${vaga.titulo}`);
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
