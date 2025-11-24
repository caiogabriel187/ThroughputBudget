import { z } from "zod";

// Future: Calculation history schema can be added here
// For MVP, all calculations are client-side with no persistence

// Throughput calculation result type
export const throughputResultSchema = z.object({
  fr: z.string(),
  fddTdd: z.string(),
  numerology: z.number(),
  scs: z.number(),
  bandwidth: z.number(),
  carriers: z.number(),
  prbs: z.number(),
  modulation: z.string(),
  codeRate: z.number(),
  mimoLayers: z.number(),
  tbsScaling: z.number(),
  dlFraction: z.number(),
  signalingOverhead: z.number(),
  spectralEfficiency: z.number(),
  throughput: z.number(),
});

export type ThroughputResult = z.infer<typeof throughputResultSchema>;

// Link budget calculation result type
export const linkBudgetResultSchema = z.object({
  txPower: z.number(),
  txGain: z.number(),
  txCableLoss: z.number(),
  rxGain: z.number(),
  rxCableLoss: z.number(),
  otherLosses: z.number(),
  frequency: z.number(),
  distance: z.number(),
  pathModel: z.string(),
  pathLoss: z.number(),
  receivedPower: z.number(),
  noiseFigure: z.number(),
  bandwidth: z.number(),
  noiseFloor: z.number(),
  sinr: z.number(),
});

export type LinkBudgetResult = z.infer<typeof linkBudgetResultSchema>;
