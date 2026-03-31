import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Vaga } from "@/types/vaga";

const STORAGE_KEY = "@patuve:vagas_salvas";

type SavedJobsContextValue = {
  savedJobs: Vaga[];
  isSaved: (jobId: string) => boolean;
  toggleSavedJob: (job: Vaga) => void;
  clearAllJobs: () => void;
};

const SavedJobsContext = createContext<SavedJobsContextValue | undefined>(undefined);

function parseSavedJobs(raw: string | null): Vaga[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Vaga[]) : [];
  } catch {
    return [];
  }
}

export function SavedJobsProvider({ children }: PropsWithChildren) {
  const [savedJobs, setSavedJobs] = useState<Vaga[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        setSavedJobs(parseSavedJobs(raw));
      })
      .catch(() => {
        setSavedJobs([]);
      })
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  const toggleSavedJob = useCallback((job: Vaga) => {
    setSavedJobs((current) => {
      const exists = current.some((item) => item.id === job.id);
      return exists ? current.filter((item) => item.id !== job.id) : [job, ...current];
    });
  }, []);

  const clearAllJobs = useCallback(() => {
    setSavedJobs([]);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs)).catch(() => {});
  }, [hydrated, savedJobs]);

  const value = useMemo(
    () => ({
      savedJobs,
      isSaved: (jobId: string) => savedJobs.some((job) => job.id === jobId),
      toggleSavedJob,
      clearAllJobs,
    }),
    [savedJobs, toggleSavedJob, clearAllJobs]
  );

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (!context) {
    throw new Error("useSavedJobs deve ser usado dentro de SavedJobsProvider.");
  }
  return context;
}
