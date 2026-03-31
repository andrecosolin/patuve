import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { colors } from "@/constants/theme";
import { useCandidaturas } from "@/context/CandidaturasContext";
import { useSavedJobs } from "@/context/SavedJobsContext";
import { formatarDataCandidatura } from "@/utils/dataRelativa";

export default function SavedJobsScreen() {
  const { savedJobs, clearAllJobs } = useSavedJobs();
  const { candidaturas, limparCandidaturas } = useCandidaturas();

  const handleClearAll = () => {
    Alert.alert(
      "Remover todas as vagas?",
      "Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover todas", style: "destructive", onPress: clearAllJobs },
      ]
    );
  };

  const handleClearCandidaturas = () => {
    Alert.alert(
      "Limpar histórico?",
      "O histórico de vagas visitadas será apagado.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: limparCandidaturas },
      ]
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Vagas salvas ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.title}>PATUVÊ</Text>
            <Text style={styles.subtitle}>Vagas salvas para você revisitar quando quiser.</Text>
          </View>
          {savedJobs.length > 0 ? (
            <Pressable onPress={handleClearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Remover todas</Text>
            </Pressable>
          ) : null}
        </View>

        {savedJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma vaga salva ainda.</Text>
            <Text style={styles.emptyText}>
              Que tal buscar agora? Toque no marcador de qualquer vaga para guardar aqui.
            </Text>
            <Pressable onPress={() => router.navigate("/")} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Buscar vagas →</Text>
            </Pressable>
          </View>
        ) : (
          savedJobs.map((job) => <JobCard job={job} key={job.id} />)
        )}

        {/* ── Vagas visitadas ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons color={colors.success} name="checkmark-circle-outline" size={18} />
            <Text style={styles.sectionTitle}>Vagas visitadas</Text>
            <Text style={styles.sectionCount}>{candidaturas.length}</Text>
          </View>
          {candidaturas.length > 0 ? (
            <Pressable onPress={handleClearCandidaturas} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Limpar</Text>
            </Pressable>
          ) : null}
        </View>

        {candidaturas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma vaga visitada ainda.</Text>
            <Text style={styles.emptyText}>
              Quando você tocar em VER VAGA, a vaga aparece aqui automaticamente.
            </Text>
          </View>
        ) : (
          candidaturas.map((c) => (
            <View key={c.link_direto} style={styles.candidaturaCard}>
              <View style={styles.candidaturaInfo}>
                <Text numberOfLines={2} style={styles.candidaturaTitulo}>{c.titulo}</Text>
                <Text style={styles.candidaturaEmpresa}>{c.empresa ?? "Empresa não informada"}</Text>
                <View style={styles.candidaturaBadge}>
                  <Ionicons color={colors.success} name="checkmark-circle" size={12} />
                  <Text style={styles.candidaturaData}>{formatarDataCandidatura(c.data_candidatura)}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => Linking.openURL(c.link_direto)}
                style={styles.candidaturaLink}
              >
                <Ionicons color={colors.background} name="open-outline" size={16} />
              </Pressable>
            </View>
          ))
        )}
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
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionCount: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 999,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearButton: {
    borderColor: "#5c1a1a",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: "#ff6b6b",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 28,
    padding: 24,
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
    marginBottom: 20,
  },
  searchButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  searchButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
  candidaturaCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14,
  },
  candidaturaInfo: {
    flex: 1,
    paddingRight: 12,
  },
  candidaturaTitulo: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  candidaturaEmpresa: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  candidaturaBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
  },
  candidaturaData: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
  },
  candidaturaLink: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: "center",
    padding: 12,
  },
});
