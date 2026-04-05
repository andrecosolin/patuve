import AsyncStorage from "@react-native-async-storage/async-storage";

import { BuscarResult, buscarVagasAPI } from "@/services/api";
import { SearchFilters, SearchMeta, Vaga } from "@/types/vaga";

const STORAGE_KEY_BUSCAS_SALVAS = "@patuve:buscas_salvas";
const MAX_BUSCAS_SALVAS = 3;

export type BuscaSalva = {
  id: string;
  savedAt: string; // ISO
  filters: SearchFilters;
  vagas: Vaga[];
  meta: SearchMeta;
};

function isValidBusca(payload: unknown): payload is BuscaSalva {
  if (!payload || typeof payload !== "object") return false;
  const c = payload as Partial<BuscaSalva>;
  return !!c.id && !!c.filters && Array.isArray(c.vagas) && !!c.meta;
}

export async function buscarVagas(filters: SearchFilters): Promise<BuscarResult> {
  return buscarVagasAPI(filters);
}

export async function carregarBuscasSalvas(): Promise<BuscaSalva[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BUSCAS_SALVAS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidBusca);
  } catch {
    return [];
  }
}

export async function salvarBusca(
  filters: SearchFilters,
  vagas: Vaga[],
  meta: SearchMeta
): Promise<{ substituiu: boolean }> {
  try {
    const existentes = await carregarBuscasSalvas();

    // Verifica se já existe busca com mesmo cargo+cidade (atualiza em vez de duplicar)
    const mesmaChave = (b: BuscaSalva) =>
      b.filters.cargo.trim().toLowerCase() === filters.cargo.trim().toLowerCase() &&
      b.filters.cidade.trim().toLowerCase() === filters.cidade.trim().toLowerCase();

    const jaExiste = existentes.some(mesmaChave);
    let novaLista: BuscaSalva[];

    const novaBusca: BuscaSalva = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      filters,
      vagas,
      meta,
    };

    if (jaExiste) {
      // Substitui a existente mantendo posição
      novaLista = existentes.map((b) => (mesmaChave(b) ? novaBusca : b));
    } else {
      // Adiciona no início, respeita limite de 3
      novaLista = [novaBusca, ...existentes].slice(0, MAX_BUSCAS_SALVAS);
    }

    await AsyncStorage.setItem(STORAGE_KEY_BUSCAS_SALVAS, JSON.stringify(novaLista));
    return { substituiu: jaExiste };
  } catch {
    return { substituiu: false };
  }
}

export async function removerBuscaSalva(id: string): Promise<void> {
  try {
    const existentes = await carregarBuscasSalvas();
    const novaLista = existentes.filter((b) => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_BUSCAS_SALVAS, JSON.stringify(novaLista));
  } catch {
    // Falha silenciosa
  }
}

export async function limparTodasBuscasSalvas(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_BUSCAS_SALVAS);
  } catch {
    // Falha silenciosa
  }
}
