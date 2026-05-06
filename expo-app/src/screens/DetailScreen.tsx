import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { calculationsApi } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

function Section({ title, data }: { title: string; data: Record<string, any> }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {Object.entries(data).map(([key, val]) => (
          <Row key={key} label={key} value={typeof val === 'number' ? val.toFixed(4) : String(val)} />
        ))}
      </View>
    </View>
  );
}

export default function DetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { calculation } = route.params;

  const isLinkBudget = calculation.type === 'linkbudget';

  const formattedDate = new Date(calculation.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = () => {
    Alert.alert(
      'Remover Cenário',
      'Tem certeza que deseja remover este cenário permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await calculationsApi.delete(calculation.id);
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o cenário.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{calculation.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isLinkBudget ? 'Link Budget' : 'Throughput'}
          </Text>
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Section title="Resultados" data={calculation.results} />
      <Section title="Parâmetros" data={calculation.parameters} />

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Remover Cenário</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  date: { fontSize: 12, color: '#94a3b8' },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLabel: { fontSize: 12, color: '#64748b', flex: 1, paddingRight: 8 },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace', textAlign: 'right' },
  deleteBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    marginTop: 8,
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
