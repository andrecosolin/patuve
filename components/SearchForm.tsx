import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";
import { ContractType, SearchFilters, SeniorityLevel, WorkMode } from "@/types/vaga";

type SearchFormProps = {
  filters: SearchFilters;
  onChange: (nextFilters: SearchFilters) => void;
  onSubmit: () => void;
  loading: boolean;
};

const contractOptions: ContractType[] = ["CLT", "PJ", "Ambos"];
const seniorityOptions: SeniorityLevel[] = ["Junior", "Pleno", "Senior", "Todos"];
const workModeOptions: WorkMode[] = ["Remoto", "Hibrido", "Presencial", "Todas"];

type ChipGroupProps<T extends string> = {
  label: string;
  options: T[];
  value: T;
  onSelect: (value: T) => void;
};

function ChipGroup<T extends string>({ label, options, value, onSelect }: ChipGroupProps<T>) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = option === value;

          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const DEFAULT_FILTERS = {
  tipoContrato: "Ambos" as ContractType,
  nivel: "Todos" as SeniorityLevel,
  modalidade: "Todas" as WorkMode,
};

type ActiveFilter = { label: string; field: "tipoContrato" | "nivel" | "modalidade" };

export function SearchForm({ filters, onChange, onSubmit, loading }: SearchFormProps) {
  const updateField = <K extends keyof SearchFilters>(field: K, value: SearchFilters[K]) => {
    onChange({ ...filters, [field]: value });
  };

  const activeFilters: ActiveFilter[] = [
    filters.tipoContrato !== DEFAULT_FILTERS.tipoContrato && { label: filters.tipoContrato, field: "tipoContrato" as const },
    filters.nivel !== DEFAULT_FILTERS.nivel && { label: filters.nivel, field: "nivel" as const },
    filters.modalidade !== DEFAULT_FILTERS.modalidade && { label: filters.modalidade, field: "modalidade" as const },
  ].filter(Boolean) as ActiveFilter[];

  const clearFilters = () => {
    onChange({ ...filters, ...DEFAULT_FILTERS });
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>PATUVE</Text>
        <Text style={styles.subtitle}>Pra tu ver a vaga certa.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cargo</Text>
        <View style={styles.inputWrapper}>
          <Ionicons color={colors.muted} name="briefcase-outline" size={18} />
          <TextInput
            onChangeText={(text) => updateField("cargo", text)}
            placeholder="Ex.: Desenvolvedor React Native"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={filters.cargo}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cidade</Text>
        <View style={styles.inputWrapper}>
          <Ionicons color={colors.muted} name="location-outline" size={18} />
          <TextInput
            onChangeText={(text) => updateField("cidade", text)}
            placeholder="Ex.: Sao Paulo"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={filters.cidade}
          />
        </View>
      </View>

      <ChipGroup
        label="Tipo"
        onSelect={(value) => updateField("tipoContrato", value)}
        options={contractOptions}
        value={filters.tipoContrato}
      />
      <ChipGroup
        label="Nivel"
        onSelect={(value) => updateField("nivel", value)}
        options={seniorityOptions}
        value={filters.nivel}
      />
      <ChipGroup
        label="Modalidade"
        onSelect={(value) => updateField("modalidade", value)}
        options={workModeOptions}
        value={filters.modalidade}
      />

      {activeFilters.length > 0 ? (
        <View style={styles.activeFiltersRow}>
          {activeFilters.map((f) => (
            <Pressable key={f.field} onPress={() => updateField(f.field, DEFAULT_FILTERS[f.field])} style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{f.label}</Text>
              <Ionicons color={colors.background} name="close" size={12} />
            </Pressable>
          ))}
          <Pressable onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpar filtros</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable disabled={loading} onPress={onSubmit} style={[styles.button, loading && styles.buttonDisabled]}>
        <Ionicons color={colors.background} name="search" size={18} />
        <Text style={styles.buttonText}>{loading ? "Buscando..." : "Buscar vagas"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 24,
    padding: 20,
  },
  brandRow: {
    marginBottom: 20,
  },
  brand: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
  },
  group: {
    gap: 10,
    marginBottom: 16,
  },
  groupLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.background,
  },
  activeFiltersRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  activeFilterChip: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeFilterText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "700",
  },
  clearButton: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 15,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
});
