/**
 * Traduz cargos comuns do português para inglês.
 * APIs internacionais usam cargoEn; Anthropic usa o original (cargoPt).
 */

const TRADUCOES = {
  // Desenvolvimento
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
  "desenvolvedor": "developer",
  "programador": "programmer",
  "engenheiro de software": "software engineer",

  // QA / Testes
  "quality assurance": "qa engineer",
  "analista de qualidade": "qa analyst",
  "analista de testes": "test analyst",
  "testador": "tester",
  "qa": "qa engineer",

  // Dados
  "analista de dados": "data analyst",
  "cientista de dados": "data scientist",
  "engenheiro de dados": "data engineer",
  "arquiteto de dados": "data architect",
  "bi analyst": "bi analyst",
  "analista de bi": "bi analyst",
  "analista de business intelligence": "bi analyst",

  // Design
  "designer grafico": "graphic designer",
  "designer ux": "ux designer",
  "designer ui": "ui designer",
  "designer ui/ux": "ui/ux designer",
  "designer ux/ui": "ux/ui designer",
  "web designer": "web designer",
  "designer": "designer",

  // Produto
  "gerente de produto": "product manager",
  "product manager": "product manager",
  "product owner": "product owner",
  "po": "product owner",

  // DevOps / Infra / Segurança
  "devops": "devops engineer",
  "sre": "site reliability engineer",
  "analista de infraestrutura": "infrastructure analyst",
  "administrador de sistemas": "system administrator",
  "analista de seguranca": "security analyst",
  "analista de segurança": "security analyst",
  "engenheiro de seguranca": "security engineer",
  "engenheiro de segurança": "security engineer",

  // Negócios / Gestão
  "analista de negocios": "business analyst",
  "analista de negócios": "business analyst",
  "gerente de projetos": "project manager",
  "gerente de ti": "it manager",
  "scrum master": "scrum master",
  "agile coach": "agile coach",

  // Marketing / Vendas
  "analista de marketing": "marketing analyst",
  "gerente de marketing": "marketing manager",
  "analista de seo": "seo analyst",
  "social media": "social media",
  "vendedor": "sales representative",
  "representante comercial": "sales representative",
  "gerente comercial": "sales manager",
  "sdr": "sales development representative",
  "bdr": "business development representative",
  "customer success": "customer success manager",
  "cs": "customer success manager",

  // RH / Pessoas
  "analista de rh": "hr analyst",
  "analista de recursos humanos": "hr analyst",
  "recrutador": "recruiter",
  "talent acquisition": "talent acquisition",
  "business partner": "hr business partner",

  // Suporte / Atendimento
  "analista de suporte": "support analyst",
  "atendente": "customer service",
  "analista de helpdesk": "helpdesk analyst",
  "analista de help desk": "helpdesk analyst",

  // Finanças / Contabilidade
  "analista financeiro": "financial analyst",
  "contador": "accountant",
  "analista contabil": "accounting analyst",
  "analista contábil": "accounting analyst",
  "controller": "controller",
  "cfo": "cfo",

  // Saúde
  "enfermeiro": "nurse",
  "tecnico de enfermagem": "nursing technician",
  "técnico de enfermagem": "nursing technician",
  "medico": "doctor",
  "médico": "doctor",
  "farmaceutico": "pharmacist",
  "farmacêutico": "pharmacist",
  "fisioterapeuta": "physical therapist",
  "psicologo": "psychologist",
  "psicólogo": "psychologist",

  // Logística / Indústria
  "motorista": "driver",
  "motorista entregador": "delivery driver",
  "operador de logistica": "logistics operator",
  "operador de logística": "logistics operator",
  "analista de logistica": "logistics analyst",
  "analista de logística": "logistics analyst",
  "operador de producao": "production operator",
  "operador de produção": "production operator",

  // Engenharia / Construção
  "eletricista": "electrician",
  "engenheiro civil": "civil engineer",
  "engenheiro eletrico": "electrical engineer",
  "engenheiro elétrico": "electrical engineer",
  "engenheiro mecanico": "mechanical engineer",
  "engenheiro mecânico": "mechanical engineer",
  "arquiteto": "architect",

  // Educação / Jurídico / Outros
  "professor": "teacher",
  "advogado": "lawyer",
  "analista juridico": "legal analyst",
  "analista jurídico": "legal analyst",
};

function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizar(str) {
  return removerAcentos(String(str).toLowerCase().trim()).replace(/\s+/g, " ");
}

/**
 * @param {string} cargo — cargo original (pode ser PT ou EN)
 * @returns {{ cargoEn: string, cargoPt: string }}
 */
function traduzirCargo(cargo) {
  const cargoPt = String(cargo).trim();
  const chave = normalizar(cargoPt);

  // 1. Match exato
  if (TRADUCOES[chave]) {
    return { cargoEn: TRADUCOES[chave], cargoPt };
  }

  // 2. Match parcial: busca a entrada mais longa do dicionário que esteja contida no cargo
  let melhorChave = null;
  let melhorTamanho = 0;
  for (const entrada of Object.keys(TRADUCOES)) {
    if (chave.includes(entrada) && entrada.length > melhorTamanho) {
      melhorChave = entrada;
      melhorTamanho = entrada.length;
    }
  }
  if (melhorChave) {
    // Substitui a parte reconhecida e mantém qualificadores extras
    const cargoEn = chave.replace(melhorChave, TRADUCOES[melhorChave]).trim();
    return { cargoEn, cargoPt };
  }

  // 3. Fallback: usa o cargo original em lowercase (funciona para termos já em inglês)
  return { cargoEn: chave, cargoPt };
}

module.exports = { traduzirCargo };
