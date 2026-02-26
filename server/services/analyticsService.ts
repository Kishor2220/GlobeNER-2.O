export class AnalyticsService {
  static getFrequency(entities: any[]) {
    const freq: Record<string, number> = {};
    entities.forEach(e => {
      const key = `${e.text} (${e.label})`;
      freq[key] = (freq[key] || 0) + 1;
    });
    return Object.entries(freq)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  static getDistribution(entities: any[]) {
    const dist: Record<string, number> = {};
    entities.forEach(e => {
      dist[e.label] = (dist[e.label] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }

  static getRelationships(entities: any[]) {
    const nodes: any[] = [];
    const links: any[] = [];
    const entityMap: Record<string, number> = {};

    // Create nodes
    entities.forEach(e => {
      const id = `${e.text}:${e.label}`;
      if (entityMap[id] === undefined) {
        entityMap[id] = nodes.length;
        nodes.push({ id, name: e.text, label: e.label });
      }
    });

    // Create links (co-occurrence in the same text)
    // For simplicity, we link all entities found in the same batch/text
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        links.push({ source: nodes[i].id, target: nodes[j].id, value: 1 });
      }
    }

    return { nodes, links };
  }
}
