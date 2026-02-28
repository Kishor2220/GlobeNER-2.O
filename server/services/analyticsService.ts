export class AnalyticsService {
  static getFrequency(entities: any[]) {
    const freq: Record<string, number> = {};
    entities.forEach(e => {
      const type = e.type || e.label || "UNKNOWN";
      const key = `${e.text} (${type})`;
      freq[key] = (freq[key] || 0) + 1;
    });
    return Object.entries(freq)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }

  static getDistribution(entities: any[]) {
    const dist: Record<string, number> = {};
    entities.forEach(e => {
      const type = e.type || e.label || "UNKNOWN";
      dist[type] = (dist[type] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }

  static getIntelligenceGraph(dbEntities: any[], dbRelationships: any[]) {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeMap = new Map();

    dbEntities.forEach(entity => {
      const id = `${entity.entity_name}:${entity.entity_type}`;
      nodeMap.set(id, nodes.length);
      nodes.push({
        id,
        name: entity.entity_name,
        label: entity.entity_type,
        rank: entity.rank_score || 0,
        frequency: entity.total_occurrence_count || 0,
        confidence: entity.average_confidence || 0,
        last_seen: entity.last_seen,
        activity: entity.session_count || 0
      });
    });

    dbRelationships.forEach(rel => {
      const sourceId = `${rel.source_name}:${rel.source_type}`;
      const targetId = `${rel.target_name}:${rel.target_type}`;

      if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
        links.push({
          source: sourceId,
          target: targetId,
          strength: rel.relationship_strength_score || 1,
          frequency: rel.relationship_frequency || 0,
          trend: rel.co_occurrence_trend || 'STABLE',
          last_seen: rel.last_seen
        });
      }
    });

    return { nodes, links };
  }

  static calculateHealthScore(stats: any) {
    // Health score based on confidence and failure rate
    const confidenceWeight = 0.7;
    const successWeight = 0.3;
    
    const score = (stats.averageConfidence * 100 * confidenceWeight) + 
                  ((100 - stats.failureRate) * successWeight);
    
    return Math.round(score);
  }

  static detectAnomalies(entities: any[]) {
    // Detect low confidence clusters
    const threshold = 0.4;
    const anomalies = entities.filter(e => e.confidence < threshold);
    
    return anomalies.map(a => ({
      type: 'LOW_CONFIDENCE',
      entity: a.text,
      confidence: a.confidence,
      timestamp: new Date().toISOString()
    })).slice(0, 5);
  }
}
