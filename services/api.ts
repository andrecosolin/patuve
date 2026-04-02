import axios, { AxiosError } from "axios";

import { AppError, AppErrorCode, SearchFilters, SearchMeta, Vaga } from "@/types/vaga";
import { validateVagasArray } from "@/utils/validators";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "https://patuve-backend-production.up.railway.app";

console.log("BACKEND_URL:", BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 90_000,
});

type BuscarVagasResponse = {
  vagas: unknown[];
  meta?: Partial<SearchMeta>;
  cache?: boolean;
};

type ApiErrorPayload = {
  error?: string;
  erro?: string;
  mensagem?: string;
  code?: string;
  details?: string;
};

export type BuscarResult = {
  vagas: Vaga[];
  meta: SearchMeta;
  cache: boolean;
};

const EMPTY_META: SearchMeta = {
  total_encontradas: 0,
  total_validas: 0,
  removidas_filtro: 0,
  removidas_link_invalido: 0,
  tempo_busca_ms: 0,
};

function buildAppError(code: AppErrorCode, message: string, status?: number): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.status = status;
  return error;
}

function normalizeMeta(meta?: Partial<SearchMeta>): SearchMeta {
  return {
    ...EMPTY_META,
    ...meta,
  };
}

function mapAxiosError(error: AxiosError<ApiErrorPayload>): AppError {
  const status = error.response?.status;
  const payload = error.response?.data;
  const serverMessage = payload?.mensagem ?? payload?.error ?? payload?.details ?? error.message;
  const normalizedMessage = serverMessage.toLowerCase();

  if (
    status === 504 ||
    payload?.erro === "busca_timeout" ||
    payload?.code === "SEARCH_TIMEOUT" ||
    error.code === "ECONNABORTED" ||
    normalizedMessage.includes("timeout")
  ) {
    return buildAppError("TIMEOUT", payload?.mensagem ?? "A busca demorou mais do que o esperado.", status);
  }

  if (!error.response) {
    return buildAppError("NO_INTERNET", "Nao foi possivel conectar ao backend.", status);
  }

  if (
    payload?.code === "INVALID_API_KEY" ||
    status === 401 ||
    status === 403 ||
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("authentication")
  ) {
    return buildAppError("INVALID_API_KEY", "A chave da API da Anthropic e invalida ou expirou.", status);
  }

  if (payload?.code === "EMPTY_RESPONSE") {
    return buildAppError("EMPTY_RESPONSE", "A IA nao retornou vagas validas para esta busca.", status);
  }

  return buildAppError("API", serverMessage || "Falha ao buscar vagas na API.", status);
}

export async function buscarVagasAPI(filters: SearchFilters): Promise<BuscarResult> {
  try {
    const { data } = await api.post<BuscarVagasResponse>("/buscar-vagas", filters);

    if (!data || !Array.isArray(data.vagas)) {
      throw buildAppError("EMPTY_RESPONSE", "A resposta do backend veio vazia.");
    }

    return {
      vagas: validateVagasArray(data.vagas),
      meta: normalizeMeta(data.meta),
      cache: Boolean(data.cache),
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      throw mapAxiosError(error);
    }

    if ((error as AppError)?.code) {
      throw error;
    }

    throw buildAppError("UNKNOWN", error instanceof Error ? error.message : "Erro desconhecido na API.");
  }
}



