import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
import apiService, { type Calculation } from "../services/api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function DetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const calculation = route.params?.calculation as Calculation | undefined;

  if (!calculation) {
    return (
      <View style={styles.center} testID="screen-detail-empty">
        <Text style={styles.noDataText}>Nenhum dado disponível.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} testID="button-back-empty">
          <Text style={styles.backLink}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLinkBudget = calculation.type === "linkbudget";

  async function handleDelete() {
    Alert.alert("Excluir Cenário", `Deseja excluir "${calculation!.name}"?`, [
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteCalculation(calculation!.id);
            Alert.alert("Excluído", "Cenário removido com sucesso.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch {
            Alert.alert("Erro", "Não foi possível excluir o cenário.");
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  const params = calculation.parameters as Record<string, any>;
  const results = calculation.results as Record<string, any>;

  return (
    <ScrollView style={styles.container} testID="screen-detail">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} testID="button-back">
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{calculation.name}</Text>
        <TouchableOpacity onPress={handleDelete} testID="button-delete">
          <Text style={styles.deleteText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metaCard} testID="meta-card">
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {isLinkBudget ? "Link Budget" : "Throughput"}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(calculation.createdAt)}</Text>
      </View>

      <View style={styles.section} testID="results-section">
        <Text style={styles.sectionTitle}>Resultados</Text>
        <View style={styles.card}>
          {isLinkBudget ? (
            <>
              <Row label="Perda de Percurso" value={`${results.pathLoss?.toFixed(2) ?? "—"} dB`} />
              <Row label="Potência Recebida" value={`${results.receivedPower?.toFixed(2) ?? "—"} dBm`} />
              <Row label="Piso de Ruído" value={`${results.noiseFloor?.toFixed(2) ?? "—"} dBm`} />
              <Row label="SINR" value={`${results.sinr?.toFixed(2) ?? "—"} dB`} />
            </>
          ) : (
            <>
              <Row label="Throughput DL" value={`${results.throughput?.toFixed(2) ?? "—"} Mbps`} />
              <Row label="Eficiência Espectral" value={`${results.spectralEfficiency?.toFixed(3) ?? "—"} bits/s/Hz`} />
            </>
          )}
        </View>
      </View>

      <View style={styles.section} testID="parameters-section">
        <Text style={styles.sectionTitle}>Parâmetros</Text>
        <View style={styles.card}>
          {Object.entries(params).map(([key, val]) => (
            <Row key={key} label={key} value={String(val)} />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.goHistoryBtn}
        onPress={() => navigation.goBack()}
        testID="button-back-bottom"
      >
        <Text style={styles.goHistoryText}>← Voltar ao Histórico</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  noDataText: { fontSize: 15, color: "#9ca3af", marginBottom: 12 },
  backLink: { fontSize: 14, color: "#0066cc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { paddingRight: 8 },
  backText: { fontSize: 14, color: "#0066cc", fontWeight: "500" },
  title: { fontSize: 16, fontWeight: "700", color: "#0f172a", flex: 1, textAlign: "center" },
  deleteText: { fontSize: 14, color: "#dc2626", fontWeight: "500" },
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  typeBadge: {
    backgroundColor: "#e8f0fe",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: { fontSize: 12, fontWeight: "600", color: "#0066cc" },
  dateText: { fontSize: 12, color: "#9ca3af" },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: { fontSize: 13, color: "#6b7280", flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "600", color: "#111827", fontFamily: "monospace" },
  goHistoryBtn: {
    margin: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  goHistoryText: { fontSize: 14, color: "#374151", fontWeight: "600" },
});
