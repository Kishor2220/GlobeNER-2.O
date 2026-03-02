import { db } from "../db";
import { AlertService } from "./alertService";

export class MemoryService {
  static record(entities: any[], sourceDocument: string) {
    if (!entities || entities.length === 0) return;

    const timestamp = new Date().toISOString();
    const entityIds: Map<string, number> = new Map();

    // 1. Process each entity
    const batchCounts = new Map<string, number>();
    for (const entity of entities) {
      const key = `${entity.text}:${entity.label || entity.type || "UNKNOWN"}`;
      batchCounts.set(key, (batchCounts.get(key) || 0) + 1);
    }

    for (const entity of entities) {
      const name = entity.text;
      const type = entity.label || entity.type || "UNKNOWN";
      const confidence = entity.confidence || 1.0;

      // Alert: Low Trust Score
      if (confidence < 0.4) {
        AlertService.generateLowTrustAlert(name, confidence);
      }

      // Alert: Frequency Spike in batch
      const countInBatch = batchCounts.get(`${name}:${type}`) || 0;
      if (countInBatch > 5) {
        AlertService.generateFrequencySpikeAlert(name, countInBatch);
        batchCounts.set(`${name}:${type}`, 0); // Only alert once per batch for this entity
      }

      // Upsert entity memory
      const existing = db.prepare("SELECT id, total_occurrence_count, average_confidence FROM entity_memory WHERE entity_name = ? AND entity_type = ?").get(name, type) as any;

      let entityId: number;
      if (existing) {
        entityId = existing.id;
        const newCount = existing.total_occurrence_count + 1;
        const newAvgConf = (existing.average_confidence * existing.total_occurrence_count + confidence) / newCount;

        // Calculate rank_score (simplified for real-time update)
        const rankScore = (newCount * 0.3) + (1.0 * 5 * 0.2) + (newAvgConf * 5 * 0.2);

        db.prepare(`
          UPDATE entity_memory 
          SET last_seen = ?, 
              total_occurrence_count = ?, 
              average_confidence = ?,
              session_count = session_count + 1,
              document_count = document_count + 1,
              rank_score = ?
          WHERE id = ?
        `).run(timestamp, newCount, newAvgConf, rankScore, entityId);
      } else {
        // Alert: New Entity Detected
        AlertService.generateNewEntityAlert(name, type);

        const rankScore = (1 * 0.3) + (1.0 * 5 * 0.2) + (confidence * 5 * 0.2);
        const result = db.prepare(`
          INSERT INTO entity_memory (entity_name, entity_type, first_seen, last_seen, total_occurrence_count, average_confidence, session_count, document_count, rank_score)
          VALUES (?, ?, ?, ?, 1, ?, 1, 1, ?)
        `).run(name, type, timestamp, timestamp, confidence, rankScore);
        entityId = result.lastInsertRowid as number;
      }
      entityIds.set(`${name}:${type}`, entityId);

      // Log occurrence
      const related = entities
        .filter(e => e.text !== name)
        .map(e => e.text);

      db.prepare(`
        INSERT INTO entity_occurrences (entity_id, occurrence_timestamp, source_document, confidence, related_entities)
        VALUES (?, ?, ?, ?, ?)
      `).run(entityId, timestamp, sourceDocument, confidence, JSON.stringify(related));
    }

    // 2. Process relationships (co-occurrences)
    const entityList = Array.from(entityIds.entries());
    for (let i = 0; i < entityList.length; i++) {
      for (let j = i + 1; j < entityList.length; j++) {
        const [keyA, idA] = entityList[i];
        const [keyB, idB] = entityList[j];

        // Ensure consistent ordering to avoid duplicate pairs (A,B) and (B,A)
        const [firstId, secondId] = idA < idB ? [idA, idB] : [idB, idA];

        const existingRel = db.prepare("SELECT id, co_occurrence_count FROM relationship_memory WHERE entity_a_id = ? AND entity_b_id = ?").get(firstId, secondId) as any;

        if (existingRel) {
          const newCount = existingRel.co_occurrence_count + 1;
          
          // Compute Strength Score
          // (frequency * 0.4) + (recency_score * 0.3) + (mutual_influence * 0.3)
          const entityA = db.prepare("SELECT rank_score FROM entity_memory WHERE id = ?").get(firstId) as any;
          const entityB = db.prepare("SELECT rank_score FROM entity_memory WHERE id = ?").get(secondId) as any;
          const mutualInfluence = ((entityA?.rank_score || 0) + (entityB?.rank_score || 0)) / 2;
          
          // Recency score: 1 / (1 + days_since_last_seen)
          const lastSeenTime = new Date(existingRel.last_seen).getTime();
          const daysSince = Math.max(0, (new Date().getTime() - lastSeenTime) / (1000 * 60 * 60 * 24));
          const recencyScore = 1 / (1 + daysSince);
          
          const strengthScore = (newCount * 0.4) + (recencyScore * 5 * 0.3) + (mutualInfluence * 0.3);
          
          // Detect Trend
          const trend = newCount > existingRel.co_occurrence_count ? 'STRENGTHENING' : 'STABLE';

          db.prepare(`
            UPDATE relationship_memory 
            SET co_occurrence_count = ?, 
                last_seen = ?,
                relationship_frequency = CAST(? AS REAL) / (SELECT SUM(co_occurrence_count) FROM relationship_memory),
                relationship_strength_score = ?,
                co_occurrence_trend = ?
            WHERE id = ?
          `).run(newCount, timestamp, newCount, strengthScore, trend, existingRel.id);
        } else {
          // Alert: Sudden Relationship Formation
          const entityA = db.prepare("SELECT entity_name FROM entity_memory WHERE id = ?").get(firstId) as any;
          const entityB = db.prepare("SELECT entity_name FROM entity_memory WHERE id = ?").get(secondId) as any;
          AlertService.generateSuddenRelationshipAlert(entityA?.entity_name, entityB?.entity_name);

          db.prepare(`
            INSERT INTO relationship_memory (entity_a_id, entity_b_id, co_occurrence_count, first_seen, last_seen, relationship_frequency, relationship_strength_score, co_occurrence_trend)
            VALUES (?, ?, 1, ?, ?, 0, 1.0, 'NEW')
          `).run(firstId, secondId, timestamp, timestamp);
        }
      }
    }
  }
}
