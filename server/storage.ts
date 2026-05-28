import { type InsertCalculation, type Calculation } from "@shared/schema";

export interface StorageLimits {
  maxPerUser: number;
  maxTotal: number;
}

export interface IStorage {
  saveCalculation(userId: string, calculation: InsertCalculation, limits: StorageLimits): Promise<Calculation>;
  getCalculations(userId: string, limit?: number): Promise<Calculation[]>;
  getCalculation(userId: string, id: string): Promise<Calculation | undefined>;
  updateCalculation(userId: string, id: string, name: string): Promise<Calculation | undefined>;
  deleteCalculation(userId: string, id: string): Promise<void>;
  getCalculationsByType(userId: string, type: string, limit?: number): Promise<Calculation[]>;
  getCalculationCount(userId: string): Promise<number>;
  getTotalCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private calculations: Map<string, Calculation> = new Map();

  // Check and insert are performed without any internal await, so they run
  // as one uninterruptible synchronous slice within the Node.js event loop.
  // This prevents the TOCTOU race that would exist if the caller did
  // getTotalCount() + getCalculationCount() + saveCalculation() as three
  // separate async calls (other requests can interleave between those awaits).
  async saveCalculation(userId: string, calculation: InsertCalculation, limits: StorageLimits): Promise<Calculation> {
    const total = this.calculations.size;
    if (total >= limits.maxTotal) {
      throw new Error("CAPACITY_EXCEEDED");
    }

    let userCount = 0;
    for (const c of this.calculations.values()) {
      if (c.userId === userId) userCount++;
    }
    if (userCount >= limits.maxPerUser) {
      throw new Error("USER_LIMIT_EXCEEDED");
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const result: Calculation = {
      ...calculation,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.calculations.set(id, result);
    return result;
  }

  async getCalculations(userId: string, limit: number = 50): Promise<Calculation[]> {
    return Array.from(this.calculations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getCalculation(userId: string, id: string): Promise<Calculation | undefined> {
    const c = this.calculations.get(id);
    if (!c || c.userId !== userId) return undefined;
    return c;
  }

  async updateCalculation(userId: string, id: string, name: string): Promise<Calculation | undefined> {
    const existing = this.calculations.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated = { ...existing, name, updatedAt: new Date() };
    this.calculations.set(id, updated);
    return updated;
  }

  async deleteCalculation(userId: string, id: string): Promise<void> {
    const existing = this.calculations.get(id);
    if (existing && existing.userId === userId) {
      this.calculations.delete(id);
    }
  }

  async getCalculationsByType(userId: string, type: string, limit: number = 50): Promise<Calculation[]> {
    return Array.from(this.calculations.values())
      .filter((c) => c.userId === userId && c.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getCalculationCount(userId: string): Promise<number> {
    let n = 0;
    for (const c of this.calculations.values()) {
      if (c.userId === userId) n++;
    }
    return n;
  }

  async getTotalCount(): Promise<number> {
    return this.calculations.size;
  }
}

async function createStorage(): Promise<IStorage> {
  try {
    const { DbStorage } = await import("./db-storage.js");
    const dbStorage = new DbStorage();
    await dbStorage.getCalculations("__probe__", 1);
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

class LazyStorage implements IStorage {
  async saveCalculation(userId: string, data: InsertCalculation, limits: StorageLimits) {
    return (await getStorage()).saveCalculation(userId, data, limits);
  }
  async getCalculations(userId: string, limit?: number) {
    return (await getStorage()).getCalculations(userId, limit);
  }
  async getCalculation(userId: string, id: string) {
    return (await getStorage()).getCalculation(userId, id);
  }
  async updateCalculation(userId: string, id: string, name: string) {
    return (await getStorage()).updateCalculation(userId, id, name);
  }
  async deleteCalculation(userId: string, id: string) {
    return (await getStorage()).deleteCalculation(userId, id);
  }
  async getCalculationsByType(userId: string, type: string, limit?: number) {
    return (await getStorage()).getCalculationsByType(userId, type, limit);
  }
  async getCalculationCount(userId: string) {
    return (await getStorage()).getCalculationCount(userId);
  }
  async getTotalCount() {
    return (await getStorage()).getTotalCount();
  }
}

export const storage = new LazyStorage();
