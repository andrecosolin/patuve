import AsyncStorage from "@react-native-async-storage/async-storage";

import { BuscarResult, buscarVagasAPI } from "@/services/api";
import { SearchFilters, SearchMeta, Vaga } from "@/types/vaga";

const STORAGE_KEY_BUSCA_SALVA = "@patuve:busca_salva";

type CacheBusca = {
  filters: SearchFilters;
  vagas: Vaga[];
  meta: SearchMeta;
};

function isValidCache(payload: unknown): payload is CacheBusca {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<CacheBusca>;
  return !!candidate.filters && Array.isArray(candidate.vagas) && !!candidate.meta;
}

export async function buscarVagas(filters: SearchFilters): Promise<BuscarResult> {
  return buscarVagasAPI(filters);
}

export async function salvarBusca(filters: SearchFilters, vagas: Vaga[], meta: SearchMeta): Promise<void> {
  try {
    const payload: CacheBusca = { filters, vagas, meta };
    await AsyncStorage.setItem(STORAGE_KEY_BUSCA_SALVA, JSON.stringify(payload));
  } catch {
    // Falha silenciosa
  }
}

export async function carregarBuscaSalva(): Promise<CacheBusca | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BUSCA_SALVA);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isValidCache(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function removerBuscaSalva(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_BUSCA_SALVA);
  } catch {
    // Falha silenciosa
  }
}
