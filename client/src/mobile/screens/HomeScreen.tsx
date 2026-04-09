import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

type SinrQuality = { label: string; color: string };

function getSinrQuality(sinr: number): SinrQuality {
  if (sinr >= 20) return { label: "Excelente", color: "#16a34a" };
  if (sinr >= 10) return { label: "Bom", color: "#2563eb" };
  if (sinr >= 0) return { label: "Marginal", color: "#d97706" };
  return { label: "Ruim", color: "#dc2626" };
}

export default function HomeScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<"throughput" | "linkbudget">("throughput");

  const [bwMHz, setBwMHz] = useState("100");
  const [mimoLayers, setMimoLayers] = useState("4");
  const [codeRate, setCodeRate] = useState("0.9258");
  const [dlFraction, setDlFraction] = useState("0.75");
  const [overhead, setOverhead] = useState("0.14");
  const [modulationBits, setModulationBits] = useState("8");

  const [txPower, setTxPower] = useState("30");
  const [txGain, setTxGain] = useState("15");
  const [rxGain, setRxGain] = useState("0");
  const [txCableLoss, setTxCableLoss] = useState("0");
  const [rxCableLoss, setRxCableLoss] = useState("0");
  const [otherLosses, setOtherLosses] = useState("2");
  const [frequency, setFrequency] = useState("3500");
  const [distanceKm, setDistanceKm] = useState("0.5");
  const [noiseFigure, setNoiseFigure] = useState("7");
  const [rbBwMHz, setRbBwMHz] = useState("20");

  const throughput = useMemo(() => {
    const bw = parseFloat(bwMHz) || 0;
    const layers = parseFloat(mimoLayers) || 1;
    const cr = parseFloat(codeRate) || 0;
    const dl = parseFloat(dlFraction) || 1;
    const oh = parseFloat(overhead) || 0;
    const mod = parseFloat(modulationBits) || 6;
    const specEff = mod * cr * layers;
    return bw * specEff * dl * (1 - oh);
  }, [bwMHz, mimoLayers, codeRate, dlFraction, overhead, modulationBits]);

  const spectralEfficiency = useMemo(() => {
    const layers = parseFloat(mimoLayers) || 1;
    const cr = parseFloat(codeRate) || 0;
    const mod = parseFloat(modulationBits) || 6;
    return mod * cr * layers;
  }, [mimoLayers, codeRate, modulationBits]);

  const { pathLoss, receivedPower, noiseFloor, sinrDb } = useMemo(() => {
    const d = parseFloat(distanceKm) || 0.001;
    const f = parseFloat(frequency) || 3500;
    const pl = 20 * Math.log10(Math.max(0.001, d)) + 20 * Math.log10(f) + 32.44;
    const tp = parseFloat(txPower) || 0;
    const tg = parseFloat(txGain) || 0;
    const rg = parseFloat(rxGain) || 0;
    const tcl = parseFloat(txCableLoss) || 0;
    const rcl = parseFloat(rxCableLoss) || 0;
    const ol = parseFloat(otherLosses) || 0;
    const nf = parseFloat(noiseFigure) || 0;
    const rbBw = parseFloat(rbBwMHz) || 20;
    const rp = tp - tcl + tg - pl + rg - rcl - ol;
    const B = Math.max(1e3, rbBw * 1e6);
    const thermal = -174 + 10 * Math.log10(B);
    const nFloor = thermal + nf;
    return {
      pathLoss: pl,
      receivedPower: rp,
      noiseFloor: nFloor,
      sinrDb: rp - nFloor,
    };
  }, [txPower, txGain, rxGain, txCableLoss, rxCableLoss, otherLosses, frequency, distanceKm, noiseFigure, rbBwMHz]);

  const sinrQuality = getSinrQuality(sinrDb);

  function handleSave() {
    const isValid =
      activeTab === "throughput"
        ? parseFloat(bwMHz) > 0 && parseFloat(mimoLayers) > 0
        : parseFloat(txPower) > 0 && parseFloat(distanceKm) > 0;

    if (!isValid) {
      Alert.alert("Campos inválidos", "Preencha todos os campos obrigatórios corretamente antes de salvar.");
      return;
    }

    navigation.navigate("Save", {
      type: activeTab,
      parameters:
        activeTab === "throughput"
          ? { bwMHz: parseFloat(bwMHz), mimoLayers: parseFloat(mimoLayers), codeRate: parseFloat(codeRate), dlFraction: parseFloat(dlFraction), overhead: parseFloat(overhead), modulationBits: parseFloat(modulationBits) }
          : { txPower: parseFloat(txPower), txGain: parseFloat(txGain), rxGain: parseFloat(rxGain), txCableLoss: parseFloat(txCableLoss), rxCableLoss: parseFloat(rxCableLoss), otherLosses: parseFloat(otherLosses), frequency: parseFloat(frequency), distanceKm: parseFloat(distanceKm), noiseFigure: parseFloat(noiseFigure), rbBwMHz: parseFloat(rbBwMHz) },
      results:
        activeTab === "throughput"
          ? { throughput, spectralEfficiency }
          : { pathLoss, receivedPower, noiseFloor, sinr: sinrDb },
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="screen-home">
      <Text style={styles.title}>Calculadora 5G NR</Text>
      <Text style={styles.subtitle}>Análise de throughput e link budget</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "throughput" && styles.tabActive]}
          onPress={() => setActiveTab("throughput")}
          testID="tab-throughput"
        >
          <Text style={[styles.tabText, activeTab === "throughput" && styles.tabTextActive]}>
            Throughput
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "linkbudget" && styles.tabActive]}
          onPress={() => setActiveTab("linkbudget")}
          testID="tab-linkbudget"
        >
          <Text style={[styles.tabText, activeTab === "linkbudget" && styles.tabTextActive]}>
            Link Budget
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "throughput" ? (
        <View style={styles.section} testID="section-throughput">
          <Text style={styles.sectionTitle}>Parâmetros de Throughput</Text>

          <Text style={styles.label}>Largura de Banda (MHz) *</Text>
          <TextInput
            style={styles.input}
            value={bwMHz}
            onChangeText={setBwMHz}
            keyboardType="decimal-pad"
            placeholder="ex: 100"
            testID="input-bandwidth"
          />

          <Text style={styles.label}>Camadas MIMO *</Text>
          <TextInput
            style={styles.input}
            value={mimoLayers}
            onChangeText={setMimoLayers}
            keyboardType="decimal-pad"
            placeholder="ex: 4"
            testID="input-mimo"
          />

          <Text style={styles.label}>Bits de Modulação (QPSK=2, 16QAM=4, 64QAM=6, 256QAM=8)</Text>
          <TextInput
            style={styles.input}
            value={modulationBits}
            onChangeText={setModulationBits}
            keyboardType="decimal-pad"
            placeholder="ex: 8"
            testID="input-modulation-bits"
          />

          <Text style={styles.label}>Code Rate (0-1)</Text>
          <TextInput
            style={styles.input}
            value={codeRate}
            onChangeText={setCodeRate}
            keyboardType="decimal-pad"
            placeholder="ex: 0.9258"
            testID="input-code-rate"
          />

          <Text style={styles.label}>Fração DL (TDD: 0.75, FDD: 1.0)</Text>
          <TextInput
            style={styles.input}
            value={dlFraction}
            onChangeText={setDlFraction}
            keyboardType="decimal-pad"
            placeholder="ex: 0.75"
            testID="input-dl-fraction"
          />

          <Text style={styles.label}>Overhead de Sinalização (0-1)</Text>
          <TextInput
            style={styles.input}
            value={overhead}
            onChangeText={setOverhead}
            keyboardType="decimal-pad"
            placeholder="ex: 0.14"
            testID="input-overhead"
          />

          <View style={styles.resultsCard} testID="results-throughput">
            <Text style={styles.resultsTitle}>Resultados</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Throughput DL</Text>
              <Text style={styles.resultValue} testID="value-throughput">
                {throughput.toFixed(2)} Mbps
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Eficiência Espectral</Text>
              <Text style={styles.resultValue} testID="value-spectral-efficiency">
                {spectralEfficiency.toFixed(3)} bits/s/Hz
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.section} testID="section-linkbudget">
          <Text style={styles.sectionTitle}>Parâmetros de Link Budget</Text>

          <Text style={styles.label}>Potência Tx (dBm) *</Text>
          <TextInput style={styles.input} value={txPower} onChangeText={setTxPower} keyboardType="decimal-pad" placeholder="ex: 30" testID="input-tx-power" />

          <Text style={styles.label}>Ganho Antena Tx (dBi)</Text>
          <TextInput style={styles.input} value={txGain} onChangeText={setTxGain} keyboardType="decimal-pad" placeholder="ex: 15" testID="input-tx-gain" />

          <Text style={styles.label}>Ganho Antena Rx (dBi)</Text>
          <TextInput style={styles.input} value={rxGain} onChangeText={setRxGain} keyboardType="decimal-pad" placeholder="ex: 0" testID="input-rx-gain" />

          <Text style={styles.label}>Perda Cabo Tx (dB)</Text>
          <TextInput style={styles.input} value={txCableLoss} onChangeText={setTxCableLoss} keyboardType="decimal-pad" placeholder="ex: 0" testID="input-tx-cable" />

          <Text style={styles.label}>Perda Cabo Rx (dB)</Text>
          <TextInput style={styles.input} value={rxCableLoss} onChangeText={setRxCableLoss} keyboardType="decimal-pad" placeholder="ex: 0" testID="input-rx-cable" />

          <Text style={styles.label}>Outras Perdas (dB)</Text>
          <TextInput style={styles.input} value={otherLosses} onChangeText={setOtherLosses} keyboardType="decimal-pad" placeholder="ex: 2" testID="input-other-losses" />

          <Text style={styles.label}>Frequência (MHz)</Text>
          <TextInput style={styles.input} value={frequency} onChangeText={setFrequency} keyboardType="decimal-pad" placeholder="ex: 3500" testID="input-frequency" />

          <Text style={styles.label}>Distância (km) *</Text>
          <TextInput style={styles.input} value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" placeholder="ex: 0.5" testID="input-distance" />

          <Text style={styles.label}>Figura de Ruído (dB)</Text>
          <TextInput style={styles.input} value={noiseFigure} onChangeText={setNoiseFigure} keyboardType="decimal-pad" placeholder="ex: 7" testID="input-noise-figure" />

          <Text style={styles.label}>Largura de Banda Rx (MHz)</Text>
          <TextInput style={styles.input} value={rbBwMHz} onChangeText={setRbBwMHz} keyboardType="decimal-pad" placeholder="ex: 20" testID="input-rx-bw" />

          <View style={styles.resultsCard} testID="results-linkbudget">
            <Text style={styles.resultsTitle}>Resultados</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Perda de Percurso (FSPL)</Text>
              <Text style={styles.resultValue} testID="value-path-loss">
                {pathLoss.toFixed(2)} dB
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Potência Recebida</Text>
              <Text style={styles.resultValue} testID="value-received-power">
                {receivedPower.toFixed(2)} dBm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Piso de Ruído</Text>
              <Text style={styles.resultValue} testID="value-noise-floor">
                {noiseFloor.toFixed(2)} dBm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>SINR</Text>
              <View style={styles.sinrRow}>
                <Text style={styles.resultValue} testID="value-sinr">
                  {sinrDb.toFixed(2)} dB
                </Text>
                <View style={[styles.qualityBadge, { backgroundColor: sinrQuality.color + "22" }]}>
                  <Text style={[styles.qualityText, { color: sinrQuality.color }]} testID="badge-sinr-quality">
                    {sinrQuality.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          testID="button-save-calculation"
        >
          <Text style={styles.btnPrimaryText}>Salvar Cenário</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate("History")}
          testID="button-go-history"
        >
          <Text style={styles.btnSecondaryText}>Ver Histórico</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: { backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", elevation: 2 } as any,
  tabText: { fontSize: 14, fontWeight: "500", color: "#64748b" },
  tabTextActive: { color: "#0f172a", fontWeight: "600" },
  section: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  label: { fontSize: 13, color: "#475569", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  resultsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  resultLabel: { fontSize: 13, color: "#6b7280", flex: 1 },
  resultValue: { fontSize: 14, fontWeight: "700", color: "#0f172a", fontFamily: "monospace" },
  sinrRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qualityBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qualityText: { fontSize: 11, fontWeight: "700" },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#0066cc",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  btnSecondaryText: { color: "#374151", fontWeight: "600", fontSize: 14 },
});
