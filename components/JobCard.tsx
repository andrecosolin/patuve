import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useCandidaturas } from "@/context/CandidaturasContext";
import { useSavedJobs } from "@/context/SavedJobsContext";
import { formatarDataCandidatura, formatarPublicacao } from "@/utils/dataRelativa";
import { FonteVaga, Vaga } from "@/types/vaga";

type JobCardProps = {
  job: Vaga;
};

const SOURCE_BADGE_COLORS: Record<FonteVaga, string> = {
  LinkedIn: "#0a66c2",
  Gupy: "#6b5ce7",
  Indeed: "#2164f3",
  Catho: "#e63946",
  InfoJobs: "#ff6b35",
  "Vagas.com": "#00b4d8",
  "trampos.co": "#06d6a0",
  Outro: "#3a3a4a",
};

export function JobCard({ job }: JobCardProps) {
  const { isSaved, toggleSavedJob } = useSavedJobs();
  const { jaMeCandidatei, registrarCandidatura, getDataCandidatura } = useCandidaturas();

  const saved = isSaved(job.id);
  const candidatou = jaMeCandidatei(job.link_direto);
  const dataCandidatura = candidatou ? getDataCandidatura(job.link_direto) : null;

  const handleOpenLink = async () => {
    const canOpen = await Linking.canOpenURL(job.link_direto);
    if (!canOpen) {
      Alert.alert("Link indisponível", "Não foi possível abrir esta vaga.");
      return;
    }
    registrarCandidatura(job);
    await Linking.openURL(job.link_direto);
  };

  const handleShare = async () => {
    await Share.share({
      message: `${job.titulo}${job.empresa ? ` — ${job.empresa}` : ""}\n${job.link_direto}`,
      url: job.link_direto,
    });
  };

  const publicacaoTexto = formatarPublicacao(job.data_publicacao);

  return (
    <View style={[styles.card, candidatou && styles.cardVisitado]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{job.titulo}</Text>
          <Text style={styles.company}>{job.empresa ?? "Empresa não informada"}</Text>
          {candidatou && dataCandidatura ? (
            <View style={styles.candidaturaBadge}>
              <Ionicons color={colors.success} name="checkmark-circle" size={12} />
              <Text style={styles.candidaturaText}>{formatarDataCandidatura(dataCandidatura)}</Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => toggleSavedJob(job)} style={styles.saveButton}>
          <Ionicons
            color={saved ? colors.accent : colors.muted}
            name={saved ? "bookmark" : "bookmark-outline"}
            size={20}
          />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Ionicons color={colors.success} name="location-outline" size={14} />
        <Text style={styles.metaText}>{job.localizacao}</Text>
      </View>

      <View style={styles.badgeRow}>
        {job.tipo_contrato ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.tipo_contrato}</Text>
          </View>
        ) : null}
        {job.modalidade ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.modalidade}</Text>
          </View>
        ) : null}
        <View style={[styles.badge, { backgroundColor: SOURCE_BADGE_COLORS[job.fonte] }]}>
          <Text style={[styles.badgeText, styles.badgeTextWhite]}>{job.fonte}</Text>
        </View>
      </View>

      <Text numberOfLines={4} style={styles.description}>
        {job.descricao_curta}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {publicacaoTexto ? (
            <View style={styles.dateRow}>
              <Ionicons color={colors.muted} name="calendar-outline" size={11} />
              <Text style={styles.date}>{publicacaoTexto}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footerActions}>
          <Pressable onPress={handleShare} style={styles.shareButton}>
            <Ionicons color={colors.muted} name="share-outline" size={18} />
          </Pressable>
          <Pressable onPress={handleOpenLink} style={styles.cta}>
            <Text style={styles.ctaText}>VER VAGA →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  cardVisitado: {
    opacity: 0.65,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  company: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  candidaturaBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
  },
  candidaturaText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 999,
    padding: 10,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    color: colors.text,
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextWhite: {
    color: "#fff",
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLeft: {
    flex: 1,
  },
  footerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  shareButton: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 999,
    padding: 12,
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ctaText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "900",
  },
});
