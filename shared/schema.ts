import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Calculation history table
export const calculations = pgTable("calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'throughput' or 'linkbudget'
  parameters: jsonb("parameters").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCalculationSchema = createInsertSchema(calculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCalculationSchema = createSelectSchema(calculations);

export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type Calculation = typeof calculations.$inferSelect;

// Throughput calculation parameters type
export const throughputParametersSchema = z.object({
  fr: z.string(),
  fddTdd: z.string(),
  numerology: z.number(),
  scs: z.number(),
  bandwidth: z.number(),
  carriers: z.number(),
  manualPRBs: z.string().optional(),
  modulation: z.string(),
  codeRate: z.number(),
  mimoLayers: z.number(),
  tbsScaling: z.number(),
  numBeams: z.number(),
  slotFormat: z.string(),
  customDlFraction: z.number().optional(),
  signalingOverhead: z.number(),
});

export type ThroughputParameters = z.infer<typeof throughputParametersSchema>;

// Throughput calculation result type
export const throughputResultSchema = z.object({
  prbs: z.number(),
  spectralEfficiency: z.number(),
  dlFraction: z.number(),
  throughput: z.number(),
});

export type ThroughputResult = z.infer<typeof throughputResultSchema>;

// Link budget calculation parameters type
export const linkBudgetParametersSchema = z.object({
  txPower: z.number(),
  txGain: z.number(),
  txCableLoss: z.number(),
  rxGain: z.number(),
  rxCableLoss: z.number(),
  otherLosses: z.number(),
  frequency: z.number(),
  distance: z.number(),
  pathModel: z.string(),
  customPathLoss: z.number().optional(),
  noiseFigure: z.number(),
  rbBandwidthMHz: z.number(),
});

export type LinkBudgetParameters = z.infer<typeof linkBudgetParametersSchema>;

// Link budget calculation result type
export const linkBudgetResultSchema = z.object({
  pathLoss: z.number(),
  receivedPower: z.number(),
  noiseFloor: z.number(),
  sinr: z.number(),
});

export type LinkBudgetResult = z.infer<typeof linkBudgetResultSchema>;
