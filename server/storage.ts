// Storage interface for 5G NR Calculator
// MVP: No persistence needed - all calculations are client-side
// Future: Can add calculation history storage here

export interface IStorage {
  // Future: Add calculation history methods
  // saveCalculation(type: string, data: any): Promise<void>;
  // getCalculationHistory(limit?: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  // Future: In-memory storage for calculation history
  constructor() {
    // No storage needed for MVP
  }
}

export const storage = new MemStorage();
