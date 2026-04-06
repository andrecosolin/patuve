/**
 * Teste robusto — simula vagas EUA com títulos neutros
 * Valida que filtroGeo.pareceIngles e filtrosVagas.filtrarIdioma
 * bloqueiam os casos mais difíceis.
 */

const { filtrarVagas, filtrarIdioma } = require("../utils/filtrosVagas");
const { filtrarPorPais, pareceIngles } = require("../utils/filtroGeo");
const { carregarCidades } = require("../utils/cidadesBR");

let passou = 0;
let falhou = 0;

async function main() {
// Carrega IBGE para que isCidadeBrasileira funcione corretamente
await carregarCidades();

function ok(label) {
  console.log(`  ✅ ${label}`);
  passou++;
}
function fail(label, detalhe) {
  console.log(`  ❌ ${label}${detalhe ? ` — ${detalhe}` : ""}`);
  falhou++;
}

function testar(label, resultado, esperado) {
  if (resultado === esperado) ok(label);
  else fail(label, `obteve=${resultado} esperado=${esperado}`);
}

// ── Seção 1: pareceIngles ─────────────────────────────────────────
console.log("\n── pareceIngles ──────────────────────────────────────────────");

testar(
  "Agate CPA — título neutro, descricao com Remote (U.S.)",
  pareceIngles(
    "Client Accounting Advisor (CAS)",
    "Remote (U.S.) — 100% Work From Home Salary: $130,000"
  ),
  true
);

testar(
  "Título 'Remote Senior DevOps' → inglês",
  pareceIngles("Remote Senior DevOps Engineer", "We are looking for a cloud expert"),
  true
);

testar(
  "Vaga BR legítima com acentos → não é inglês",
  pareceIngles("Desenvolvedor Back-end Pleno", "Empresa em São Paulo busca desenvolvedor"),
  false
);

testar(
  "Vaga BR sem acentos mas com palavras PT → não é inglês",
  pareceIngles("Analista de Dados", "empresa busca profissional de dados"),
  false
);

testar(
  "Salary $120,000 na descrição → inglês",
  pareceIngles("Staff Engineer", "Salary: $120,000 annually"),
  true
);

testar(
  "Payroll Specialist → CARGO_INGLES → inglês",
  pareceIngles("Payroll Specialist", "Join our HR team"),
  true
);

testar(
  "Account Manager → CARGO_INGLES → inglês",
  pareceIngles("Account Manager LATAM", "We are hiring for our sales team"),
  true
);

testar(
  "Sinal 'is hiring' na descricao → inglês",
  pareceIngles("Product Designer", "Our startup is hiring a talented designer"),
  true
);

testar(
  "'work from home' na descricao (sem marcas PT) → inglês",
  pareceIngles("Support Technician", "100% work from home position available"),
  true
);

testar(
  "Suporte Técnico (acento PT) com 'work from home' → aceito (título é PT)",
  pareceIngles("Suporte Técnico", "100% work from home position available"),
  false
);

testar(
  "Texto '(u.s.)' na descricao → inglês",
  pareceIngles("Customer Success Manager", "Based in (u.s.) or Canada"),
  true
);

// ── Seção 2: filtrarIdioma ─────────────────────────────────────────
console.log("\n── filtrarIdioma ─────────────────────────────────────────────");

const vagasTesteIdioma = [
  {
    id: "1",
    titulo: "Client Accounting Advisor (CAS)",
    descricao_curta: "Remote (U.S.) — 100% Work From Home Salary: $130,000",
    link_direto: "https://jooble.org/desc/1",
    empresa: "Agate CPA",
    fonte: "Jooble",
    localizacao: "Remote",
  },
  {
    id: "2",
    titulo: "Desenvolvedor Front-end Pleno",
    descricao_curta: "Empresa em Belo Horizonte busca dev React com 3 anos de experiência.",
    link_direto: "https://jooble.org/desc/2",
    empresa: "TechBR",
    fonte: "Jooble",
    localizacao: "Belo Horizonte, MG",
  },
  {
    id: "3",
    titulo: "Remote Software Engineer",
    descricao_curta: "We are looking for a backend engineer. Benefits include health insurance.",
    link_direto: "https://jooble.org/desc/3",
    empresa: "US Corp",
    fonte: "Jooble",
    localizacao: "Remote",
  },
  {
    id: "4",
    titulo: "Analista de Suporte",
    descricao_curta: "Vaga para analista de suporte técnico em empresa de TI. Requisitos: inglês avançado.",
    link_direto: "https://jooble.org/desc/4",
    empresa: "SuporteBR",
    fonte: "Jooble",
    localizacao: "São Paulo, SP",
  },
  {
    id: "5",
    titulo: "Staff Accountant",
    descricao_curta: "We offer competitive salary range $75k-$90k. Equal opportunity employer.",
    link_direto: "https://jooble.org/desc/5",
    empresa: "CPA Firm USA",
    fonte: "Jooble",
    localizacao: "Remote",
  },
];

const { vagas: aprovadas, removidas } = filtrarIdioma(vagasTesteIdioma);
const idsAprovados = new Set(aprovadas.map((v) => v.id));

testar("Agate CPA bloqueada pelo filtrarIdioma", idsAprovados.has("1"), false);
testar("Dev Front-end BR aprovado", idsAprovados.has("2"), true);
testar("Remote Software Engineer bloqueado", idsAprovados.has("3"), false);
testar("Analista de Suporte BR aprovado", idsAprovados.has("4"), true);
testar("Staff Accountant $75k bloqueado", idsAprovados.has("5"), false);
testar(`Total removidas: esperado 3, obtido ${removidas}`, removidas, 3);

// ── Seção 3: filtrarPorPais ────────────────────────────────────────
console.log("\n── filtrarPorPais ────────────────────────────────────────────");

const vagasTesteGeo = [
  {
    id: "g1",
    titulo: "Client Accounting Advisor (CAS)",
    descricao_curta: "Remote (U.S.) — 100% Work From Home Salary: $130,000",
    link_direto: "https://jooble.org/desc/g1",
    empresa: "Agate CPA",
    localizacao: "Remote",
  },
  {
    id: "g2",
    titulo: "DevOps Engineer",
    descricao_curta: "We are looking for DevOps. Apply now. Join our team.",
    link_direto: "https://jooble.org/desc/g2",
    empresa: "US Tech",
    localizacao: "California",
  },
  {
    id: "g3",
    titulo: "Engenheiro DevOps",
    descricao_curta: "Empresa em Florianópolis busca engenheiro DevOps com experiência em AWS.",
    link_direto: "https://jooble.org/desc/g3",
    empresa: "TechFloripa",
    localizacao: "Florianópolis, SC",
  },
  {
    id: "g4",
    titulo: "Product Designer",
    descricao_curta: "Toledo, OH based role. Our startup is hiring a talented designer.",
    link_direto: "https://jooble.org/desc/g4",
    empresa: "Design Co",
    localizacao: "Toledo, OH",
  },
  {
    id: "g5",
    titulo: "Colorado Remote Job",
    descricao_curta: "Remote opportunity. No location required.",
    link_direto: "https://jooble.org/desc/g5",
    empresa: "Some Co",
    localizacao: "Colorado",
  },
];

const geoBR = filtrarPorPais(vagasTesteGeo, "Brasil", true);
const idsGeo = new Set(geoBR.map((v) => v.id));

testar("Agate CPA bloqueada pelo filtrarPorPais", idsGeo.has("g1"), false);
testar("California bloqueada (TEXTO_INGLES)", idsGeo.has("g2"), false);
testar("Engenheiro DevOps, Florianópolis SC aprovado", idsGeo.has("g3"), true);
testar("Toledo, OH bloqueada (sigla EUA)", idsGeo.has("g4"), false);
testar("Colorado sem estado BR bloqueado (cidade ambígua)", idsGeo.has("g5"), false);

// Siglas brasileiras que colidiam com EUA — não devem mais ser bloqueadas
const vagasSiglasBR = [
  { id: "s1", titulo: "Analista de TI", descricao_curta: "Vaga presencial em Florianópolis.", link_direto: "https://j.co/s1", empresa: "TechSC", localizacao: "Florianópolis, SC" },
  { id: "s2", titulo: "Dev Backend", descricao_curta: "Empresa em Belém busca desenvolvedor.", link_direto: "https://j.co/s2", empresa: "TechPA", localizacao: "Belém, PA" },
  { id: "s3", titulo: "Analista Fiscal", descricao_curta: "Vaga em Campo Grande para analista.", link_direto: "https://j.co/s3", empresa: "FiscalMS", localizacao: "Campo Grande, MS" },
  { id: "s4", titulo: "Engenheiro Civil", descricao_curta: "Cuiabá, oportunidade de engenharia.", link_direto: "https://j.co/s4", empresa: "ConstrMT", localizacao: "Cuiabá, MT" },
  { id: "s5", titulo: "Advogado", descricao_curta: "Escritório em Maceió precisa de advogado.", link_direto: "https://j.co/s5", empresa: "JurAL", localizacao: "Maceió, AL" },
  { id: "s6", titulo: "Professor", descricao_curta: "Escola em São Luís busca professor.", link_direto: "https://j.co/s6", empresa: "EduMA", localizacao: "São Luís, MA" },
];

console.log("\n── Siglas BR que colidiiam com EUA ────────────────────────────");
const geoSiglasBR = filtrarPorPais(vagasSiglasBR, "Brasil", false);
const idsSiglasBR = new Set(geoSiglasBR.map((v) => v.id));
testar("Florianópolis, SC aprovada", idsSiglasBR.has("s1"), true);
testar("Belém, PA aprovada", idsSiglasBR.has("s2"), true);
testar("Campo Grande, MS aprovada", idsSiglasBR.has("s3"), true);
testar("Cuiabá, MT aprovada", idsSiglasBR.has("s4"), true);
testar("Maceió, AL aprovada", idsSiglasBR.has("s5"), true);
testar("São Luís, MA aprovada", idsSiglasBR.has("s6"), true);

// ── Resumo ─────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════════════`);
console.log(`Resultado: ${passou} passou / ${falhou} falhou`);
if (falhou === 0) {
  console.log("TODOS OS TESTES PASSARAM ✅");
} else {
  console.log("ATENÇÃO: há falhas que precisam ser investigadas ⚠️");
  process.exit(1);
}
} // end main

main().catch((e) => { console.error(e); process.exit(1); });
