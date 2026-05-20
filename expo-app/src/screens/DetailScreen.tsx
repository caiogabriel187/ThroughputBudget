import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
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

  const [calcName, setCalcName] = useState(calculation.name);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const isLinkBudget = calculation.type === 'linkbudget';

  const formattedDate = new Date(calculation.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleOpenRename = () => {
    setRenameValue(calcName);
    setRenameError('');
    setRenameVisible(true);
  };

  const handleRename = async () => {
    if (!renameValue.trim()) {
      setRenameError('O nome é obrigatório.');
      return;
    }
    if (renameValue.trim().length < 3) {
      setRenameError('O nome deve ter pelo menos 3 caracteres.');
      return;
    }
    setRenameLoading(true);
    try {
      const updated = await calculationsApi.update(calculation.id, renameValue.trim());
      setCalcName(updated.name);
      setRenameVisible(false);
      Alert.alert('Renomeado!', `Cenário renomeado para "${updated.name}".`);
    } catch {
      Alert.alert('Erro', 'Não foi possível renomear o cenário.');
    } finally {
      setRenameLoading(false);
    }
  };

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
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/5G_logo.svg/120px-5G_logo.svg.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {isLinkBudget ? 'Link Budget' : 'Throughput'}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{calcName}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
          <TouchableOpacity style={styles.renameBtn} onPress={handleOpenRename}>
            <Text style={styles.renameBtnText}>Renomear Cenário</Text>
          </TouchableOpacity>
        </View>

        <Section title="Resultados" data={calculation.results} />
        <Section title="Parametros" data={calculation.parameters} />

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Remover Cenário</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={renameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Renomear Cenário</Text>
            <TextInput
              style={[styles.modalInput, !!renameError && styles.modalInputError]}
              value={renameValue}
              onChangeText={(v) => {
                setRenameValue(v);
                if (renameError) setRenameError('');
              }}
              placeholder="Novo nome do cenário"
              placeholderTextColor="#94a3b8"
              maxLength={80}
              autoFocus
            />
            {!!renameError && <Text style={styles.errorText}>{renameError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRenameVisible(false)}
                disabled={renameLoading}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, renameLoading && styles.btnDisabled]}
                onPress={handleRename}
                disabled={renameLoading}
              >
                {renameLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 48,
    height: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  date: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  renameBtn: {
    borderWidth: 1.5,
    borderColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  renameBtnText: { color: '#0066cc', fontWeight: '600', fontSize: 13 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 4,
  },
  modalInputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginBottom: 8, fontWeight: '500' },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalCancelText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  modalSaveText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
