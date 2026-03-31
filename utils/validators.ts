import { FonteVaga, Modalidade, TipoContrato, Vaga } from "@/types/vaga";

const FONTES_CONHECIDAS: FonteVaga[] = [
  "LinkedIn",
  "Gupy",
  "Indeed",
  "Catho",
  "InfoJobs",
  "Vagas.com",
  "trampos.co",
];

const TIPOS_CONTRATO: Exclude<TipoContrato, null>[] = ["CLT", "PJ", "Estagio", "Freelance", "Trainee"];
const MODALIDADES: Exclude<Modalidade, null>[] = ["Remoto", "Hibrido", "Presencial"];

function normalizeFonte(raw: unknown): FonteVaga {
  const s = String(raw ?? "").trim();
  const found = FONTES_CONHECIDAS.find((fonte) => s.toLowerCase().includes(fonte.toLowerCase()));
  return found ?? "Outro";
}

function normalizeTipoContrato(raw: unknown): TipoContrato {
  const s = String(raw ?? "").trim();
  if (/est[aá]gio/i.test(s)) return "Estagio";
  return TIPOS_CONTRATO.find((tipo) => s.toLowerCase().includes(tipo.toLowerCase())) ?? null;
}

function normalizeModalidade(raw: unknown): Modalidade {
  const s = String(raw ?? "").trim();
  if (/h[ií]brido/i.test(s)) return "Hibrido";
  return MODALIDADES.find((modalidade) => s.toLowerCase().includes(modalidade.toLowerCase())) ?? null;
}

export function isValidLink(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("https://");
}

export function parseVagaFromRaw(raw: Record<string, unknown>, index: number): Vaga | null {
  if (!isValidLink(raw.link_direto)) return null;

  return {
    id: String(raw.id ?? raw.link_direto ?? `vaga-${index}`),
    titulo: String(raw.titulo ?? "Vaga sem titulo"),
    empresa: raw.empresa ? String(raw.empresa) : null,
    localizacao: String(raw.localizacao ?? "Brasil"),
    tipo_contrato: normalizeTipoContrato(raw.tipo_contrato),
    modalidade: normalizeModalidade(raw.modalidade),
    descricao_curta: String(raw.descricao_curta ?? "").slice(0, 200),
    link_direto: raw.link_direto,
    fonte: normalizeFonte(raw.fonte),
    data_publicacao: raw.data_publicacao ? String(raw.data_publicacao) : null,
  };
}

export function validateVagasArray(data: unknown): Vaga[] {
  if (!Array.isArray(data)) return [];

  const seenLinks = new Set<string>();

  return data
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => parseVagaFromRaw(item, index))
    .filter((vaga): vaga is Vaga => {
      if (!vaga || seenLinks.has(vaga.link_direto)) {
        return false;
      }

      seenLinks.add(vaga.link_direto);
      return true;
    });
}
