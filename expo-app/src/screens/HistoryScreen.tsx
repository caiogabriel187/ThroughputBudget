import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { calculationsApi, Calculation } from '../services/api';
import CalculationCard from '../components/CalculationCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'throughput' | 'linkbudget'>('all');

  const fetchCalculations = async () => {
    try {
      const data = await calculationsApi.getAll();
      setCalculations(data);
    } catch (error) {
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível carregar o histórico. Verifique se o servidor está rodando.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCalculations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCalculations();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Remover Cenário',
      'Tem certeza que deseja remover este cenário do histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await calculationsApi.delete(id);
              setCalculations((prev) => prev.filter((c) => c.id !== id));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o cenário.');
            }
          },
        },
      ]
    );
  };

  const handlePress = (calculation: Calculation) => {
    navigation.navigate('Detail', { calculation });
  };

  const filtered = calculations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || c.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cenários..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'throughput', 'linkbudget'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'all' ? 'Todos' : f === 'throughput' ? 'Throughput' : 'Link Budget'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CalculationCard
            calculation={item}
            onPress={() => handlePress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066cc" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhum cenário encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Tente uma busca diferente'
                : 'Salve um cálculo para aparecer aqui'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  searchBar: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterBtnTextActive: { color: '#ffffff' },
  listContent: { padding: 12, gap: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center' },
});
