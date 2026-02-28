import { db } from "./memoryService";

export interface RankedEntity {
  id: number;
  entity_name: string;
  entity_type: string;
  total_occurrence_count: number;
  average_confidence: number;
  relationship_count: number;
  rank_score: number;
  last_seen: string;
}

export class RankingService {
  /**
   * Calculates the intelligence rank score for all entities in memory.
   * Formula: (frequency * 0.3) + (recency_score * 0.2) + (relationship_count * 0.2) + (confidence_avg * 0.2) + (anomaly_factor * 0.1)
   */
  static getRankedEntities(limit: number = 15): RankedEntity[] {
    const entities = db.prepare(`
      SELECT 
        em.*,
        (SELECT COUNT(*) FROM relationship_memory WHERE entity_a_id = em.id OR entity_b_id = em.id) as relationship_count
      FROM entity_memory em
    `).all() as any[];

    if (entities.length === 0) return [];

    const now = new Date().getTime();

    const ranked = entities.map(e => {
      // 1. Frequency (Normalized by max frequency in set for better scoring)
      const frequency = e.total_occurrence_count;
      
      // 2. Recency Score: 1 / (1 + days_since_last_seen)
      const lastSeenTime = new Date(e.last_seen).getTime();
      const daysSince = Math.max(0, (now - lastSeenTime) / (1000 * 60 * 60 * 24));
      const recencyScore = 1 / (1 + daysSince);

      // 3. Relationship Count
      const relCount = e.relationship_count || 0;

      // 4. Average Confidence
      const avgConf = e.average_confidence || 0;

      // 5. Anomaly Factor: Entities with unusual confidence or rare occurrences that might be significant
      // We'll define it as high if confidence is extremely high or if it's a rare but highly related entity
      const anomalyFactor = (avgConf > 0.95 || (relCount > 5 && frequency < 3)) ? 1 : 0.2;

      // Apply Weights
      // Note: We scale some factors to ensure they contribute meaningfully to the final score
      const score = 
        (frequency * 0.3) +
        (recencyScore * 5 * 0.2) + 
        (relCount * 0.2) +
        (avgConf * 5 * 0.2) +
        (anomalyFactor * 0.1);

      return {
        id: e.id,
        entity_name: e.entity_name,
        entity_type: e.entity_type,
        total_occurrence_count: frequency,
        average_confidence: avgConf,
        relationship_count: relCount,
        rank_score: parseFloat(score.toFixed(4)),
        last_seen: e.last_seen
      };
    });

    return ranked.sort((a, b) => b.rank_score - a.rank_score).slice(0, limit);
  }

  static getTopEntities(limit: number = 10) {
    return this.getRankedEntities(limit);
  }

  static getTrendingEntities(limit: number = 5) {
    // Trending prioritizes recency and recent growth (simulated here by recency weight)
    const ranked = this.getRankedEntities(limit * 3);
    return ranked
      .sort((a, b) => {
        const aTime = new Date(a.last_seen).getTime();
        const bTime = new Date(b.last_seen).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  static getMostActiveEntities(limit: number = 5) {
    // Active prioritizes frequency and relationship density
    const ranked = this.getRankedEntities(limit * 3);
    return ranked
      .sort((a, b) => (b.total_occurrence_count + b.relationship_count) - (a.total_occurrence_count + a.relationship_count))
      .slice(0, limit);
  }
}
