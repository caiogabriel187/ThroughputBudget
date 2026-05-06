import axios from 'axios';

// Altere para o IP/URL do seu servidor backend
// Durante desenvolvimento local: use o IP da sua máquina (ex: http://192.168.1.x:5000)
// Em produção: use a URL do servidor hospedado
const BASE_URL = 'http://localhost:5000';

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

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/calculations/${id}`);
  },
};

export default api;
