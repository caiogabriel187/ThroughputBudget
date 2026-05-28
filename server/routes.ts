import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCalculationSchema } from "@shared/schema";

const MAX_LIMIT = 50;
const MAX_RECORDS_PER_USER = 200;
const MAX_TOTAL_RECORDS = 2000;

// IP-based rate limit applied to ALL mutating routes.
// Uses req.ip (populated from X-Forwarded-For when trust proxy is enabled)
// so the counter is keyed on the real visitor address, not the proxy address.
// Stored in process memory — limits are advisory in multi-instance deployments
// but still provide meaningful throttling per backend instance.
const IP_RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateMap) {
    if (now > entry.resetAt) ipRateMap.delete(ip);
  }
}, RATE_WINDOW_MS);

function getClientIp(req: Request): string {
  // req.ip is populated from X-Forwarded-For when trust proxy is enabled,
  // giving the real visitor address rather than the upstream proxy's address.
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

function ipRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = ipRateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  if (entry.count >= IP_RATE_LIMIT) {
    return res.status(429).json({ error: "Muitas requisições. Tente novamente em breve." });
  }

  entry.count += 1;
  next();
}

// Assigns a stable userId to the session — only called for POST so that
// the first save creates a session. PUT and DELETE never trigger session
// creation; callers without a session simply have no data to operate on.
function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    req.session.userId = crypto.randomUUID();
  }
  next();
}

// Guard for routes that need an existing session but must NOT create one.
// If there is no session, the caller has no stored data, so 404 is correct
// and avoids allocating a new server-side session object for every request.
function requireExistingSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(404).json({ error: "Cálculo não encontrado" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "5G NR Calculator" });
  });

  // POST: IP rate-limit first (cannot be bypassed by rotating cookies),
  // then session assignment, then atomic limit enforcement inside storage.
  app.post("/api/calculations", ipRateLimit, requireSession, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const validated = insertCalculationSchema.parse(req.body);
      const calculation = await storage.saveCalculation(userId, validated, {
        maxPerUser: MAX_RECORDS_PER_USER,
        maxTotal: MAX_TOTAL_RECORDS,
      });
      res.json(calculation);
    } catch (error: any) {
      if (error.message === "CAPACITY_EXCEEDED") {
        return res.status(409).json({ error: "Capacidade do sistema atingida. Tente novamente mais tarde." });
      }
      if (error.message === "USER_LIMIT_EXCEEDED") {
        return res.status(409).json({ error: "Limite de cenários atingido. Apague alguns para continuar." });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // GET: read-only — use existing session userId if present; return empty if
  // no session exists so that GET requests never force session store creation.
  app.get("/api/calculations", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.json([]);

      const requested = req.query.limit ? parseInt(req.query.limit as string, 10) : MAX_LIMIT;
      const limit = Number.isFinite(requested) && requested > 0
        ? Math.min(requested, MAX_LIMIT)
        : MAX_LIMIT;
      const type = req.query.type as string | undefined;

      const calculations = type
        ? await storage.getCalculationsByType(userId, type, limit)
        : await storage.getCalculations(userId, limit);

      res.json(calculations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/calculations/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(404).json({ error: "Cálculo não encontrado" });

      const calculation = await storage.getCalculation(userId, req.params.id);
      if (!calculation) {
        return res.status(404).json({ error: "Cálculo não encontrado" });
      }
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT/DELETE: IP rate limit prevents write flooding even for clients that
  // already hold a valid session. requireExistingSession ensures these routes
  // never allocate a new session object for unauthenticated callers, so an
  // attacker cannot exhaust the session store by hitting PUT/DELETE without a
  // cookie. Callers without a session have no stored data → 404 is correct.
  app.put("/api/calculations/:id", ipRateLimit, requireExistingSession, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length < 3) {
        return res.status(400).json({ error: "Nome inválido (mínimo 3 caracteres)" });
      }
      const updated = await storage.updateCalculation(userId, req.params.id, name.trim());
      if (!updated) {
        return res.status(404).json({ error: "Cálculo não encontrado" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/calculations/:id", ipRateLimit, requireExistingSession, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.deleteCalculation(userId, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
