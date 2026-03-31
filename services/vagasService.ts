import AsyncStorage from "@react-native-async-storage/async-storage";

import { BuscarResult, buscarVagasAPI } from "@/services/api";
import { SearchFilters, SearchMeta, Vaga } from "@/types/vaga";

const STORAGE_KEY_ULTIMA_BUSCA = "@patuve:ultima_busca";

type CacheUltimaBusca = {
  filters: SearchFilters;
  vagas: Vaga[];
  meta: SearchMeta;
};

function isValidCache(payload: unknown): payload is CacheUltimaBusca {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<CacheUltimaBusca>;
  return !!candidate.filters && Array.isArray(candidate.vagas) && !!candidate.meta;
}

export async function buscarVagas(filters: SearchFilters): Promise<BuscarResult> {
  const result = await buscarVagasAPI(filters);

  try {
    const payload: CacheUltimaBusca = { filters, vagas: result.vagas, meta: result.meta };
    await AsyncStorage.setItem(STORAGE_KEY_ULTIMA_BUSCA, JSON.stringify(payload));
  } catch {
    // Falha no cache nao impede o retorno dos resultados.
  }

  return result;
}

export async function carregarUltimaBusca(): Promise<CacheUltimaBusca | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ULTIMA_BUSCA);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isValidCache(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
