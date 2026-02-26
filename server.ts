import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { NERService } from "./server/services/nerService";
import { ProcessingService } from "./server/services/processingService";
import { DBService } from "./server/services/dbService";
import { AnalyticsService } from "./server/services/analyticsService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  console.log("-------------------------------------------------------");
  console.log("GlobeNER 2.0 | Enterprise Intelligence Platform");
  console.log("-------------------------------------------------------");

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken || hfToken === "MY_HF_TOKEN") {
    console.error("[Server] CRITICAL: HF_TOKEN is missing.");
    process.exit(1);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API Layer ---

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      ner: "ready",
      pdf: "ready",
      version: "2.0.0",
      timestamp: new Date().toISOString()
    });
  });

  // File Upload & Processing
  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    try {
      const result = await ProcessingService.processDocument(req.file);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Batch Processing
  app.post("/api/batch", async (req, res) => {
    const { texts } = req.body;
    if (!Array.isArray(texts)) return res.status(400).json({ error: "Texts must be an array" });

    try {
      const results = [];
      for (const text of texts) {
        // Simple mock of file object for batch text
        const result = await ProcessingService.processDocument({
          originalname: `batch_item_${Date.now()}.txt`,
          buffer: Buffer.from(text),
          mimetype: "text/plain"
        } as any);
        results.push(result);
      }
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard Data
  app.get("/api/dashboard", (req, res) => {
    try {
      const stats = DBService.getStats();
      const documents = DBService.getDocuments();
      const entitySummary = DBService.getEntitySummary();
      const dbRelationships = DBService.getRelationships();
      
      const healthScore = AnalyticsService.calculateHealthScore(stats);
      const anomalies = AnalyticsService.detectAnomalies(entitySummary);
      
      res.json({
        stats: { ...stats, healthScore },
        documents,
        anomalies,
        analytics: {
          frequency: AnalyticsService.getFrequency(entitySummary),
          distribution: AnalyticsService.getDistribution(entitySummary),
          relationships: AnalyticsService.getRelationships(dbRelationships)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Investigation Endpoint
  app.get("/api/investigate", (req, res) => {
    const { query } = req.query;
    try {
      const results = DBService.getEntitySummary(query as string);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // System Monitor Data
  app.get("/api/system", (req, res) => {
    const stats = DBService.getStats();
    res.json({
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      stats: {
        avgLatency: stats.averageProcessingTime,
        failureRate: stats.failureRate
      }
    });
  });

  // Single Text Analysis
  app.post("/api/analyze", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
      const result = await ProcessingService.processDocument({
        originalname: "direct_input.txt",
        buffer: Buffer.from(text),
        mimetype: "text/plain"
      } as any);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite / Static Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] GlobeNER 2.0 running on port ${PORT}`);
  });
}

startServer();
