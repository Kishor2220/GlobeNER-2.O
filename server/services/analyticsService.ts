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

  static getRelationships(dbRelationships: any[]) {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeMap = new Map();

    dbRelationships.forEach(rel => {
      const sourceId = `${rel.source_text}:${rel.source_type}`;
      const targetId = `${rel.target_text}:${rel.target_type}`;

      if (!nodeMap.has(sourceId)) {
        nodeMap.set(sourceId, nodes.length);
        nodes.push({ id: sourceId, name: rel.source_text, label: rel.source_type, value: 0 });
      }
      nodes[nodeMap.get(sourceId)].value += rel.strength;

      if (!nodeMap.has(targetId)) {
        nodeMap.set(targetId, nodes.length);
        nodes.push({ id: targetId, name: rel.target_text, label: rel.target_type, value: 0 });
      }
      nodes[nodeMap.get(targetId)].value += rel.strength;

      links.push({
        source: sourceId,
        target: targetId,
        value: rel.strength
      });
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
