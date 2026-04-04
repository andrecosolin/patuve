import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SearchForm } from "@/components/SearchForm";
import { colors } from "@/constants/theme";
import { buscarVagas, carregarBuscaSalva, removerBuscaSalva, salvarBusca } from "@/services/vagasService";
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

type BuscaSalva = {
  filters: SearchFilters;
  vagas: Vaga[];
  meta: SearchMeta;
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

function showToast(message: string, setToast: (msg: string | null) => void) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    setToast(message);
  }
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
  const [toast, setToast] = useState<string | null>(null);
  const [buscaSalva, setBuscaSalva] = useState<BuscaSalva | null>(null);

  // Ao iniciar: app começa limpo, apenas verifica se existe busca salva
  useEffect(() => {
    carregarBuscaSalva().then((data) => {
      if (data) setBuscaSalva(data);
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

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
  const podeSalvar = hasSearched && !loading && allJobs.length > 0 && !error;

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
      setBuscaSalva(null); // esconde o card ao iniciar nova busca

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

  const handleSalvarBusca = async () => {
    if (!meta) return;
    await salvarBusca(filters, allJobs, meta);
    showToast("Busca salva!", setToast);
  };

  const handleContinuarBusca = () => {
    if (!buscaSalva) return;
    setFilters(buscaSalva.filters);
    setAllJobs(buscaSalva.vagas);
    setMeta(buscaSalva.meta);
    setHasSearched(true);
    setCacheHit(false);
    setBuscaSalva(null);
  };

  const handleDescartarBuscaSalva = async () => {
    await removerBuscaSalva();
    setBuscaSalva(null);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SearchForm filters={filters} loading={loading} onChange={setFilters} onSubmit={handleSearch} />

        {/* Card de busca salva */}
        {buscaSalva && !hasSearched ? (
          <View style={styles.buscaSalvaCard}>
            <View style={styles.buscaSalvaInfo}>
              <Ionicons name="bookmark" size={16} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.buscaSalvaLabel} numberOfLines={1}>
                {buscaSalva.filters.cargo} em {buscaSalva.filters.cidade}
              </Text>
            </View>
            <View style={styles.buscaSalvaActions}>
              <Pressable onPress={handleContinuarBusca} style={styles.buscaSalvaBtnPrimary}>
                <Text style={styles.buscaSalvaBtnPrimaryText}>Continuar</Text>
              </Pressable>
              <Pressable onPress={handleDescartarBuscaSalva} style={styles.buscaSalvaBtnSecondary}>
                <Text style={styles.buscaSalvaBtnSecondaryText}>Descartar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Toast */}
        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
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
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsTitle}>Vagas encontradas</Text>
              {podeSalvar ? (
                <Pressable onPress={handleSalvarBusca} style={styles.salvarBtn} hitSlop={8}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.accent} />
                  <Text style={styles.salvarBtnText}>Salvar busca</Text>
                </Pressable>
              ) : null}
            </View>
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
  buscaSalvaCard: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.accent,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  buscaSalvaInfo: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  buscaSalvaLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  buscaSalvaActions: {
    flexDirection: "row",
    gap: 8,
  },
  buscaSalvaBtnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  buscaSalvaBtnPrimaryText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "700",
  },
  buscaSalvaBtnSecondary: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  buscaSalvaBtnSecondaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
  },
  salvarBtn: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  salvarBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
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
