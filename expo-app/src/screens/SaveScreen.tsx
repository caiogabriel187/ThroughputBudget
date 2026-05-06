import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { calculationsApi } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SaveRouteProp = RouteProp<RootStackParamList, 'Save'>;

export default function SaveScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SaveRouteProp>();
  const { calculationData } = route.params;

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError('O nome é obrigatório.');
      return false;
    }
    if (name.trim().length < 3) {
      setNameError('O nome deve ter pelo menos 3 caracteres.');
      return false;
    }
    if (name.trim().length > 80) {
      setNameError('O nome deve ter no máximo 80 caracteres.');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await calculationsApi.create({
        name: name.trim(),
        type: calculationData.type,
        parameters: calculationData.parameters,
        results: calculationData.results,
      });

      Alert.alert(
        'Cenário Salvo!',
        `"${name.trim()}" foi salvo no histórico.`,
        [
          {
            text: 'Ver Histórico',
            onPress: () => {
              navigation.navigate('Tabs');
            },
          },
          {
            text: 'Continuar',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao Salvar',
        error?.response?.data?.message || 'Não foi possível salvar. Verifique a conexão com o servidor.',
        [{ text: 'Tentar Novamente' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const isLinkBudget = calculationData.type === 'linkbudget';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nome do Cenário</Text>
        <TextInput
          style={[styles.input, !!nameError && styles.inputError]}
          placeholder="Ex.: Macro Urbano 3.5GHz 100MHz"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (nameError) setNameError('');
          }}
          maxLength={80}
          autoFocus
        />
        {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
        <Text style={styles.charCount}>{name.length}/80</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo do Cálculo</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {isLinkBudget ? 'Link Budget' : 'Throughput'}
          </Text>
        </View>

        {!isLinkBudget ? (
          <>
            <SummaryRow label="Throughput DL" value={`${calculationData.results.throughputMbps} Mbps`} highlight />
            <SummaryRow label="PRBs Estimados" value={String(calculationData.results.prbs)} />
            <SummaryRow label="Efic. Espectral" value={`${calculationData.results.spectralEff} bits/s/Hz`} />
            <SummaryRow label="Fração DL" value={calculationData.results.dlFraction} />
          </>
        ) : (
          <>
            <SummaryRow label="Potência Recebida" value={`${calculationData.results.receivedPower} dBm`} highlight />
            <SummaryRow label="Perda de Percurso" value={`${calculationData.results.pathLoss} dB`} />
            <SummaryRow label="Piso de Ruído" value={`${calculationData.results.noiseFloor} dBm`} />
            <SummaryRow label="SINR" value={`${calculationData.results.sinrDb} dB (${calculationData.results.sinrLabel})`} />
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveBtnText}>Confirmar Salvamento</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.cancelBtnText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' },
  summaryHighlight: { color: '#0066cc', fontSize: 16 },
  saveBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
});
