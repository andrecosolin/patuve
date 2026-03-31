/**
 * Camada 2 - Validacao de links via HEAD request em paralelo controlado.
 * Confirma se cada URL ainda esta acessivel antes de retornar ao app.
 */

const TIMEOUT_MS = 3000;
const MAX_CONCURRENCY = 8;

const ORDEM_FONTES = ["Gupy", "LinkedIn", "Indeed", "Catho", "InfoJobs", "Vagas.com", "trampos.co", "Outro"];

async function validarLink(url) {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await Promise.race([
      fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("HEAD_TIMEOUT")), TIMEOUT_MS);
      }),
    ]);

    clearTimeout(abortTimer);
    return response.status !== 404;
  } catch {
    clearTimeout(abortTimer);
    // Timeout ou erro de rede: mantem vaga (beneficio da duvida)
    return true;
  }
}

async function processarLoteComConcorrencia(vagas) {
  const resultados = new Array(vagas.length).fill(true);
  let cursor = 0;

  async function worker() {
    while (cursor < vagas.length) {
      const currentIndex = cursor;
      cursor += 1;

      try {
        resultados[currentIndex] = await validarLink(vagas[currentIndex].link_direto);
      } catch {
        resultados[currentIndex] = true;
      }
    }
  }

  const workerCount = Math.min(MAX_CONCURRENCY, vagas.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return resultados;
}

async function validarVagas(vagas) {
  const resultados = await processarLoteComConcorrencia(vagas);

  const aprovadas = [];
  let removidas = 0;

  for (let index = 0; index < vagas.length; index += 1) {
    if (resultados[index]) {
      aprovadas.push(vagas[index]);
    } else {
      removidas += 1;
      console.log(`[validador] 404 removido: ${vagas[index].link_direto}`);
    }
  }

  console.log(`[validador] ${aprovadas.length} aprovadas, ${removidas} removidas por 404.`);
  return { vagas: aprovadas, removidas };
}

function ordenarPorFonte(vagas) {
  return [...vagas].sort((a, b) => {
    const indiceA = ORDEM_FONTES.indexOf(a.fonte);
    const indiceB = ORDEM_FONTES.indexOf(b.fonte);
    return (indiceA === -1 ? 99 : indiceA) - (indiceB === -1 ? 99 : indiceB);
  });
}

module.exports = { validarVagas, ordenarPorFonte };

