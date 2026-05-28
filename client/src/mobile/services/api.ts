import axios from "axios";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

export type Calculation = {
  id: string;
  name: string;
  type: "throughput" | "linkbudget";
  parameters: Record<string, any>;
  results: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type InsertCalculation = {
  name: string;
  type: "throughput" | "linkbudget";
  parameters: Record<string, any>;
  results: Record<string, any>;
};

export const apiService = {
  async getCalculations(): Promise<Calculation[]> {
    const response = await api.get<Calculation[]>("/calculations");
    return response.data;
  },

  async getCalculationsByType(type: string): Promise<Calculation[]> {
    const response = await api.get<Calculation[]>(`/calculations?type=${type}`);
    return response.data;
  },

  async getCalculation(id: string): Promise<Calculation> {
    const response = await api.get<Calculation>(`/calculations/${id}`);
    return response.data;
  },

  async saveCalculation(data: InsertCalculation): Promise<Calculation> {
    const response = await api.post<Calculation>("/calculations", data);
    return response.data;
  },

  async deleteCalculation(id: string): Promise<void> {
    await api.delete(`/calculations/${id}`);
  },
};

export default apiService;
