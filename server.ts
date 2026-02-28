import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";
import { NERService } from "./server/services/nerService";
import { MemoryService } from "./server/services/memoryService";
import { RankingService } from "./server/services/rankingService";
import { ActivityService } from "./server/services/activityService";
import { RelationshipService } from "./server/services/relationshipService";
import { AlertService } from "./server/services/alertService";
import { BehaviorService } from "./server/services/behaviorService";
import { FileService } from "./server/services/fileService";
import { AnalyticsService } from "./server/services/analyticsService";
import { ModelService } from "./server/services/modelService";

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
  console.log("[Server] Initializing GlobeNER 2.0 (Offline Mode)...");

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Preload model in background
  ModelService.preload().then(() => {
    console.log("[Server] Model preloaded and ready for inference.");
  }).catch(err => {
    console.warn("[Server] Model preload failed (will retry on first request):", err);
  });

  // --- Production API Layer ---

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "2.0.0",
      capabilities: ["Offline NER", "Batch", "FileProcessing", "Analytics", "KnowledgeGraph"]
    });
  });

  // Single Extraction
  app.post("/api/extract-entities", async (req, res) => {
    const { text, threshold = 0.5 } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
      const entities = await NERService.extract(text, threshold);
      
      // Record to Entity Memory System
      MemoryService.record(entities, "direct_api_request");
      
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
          
          // Record to Entity Memory System
          MemoryService.record(entities, `batch_item_${results.length + 1}`);
          
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
        extractedText = rows.join("\n");
        
        // Process in chunks/rows for better accuracy? 
        // For simplicity, process whole text or row by row.
        // Row by row is safer for memory but slower.
        // Let's do row by row to be safe.
        let currentOffset = 0;
        for (const rowText of rows) {
           const rowEntities = await NERService.extract(rowText, threshold);
           rowEntities.forEach((e: any) => {
             entities.push({
               ...e,
               start: e.start + currentOffset,
               end: e.end + currentOffset
             });
           });
           currentOffset += rowText.length + 1; // +1 for newline
        }

      } else if (ext === ".json") {
        const json = JSON.parse(req.file.buffer.toString());
        const texts = Array.isArray(json) ? json.map(item => typeof item === 'string' ? item : JSON.stringify(item)) : [JSON.stringify(json)];
        extractedText = texts.join("\n");
        
        let currentOffset = 0;
        for (const rowText of texts) {
           const rowEntities = await NERService.extract(rowText, threshold);
           rowEntities.forEach((e: any) => {
             entities.push({
               ...e,
               start: e.start + currentOffset,
               end: e.end + currentOffset
             });
           });
           currentOffset += rowText.length + 1;
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

        // Process whole text
        // Note: Transformers.js pipeline handles truncation/chunking internally usually?
        // Actually, for long text, we might need to chunk it ourselves if the model has a limit (512 tokens).
        // The pipeline might handle it or truncate.
        // For robustness, let's assume pipeline handles it or we accept truncation for now.
        // Ideally we should chunk.
        entities = await NERService.extract(extractedText, threshold);
      }

      // Record to Entity Memory System
      MemoryService.record(entities, `file_upload:${req.file.originalname}`);

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

  // Intelligence Ranking API
  app.get("/api/ranking/top", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(RankingService.getTopEntities(limit));
  });

  app.get("/api/ranking/trending", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 5;
    res.json(RankingService.getTrendingEntities(limit));
  });

  app.get("/api/ranking/active", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 5;
    res.json(RankingService.getMostActiveEntities(limit));
  });

  // Activity Intelligence API
  app.get("/api/activity/trends", (req, res) => {
    res.json(ActivityService.getTrends());
  });

  app.get("/api/activity/timeline", (req, res) => {
    const days = parseInt(req.query.days as string) || 7;
    res.json(ActivityService.getAppearanceTimeline(days));
  });

  app.get("/api/activity/tracker", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(ActivityService.getLastSeenTracker(limit));
  });

  // Relationship Evolution API
  app.get("/api/relationships/new", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(RelationshipService.getNewRelationships(limit));
  });

  app.get("/api/relationships/strengthened", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(RelationshipService.getStrengthenedRelationships(limit));
  });

  app.get("/api/relationships/fading", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(RelationshipService.getFadingRelationships(limit));
  });

  // Intelligence Alerts API
  app.get("/api/alerts", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const severity = req.query.severity as string;
    res.json(AlertService.getRecentAlerts(limit, severity));
  });

  // Behavior Analysis API
  app.get("/api/behavior", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(BehaviorService.getBehavioralAnalysis(limit));
  });

  // Analytics Engine
  app.get("/api/analytics", (req, res) => {
    RelationshipService.refreshRelationships();
    BehaviorService.computeBehaviorScores();
    const history = db.prepare("SELECT * FROM analysis_history ORDER BY timestamp DESC LIMIT 1000").all();
    
    let allEntities: any[] = [];
    history.forEach((row: any) => {
      try {
        const entities = JSON.parse(row.entities);
        if (Array.isArray(entities)) {
          allEntities = [...allEntities, ...entities];
        }
      } catch (e) {}
    });

    const rankedEntities = RankingService.getTopEntities(50);
    const dbRelationships = db.prepare(`
      SELECT 
        rm.*,
        ea.entity_name as source_name, ea.entity_type as source_type,
        eb.entity_name as target_name, eb.entity_type as target_type
      FROM relationship_memory rm
      JOIN entity_memory ea ON rm.entity_a_id = ea.id
      JOIN entity_memory eb ON rm.entity_b_id = eb.id
      ORDER BY rm.co_occurrence_count DESC
      LIMIT 100
    `).all() as any[];

    res.json({
      frequency: rankedEntities.length > 0 
        ? rankedEntities.map(e => ({
            name: e.entity_name,
            value: e.total_occurrence_count,
            type: e.entity_type,
            score: e.rank_score
          }))
        : AnalyticsService.getFrequency(allEntities),
      distribution: AnalyticsService.getDistribution(allEntities),
      relationships: AnalyticsService.getIntelligenceGraph(rankedEntities, dbRelationships),
      total_processed: history.length,
      trending: RankingService.getTrendingEntities(5),
      active: RankingService.getMostActiveEntities(5),
      activity: {
        trends: ActivityService.getTrends(),
        timeline: ActivityService.getAppearanceTimeline(7),
        relationship_timeline: ActivityService.getRelationshipTimeline(7),
        tracker: ActivityService.getLastSeenTracker(10)
      },
      relationship_evolution: {
        new: RelationshipService.getNewRelationships(5),
        strengthened: RelationshipService.getStrengthenedRelationships(5),
        fading: RelationshipService.getFadingRelationships(5)
      },
      appState: { status: "online", version: "2.0.0" }
    });
  });

  // Legacy compatibility for frontend
  app.post("/api/analyze", async (req, res) => {
    const { text, confidenceThreshold = 0.5 } = req.body;
    try {
      const entities = await NERService.extract(text, confidenceThreshold);
      
      // Record to Entity Memory System
      MemoryService.record(entities, "web_ui_request");

      // Save to history
      const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
      stmt.run(text, JSON.stringify(entities), "web_ui");

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

