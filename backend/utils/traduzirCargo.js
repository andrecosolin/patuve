/**
 * Traduz cargos comuns do português para inglês.
 * Jooble e Anthropic usam cargoPt; demais APIs internacionais usam cargoEn.
 */

// Dicionário de frases completas (match exato ou parcial de frases)
const TRADUCOES_FRASES = {
  // Desenvolvimento — variações compostas primeiro (mais longas = mais específicas)
  "desenvolvedor react native": "react native developer",
  "desenvolvedor frontend": "frontend developer",
  "desenvolvedor front end": "frontend developer",
  "desenvolvedor front-end": "frontend developer",
  "desenvolvedor backend": "backend developer",
  "desenvolvedor back end": "backend developer",
  "desenvolvedor back-end": "backend developer",
  "desenvolvedor fullstack": "fullstack developer",
  "desenvolvedor full stack": "fullstack developer",
  "desenvolvedor full-stack": "fullstack developer",
  "desenvolvedor mobile": "mobile developer",
  "desenvolvedor java": "java developer",
  "desenvolvedor python": "python developer",
  "desenvolvedor node": "node.js developer",
  "desenvolvedor nodejs": "node.js developer",
  "desenvolvedor node.js": "node.js developer",
  "desenvolvedor php": "php developer",
  "desenvolvedor .net": ".net developer",
  "desenvolvedor dotnet": ".net developer",
  "desenvolvedor angular": "angular developer",
  "desenvolvedor vue": "vue.js developer",
  "desenvolvedor vuejs": "vue.js developer",
  "desenvolvedor react": "react developer",
  "desenvolvedor ios": "ios developer",
  "desenvolvedor android": "android developer",
  "engenheiro de software": "software engineer",
  "engenheiro de dados": "data engineer",
  "engenheiro de seguranca": "security engineer",
  "arquiteto de dados": "data architect",
  "analista de qualidade": "qa analyst",
  "analista de testes": "test analyst",
  "analista de dados": "data analyst",
  "analista de bi": "bi analyst",
  "analista de business intelligence": "bi analyst",
  "analista de infraestrutura": "infrastructure analyst",
  "analista de seguranca": "security analyst",
  "analista de negocios": "business analyst",
  "analista de marketing": "marketing analyst",
  "analista de seo": "seo analyst",
  "analista de rh": "hr analyst",
  "analista de recursos humanos": "hr analyst",
  "analista de suporte": "support analyst",
  "analista de helpdesk": "helpdesk analyst",
  "analista de help desk": "helpdesk analyst",
  "analista financeiro": "financial analyst",
  "analista contabil": "accounting analyst",
  "analista de logistica": "logistics analyst",
  "analista juridico": "legal analyst",
  "cientista de dados": "data scientist",
  "administrador de sistemas": "system administrator",
  "gerente de produto": "product manager",
  "gerente de projetos": "project manager",
  "gerente de marketing": "marketing manager",
  "gerente comercial": "sales manager",
  "gerente de ti": "it manager",
  "representante comercial": "sales representative",
  "tecnico de enfermagem": "nursing technician",
  "operador de logistica": "logistics operator",
  "operador de producao": "production operator",
  "operador de caixa": "cashier",
  "engenheiro civil": "civil engineer",
  "engenheiro eletrico": "electrical engineer",
  "engenheiro mecanico": "mechanical engineer",
  "motorista entregador": "delivery driver",
  "quality assurance": "qa engineer",
  "designer grafico": "graphic designer",
  "designer ux": "ux designer",
  "designer ui": "ui designer",
  "web designer": "web designer",
};

// Dicionário de palavras individuais para tradução dinâmica por partes
const TRADUCOES_PALAVRAS = {
  // Cargos / funções
  "desenvolvedor": "developer",
  "dev": "developer",
  "programador": "programmer",
  "engenheiro": "engineer",
  "arquiteto": "architect",
  "analista": "analyst",
  "gerente": "manager",
  "coordenador": "coordinator",
  "assistente": "assistant",
  "auxiliar": "assistant",
  "estagiario": "intern",
  "trainee": "trainee",
  "diretor": "director",
  "supervisor": "supervisor",
  "tecnico": "technician",
  "operador": "operator",
  "consultor": "consultant",
  "especialista": "specialist",
  "lider": "lead",
  "chefe": "head",
  "motorista": "driver",
  "entregador": "delivery driver",
  "vendedor": "sales representative",
  "recrutador": "recruiter",
  "contador": "accountant",
  "enfermeiro": "nurse",
  "medico": "doctor",
  "farmaceutico": "pharmacist",
  "fisioterapeuta": "physical therapist",
  "psicologo": "psychologist",
  "professor": "teacher",
  "advogado": "lawyer",
  "eletricista": "electrician",
  "atendente": "customer service",
  "testador": "tester",
  // Siglas de áreas (sem acento pois normalizar() remove acentos)
  "rh": "hr",
  "ti": "it",
  "dp": "payroll",
  "bi": "bi",
  "qa": "qa",
  "po": "product owner",
  "sm": "scrum master",
  "sre": "sre",
  "cs": "customer success",
  "ux": "ux",
  "ui": "ui",
  "ml": "machine learning",
  "mkt": "marketing",
  "cfo": "cfo",
  "cto": "cto",
  "ceo": "ceo",
  "coo": "coo",
  "sdr": "sales development representative",
  "bdr": "business development representative",
  // Áreas por extenso
  "recursos": "resources",
  "humanos": "human",
  "tecnologia": "technology",
  "informacao": "information",
  "marketing": "marketing",
  "financeiro": "financial",
  "comercial": "sales",
  "logistica": "logistics",
  "producao": "production",
  "qualidade": "quality",
  "seguranca": "security",
  "infraestrutura": "infrastructure",
  "negocios": "business",
  "projetos": "projects",
  "dados": "data",
  "software": "software",
  "sistemas": "systems",
  "suporte": "support",
  // Preposições (removidas na tradução)
  "de": "",
  "do": "",
  "da": "",
  "dos": "",
  "das": "",
  "em": "",
  "e": "",
  "para": "",
};

function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizar(str) {
  return removerAcentos(String(str).toLowerCase().trim()).replace(/\s+/g, " ");
}

function traduzirPorPalavras(chave) {
  const palavras = chave.split(" ");
  const traduzidas = palavras.map((p) => TRADUCOES_PALAVRAS[p] ?? p);
  // Remove strings vazias (preposições removidas) e junta
  return traduzidas.filter(Boolean).join(" ").trim();
}

/**
 * @param {string} cargo — cargo original (pode ser PT ou EN)
 * @returns {{ cargoEn: string, cargoPt: string }}
 */
function traduzirCargo(cargo) {
  const cargoPt = String(cargo).trim();
  const chave = normalizar(cargoPt);

  // 1. Match exato no dicionário de frases
  if (TRADUCOES_FRASES[chave]) {
    return { cargoEn: TRADUCOES_FRASES[chave], cargoPt };
  }

  // 2. Match parcial: substitui a frase mais longa encontrada dentro do cargo
  let melhorChave = null;
  let melhorTamanho = 0;
  for (const entrada of Object.keys(TRADUCOES_FRASES)) {
    if (chave.includes(entrada) && entrada.length > melhorTamanho) {
      melhorChave = entrada;
      melhorTamanho = entrada.length;
    }
  }
  if (melhorChave) {
    const cargoEn = chave.replace(melhorChave, TRADUCOES_FRASES[melhorChave]).trim();
    return { cargoEn, cargoPt };
  }

  // 3. Tradução dinâmica palavra por palavra
  const traduzidoPorPalavras = traduzirPorPalavras(chave);
  if (traduzidoPorPalavras !== chave) {
    return { cargoEn: traduzidoPorPalavras, cargoPt };
  }

  // 4. Fallback: cargo original em lowercase (funciona para termos já em inglês)
  return { cargoEn: chave, cargoPt };
}

module.exports = { traduzirCargo };
