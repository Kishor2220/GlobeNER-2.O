import { db } from "./memoryService";
import { AlertService } from "./alertService";

export class RelationshipService {
  static refreshRelationships() {
    const now = new Date().getTime();
    const relationships = db.prepare("SELECT * FROM relationship_memory").all() as any[];

    relationships.forEach(rel => {
      const lastSeenTime = new Date(rel.last_seen).getTime();
      const daysSince = Math.max(0, (now - lastSeenTime) / (1000 * 60 * 60 * 24));
      const recencyScore = 1 / (1 + daysSince);

      // Re-calculate strength with current recency
      const entityA = db.prepare("SELECT entity_name, rank_score FROM entity_memory WHERE id = ?").get(rel.entity_a_id) as any;
      const entityB = db.prepare("SELECT entity_name, rank_score FROM entity_memory WHERE id = ?").get(rel.entity_b_id) as any;
      const mutualInfluence = ((entityA?.rank_score || 0) + (entityB?.rank_score || 0)) / 2;
      
      const newStrength = (rel.co_occurrence_count * 0.4) + (recencyScore * 5 * 0.3) + (mutualInfluence * 0.3);
      
      let trend = rel.co_occurrence_trend;
      const oldTrend = trend;
      if (daysSince > 7) trend = 'FADING';
      else if (daysSince > 3) trend = 'WEAKENING';
      else if (newStrength < rel.relationship_strength_score && trend !== 'NEW') trend = 'WEAKENING';

      // Alert: Relationship Disappearance
      if (trend === 'FADING' && oldTrend !== 'FADING') {
        AlertService.generateRelationshipDisappearanceAlert(entityA?.entity_name, entityB?.entity_name);
      }

      db.prepare(`
        UPDATE relationship_memory 
        SET relationship_strength_score = ?, 
            co_occurrence_trend = ?
        WHERE id = ?
      `).run(newStrength, trend, rel.id);
    });
  }

  static getNewRelationships(limit: number = 10) {
    return db.prepare(`
      SELECT 
        rm.*,
        ea.entity_name as source_name, ea.entity_type as source_type,
        eb.entity_name as target_name, eb.entity_type as target_type
      FROM relationship_memory rm
      JOIN entity_memory ea ON rm.entity_a_id = ea.id
      JOIN entity_memory eb ON rm.entity_b_id = eb.id
      WHERE rm.co_occurrence_trend = 'NEW'
      ORDER BY rm.first_seen DESC
      LIMIT ?
    `).all(limit);
  }

  static getStrengthenedRelationships(limit: number = 10) {
    return db.prepare(`
      SELECT 
        rm.*,
        ea.entity_name as source_name, ea.entity_type as source_type,
        eb.entity_name as target_name, eb.entity_type as target_type
      FROM relationship_memory rm
      JOIN entity_memory ea ON rm.entity_a_id = ea.id
      JOIN entity_memory eb ON rm.entity_b_id = eb.id
      WHERE rm.co_occurrence_trend = 'STRENGTHENING'
      ORDER BY rm.relationship_strength_score DESC
      LIMIT ?
    `).all(limit);
  }

  static getFadingRelationships(limit: number = 10) {
    return db.prepare(`
      SELECT 
        rm.*,
        ea.entity_name as source_name, ea.entity_type as source_type,
        eb.entity_name as target_name, eb.entity_type as target_type
      FROM relationship_memory rm
      JOIN entity_memory ea ON rm.entity_a_id = ea.id
      JOIN entity_memory eb ON rm.entity_b_id = eb.id
      WHERE rm.co_occurrence_trend IN ('FADING', 'WEAKENING')
      ORDER BY rm.relationship_strength_score ASC
      LIMIT ?
    `).all(limit);
  }
}
