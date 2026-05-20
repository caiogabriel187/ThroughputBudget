import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

// ─── Modelos de Perda de Percurso ─────────────────────────────────────────────
function fspl(d_km: number, f_mhz: number): number {
  if (d_km <= 0) return 0;
  return 20 * Math.log10(d_km) + 20 * Math.log10(f_mhz) + 32.44;
}

function uma_los(d_km: number, f_mhz: number, hBS = 25, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  return 28.0 + 22 * Math.log10(Math.max(d3D, 1)) + 20 * Math.log10(f_ghz);
}

function uma_nlos(d_km: number, f_mhz: number, hBS = 25, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  const pl = 13.54 + 39.08 * Math.log10(Math.max(d3D, 1)) + 20 * Math.log10(f_ghz) - 0.6 * (hUT - 1.5);
  return Math.max(pl, uma_los(d_km, f_mhz, hBS, hUT));
}

function umi_los(d_km: number, f_mhz: number, hBS = 10, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  return 32.4 + 21 * Math.log10(Math.max(d3D, 1)) + 20 * Math.log10(f_ghz);
}

function umi_nlos(d_km: number, f_mhz: number, hBS = 10, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  const pl = 35.3 * Math.log10(Math.max(d3D, 1)) + 22.4 + 21.3 * Math.log10(f_ghz) - 0.3 * (hUT - 1.5);
  return Math.max(pl, umi_los(d_km, f_mhz, hBS, hUT));
}

function indoor_los(d_km: number, f_mhz: number): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  return 32.4 + 17.3 * Math.log10(Math.max(d_m, 1)) + 20 * Math.log10(f_ghz);
}

function computePathLoss(model: string, d_km: number, f_mhz: number, customPL = 120): number {
  const d = Math.max(0.001, d_km);
  switch (model) {
    case 'fspl': return fspl(d, f_mhz);
    case 'uma_los': return uma_los(d, f_mhz);
    case 'uma_nlos': return uma_nlos(d, f_mhz);
    case 'umi_los': return umi_los(d, f_mhz);
    case 'umi_nlos': return umi_nlos(d, f_mhz);
    case 'indoor_los': return indoor_los(d, f_mhz);
    case 'custom': return customPL;
    default: return fspl(d, f_mhz);
  }
}

const PATH_MODELS = [
  { key: 'fspl', label: 'FSPL (Espaço Livre)' },
  { key: 'uma_los', label: '3GPP UMa LOS' },
  { key: 'uma_nlos', label: '3GPP UMa NLOS' },
  { key: 'umi_los', label: '3GPP UMi LOS' },
  { key: 'umi_nlos', label: '3GPP UMi NLOS' },
  { key: 'indoor_los', label: '3GPP Indoor LOS' },
  { key: 'custom', label: 'Personalizada' },
];

const MODULATIONS = ['QPSK', '16QAM', '64QAM', '256QAM', '1024QAM'];

function modBits(mod: string): number {
  switch (mod) {
    case 'QPSK': return 2;
    case '16QAM': return 4;
    case '64QAM': return 6;
    case '256QAM': return 8;
    case '1024QAM': return 10;
    default: return 6;
  }
}

function CycleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const idx = options.indexOf(value);
  const next = () => onChange(options[(idx + 1) % options.length]);
  const prev = () => onChange(options[(idx - 1 + options.length) % options.length]);
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.cycleRow}>
        <TouchableOpacity onPress={prev} style={styles.cycleBtn}>
          <Text style={styles.cycleBtnText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.cycleValue}>{value}</Text>
        <TouchableOpacity onPress={next} style={styles.cycleBtn}>
          <Text style={styles.cycleBtnText}>{'›'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType = 'numeric',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

function ResultCard({
  label,
  value,
  unit,
  highlight,
  badge,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, highlight && styles.resultHighlight]}>{value}</Text>
      {unit && <Text style={styles.resultUnit}>{unit}</Text>}
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<any>>();
  const mode: 'throughput' | 'linkbudget' = route.params?.mode ?? 'throughput';

  // Throughput state
  const [bwMHz, setBwMHz] = useState('100');
  const [scs, setScs] = useState('30');
  const [mimoLayers, setMimoLayers] = useState('2');
  const [modulation, setModulation] = useState('256QAM');
  const [codeRate, setCodeRate] = useState('0.9258');
  const [tbsScaling, setTbsScaling] = useState('1.0');
  const [fddTdd, setFddTdd] = useState('FDD');
  const [dlFractionCustom, setDlFractionCustom] = useState('0.75');
  const [overhead, setOverhead] = useState('0.14');
  const [carriers, setCarriers] = useState('1');

  // Link Budget state
  const [txPower, setTxPower] = useState('30');
  const [txGain, setTxGain] = useState('15');
  const [rxGain, setRxGain] = useState('0');
  const [txCableLoss, setTxCableLoss] = useState('0');
  const [rxCableLoss, setRxCableLoss] = useState('0');
  const [otherLosses, setOtherLosses] = useState('2');
  const [frequency, setFrequency] = useState('3500');
  const [distanceKm, setDistanceKm] = useState('0.2');
  const [pathModel, setPathModel] = useState('fspl');
  const [customPathLoss, setCustomPathLoss] = useState('120');
  const [noiseFigure, setNoiseFigure] = useState('7');
  const [rxBandwidth, setRxBandwidth] = useState('20');

  // ─── Cálculos Throughput ───────────────────────────────────────────────────
  const prbs = useMemo(() => {
    const bw = parseFloat(bwMHz) || 100;
    const s = parseFloat(scs) || 30;
    return Math.floor((bw * 1000) / (12 * s));
  }, [bwMHz, scs]);

  const dlFraction = useMemo(() => {
    if (fddTdd === 'FDD') return 1.0;
    return parseFloat(dlFractionCustom) || 0.75;
  }, [fddTdd, dlFractionCustom]);

  const spectralEff = useMemo(() => {
    const bits = modBits(modulation);
    const cr = parseFloat(codeRate) || 0.9258;
    const mimo = parseFloat(mimoLayers) || 2;
    const tbs = parseFloat(tbsScaling) || 1.0;
    return bits * cr * mimo * tbs;
  }, [modulation, codeRate, mimoLayers, tbsScaling]);

  const throughputMbps = useMemo(() => {
    const bw = parseFloat(bwMHz) || 100;
    const oh = parseFloat(overhead) || 0.14;
    const c = parseFloat(carriers) || 1;
    const result = bw * spectralEff * dlFraction * (1 - oh) * c;
    return isFinite(result) ? result : 0;
  }, [bwMHz, spectralEff, dlFraction, overhead, carriers]);

  // ─── Cálculos Link Budget ──────────────────────────────────────────────────
  const pathLoss = useMemo(() => {
    return computePathLoss(
      pathModel,
      parseFloat(distanceKm) || 0.2,
      parseFloat(frequency) || 3500,
      parseFloat(customPathLoss) || 120,
    );
  }, [pathModel, distanceKm, frequency, customPathLoss]);

  const receivedPower = useMemo(() => {
    return (
      (parseFloat(txPower) || 30) -
      (parseFloat(txCableLoss) || 0) +
      (parseFloat(txGain) || 15) -
      pathLoss +
      (parseFloat(rxGain) || 0) -
      (parseFloat(rxCableLoss) || 0) -
      (parseFloat(otherLosses) || 2)
    );
  }, [txPower, txCableLoss, txGain, pathLoss, rxGain, rxCableLoss, otherLosses]);

  const noiseFloor = useMemo(() => {
    const B = Math.max(1e3, (parseFloat(rxBandwidth) || 20) * 1e6);
    return -174 + 10 * Math.log10(B) + (parseFloat(noiseFigure) || 7);
  }, [rxBandwidth, noiseFigure]);

  const sinrDb = useMemo(() => receivedPower - noiseFloor, [receivedPower, noiseFloor]);

  const sinrLabel =
    sinrDb >= 20 ? 'Excelente' : sinrDb >= 10 ? 'Bom' : sinrDb >= 0 ? 'Marginal' : 'Ruim';

  function handleSave() {
    if (mode === 'throughput') {
      const data = {
        type: 'throughput' as const,
        parameters: { bwMHz, scs, mimoLayers, modulation, codeRate, tbsScaling, fddTdd, dlFractionCustom, overhead, carriers },
        results: { prbs, spectralEff: spectralEff.toFixed(3), throughputMbps: throughputMbps.toFixed(2), dlFraction: dlFraction.toFixed(3) },
      };
      navigation.navigate('Save', { calculationData: data });
    } else {
      const data = {
        type: 'linkbudget' as const,
        parameters: { txPower, txGain, rxGain, txCableLoss, rxCableLoss, otherLosses, frequency, distanceKm, pathModel, noiseFigure, rxBandwidth },
        results: { pathLoss: pathLoss.toFixed(2), receivedPower: receivedPower.toFixed(2), noiseFloor: noiseFloor.toFixed(2), sinrDb: sinrDb.toFixed(2), sinrLabel },
      };
      navigation.navigate('Save', { calculationData: data });
    }
  }

  if (mode === 'throughput') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/5G_logo.svg/120px-5G_logo.svg.png' }}
            style={styles.bannerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.bannerTitle}>Throughput DL 5G NR</Text>
            <Text style={styles.bannerSub}>Cálculo por largura de banda e MIMO</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Parâmetros de Throughput</Text>

        <View style={styles.card}>
          <Field label="Largura de Banda (MHz)" value={bwMHz} onChange={setBwMHz} />
          <Field label="Espaçamento de Subportadora (kHz)" value={scs} onChange={setScs} />
          <CycleSelect label="Modo Duplex" options={['FDD', 'TDD']} value={fddTdd} onChange={setFddTdd} />
          {fddTdd === 'TDD' && (
            <Field label="Fração DL (0–1)" value={dlFractionCustom} onChange={setDlFractionCustom} />
          )}
          <Field label="Portadoras Agregadas" value={carriers} onChange={setCarriers} />
        </View>

        <View style={styles.card}>
          <CycleSelect label="Modulação" options={MODULATIONS} value={modulation} onChange={setModulation} />
          <Field label="Taxa de Código" value={codeRate} onChange={setCodeRate} />
          <Field label="Camadas MIMO" value={mimoLayers} onChange={setMimoLayers} />
          <Field label="Escala TBS" value={tbsScaling} onChange={setTbsScaling} />
          <Field label="Overhead de Sinalização" value={overhead} onChange={setOverhead} />
        </View>

        <Text style={styles.sectionTitle}>Resultados</Text>
        <View style={styles.resultsGrid}>
          <ResultCard label="PRBs Estimados" value={String(prbs)} />
          <ResultCard label="Efic. Espectral" value={spectralEff.toFixed(3)} unit="bits/s/Hz" />
          <ResultCard label="Fração DL" value={dlFraction.toFixed(3)} />
          <ResultCard label="Throughput DL" value={throughputMbps.toFixed(1)} unit="Mbps" highlight />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Salvar Cenário</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/5G_logo.svg/120px-5G_logo.svg.png' }}
          style={styles.bannerLogo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.bannerTitle}>Link Budget 5G NR</Text>
          <Text style={styles.bannerSub}>7 modelos de perda de percurso</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Transmissor</Text>
      <View style={styles.card}>
        <Field label="Potência Tx (dBm)" value={txPower} onChange={setTxPower} />
        <Field label="Ganho Tx (dBi)" value={txGain} onChange={setTxGain} />
        <Field label="Perda no Cabo Tx (dB)" value={txCableLoss} onChange={setTxCableLoss} />
      </View>

      <Text style={styles.sectionTitle}>Propagação</Text>
      <View style={styles.card}>
        <Field label="Frequência (MHz)" value={frequency} onChange={setFrequency} />
        <Field label="Distância (km)" value={distanceKm} onChange={setDistanceKm} />
        <CycleSelect
          label="Modelo de Perda"
          options={PATH_MODELS.map((m) => m.key)}
          value={pathModel}
          onChange={setPathModel}
        />
        <Text style={styles.modelNote}>
          {PATH_MODELS.find((m) => m.key === pathModel)?.label}
        </Text>
        {pathModel === 'custom' && (
          <Field label="Perda Personalizada (dB)" value={customPathLoss} onChange={setCustomPathLoss} />
        )}
      </View>

      <Text style={styles.sectionTitle}>Receptor</Text>
      <View style={styles.card}>
        <Field label="Ganho Rx (dBi)" value={rxGain} onChange={setRxGain} />
        <Field label="Perda no Cabo Rx (dB)" value={rxCableLoss} onChange={setRxCableLoss} />
        <Field label="Outras Perdas (dB)" value={otherLosses} onChange={setOtherLosses} />
        <Field label="Figura de Ruído (dB)" value={noiseFigure} onChange={setNoiseFigure} />
        <Field label="Largura de Banda Rx (MHz)" value={rxBandwidth} onChange={setRxBandwidth} />
      </View>

      <Text style={styles.sectionTitle}>Resultados</Text>
      <View style={styles.resultsGrid}>
        <ResultCard label="Perda de Percurso" value={pathLoss.toFixed(2)} unit="dB" />
        <ResultCard label="Potência Recebida" value={receivedPower.toFixed(2)} unit="dBm" highlight />
        <ResultCard label="Piso de Ruído" value={noiseFloor.toFixed(2)} unit="dBm" />
        <ResultCard label="SINR" value={sinrDb.toFixed(2)} unit="dB" badge={sinrLabel} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Salvar Cenário</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bannerLogo: {
    width: 52,
    height: 32,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  bannerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontFamily: 'monospace',
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cycleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#f1f5f9',
  },
  cycleBtnText: {
    fontSize: 18,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  cycleValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  modelNote: {
    fontSize: 11,
    color: '#0066cc',
    marginTop: -6,
    marginBottom: 4,
    paddingLeft: 2,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: '47%',
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  resultHighlight: {
    color: '#0066cc',
    fontSize: 28,
  },
  resultUnit: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    marginTop: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  saveBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
