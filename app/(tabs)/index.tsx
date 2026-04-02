import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SearchForm } from "@/components/SearchForm";
import { colors } from "@/constants/theme";
import { buscarVagas, carregarUltimaBusca } from "@/services/vagasService";
import { AppError, SearchFilters, SearchMeta, Vaga } from "@/types/vaga";

const PAGE_SIZE = 5;
const LOADING_MESSAGES = [
  "Buscando vagas...",
  "Analisando resultados...",
  "Validando oportunidades...",
];

const initialFilters: SearchFilters = {
  cargo: "",
  cidade: "",
  tipoContrato: "Ambos",
  nivel: "Todos",
  modalidade: "Todas",
};

function formatMetaLabel(meta: SearchMeta): string {
  return `${meta.total_validas} vaga${meta.total_validas !== 1 ? "s" : ""} encontrada${meta.total_validas !== 1 ? "s" : ""} • atualizado agora`;
}

function buildUnknownError(): AppError {
  const error = new Error("Erro desconhecido ao buscar vagas.") as AppError;
  error.code = "UNKNOWN";
  return error;
}

function getErrorCopy(error: AppError | null) {
  if (!error) return null;

  if (error.code === "NO_INTERNET") {
    return {
      title: "Sem conexao",
      message: "Verifique sua internet e tente novamente.",
    };
  }

  if (error.code === "TIMEOUT") {
    return {
      title: "Busca demorou demais",
      message: "A busca excedeu o tempo limite. Tente novamente em instantes.",
    };
  }

  if (error.code === "INVALID_API_KEY") {
    return {
      title: "Erro de configuracao da API",
      message: "A chave da Anthropic e invalida, expirou ou nao esta autorizada.",
    };
  }

  if (error.code === "EMPTY_RESPONSE") {
    return {
      title: "Nenhuma vaga valida retornou",
      message: "A IA nao trouxe vagas validas para esta busca. Tente ajustar os filtros.",
    };
  }

  return {
    title: "Erro da API",
    message: error.message,
  };
}

export default function SearchScreen() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [allJobs, setAllJobs] = useState<Vaga[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [restoredToast, setRestoredToast] = useState<string | null>(null);

  useEffect(() => {
    carregarUltimaBusca().then((data) => {
      if (!data) return;

      setFilters(data.filters);
      setAllJobs(data.vagas);
      setMeta(data.meta);
      setHasSearched(true);

      const message = `Ultima busca: ${data.filters.cargo} em ${data.filters.cidade}`;
      if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        setRestoredToast(message);
      }
    });
  }, []);

  useEffect(() => {
    if (!restoredToast) return undefined;
    const timer = setTimeout(() => setRestoredToast(null), 2400);
    return () => clearTimeout(timer);
  }, [restoredToast]);

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return undefined;
    }

    const timer = setInterval(() => {
      setLoadingMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [loading]);

  const visibleJobs = allJobs.slice(0, visibleCount);
  const hasMore = visibleCount < allJobs.length;
  const errorCopy = useMemo(() => getErrorCopy(error), [error]);

  const handleSearch = async () => {
    if (!filters.cargo.trim() || !filters.cidade.trim()) {
      Alert.alert("Campos obrigatorios", "Preencha cargo e cidade para buscar vagas.");
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      setError(null);
      setCacheHit(false);
      setVisibleCount(PAGE_SIZE);

      const result = await buscarVagas(filters);
      setAllJobs(result.vagas);
      setMeta(result.meta);
      setCacheHit(result.cache);
    } catch (caughtError) {
      const nextError = (caughtError as AppError)?.code ? (caughtError as AppError) : buildUnknownError();
      setError(nextError);
      setAllJobs([]);
      setMeta(null);
      setCacheHit(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SearchForm filters={filters} loading={loading} onChange={setFilters} onSubmit={handleSearch} />

        {restoredToast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{restoredToast}</Text>
          </View>
        ) : null}

        {errorCopy ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>{errorCopy.title}</Text>
            <Text style={styles.errorText}>{errorCopy.message}</Text>
            <Pressable onPress={handleSearch} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {!errorCopy && hasSearched ? (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Vagas encontradas</Text>
            <Text style={styles.resultsMeta}>
              {loading ? LOADING_MESSAGES[loadingMessageIndex] : meta ? formatMetaLabel(meta) : `${allJobs.length} resultado(s)`}
            </Text>
            {!loading && cacheHit ? <Text style={styles.cacheHint}>resultado salvo</Text> : null}
          </View>
        ) : null}

        {loading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : null}

        {!loading && !errorCopy ? visibleJobs.map((job) => <JobCard job={job} key={job.id} />) : null}

        {!loading && !errorCopy && hasMore ? (
          <Pressable
            onPress={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, allJobs.length))}
            style={styles.loadMore}
          >
            <Text style={styles.loadMoreText}>Carregar mais ({Math.max(allJobs.length - visibleCount, 0)} restantes)</Text>
          </Pressable>
        ) : null}

        {!loading && !errorCopy && hasSearched && allJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma vaga encontrada nesta busca.</Text>
            <Text style={styles.emptyText}>Tente mudar cidade, cargo ou filtros para ampliar o resultado.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
  },
  resultsMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
  },
  cacheHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  errorState: {
    backgroundColor: "#1a0a0a",
    borderColor: "#5c1a1a",
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    padding: 20,
  },
  errorTitle: {
    color: "#ff6b6b",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  errorText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#5c1a1a",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#ff6b6b",
    fontSize: 13,
    fontWeight: "700",
  },
  toast: {
    alignSelf: "flex-start",
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  loadMore: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    paddingVertical: 16,
  },
  loadMoreText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});

