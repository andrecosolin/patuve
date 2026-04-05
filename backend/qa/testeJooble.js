/**
 * QA — Valida que o backend não retorna vagas americanas/inglesas/antigas.
 * Uso: node backend/qa/testeJooble.js
 */

const BACKEND = process.env.BACKEND_URL || "https://patuve-backend-production.up.railway.app";
const DIAS_MAX = 45;

// nivel variado garante cache-bypass (cada combinação tem chave MD5 única)
const cenarios = [
  { cargo: "QA", cidade: "Brasil", modalidade: "Remoto", nivel: "Junior", desc: "QA/Brasil/Remoto — caso do Colorado" },
  { cargo: "DevOps", cidade: "Brasil", modalidade: "Remoto", nivel: "Junior", desc: "DevOps/Brasil/Remoto" },
  { cargo: "Desenvolvedor", cidade: "Colorado", modalidade: "Presencial", nivel: "Junior", desc: "Dev/Colorado — ambígua BR/EUA" },
  { cargo: "Analista", cidade: "Toledo", modalidade: "Presencial", nivel: "Junior", desc: "Analista/Toledo — BR legítimo, deve passar" },
  { cargo: "Contador", cidade: "Florida", modalidade: "Presencial", nivel: "Junior", desc: "Contador/Florida — ambígua BR/EUA" },
];

const MARCAS_PORTUGUES = /[ãâáéêíóôúç]|\b(você|será|buscamos|procuramos|empresa|vaga|salário|benefícios|requisitos|experiência|conhecimento|habilidades|formação|desejável|diferencial|remuneração|oportunidade|candidat|desenvolvedor|analista|gerente|coordenador|engenheiro|remoto|hibrido|presencial|pleno|cargo)\b/i;

const TITULO_INGLES_REMOTE = /^remote\s+[a-z]/i;
const TEXTO_INGLES_FORTE = /\b(we are looking for|join our team|you will be responsible|we offer|benefits include|apply now|job description|about the role|about us|what you will do|requirements:|qualifications:|equal opportunity|we are hiring|we're looking|salary range|health insurance|pto\b)\b/i;
const CARGO_INGLES = /\b(payroll|staffing|workforce|account executive|account manager|customer success|employee relations|client services|onboarding specialist|sales development|compliance officer)\b/i;

function estaEmIngles(vaga) {
  const texto = `${vaga.titulo || ""} ${vaga.descricao_curta || ""}`;
  if (MARCAS_PORTUGUES.test(texto)) return false;
  return TITULO_INGLES_REMOTE.test(vaga.titulo || "") ||
    TEXTO_INGLES_FORTE.test(texto) ||
    CARGO_INGLES.test(texto);
}

function eAntiga(vaga) {
  if (!vaga.data_publicacao) return false;
  const d = new Date(vaga.data_publicacao);
  if (isNaN(d.getTime())) return false;
  const diffDias = (Date.now() - d.getTime()) / 86_400_000;
  return diffDias > DIAS_MAX;
}

const CIDADES_AMBIGUAS = new Set([
  "colorado", "washington", "california", "califórnia",
  "florida", "flórida", "indiana", "columbia", "nevada",
  "virginia", "georgia", "carolina", "toledo",
]);
const ESTADOS_BR = /(acre|alagoas|amapá|amapa|amazonas|bahia|ceará|ceara|espirito santo|goiás|goias|maranhão|maranhao|mato grosso|minas gerais|pará|para\b|paraíba|paraiba|paraná|parana\b|pernambuco|piauí|piaui|rio de janeiro|rio grande|rondônia|rondonia|roraima|santa catarina|são paulo|sao paulo|sergipe|tocantins)/i;

function temLocalizacaoAmbigua(vaga) {
  const loc = String(vaga.localizacao || "");
  const cidade = loc.split(",")[0].trim().toLowerCase();
  if (!CIDADES_AMBIGUAS.has(cidade)) return false;
  // Se tem estado brasileiro no resto → é BR legítimo
  const resto = loc.includes(",") ? loc.slice(loc.indexOf(",") + 1) : "";
  if (ESTADOS_BR.test(resto)) return false;
  return true;
}

async function testar(cenario, nro) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`CENÁRIO ${nro}/5: ${cenario.desc}`);
  console.log(`${"═".repeat(60)}`);

  try {
    const res = await fetch(`${BACKEND}/buscar-vagas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cargo: cenario.cargo,
        cidade: cenario.cidade,
        tipoContrato: "Ambos",
        nivel: cenario.nivel ?? "Todos",
        modalidade: cenario.modalidade,
      }),
    });

    const json = await res.json();
    const vagas = Array.isArray(json.vagas) ? json.vagas : [];

    if (!vagas.length) {
      console.log(`⚠️  0 vagas retornadas (cache: ${json.cache})`);
      return { passou: true, falhas: [] };
    }

    console.log(`Total: ${vagas.length} vagas | cache: ${json.cache}`);

    const falhas = [];
    for (const v of vagas) {
      const problemas = [];
      if (estaEmIngles(v)) problemas.push("INGLÊS");
      if (eAntiga(v)) problemas.push(`ANTIGA(${v.data_publicacao})`);
      if (temLocalizacaoAmbigua(v)) problemas.push(`AMBÍGUA(${v.localizacao})`);

      if (problemas.length) {
        falhas.push({ titulo: v.titulo, localizacao: v.localizacao, problemas });
        console.log(`  ❌ [${problemas.join(",")}] ${v.titulo} | ${v.localizacao}`);
      } else {
        console.log(`  ✅ ${v.titulo} | ${v.localizacao}`);
      }
    }

    if (falhas.length === 0) {
      console.log(`\n✅ PASSOU — ${vagas.length} vagas, todas OK`);
    } else {
      console.log(`\n❌ FALHOU — ${falhas.length} problema(s) detectado(s)`);
    }

    return { passou: falhas.length === 0, falhas };
  } catch (e) {
    console.log(`❌ ERRO: ${e.message}`);
    return { passou: false, falhas: [{ titulo: "ERRO", problemas: [e.message] }] };
  }
}

async function main() {
  console.log(`\n🔍 PATUVÊ QA — Backend: ${BACKEND}`);
  console.log(`📅 Data: ${new Date().toISOString()}\n`);

  const resultados = [];
  for (let i = 0; i < cenarios.length; i++) {
    const r = await testar(cenarios[i], i + 1);
    resultados.push(r);
    if (i < cenarios.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("RELATÓRIO FINAL");
  console.log(`${"═".repeat(60)}`);

  let totalIngles = 0, totalAntigas = 0, totalAmbiguas = 0;
  for (const r of resultados) {
    for (const f of r.falhas) {
      if (f.problemas?.some(p => p === "INGLÊS")) totalIngles++;
      if (f.problemas?.some(p => p.startsWith("ANTIGA"))) totalAntigas++;
      if (f.problemas?.some(p => p.startsWith("AMBÍGUA"))) totalAmbiguas++;
    }
  }

  console.log(`Vagas em inglês passando:     ${totalIngles}`);
  console.log(`Vagas antigas (+45d) passando: ${totalAntigas}`);
  console.log(`Cidades ambíguas passando:    ${totalAmbiguas}`);

  const aprovados = resultados.filter(r => r.passou).length;
  console.log(`\nCenários: ${aprovados}/5 aprovados`);
  console.log(`VEREDICTO: ${aprovados === 5 ? "✅ APROVADO" : "❌ REPROVADO"}`);
}

main();
