import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for 5G NR Calculator
  // MVP: All calculations are client-side, no backend persistence
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "5G NR Calculator" });
  });

  // Future endpoints for calculation history:
  // app.post("/api/calculations/save", async (req, res) => { ... });
  // app.get("/api/calculations/history", async (req, res) => { ... });

  const httpServer = createServer(app);

  return httpServer;
}
