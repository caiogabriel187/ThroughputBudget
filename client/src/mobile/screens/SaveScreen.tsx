import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native-web";
const Alert = {
  alert: (title: string, message?: string, buttons?: Array<{text: string; onPress?: () => void; style?: string}>) => {
    if (buttons && buttons.length > 0) {
      const confirmed = window.confirm(`${title}\n\n${message || ""}`);
      if (confirmed) {
        const confirmBtn = buttons.find(b => b.style !== "cancel");
        confirmBtn?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message || ""}`);
    }
  }
};
import { useNavigation, useRoute } from "../navigation";
import apiService from "../services/api";

type FormErrors = {
  name?: string;
};

function validate(name: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) {
    errors.name = "O nome do cenário é obrigatório.";
  } else if (name.trim().length < 3) {
    errors.name = "O nome deve ter pelo menos 3 caracteres.";
  } else if (name.trim().length > 80) {
    errors.name = "O nome deve ter no máximo 80 caracteres.";
  }
  return errors;
}

export default function SaveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, parameters, results } = (route.params || {}) as {
    type: "throughput" | "linkbudget";
    parameters: Record<string, any>;
    results: Record<string, any>;
  };

  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (errors.name) {
      setErrors(validate(value));
    }
  }

  async function handleSave() {
    const validationErrors = validate(name);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await apiService.saveCalculation({
        name: name.trim(),
        type,
        parameters,
        results,
      });
      Alert.alert("Salvo com sucesso!", `O cenário "${name.trim()}" foi salvo.`, [
        {
          text: "Ver Histórico",
          onPress: () => navigation.navigate("History"),
        },
        {
          text: "Nova Calculadora",
          onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
            if (navigation.canGoBack()) navigation.goBack();
          },
        },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Falha na conexão.";
      Alert.alert("Erro ao Salvar", `Não foi possível salvar o cenário.\n${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  const isLinkBudget = type === "linkbudget";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="screen-save">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID="button-back"
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Salvar Cenário</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.typeBanner}>
        <Text style={styles.typeLabel}>
          Tipo: {isLinkBudget ? "Link Budget" : "Throughput"}
        </Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>Dados do Cenário</Text>

        <Text style={styles.label}>
          Nome do Cenário <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Ex: Ericsson NR 3.5 GHz Outdoor"
          testID="input-scenario-name"
          maxLength={80}
          autoFocus
        />
        {errors.name ? (
          <Text style={styles.errorText} testID="error-name">
            {errors.name}
          </Text>
        ) : null}
        <Text style={styles.hint}>{name.length}/80 caracteres</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionLabel}>Resumo dos Resultados</Text>
        {isLinkBudget ? (
          <View style={styles.summaryCard} testID="summary-linkbudget">
            <SummaryRow label="Perda de Percurso" value={`${results?.pathLoss?.toFixed(2) ?? "—"} dB`} />
            <SummaryRow label="Potência Recebida" value={`${results?.receivedPower?.toFixed(2) ?? "—"} dBm`} />
            <SummaryRow label="Piso de Ruído" value={`${results?.noiseFloor?.toFixed(2) ?? "—"} dBm`} />
            <SummaryRow label="SINR" value={`${results?.sinr?.toFixed(2) ?? "—"} dB`} />
          </View>
        ) : (
          <View style={styles.summaryCard} testID="summary-throughput">
            <SummaryRow label="Throughput DL" value={`${results?.throughput?.toFixed(2) ?? "—"} Mbps`} />
            <SummaryRow label="Eficiência Espectral" value={`${results?.spectralEfficiency?.toFixed(3) ?? "—"} bits/s/Hz`} />
          </View>
        )}
      </View>

      <View style={styles.paramSection}>
        <Text style={styles.sectionLabel}>Parâmetros Utilizados</Text>
        <View style={styles.paramCard} testID="params-card">
          {Object.entries(parameters || {}).map(([key, val]) => (
            <SummaryRow key={key} label={key} value={String(val)} />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
        testID="button-confirm-save"
      >
        {isSaving ? (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color="#ffffff" testID="save-activity-indicator" />
            <Text style={styles.saveBtnText}>Salvando...</Text>
          </View>
        ) : (
          <Text style={styles.saveBtnText}>Confirmar Salvamento</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  label: { fontSize: 12, color: "#6b7280", flex: 1 },
  value: { fontSize: 12, fontWeight: "600", color: "#111827", fontFamily: "monospace" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: 14, color: "#0066cc", fontWeight: "500" },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  typeBanner: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  typeLabel: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },
  formSection: { padding: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  label: { fontSize: 13, color: "#374151", marginBottom: 6 },
  required: { color: "#dc2626" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  inputError: { borderColor: "#dc2626" },
  errorText: { fontSize: 12, color: "#dc2626", marginTop: 4 },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: 3, textAlign: "right" },
  summarySection: { paddingHorizontal: 16, marginTop: 4 },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 4,
  },
  paramSection: { paddingHorizontal: 16, marginTop: 8 },
  paramCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#0066cc",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  savingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
