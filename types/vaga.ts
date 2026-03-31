export type FonteVaga =
  | "LinkedIn"
  | "Gupy"
  | "Indeed"
  | "Catho"
  | "InfoJobs"
  | "Vagas.com"
  | "trampos.co"
  | "Outro";

export type TipoContrato = "CLT" | "PJ" | "Estagio" | "Freelance" | "Trainee" | null;
export type Modalidade = "Remoto" | "Hibrido" | "Presencial" | null;
export type ContractType = "CLT" | "PJ" | "Ambos";
export type SeniorityLevel = "Junior" | "Pleno" | "Senior" | "Todos";
export type WorkMode = "Remoto" | "Hibrido" | "Presencial" | "Todas";

export interface SearchFilters {
  cargo: string;
  cidade: string;
  tipoContrato: ContractType;
  nivel: SeniorityLevel;
  modalidade: WorkMode;
}

export interface SearchMeta {
  total_encontradas: number;
  total_validas: number;
  removidas_filtro: number;
  removidas_link_invalido: number;
  tempo_busca_ms: number;
  timed_out?: boolean;
}

export interface Vaga {
  id: string;
  titulo: string;
  empresa: string | null;
  localizacao: string;
  tipo_contrato: TipoContrato;
  modalidade: Modalidade;
  descricao_curta: string;
  link_direto: string;
  fonte: FonteVaga;
  data_publicacao: string | null;
}

export interface CandidaturaRegistrada {
  link_direto: string;
  titulo: string;
  empresa: string | null;
  data_candidatura: string; // ISO string
}

export type AppErrorCode =
  | "TIMEOUT"
  | "NO_INTERNET"
  | "INVALID_API_KEY"
  | "EMPTY_RESPONSE"
  | "API"
  | "UNKNOWN";

export interface AppError extends Error {
  code: AppErrorCode;
  status?: number;
}

