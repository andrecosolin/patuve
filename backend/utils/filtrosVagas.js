/**
 * Camada 3 — Filtros de qualidade estáticos (sem I/O).
 * Remove vagas inválidas antes da validação de links.
 */

// Padrões de URL específica de vaga por plataforma
const PADROES_URL_VALIDA = {
  LinkedIn: /linkedin\.com\/jobs\/view\/\d+/i,
  Gupy: /(?:[a-z0-9-]+\.gupy\.io\/jobs\/\d+|jobs\.gupy\.io\/companies\/[a-z0-9-]+\/jobs\/\d+)/i,
  Indeed: /indeed\.com(?:\.br)?\/viewjob\?jk=[a-z0-9]+/i,
  Catho: /catho\.com\.br\/vagas\/.+-\d+/i,
  InfoJobs: /infojobs\.com\.br\/vagas-de-emprego\/.+/i,
  "Vagas.com": /vagas\.com\/vagas\/.+-\d+/i,
  "trampos.co": /trampos\.co\/oportunidades\/.+/i,
};

// Padrões que indicam página de busca genérica (não vaga específica)
const PADROES_BUSCA_GENERICA = [
  /\/jobs\/search/i,
  /\/jobs\?(?!.*\/view\/)/i,
  /[?&]q=/i,
  /\/search\?/i,
  /\/vagas\?/i,
  /\/oportunidades\?/i,
];

/**
 * Verifica se a URL segue o padrão esperado para a fonte informada.
 * Para fontes desconhecidas, aceita qualquer URL https sem padrão de busca.
 */
function isLinkValido(url, fonte) {
  if (!url || !url.startsWith("https://")) return false;
  if (PADROES_BUSCA_GENERICA.some((p) => p.test(url))) return false;

  const padrao = PADROES_URL_VALIDA[fonte];
  return padrao ? padrao.test(url) : true;
}

const INDICADORES_REMOTO = [
  "remoto", "remote", "home office", "homeoffice",
  "trabalho remoto", "anywhere", "worldwide",
  "trabalhe de casa", "de qualquer lugar",
];

const INDICADORES_PRESENCIAL = [
  "presencial", "on-site", "onsite", "in-office", "in office",
  "modalidade: presencial", "modalidade presencial",
  "modalidade: híbrido", "modalidade hibrido",
];

/**
 * Filtra por modalidade usando texto (título + descrição + localização).
 * Necessário porque a maioria das APIs não retorna o campo modalidade.
 */
function filtrarPorModalidadeTexto(vagas, modalidade) {
  if (!modalidade || modalidade === "Todas") return { vagas, removidas: 0 };

  const aprovadas = [];
  let removidas = 0;

  for (const vaga of vagas) {
    const texto = [vaga.titulo, vaga.descricao_curta, vaga.localizacao]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (modalidade === "Remoto") {
      const temPresencial = INDICADORES_PRESENCIAL.some((i) => texto.includes(i));
      if (temPresencial) {
        console.log(`[filtro] Removida por presencial: ${vaga.titulo}`);
        removidas++;
        continue;
      }

      const temRemoto = INDICADORES_REMOTO.some((i) => texto.includes(i));
      if (!temRemoto) {
        console.log(`[filtro] Removida sem indicador remoto: ${vaga.titulo}`);
        removidas++;
        continue;
      }
    }

    if (modalidade === "Presencial") {
      const temRemoto = INDICADORES_REMOTO.some((i) => texto.includes(i));
      if (temRemoto) {
        console.log(`[filtro] Removida remoto em busca presencial: ${vaga.titulo}`);
        removidas++;
        continue;
      }
    }

    aprovadas.push(vaga);
  }

  return { vagas: aprovadas, removidas };
}

/**
 * Aplica todos os filtros estáticos e retorna vagas aprovadas + contagem de removidas.
 */
function filtrarVagas(vagas, filtros = {}) {
  const modalidadeDesejada = filtros.modalidade && filtros.modalidade !== "Todas" ? filtros.modalidade : null;
  const contratoDesejado = filtros.tipoContrato && filtros.tipoContrato !== "Ambos" ? filtros.tipoContrato : null;

  const seen = new Set();
  const aprovadas = [];
  let removidas = 0;

  for (const vaga of vagas) {
    // Link deve ser http:// ou https://
    if (!vaga.link_direto || !/^https?:\/\//i.test(vaga.link_direto)) {
      removidas++;
      continue;
    }

    // Não pode ser página de busca genérica
    if (PADROES_BUSCA_GENERICA.some((p) => p.test(vaga.link_direto))) {
      removidas++;
      continue;
    }

    // Título mínimo de 5 caracteres
    if (!vaga.titulo || vaga.titulo.trim().length < 5) {
      removidas++;
      continue;
    }

    // Sem duplicatas por link
    if (seen.has(vaga.link_direto)) {
      removidas++;
      continue;
    }

    // Não aceita empresa nula com fonte desconhecida simultaneamente
    if (!vaga.empresa && vaga.fonte === "Outro") {
      removidas++;
      continue;
    }

    // Filtro de tipo contrato (só aplica se vaga tem a info)
    if (contratoDesejado && vaga.tipo_contrato && vaga.tipo_contrato !== contratoDesejado) {
      removidas++;
      continue;
    }

    seen.add(vaga.link_direto);
    aprovadas.push(vaga);
  }

  // Filtro de modalidade por texto (cobre vagas sem campo modalidade preenchido)
  if (modalidadeDesejada) {
    const { vagas: vagasMod, removidas: removidasMod } = filtrarPorModalidadeTexto(aprovadas, modalidadeDesejada);
    return { vagas: vagasMod, removidas: removidas + removidasMod };
  }

  return { vagas: aprovadas, removidas };
}

module.exports = { isLinkValido, filtrarVagas };
