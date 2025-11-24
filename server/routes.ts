import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCalculationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "5G NR Calculator" });
  });

  // Save a calculation
  app.post("/api/calculations", async (req, res) => {
    try {
      const validated = insertCalculationSchema.parse(req.body);
      const calculation = await storage.saveCalculation(validated);
      res.json(calculation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all calculations
  app.get("/api/calculations", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const type = req.query.type as string | undefined;
      
      const calculations = type
        ? await storage.getCalculationsByType(type, limit)
        : await storage.getCalculations(limit);
      
      res.json(calculations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific calculation
  app.get("/api/calculations/:id", async (req, res) => {
    try {
      const calculation = await storage.getCalculation(req.params.id);
      if (!calculation) {
        return res.status(404).json({ error: "Calculation not found" });
      }
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a calculation
  app.delete("/api/calculations/:id", async (req, res) => {
    try {
      await storage.deleteCalculation(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
