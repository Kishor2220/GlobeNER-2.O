import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";
import { NERService } from "./server/services/nerService";
import { FileService } from "./server/services/fileService";
import { AnalyticsService } from "./server/services/analyticsService";
import { ProcessingService } from "./server/services/processingService";
import { DBService } from "./server/services/dbService";

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
  console.log("[Server] Initializing GlobeNER 2.0...");

  // 1. Verify token loading
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken || hfToken === "MY_HF_TOKEN") {
    const errorMsg = "CRITICAL ERROR: HF_TOKEN is missing or not configured. Server cannot start without a valid Hugging Face token.";
    console.error(`[Server] ${errorMsg}`);
    throw new Error(errorMsg);
  } else {
    console.log("[Server] Hugging Face token detected (presence verified)");
  }

  // 2. Test inference with sample text at startup
  try {
    console.log("[Server] Performing startup inference test...");
    await NERService.extract("Startup test");
  } catch (err) {
    console.warn("[Server] Startup inference test failed, but continuing server start...", err);
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
      // Warm up is handled by the startup test now
    }
    next();
  });

  // Single Extraction
  app.post("/api/extract-entities", async (req, res) => {
    const { text, threshold = 0.5 } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
      const entities = await NERService.extract(text, threshold);
      
      // Save to history
      const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
      stmt.run(text, JSON.stringify(entities), "direct_api");

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
      const results = [];
      for (const text of texts) {
        try {
          const entities = await NERService.extract(text, threshold);
          
          // Save to history
          const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
          stmt.run(text, JSON.stringify(entities), "batch_api");

          results.push({ text, entities, status: "success" });
        } catch (err: any) {
          results.push({ text, status: "error", error: err.message });
        }
      }
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
    const startTime = Date.now();

    const allowedExtensions = [".txt", ".csv", ".json", ".pdf"];
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file type: ${ext}. Allowed: ${allowedExtensions.join(", ")}` });
    }

    console.log(`[API] File processing started: ${req.file.originalname}`);
    try {
      let extractedText = "";
      let entities: any[] = [];
      let status = "success";

      if (ext === ".csv") {
        const rows = await FileService.parseCSV(req.file.buffer);
        
        let currentOffset = 0;
        for (let i = 0; i < rows.length; i++) {
          const rowText = rows[i];
          const rowEntities = await NERService.extract(rowText, threshold);
          
          rowEntities.forEach((e: any) => {
            entities.push({
              ...e,
              start: e.startIndex + currentOffset,
              end: e.endIndex + currentOffset,
              label: e.type
            });
          });
          
          extractedText += rowText + (i < rows.length - 1 ? "\n" : "");
          currentOffset += rowText.length + 1; // +1 for newline
        }
      } else if (ext === ".json") {
        const json = JSON.parse(req.file.buffer.toString());
        const texts = Array.isArray(json) ? json.map(item => typeof item === 'string' ? item : JSON.stringify(item)) : [JSON.stringify(json)];
        
        let currentOffset = 0;
        for (let i = 0; i < texts.length; i++) {
          const rowText = texts[i];
          const rowEntities = await NERService.extract(rowText, threshold);
          
          rowEntities.forEach((e: any) => {
            entities.push({
              ...e,
              start: e.startIndex + currentOffset,
              end: e.endIndex + currentOffset,
              label: e.type
            });
          });
          
          extractedText += rowText + (i < texts.length - 1 ? "\n" : "");
          currentOffset += rowText.length + 1; // +1 for newline
        }
      } else {
        if (ext === ".pdf") {
          extractedText = await FileService.parsePDF(req.file.buffer);
        } else {
          extractedText = await FileService.parseText(req.file.buffer);
        }

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error("Extracted text is empty");
        }

        const resultEntities = await NERService.extract(extractedText, threshold);
        entities = resultEntities.map(e => ({
          ...e,
          start: e.startIndex,
          end: e.endIndex,
          label: e.type
        }));
      }

      // Save to history
      const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
      stmt.run(extractedText, JSON.stringify(entities), "file_upload");

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

      res.json({
        fileName: req.file.originalname,
        extractedText,
        entities,
        entityCount: entities.length,
        processingTime,
        status
      });
    } catch (error: any) {
      console.error(`[API] File processing error (${req.file.originalname}):`, error.message);
      res.status(500).json({ 
        fileName: req.file.originalname,
        status: "error",
        error: error.message 
      });
    }
  });

  // Analytics Engine
  app.get("/api/analytics", (req, res) => {
    const history = db.prepare("SELECT * FROM analysis_history ORDER BY timestamp DESC LIMIT 1000").all();
    
    let allEntities: any[] = [];
    const cooccurrences = new Map();

    history.forEach((row: any) => {
      try {
        const entities = JSON.parse(row.entities);
        if (Array.isArray(entities)) {
          allEntities = [...allEntities, ...entities];
          
          // Calculate co-occurrences
          for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
              const e1 = entities[i];
              const e2 = entities[j];
              if (e1.text !== e2.text) {
                const pair = [
                  { text: e1.text, type: e1.type || e1.label || "UNKNOWN" },
                  { text: e2.text, type: e2.type || e2.label || "UNKNOWN" }
                ].sort((a, b) => a.text.localeCompare(b.text));
                
                const key = `${pair[0].text}:${pair[0].type}|${pair[1].text}:${pair[1].type}`;
                if (!cooccurrences.has(key)) {
                  cooccurrences.set(key, {
                    source_text: pair[0].text,
                    source_type: pair[0].type,
                    target_text: pair[1].text,
                    target_type: pair[1].type,
                    strength: 0
                  });
                }
                cooccurrences.get(key).strength += 1;
              }
            }
          }
        }
      } catch (e) {
        console.error("[Analytics] Failed to parse entities for row", row.id);
      }
    });

    console.log(`[Analytics] Computing stats for ${allEntities.length} entities from ${history.length} docs`);

    res.json({
      frequency: AnalyticsService.getFrequency(allEntities),
      distribution: AnalyticsService.getDistribution(allEntities),
      relationships: AnalyticsService.getRelationships(Array.from(cooccurrences.values())),
      total_processed: history.length,
      appState: { status: "online", version: "2.0.0" }
    });
  });

  // Legacy compatibility for frontend
  app.post("/api/analyze", async (req, res) => {
    const { text, confidenceThreshold = 0.5 } = req.body;
    try {
      const entities = await NERService.extract(text, confidenceThreshold);
      
      // Save to history
      const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
      stmt.run(text, JSON.stringify(entities), "web_ui");

      const formattedEntities = entities.map(e => ({
        ...e,
        start: e.startIndex,
        end: e.endIndex,
        label: e.type
      }));

      res.json({ entities: formattedEntities, language: "Multilingual (Auto)", highlighted_text: text });
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
