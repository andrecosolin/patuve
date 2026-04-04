/**
 * Filtro geográfico: remove vagas estrangeiras quando a busca é por cidade brasileira.
 */

const { isCidadeBrasileira } = require("./cidadesBR");

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

    const cidadeVaga = String(vaga.localizacao).split(",")[0].trim();
    const ehBR = isCidadeBrasileira(cidadeVaga);

    if (ehBR === false) {
      removidas++;
      return false;
    }

    // Indeterminado (cidade desconhecida): assume brasileira e corrige localização
    if (ehBR === null) {
      vaga.localizacao = cidadeUsuario;
      return true;
    }

    return true;
  });

  if (removidas > 0) {
    console.log(`[filtroGeo] ${removidas} vaga(s) estrangeira(s) removida(s).`);
  }

  return resultado;
}

module.exports = { filtrarPorPais };
