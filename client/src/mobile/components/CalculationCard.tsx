import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native-web";
import type { Calculation } from "../services/api";

type Props = {
  item: Calculation;
  onPress: (item: Calculation) => void;
  onDelete: (id: string) => void;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ResultSummary({ item }: { item: Calculation }) {
  if (item.type === "throughput") {
    const r = item.results as { throughput?: number; spectralEfficiency?: number };
    return (
      <Text style={styles.resultText} testID={`result-throughput-${item.id}`}>
        Throughput: {r.throughput?.toFixed(2) ?? "—"} Mbps
      </Text>
    );
  }
  const r = item.results as { sinr?: number; receivedPower?: number };
  return (
    <Text style={styles.resultText} testID={`result-sinr-${item.id}`}>
      SINR: {r.sinr?.toFixed(2) ?? "—"} dB · Rx: {r.receivedPower?.toFixed(2) ?? "—"} dBm
    </Text>
  );
}

export default function CalculationCard({ item, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      testID={`card-calculation-${item.id}`}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.type === "throughput" ? "Throughput" : "Link Budget"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          testID={`button-delete-${item.id}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.name} testID={`text-name-${item.id}`} numberOfLines={1}>
        {item.name}
      </Text>

      <ResultSummary item={item} />

      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  } as any,
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: "#e8f0fe",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0066cc",
    textTransform: "uppercase",
  },
  deleteBtn: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "bold",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  date: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
});
