/**
 * Servidor mock do Patuvê — retorna vagas realistas sem chamar nenhuma API.
 * Use para testar toda a UI do app: busca, filtros, cards, salvar, paginação.
 *
 * Rodar: node server-mock.js
 */

const { randomUUID } = require("crypto");
const cors = require("cors");
const express = require("express");

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// ─── Base de vagas mock ───────────────────────────────────────────────────────

const BASE_VAGAS = [
  {
    titulo: "Desenvolvedor React Native",
    empresa: "Nubank",
    localizacao: "São Paulo, SP",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Vaga para dev React Native no time de super app. Kotlin ou Swift como diferencial. Atuação em squad ágil com foco em performance e acessibilidade.",
    link_direto: "https://nubank.gupy.io/jobs/7123456",
    fonte: "Gupy",
    data_publicacao: "28/03/2025",
  },
  {
    titulo: "Desenvolvedor Mobile Sênior",
    empresa: "iFood",
    localizacao: "Campinas, SP",
    tipo_contrato: "CLT",
    modalidade: "Remoto",
    descricao_curta: "Desenvolvimento de features no app do iFood com mais de 40 milhões de usuários. Stack: React Native, TypeScript, GraphQL.",
    link_direto: "https://ifood.gupy.io/jobs/8234567",
    fonte: "Gupy",
    data_publicacao: "27/03/2025",
  },
  {
    titulo: "Engenheiro de Software Mobile",
    empresa: "PicPay",
    localizacao: "Remoto",
    tipo_contrato: "CLT",
    modalidade: "Remoto",
    descricao_curta: "Vaga 100% remota para engenheiro mobile no PicPay. Trabalhe em um dos maiores apps de pagamento do Brasil com 65M de usuários.",
    link_direto: "https://picpay.gupy.io/jobs/9345678",
    fonte: "Gupy",
    data_publicacao: "26/03/2025",
  },
  {
    titulo: "React Native Developer",
    empresa: "Mercado Livre",
    localizacao: "São Paulo, SP",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Oportunidade de trabalhar no maior e-commerce da América Latina. Impacte milhões de compradores e vendedores com features inovadoras.",
    link_direto: "https://www.linkedin.com/jobs/view/3987600001",
    fonte: "LinkedIn",
    data_publicacao: "25/03/2025",
  },
  {
    titulo: "Mobile Developer Pleno",
    empresa: "Creditas",
    localizacao: "São Paulo, SP",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Desenvolvimento mobile para plataforma de crédito. Ambiente de alta performance, cultura data-driven e foco em experiência do usuário.",
    link_direto: "https://creditas.gupy.io/jobs/4012345",
    fonte: "Gupy",
    data_publicacao: "24/03/2025",
  },
  {
    titulo: "Desenvolvedor Mobile Júnior",
    empresa: "Hotmart",
    localizacao: "Belo Horizonte, MG",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Primeira vaga mobile? Aqui é o lugar! Mentoria, ambiente de aprendizado contínuo e stack moderna com React Native e TypeScript.",
    link_direto: "https://hotmart.gupy.io/jobs/5023456",
    fonte: "Gupy",
    data_publicacao: "23/03/2025",
  },
  {
    titulo: "Senior React Native Engineer",
    empresa: "Lemon Energy",
    localizacao: "Remoto",
    tipo_contrato: "PJ",
    modalidade: "Remoto",
    descricao_curta: "Startup de energia limpa busca dev sênior React Native PJ. Produto em crescimento acelerado, squad autônomo e salário competitivo.",
    link_direto: "https://www.linkedin.com/jobs/view/3987600002",
    fonte: "LinkedIn",
    data_publicacao: "22/03/2025",
  },
  {
    titulo: "Desenvolvedor Mobile Fullstack",
    empresa: "Petz",
    localizacao: "São Paulo, SP",
    tipo_contrato: "CLT",
    modalidade: "Presencial",
    descricao_curta: "Vaga fullstack mobile + backend (Node.js) para o app da Petz. Mais de 3M de pets cadastrados. React Native, AWS e boas práticas de CI/CD.",
    link_direto: "https://petz.gupy.io/jobs/6034567",
    fonte: "Gupy",
    data_publicacao: "21/03/2025",
  },
  {
    titulo: "React Native Developer Freelance",
    empresa: "Agência Digital XP",
    localizacao: "Remoto",
    tipo_contrato: "Freelance",
    modalidade: "Remoto",
    descricao_curta: "Projeto de 3 meses para desenvolvimento de app de investimentos. Entregas semanais, boa remuneração e possibilidade de renovação.",
    link_direto: "https://trampos.co/oportunidades/react-native-freelance-xp",
    fonte: "trampos.co",
    data_publicacao: "20/03/2025",
  },
  {
    titulo: "Estagiário de Desenvolvimento Mobile",
    empresa: "Totvs",
    localizacao: "São Paulo, SP",
    tipo_contrato: "Estágio",
    modalidade: "Híbrido",
    descricao_curta: "Estágio em mobile para estudantes de TI. Aprenda com um dos maiores ERPs do Brasil. Bolsa + benefícios + possibilidade de efetivação.",
    link_direto: "https://totvs.gupy.io/jobs/7045678",
    fonte: "Gupy",
    data_publicacao: "19/03/2025",
  },
  {
    titulo: "Desenvolvedor Frontend React",
    empresa: "Conta Simples",
    localizacao: "Remoto",
    tipo_contrato: "CLT",
    modalidade: "Remoto",
    descricao_curta: "Fintech B2B busca dev React para produto de gestão financeira. Stack: React, TypeScript, Storybook, Jest. Time pequeno e produto com grande impacto.",
    link_direto: "https://contasimples.gupy.io/jobs/8056789",
    fonte: "Gupy",
    data_publicacao: "18/03/2025",
  },
  {
    titulo: "Programador Mobile",
    empresa: null,
    localizacao: "Rio de Janeiro, RJ",
    tipo_contrato: "PJ",
    modalidade: "Presencial",
    descricao_curta: "Empresa de tecnologia no RJ busca dev mobile PJ para projeto de longa duração. Valor hora a combinar conforme experiência.",
    link_direto: "https://www.vagas.com/vagas/dev-mobile-rj-12345",
    fonte: "Vagas.com",
    data_publicacao: null,
  },
  {
    titulo: "Tech Lead Mobile",
    empresa: "Stone",
    localizacao: "Rio de Janeiro, RJ",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Lidere um time de 6 devs mobile na Stone. Responsável por decisões técnicas, code review e evolução da arquitetura do app.",
    link_direto: "https://stone.gupy.io/jobs/9067890",
    fonte: "Gupy",
    data_publicacao: "17/03/2025",
  },
  {
    titulo: "Desenvolvedor iOS / React Native",
    empresa: "Azul Linhas Aéreas",
    localizacao: "Barueri, SP",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Vaga para dev mobile com foco em iOS e React Native no app da Azul. Mais de 25M de downloads. Benefícios: passagens aéreas ilimitadas.",
    link_direto: "https://azul.gupy.io/jobs/1078901",
    fonte: "Gupy",
    data_publicacao: "16/03/2025",
  },
  {
    titulo: "Desenvolvedor Full Stack",
    empresa: "99 (DiDi)",
    localizacao: "São Paulo, SP",
    tipo_contrato: "CLT",
    modalidade: "Híbrido",
    descricao_curta: "Desenvolva features para o app da 99. Stack: React Native, Python, Go. Trabalhe em uma empresa global com impacto em transporte urbano.",
    link_direto: "https://99app.gupy.io/jobs/2089012",
    fonte: "Gupy",
    data_publicacao: "15/03/2025",
  },
];

// ─── Lógica de filtros ────────────────────────────────────────────────────────

/** Normaliza string removendo acentos e pontuação para comparações robustas. */
function normalizar(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

function aplicarFiltros(vagas, { cargo, cidade, tipoContrato, nivel, modalidade }) {
  const termos = normalizar(cargo).split(/\s+/).filter(Boolean);
  const cidadeNorm = normalizar(cidade);

  return vagas.filter((v) => {
    // Filtro por cargo (qualquer termo do cargo deve aparecer no título ou descrição)
    const textoVaga = normalizar(`${v.titulo} ${v.descricao_curta}`);
    const matchCargo = termos.some((t) => textoVaga.includes(t));
    if (!matchCargo) return false;

    // Filtro por cidade (remoto sempre aparece em qualquer cidade)
    const locNorm = normalizar(v.localizacao);
    const matchCidade =
      v.modalidade === "Remoto" ||
      locNorm.includes(cidadeNorm) ||
      cidadeNorm.includes(locNorm.split(",")[0]) ||
      cidadeNorm.includes("remoto");
    if (!matchCidade) return false;

    // Filtro por tipo de contrato
    if (tipoContrato !== "Ambos" && v.tipo_contrato !== tipoContrato) return false;

    // Filtro por modalidade
    if (modalidade !== "Todas" && v.modalidade !== modalidade) return false;

    // Filtro por nível (heurística no título)
    if (nivel !== "Todos") {
      const titulo = v.titulo.toLowerCase();
      const mapaNivel = {
        Junior: ["júnior", "junior", "jr", "jr.", "estagiário", "estágio", "trainee"],
        Pleno: ["pleno", "pl", "mid", "mid-level"],
        Senior: ["sênior", "senior", "sr", "sr.", "specialist", "especialista", "lead", "tech lead"],
      };
      const termoNivel = mapaNivel[nivel] ?? [];
      // Se o título contém indicação de outro nível, exclui. Se não tem indicação, inclui.
      const outrosNiveis = Object.entries(mapaNivel)
        .filter(([k]) => k !== nivel)
        .flatMap(([, v]) => v);
      if (outrosNiveis.some((t) => titulo.includes(t))) return false;
    }

    return true;
  });
}

// ─── Endpoint ─────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ ok: true, mock: true, ts: new Date().toISOString() });
});

app.post("/buscar-vagas", (req, res) => {
  const inicio = Date.now();
  const {
    cargo = "",
    cidade = "",
    tipoContrato = "Ambos",
    nivel = "Todos",
    modalidade = "Todas",
  } = req.body ?? {};

  if (!cargo.trim() || !cidade.trim()) {
    return res.status(400).json({ error: "Os campos 'cargo' e 'cidade' são obrigatórios." });
  }

  const totalEncontradas = BASE_VAGAS.length;
  const vagasFiltradas = aplicarFiltros(BASE_VAGAS, { cargo, cidade, tipoContrato, nivel, modalidade });

  // Adiciona IDs únicos
  const vagas = vagasFiltradas.map((v) => ({ ...v, id: randomUUID() }));
  const removidasFiltro = totalEncontradas - vagas.length;

  const meta = {
    total_encontradas: totalEncontradas,
    total_validas: vagas.length,
    removidas_filtro: removidasFiltro,
    removidas_link_invalido: 0,
    tempo_busca_ms: Date.now() - inicio,
  };

  console.log(`[mock] "${cargo}" em "${cidade}" → ${vagas.length} vagas | ${JSON.stringify({ tipoContrato, nivel, modalidade })}`);

  // Simula latência mínima para testar o loading skeleton
  setTimeout(() => res.json({ vagas, meta }), 800);
});

app.listen(port, () => {
  console.log(`[patuvê MOCK] Servidor rodando em http://localhost:${port}`);
  console.log(`[patuvê MOCK] Nenhuma API necessária — ${BASE_VAGAS.length} vagas de exemplo disponíveis`);
});
