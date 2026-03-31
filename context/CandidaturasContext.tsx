import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { CandidaturaRegistrada, Vaga } from "@/types/vaga";

const STORAGE_KEY = "@patuve:candidaturas";

type CandidaturasContextValue = {
  candidaturas: CandidaturaRegistrada[];
  registrarCandidatura: (vaga: Vaga) => void;
  jaMeCandidatei: (link_direto: string) => boolean;
  getDataCandidatura: (link_direto: string) => string | null;
  limparCandidaturas: () => void;
};

const CandidaturasContext = createContext<CandidaturasContextValue | undefined>(undefined);

function parseCandidaturas(raw: string | null): CandidaturaRegistrada[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CandidaturaRegistrada[]) : [];
  } catch {
    return [];
  }
}

export function CandidaturasProvider({ children }: PropsWithChildren) {
  const [candidaturas, setCandidaturas] = useState<CandidaturaRegistrada[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        setCandidaturas(parseCandidaturas(raw));
      })
      .catch(() => {
        setCandidaturas([]);
      })
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  const registrarCandidatura = useCallback((vaga: Vaga) => {
    setCandidaturas((current) => {
      // Não registra duplicata — mesmo link = mesma vaga
      if (current.some((c) => c.link_direto === vaga.link_direto)) return current;
      const nova: CandidaturaRegistrada = {
        link_direto: vaga.link_direto,
        titulo: vaga.titulo,
        empresa: vaga.empresa,
        data_candidatura: new Date().toISOString(),
      };
      return [nova, ...current];
    });
  }, []);

  const limparCandidaturas = useCallback(() => {
    setCandidaturas([]);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(candidaturas)).catch(() => {});
  }, [hydrated, candidaturas]);

  const value = useMemo(
    () => ({
      candidaturas,
      registrarCandidatura,
      jaMeCandidatei: (link_direto: string) =>
        candidaturas.some((c) => c.link_direto === link_direto),
      getDataCandidatura: (link_direto: string) =>
        candidaturas.find((c) => c.link_direto === link_direto)?.data_candidatura ?? null,
      limparCandidaturas,
    }),
    [candidaturas, registrarCandidatura, limparCandidaturas]
  );

  return <CandidaturasContext.Provider value={value}>{children}</CandidaturasContext.Provider>;
}

export function useCandidaturas() {
  const context = useContext(CandidaturasContext);
  if (!context) {
    throw new Error("useCandidaturas deve ser usado dentro de CandidaturasProvider.");
  }
  return context;
}
