import axios from 'axios';

// Servidor rodando no Replit — URL pública estável após publicar o projeto
// Para usar: clique em "Publicar" no Replit e substitua pela URL gerada (ex: https://seu-app.replit.app)
// Enquanto estiver em desenvolvimento no Replit, use a URL abaixo (visível no painel de preview)
const BASE_URL = 'https://5e237d7a-1a5a-4a74-8414-562ff319b1ea-00-2wnc16uxaddng.spock.replit.dev';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Calculation {
  id: string;
  name: string;
  type: 'throughput' | 'linkbudget';
  parameters: Record<string, any>;
  results: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalculationDTO {
  name: string;
  type: 'throughput' | 'linkbudget';
  parameters: Record<string, any>;
  results: Record<string, any>;
}

export const calculationsApi = {
  getAll: async (type?: string): Promise<Calculation[]> => {
    const params = type ? { type } : {};
    const response = await api.get<Calculation[]>('/api/calculations', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Calculation> => {
    const response = await api.get<Calculation>(`/api/calculations/${id}`);
    return response.data;
  },

  create: async (data: CreateCalculationDTO): Promise<Calculation> => {
    const response = await api.post<Calculation>('/api/calculations', data);
    return response.data;
  },

  update: async (id: string, name: string): Promise<Calculation> => {
    const response = await api.put<Calculation>(`/api/calculations/${id}`, { name });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/calculations/${id}`);
  },
};

export default api;
