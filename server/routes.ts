import express from "express";
import { db } from "./db";
import multer from "multer";
import { NERService } from "./services/nerService";
import { MemoryService } from "./services/memoryService";
import { RankingService } from "./services/rankingService";
import { ActivityService } from "./services/activityService";
import { RelationshipService } from "./services/relationshipService";
import { AlertService } from "./services/alertService";
import { BehaviorService } from "./services/behaviorService";
import { FileService } from "./services/fileService";
import { AnalyticsService } from "./services/analyticsService";
import { logger } from "./logger";
import { CONFIG } from "./config";
import path from "path";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    version: CONFIG.VERSION,
    capabilities: ["Offline NER", "Batch", "FileProcessing", "Analytics", "KnowledgeGraph"]
  });
});

router.post("/extract-entities", async (req, res) => {
  const { text, threshold = 0.5 } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  
  logger.info(`Extracting entities from text (${text.length} chars)`, 'API');
  try {
    const entities = await NERService.extract(text, threshold);
    MemoryService.record(entities, "direct_api_request");
    const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
    stmt.run(text, JSON.stringify(entities), "direct_api");
    res.json({ entities, text });
  } catch (error: any) {
    logger.error("Extraction failed", "API", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/batch-extract", async (req, res) => {
  const { texts, threshold = 0.5 } = req.body;
  if (!Array.isArray(texts)) return res.status(400).json({ error: "Texts must be an array" });
  
  if (texts.length > CONFIG.API.BATCH_LIMIT) {
    return res.status(400).json({ error: `Batch size exceeds limit of ${CONFIG.API.BATCH_LIMIT}` });
  }

  logger.info(`Batch extracting entities (${texts.length} items)`, 'API');
  try {
    const results = [];
    for (const text of texts) {
      try {
        const entities = await NERService.extract(text, threshold);
        MemoryService.record(entities, `batch_item_${results.length + 1}`);
        const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
        stmt.run(text, JSON.stringify(entities), "batch_api");
        results.push({ text, entities, status: "success" });
      } catch (err: any) {
        results.push({ text, status: "error", error: err.message });
      }
    }
    res.json({ results });
  } catch (error: any) {
    logger.error("Batch extraction failed", "API", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/upload", upload.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { threshold = 0.5 } = req.body;
  const startTime = Date.now();
  const ext = path.extname(req.file.originalname).toLowerCase();

  logger.info(`File upload: ${req.file.originalname} (${req.file.size} bytes)`, 'API');
  try {
    let extractedText = "";
    let entities: any[] = [];

    if (ext === ".csv") {
      const rows = await FileService.parseCSV(req.file.buffer);
      extractedText = rows.join("\n");
      let currentOffset = 0;
      for (const rowText of rows) {
         const rowEntities = await NERService.extract(rowText, threshold);
         rowEntities.forEach((e: any) => {
           entities.push({ ...e, start: e.start + currentOffset, end: e.end + currentOffset });
         });
         currentOffset += rowText.length + 1;
      }
    } else if (ext === ".json") {
      const json = JSON.parse(req.file.buffer.toString());
      const texts = Array.isArray(json) ? json.map(item => typeof item === 'string' ? item : JSON.stringify(item)) : [JSON.stringify(json)];
      extractedText = texts.join("\n");
      let currentOffset = 0;
      for (const rowText of texts) {
         const rowEntities = await NERService.extract(rowText, threshold);
         rowEntities.forEach((e: any) => {
           entities.push({ ...e, start: e.start + currentOffset, end: e.end + currentOffset });
         });
         currentOffset += rowText.length + 1;
      }
    } else {
      extractedText = ext === ".pdf" ? await FileService.parsePDF(req.file.buffer) : await FileService.parseText(req.file.buffer);
      entities = await NERService.extract(extractedText, threshold);
    }

    MemoryService.record(entities, `file_upload:${req.file.originalname}`);
    const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
    stmt.run(extractedText, JSON.stringify(entities), "file_upload");

    res.json({
      fileName: req.file.originalname,
      extractedText,
      entities,
      entityCount: entities.length,
      processingTime: ((Date.now() - startTime) / 1000).toFixed(2) + "s",
      status: "success"
    });
  } catch (error: any) {
    logger.error(`File processing failed: ${req.file.originalname}`, "API", error);
    res.status(500).json({ fileName: req.file.originalname, status: "error", error: error.message });
  }
});

router.get("/ranking/top", (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(RankingService.getTopEntities(limit));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top entities" });
  }
});

router.get("/analytics", (req, res) => {
  try {
    RelationshipService.refreshRelationships();
    BehaviorService.computeBehaviorScores();
    const history = db.prepare("SELECT * FROM analysis_history ORDER BY timestamp DESC LIMIT 1000").all();
    
    let allEntities: any[] = [];
    history.forEach((row: any) => {
      try {
        const entities = JSON.parse(row.entities);
        if (Array.isArray(entities)) allEntities = [...allEntities, ...entities];
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
        ? rankedEntities.map(e => ({ name: e.entity_name, value: e.total_occurrence_count, type: e.entity_type, score: e.rank_score }))
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
      appState: { status: "online", version: CONFIG.VERSION }
    });
  } catch (err: any) {
    logger.error("Analytics fetch failed", "API", err);
    res.status(500).json({ error: err.message });
  }
});

// Placeholder routes for frontend compatibility
router.get("/alerts", (req, res) => {
  res.json([]);
});

router.get("/behavior", (req, res) => {
  res.json({
    scores: [],
    anomalies: [],
    summary: "Behavioral analysis placeholder"
  });
});

router.post("/analyze", async (req, res) => {
  const { text, confidenceThreshold = 0.5 } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  
  try {
    const entities = await NERService.extract(text, confidenceThreshold);
    MemoryService.record(entities, "web_ui_request");
    const stmt = db.prepare("INSERT INTO analysis_history (text, entities, source_type) VALUES (?, ?, ?)");
    stmt.run(text, JSON.stringify(entities), "web_ui");
    res.json({ entities, language: "Multilingual (Auto)", highlighted_text: text });
  } catch (error: any) {
    logger.error("Analysis failed", "API", error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for /api/*
router.use((req, res) => {
  logger.warn(`API Route not found: ${req.method} ${req.url}`, 'API');
  res.status(404).json({ error: "API Route not found", method: req.method, url: req.url });
});

export default router;
