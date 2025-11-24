import { db } from "../db";
import { calculations, type InsertCalculation, type Calculation } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  // Calculation history methods
  saveCalculation(calculation: InsertCalculation): Promise<Calculation>;
  getCalculations(limit?: number): Promise<Calculation[]>;
  getCalculation(id: string): Promise<Calculation | undefined>;
  deleteCalculation(id: string): Promise<void>;
  getCalculationsByType(type: string, limit?: number): Promise<Calculation[]>;
}

export class DbStorage implements IStorage {
  async saveCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const [result] = await db.insert(calculations).values(calculation).returning();
    return result;
  }

  async getCalculations(limit: number = 50): Promise<Calculation[]> {
    return await db
      .select()
      .from(calculations)
      .orderBy(desc(calculations.createdAt))
      .limit(limit);
  }

  async getCalculation(id: string): Promise<Calculation | undefined> {
    const [result] = await db
      .select()
      .from(calculations)
      .where(eq(calculations.id, id));
    return result;
  }

  async deleteCalculation(id: string): Promise<void> {
    await db.delete(calculations).where(eq(calculations.id, id));
  }

  async getCalculationsByType(type: string, limit: number = 50): Promise<Calculation[]> {
    return await db
      .select()
      .from(calculations)
      .where(eq(calculations.type, type))
      .orderBy(desc(calculations.createdAt))
      .limit(limit);
  }
}

export const storage = new DbStorage();
