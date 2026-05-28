import { db } from "../db";
import { calculations, type InsertCalculation, type Calculation } from "@shared/schema";
import { and, desc, eq, count } from "drizzle-orm";
import type { IStorage, StorageLimits } from "./storage";

export class DbStorage implements IStorage {
  // Wraps count checks and insert in a SERIALIZABLE transaction so that
  // concurrent requests see a consistent snapshot of the row count and cannot
  // collectively exceed MAX_TOTAL_RECORDS or MAX_RECORDS_PER_USER. Under
  // SERIALIZABLE isolation the database detects conflicting concurrent writes
  // and will abort/retry the losers, preventing the TOCTOU race that exists
  // under the default READ COMMITTED isolation.
  async saveCalculation(userId: string, calculation: InsertCalculation, limits: StorageLimits): Promise<Calculation> {
    return await db.transaction(async (tx) => {
      const [totalRow] = await tx.select({ total: count() }).from(calculations);
      if ((totalRow?.total ?? 0) >= limits.maxTotal) {
        throw new Error("CAPACITY_EXCEEDED");
      }

      const [userRow] = await tx
        .select({ total: count() })
        .from(calculations)
        .where(eq(calculations.userId, userId));
      if ((userRow?.total ?? 0) >= limits.maxPerUser) {
        throw new Error("USER_LIMIT_EXCEEDED");
      }

      const [result] = await tx
        .insert(calculations)
        .values({ ...calculation, userId })
        .returning();
      return result;
    }, { isolationLevel: "serializable" });
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
