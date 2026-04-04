/**
 * Filtro geográfico: remove vagas estrangeiras quando a busca é por cidade brasileira.
 */

const { isCidadeBrasileira } = require("./cidadesBR");

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

function filtrarPorPais(vagas, cidadeUsuario, isRemoto) {
  // Busca remota: sem filtro geográfico
  if (isRemoto) return vagas;

  // IBGE ainda não carregou: passa tudo (benefício da dúvida)
  const buscaBrasil = isCidadeBrasileira(cidadeUsuario);
  if (buscaBrasil === null) return vagas;

  // Cidade do usuário não é brasileira: sem filtro
  if (!buscaBrasil) return vagas;

  let removidas = 0;
  const resultado = vagas.filter((vaga) => {
    if (!vaga.localizacao) {
      vaga.localizacao = cidadeUsuario;
      return true;
    }

    // Descarta imediatamente se termina em sigla de estado americano/canadense
    // Ex: "Toledo, OH", "Columbia, SC", "Jackson, MS"
    if (temSiglaAmericana(vaga.localizacao)) {
      removidas++;
      return false;
    }

    const cidadeVaga = String(vaga.localizacao).split(",")[0].trim();
    const ehBR = isCidadeBrasileira(cidadeVaga);

    if (ehBR === false) {
      removidas++;
      return false;
    }

    // Indeterminado (cidade não reconhecida pelo IBGE): descarta
    if (ehBR === null) {
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

module.exports = { filtrarPorPais };
