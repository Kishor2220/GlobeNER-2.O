import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";
import { NerService } from "./server/services/nerService";
import { FileService } from "./server/services/fileService";
import { AnalyticsService } from "./server/services/analyticsService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("globerner_v2.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    entities TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_type TEXT
  );
`);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  console.log("Server starting...");

  // 1. Check if Hugging Face token is being read correctly
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken || hfToken === "MY_HF_TOKEN") {
    const errorMsg = "CRITICAL ERROR: HF_TOKEN is missing or not configured. Server cannot start without a valid Hugging Face token.";
    console.error(errorMsg);
    // In some environments, we might want to process.exit(1), 
    // but here we'll let it start so the user can see the error in logs if they check.
    // However, the prompt says "throw clear startup error".
    throw new Error(errorMsg);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- Production API Layer ---

  // Health Check (as requested)
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Health Check (existing)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "2.0.0",
      capabilities: ["NER", "Batch", "FileProcessing", "Analytics", "KnowledgeGraph"]
    });
  });

  // Middleware to lazy load model on first request
  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      NerService.warmUp(); 
    }
    next();
  });

  // Single Extraction
  app.post("/api/extract-entities", async (req, res) => {
    const { text, threshold = 0.5 } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
      const entities = await NerService.extractEntities(text, threshold);
      
      db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)")
        .run(text, JSON.stringify(entities), "direct_api");

      res.json({ entities, text });
    } catch (error: any) {
      console.error("[API] Extraction error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch Extraction
  app.post("/api/batch-extract", async (req, res) => {
    const { texts, threshold = 0.5 } = req.body;
    if (!Array.isArray(texts)) return res.status(400).json({ error: "Texts must be an array" });

    console.log(`[API] Batch processing started. Items: ${texts.length}`);
    try {
      const results = await NerService.batchExtract(texts, threshold);
      console.log("[API] Batch processing completed");
      res.json({ results });
    } catch (error: any) {
      console.error("[API] Batch processing error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // File Upload & Processing
  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { threshold = 0.5 } = req.body;

    const allowedExtensions = [".txt", ".csv", ".json", ".pdf"];
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file type: ${ext}. Allowed: ${allowedExtensions.join(", ")}` });
    }

    console.log(`[API] File processing started: ${req.file.originalname}`);
    try {
      let text = "";

      if (ext === ".pdf") {
        text = await FileService.parsePDF(req.file.buffer);
      } else if (ext === ".csv") {
        const rows = await FileService.parseCSV(req.file.buffer);
        const results = await NerService.batchExtract(rows, threshold);
        return res.json({ results, filename: req.file.originalname, type: "batch" });
      } else if (ext === ".json") {
        const json = JSON.parse(req.file.buffer.toString());
        const texts = Array.isArray(json) ? json.map(item => typeof item === 'string' ? item : JSON.stringify(item)) : [JSON.stringify(json)];
        const results = await NerService.batchExtract(texts, threshold);
        return res.json({ results, filename: req.file.originalname, type: "batch" });
      } else {
        text = await FileService.parseText(req.file.buffer);
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Extracted text is empty");
      }

      const entities = await NerService.extractEntities(text, threshold);
      
      db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)")
        .run(text.slice(0, 1000), JSON.stringify(entities), "file_upload");

      res.json({ entities, text, filename: req.file.originalname, type: "single" });
    } catch (error: any) {
      console.error(`[API] File processing error (${req.file.originalname}):`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics Engine
  app.get("/api/analytics", (req, res) => {
    const history = db.prepare("SELECT * FROM analysis_history ORDER BY timestamp DESC LIMIT 1000").all();
    
    let allEntities: any[] = [];
    history.forEach((row: any) => {
      allEntities = [...allEntities, ...JSON.parse(row.entities)];
    });

    res.json({
      frequency: AnalyticsService.getFrequency(allEntities),
      distribution: AnalyticsService.getDistribution(allEntities),
      relationships: AnalyticsService.getRelationships(allEntities),
      total_processed: history.length
    });
  });

  // Legacy compatibility for frontend
  app.post("/api/analyze", async (req, res) => {
    const { text, confidenceThreshold = 0.5 } = req.body;
    try {
      const entities = await NerService.extractEntities(text, confidenceThreshold);
      res.json({ entities, language: "Multilingual (Auto)", highlighted_text: text });
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
    console.log(`GlobeNER 2.0 Production Server running on http://localhost:${PORT}`);
  });
}

startServer();
