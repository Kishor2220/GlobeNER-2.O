import Database from "better-sqlite3";

const db = new Database("globerner_v2.db");

export enum BehaviorClassification {
  HIGHLY_ACTIVE = "Highly Active",
  EMERGING = "Emerging",
  STABLE = "Stable",
  DECLINING = "Declining",
  SUSPICIOUS = "Suspicious",
}

export class BehaviorService {
  static computeBehaviorScores() {
    const entities = db.prepare("SELECT * FROM entity_memory").all() as any[];
    const now = new Date().getTime();

    for (const entity of entities) {
      // 1. Interaction Frequency (normalized by total occurrences)
      const frequencyScore = Math.min(entity.total_occurrence_count / 10, 1.0);

      // 2. Relationship Diversity (unique connections)
      const diversity = db.prepare(`
        SELECT COUNT(*) as count FROM relationship_memory 
        WHERE entity_a_id = ? OR entity_b_id = ?
      `).get(entity.id, entity.id) as any;
      const diversityScore = Math.min(diversity.count / 5, 1.0);

      // 3. Sudden Activity Spikes (recent occurrences vs total)
      const recentOccurrences = db.prepare(`
        SELECT COUNT(*) as count FROM entity_occurrences 
        WHERE entity_id = ? AND occurrence_timestamp > datetime('now', '-24 hours')
      `).get(entity.id) as any;
      const spikeScore = Math.min(recentOccurrences.count / 5, 1.0);

      // 4. Cross-document presence
      const documentScore = Math.min(entity.document_count / 5, 1.0);

      // 5. Anomaly patterns (Low confidence but high frequency)
      let anomalyScore = 0;
      if (entity.average_confidence < 0.5 && entity.total_occurrence_count > 10) {
        anomalyScore = 1.0;
      }

      // Final Behavior Score
      const behaviorScore = (frequencyScore * 0.25) + (diversityScore * 0.25) + (spikeScore * 0.25) + (documentScore * 0.25);
      
      // Classification Logic
      let classification = BehaviorClassification.STABLE;
      
      const lastSeenTime = new Date(entity.last_seen).getTime();
      const daysSince = (now - lastSeenTime) / (1000 * 60 * 60 * 24);

      if (anomalyScore > 0.8) {
        classification = BehaviorClassification.SUSPICIOUS;
      } else if (spikeScore > 0.7 && entity.total_occurrence_count < 20) {
        classification = BehaviorClassification.EMERGING;
      } else if (behaviorScore > 0.75) {
        classification = BehaviorClassification.HIGHLY_ACTIVE;
      } else if (daysSince > 5) {
        classification = BehaviorClassification.DECLINING;
      }

      db.prepare(`
        UPDATE entity_memory 
        SET behavior_score = ?, 
            behavior_classification = ?
        WHERE id = ?
      `).run(behaviorScore, classification, entity.id);
    }
  }

  static getBehavioralAnalysis(limit: number = 20) {
    return db.prepare(`
      SELECT 
        entity_name, 
        entity_type, 
        behavior_score, 
        behavior_classification,
        total_occurrence_count,
        document_count
      FROM entity_memory
      ORDER BY behavior_score DESC
      LIMIT ?
    `).all(limit);
  }
}
