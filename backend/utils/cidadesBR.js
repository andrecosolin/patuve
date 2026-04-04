/**
 * Carrega municípios brasileiros via IBGE para validação geográfica.
 */

const axios = require("axios");

let cidadesSet = null;

function normalizar(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

async function carregarCidades() {
  try {
    console.log("[ibge] Carregando municipios brasileiros...");
    const resp = await axios.get(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
      { timeout: 10_000 }
    );
    cidadesSet = new Set(resp.data.map((c) => normalizar(c.nome)));
    console.log(`[ibge] ${cidadesSet.size} municipios carregados.`);
  } catch (erro) {
    console.error("[ibge] Erro ao carregar:", erro.message);
    cidadesSet = new Set();
  }
}

/**
 * Retorna true se cidade for brasileira, false se estrangeira, null se indeterminado.
 */
function isCidadeBrasileira(cidade) {
  if (!cidade) return null;
  if (!cidadesSet || cidadesSet.size === 0) return null;

  const cidadeNorm = normalizar(String(cidade).split(",")[0].trim());

  if (cidadesSet.has(cidadeNorm)) return true;

  // Tenta cada palavra com mais de 3 letras (cobre "São Paulo, SP" → "sao paulo")
  const partes = cidadeNorm.split(" ");
  for (const parte of partes) {
    if (parte.length > 3 && cidadesSet.has(parte)) return true;
  }

  return false;
}

module.exports = { carregarCidades, isCidadeBrasileira };
