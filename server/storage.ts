import { type InsertCalculation, type Calculation } from "@shared/schema";

export interface IStorage {
  saveCalculation(calculation: InsertCalculation): Promise<Calculation>;
  getCalculations(limit?: number): Promise<Calculation[]>;
  getCalculation(id: string): Promise<Calculation | undefined>;
  updateCalculation(id: string, name: string): Promise<Calculation | undefined>;
  deleteCalculation(id: string): Promise<void>;
  getCalculationsByType(type: string, limit?: number): Promise<Calculation[]>;
}

// In-memory storage as the primary/fallback storage
export class MemStorage implements IStorage {
  private calculations: Map<string, Calculation> = new Map();
  private nextId = 1;

  async saveCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const id = crypto.randomUUID();
    const now = new Date();
    const result: Calculation = {
      ...calculation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.calculations.set(id, result);
    return result;
  }

  async getCalculations(limit: number = 50): Promise<Calculation[]> {
    return Array.from(this.calculations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getCalculation(id: string): Promise<Calculation | undefined> {
    return this.calculations.get(id);
  }

  async updateCalculation(id: string, name: string): Promise<Calculation | undefined> {
    const existing = this.calculations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, name, updatedAt: new Date() };
    this.calculations.set(id, updated);
    return updated;
  }

  async deleteCalculation(id: string): Promise<void> {
    this.calculations.delete(id);
  }

  async getCalculationsByType(type: string, limit: number = 50): Promise<Calculation[]> {
    return Array.from(this.calculations.values())
      .filter((c) => c.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

// Try DB storage, fall back to mem
async function createStorage(): Promise<IStorage> {
  try {
    const { DbStorage } = await import("./db-storage.js");
    const dbStorage = new DbStorage();
    // Test the connection with a quick query
    await dbStorage.getCalculations(1);
    console.log("[storage] Using database storage");
    return dbStorage;
  } catch (err: any) {
    console.warn("[storage] Database unavailable, using in-memory storage:", err.message);
    return new MemStorage();
  }
}

let storageInstance: IStorage | null = null;

async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}

// Proxy that lazily initializes storage
class LazyStorage implements IStorage {
  async saveCalculation(data: InsertCalculation) {
    return (await getStorage()).saveCalculation(data);
  }
  async getCalculations(limit?: number) {
    return (await getStorage()).getCalculations(limit);
  }
  async getCalculation(id: string) {
    return (await getStorage()).getCalculation(id);
  }
  async updateCalculation(id: string, name: string) {
    return (await getStorage()).updateCalculation(id, name);
  }
  async deleteCalculation(id: string) {
    return (await getStorage()).deleteCalculation(id);
  }
  async getCalculationsByType(type: string, limit?: number) {
    return (await getStorage()).getCalculationsByType(type, limit);
  }
}

export const storage = new LazyStorage();
