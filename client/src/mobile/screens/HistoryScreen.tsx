import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
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
import { useNavigation } from "../navigation";
import apiService, { type Calculation } from "../services/api";
import CalculationCard from "../components/CalculationCard";
import LoadingIndicator from "../components/LoadingIndicator";

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [filtered, setFiltered] = useState<Calculation[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "throughput" | "linkbudget">("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getCalculations();
      setCalculations(data);
      setFiltered(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Falha na conexão com o servidor.";
      setError(msg);
      Alert.alert("Erro de Rede", `Não foi possível carregar os cálculos.\n${msg}`, [
        { text: "Tentar Novamente", onPress: fetchData },
        { text: "Cancelar", style: "cancel" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let list = calculations;
    if (activeFilter !== "all") {
      list = list.filter((c) => c.type === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [search, activeFilter, calculations]);

  async function handleDelete(id: string) {
    Alert.alert("Confirmar Exclusão", "Deseja excluir este cenário?", [
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteCalculation(id);
            setCalculations((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert("Erro", "Não foi possível excluir o cenário.");
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function handlePress(item: Calculation) {
    navigation.navigate("Detail", { calculation: item });
  }

  const renderItem = ({ item }: { item: Calculation }) => (
    <CalculationCard item={item} onPress={handlePress} onDelete={handleDelete} />
  );

  return (
    <View style={styles.container} testID="screen-history">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID="button-back"
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Histórico</Text>
        <TouchableOpacity onPress={fetchData} testID="button-refresh">
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome..."
          value={search}
          onChangeText={setSearch}
          testID="input-search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterRow}>
        {(["all", "throughput", "linkbudget"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
            testID={`filter-${f}`}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === "all" ? "Todos" : f === "throughput" ? "Throughput" : "Link Budget"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingIndicator message="Carregando histórico..." />
      ) : error ? (
        <View style={styles.errorContainer} testID="error-container">
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData} testID="button-retry">
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer} testID="empty-list">
              <Text style={styles.emptyText}>Nenhum cenário encontrado.</Text>
              <TouchableOpacity
                style={styles.newBtn}
                onPress={() => navigation.goBack()}
                testID="button-new-calculation"
              >
                <Text style={styles.newBtnText}>Fazer um cálculo</Text>
              </TouchableOpacity>
            </View>
          }
          testID="flatlist-calculations"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
  refreshText: { fontSize: 14, color: "#0066cc", fontWeight: "500" },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111827",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  filterBtnActive: { backgroundColor: "#0066cc" },
  filterText: { fontSize: 12, fontWeight: "500", color: "#475569" },
  filterTextActive: { color: "#ffffff" },
  list: { paddingTop: 8, paddingBottom: 24 },
  emptyList: { flex: 1, justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 15, color: "#9ca3af", marginBottom: 16 },
  newBtn: {
    backgroundColor: "#0066cc",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  newBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { fontSize: 14, color: "#dc2626", textAlign: "center", marginBottom: 16 },
  retryBtn: {
    backgroundColor: "#0066cc",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  retryText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
});
