import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calculation } from '../services/api';

interface Props {
  calculation: Calculation;
  onPress: () => void;
  onDelete: () => void;
}

export default function CalculationCard({ calculation, onPress, onDelete }: Props) {
  const isLinkBudget = calculation.type === 'linkbudget';

  const formattedDate = new Date(calculation.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mainResult = isLinkBudget
    ? `${Number(calculation.results?.receivedPower ?? 0).toFixed(1)} dBm`
    : `${Number(calculation.results?.throughputMbps ?? 0).toFixed(1)} Mbps`;

  const mainLabel = isLinkBudget ? 'Pot. Recebida' : 'Throughput DL';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{calculation.name}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={[styles.badge, isLinkBudget && styles.badgeLinkBudget]}>
          <Text style={[styles.badgeText, isLinkBudget && styles.badgeTextLinkBudget]}>
            {isLinkBudget ? 'Link Budget' : 'Throughput'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.resultLabel}>{mainLabel}</Text>
          <Text style={styles.resultValue}>{mainResult}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  date: { fontSize: 11, color: '#94a3b8' },
  badge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexShrink: 0,
  },
  badgeLinkBudget: { backgroundColor: '#dbeafe' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  badgeTextLinkBudget: { color: '#1d4ed8' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resultLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  resultValue: { fontSize: 18, fontWeight: '700', color: '#0066cc', fontFamily: 'monospace' },
  deleteBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
});
