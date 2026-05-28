import { db } from "../db";
import { calculations, type InsertCalculation, type Calculation } from "@shared/schema";
import { and, desc, eq, count } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  async saveCalculation(userId: string, calculation: InsertCalculation): Promise<Calculation> {
    const [result] = await db
      .insert(calculations)
      .values({ ...calculation, userId })
      .returning();
    return result;
  }

  async getCalculations(userId: string, limit: number = 50): Promise<Calculation[]> {
    return await db
      .select()
      .from(calculations)
      .where(eq(calculations.userId, userId))
      .orderBy(desc(calculations.createdAt))
      .limit(limit);
  }

  async getCalculation(userId: string, id: string): Promise<Calculation | undefined> {
    const [result] = await db
      .select()
      .from(calculations)
      .where(and(eq(calculations.id, id), eq(calculations.userId, userId)));
    return result;
  }

  async updateCalculation(userId: string, id: string, name: string): Promise<Calculation | undefined> {
    const [result] = await db
      .update(calculations)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(calculations.id, id), eq(calculations.userId, userId)))
      .returning();
    return result;
  }

  async deleteCalculation(userId: string, id: string): Promise<void> {
    await db
      .delete(calculations)
      .where(and(eq(calculations.id, id), eq(calculations.userId, userId)));
  }

  async getCalculationsByType(userId: string, type: string, limit: number = 50): Promise<Calculation[]> {
    return await db
      .select()
      .from(calculations)
      .where(and(eq(calculations.userId, userId), eq(calculations.type, type)))
      .orderBy(desc(calculations.createdAt))
      .limit(limit);
  }

  async getCalculationCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(calculations)
      .where(eq(calculations.userId, userId));
    return row?.total ?? 0;
  }

  async getTotalCount(): Promise<number> {
    const [row] = await db.select({ total: count() }).from(calculations);
    return row?.total ?? 0;
  }
}
