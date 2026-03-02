import { db } from "../db";

export interface ActivityTrend {
  entity_name: string;
  entity_type: string;
  change_percent: number;
  direction: 'up' | 'down' | 'stable';
  current_count: number;
}

export interface TimelinePoint {
  timestamp: string;
  count: number;
  entities: string[];
}

export class ActivityService {
  /**
   * Detects trends by comparing the last 24 hours of activity to the previous 24 hours.
   */
  static getTrends(): ActivityTrend[] {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const recentCounts = db.prepare(`
      SELECT em.entity_name, em.entity_type, COUNT(eo.id) as count
      FROM entity_occurrences eo
      JOIN entity_memory em ON eo.entity_id = em.id
      WHERE eo.occurrence_timestamp >= ?
      GROUP BY em.id
    `).all(twentyFourHoursAgo) as any[];

    const previousCounts = db.prepare(`
      SELECT em.entity_name, em.entity_type, COUNT(eo.id) as count
      FROM entity_occurrences eo
      JOIN entity_memory em ON eo.entity_id = em.id
      WHERE eo.occurrence_timestamp >= ? AND eo.occurrence_timestamp < ?
      GROUP BY em.id
    `).all(fortyEightHoursAgo, twentyFourHoursAgo) as any[];

    const trends: ActivityTrend[] = [];
    const prevMap = new Map(previousCounts.map(p => [`${p.entity_name}:${p.entity_type}`, p.count]));

    recentCounts.forEach(r => {
      const key = `${r.entity_name}:${r.entity_type}`;
      const prevCount = prevMap.get(key) || 0;
      const currentCount = r.count;

      let changePercent = 0;
      if (prevCount === 0) {
        changePercent = currentCount * 100; // New entity or massive spike
      } else {
        changePercent = ((currentCount - prevCount) / prevCount) * 100;
      }

      trends.push({
        entity_name: r.entity_name,
        entity_type: r.entity_type,
        change_percent: parseFloat(changePercent.toFixed(1)),
        direction: changePercent > 20 ? 'up' : (changePercent < -20 ? 'down' : 'stable'),
        current_count: currentCount
      });
    });

    // Also check for entities that dropped to zero
    previousCounts.forEach(p => {
      const key = `${p.entity_name}:${p.entity_type}`;
      if (!recentCounts.find(r => `${r.entity_name}:${r.entity_type}` === key)) {
        trends.push({
          entity_name: p.entity_name,
          entity_type: p.entity_type,
          change_percent: -100,
          direction: 'down',
          current_count: 0
        });
      }
    });

    return trends.sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent)).slice(0, 10);
  }

  /**
   * Generates a timeline of entity appearances aggregated by hour.
   */
  static getAppearanceTimeline(days: number = 7): TimelinePoint[] {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const occurrences = db.prepare(`
      SELECT 
        strftime('%Y-%m-%dT%H:00:00Z', occurrence_timestamp) as hour,
        COUNT(*) as count,
        GROUP_CONCAT(em.entity_name) as entities
      FROM entity_occurrences eo
      JOIN entity_memory em ON eo.entity_id = em.id
      WHERE occurrence_timestamp >= ?
      GROUP BY hour
      ORDER BY hour ASC
    `).all(startTime) as any[];

    return occurrences.map(o => ({
      timestamp: o.hour as string,
      count: o.count as number,
      entities: Array.from(new Set((o.entities || "").split(','))).slice(0, 5) as string[]
    }));
  }

  /**
   * Generates a timeline of relationship evolution (co-occurrences).
   */
  static getRelationshipTimeline(days: number = 7): any[] {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // We'll use the analysis_history table to see co-occurrences over time
    // since relationship_memory only stores the latest state.
    const history = db.prepare(`
      SELECT 
        strftime('%Y-%m-%dT%H:00:00Z', timestamp) as hour,
        entities
      FROM analysis_history
      WHERE timestamp >= ?
      ORDER BY hour ASC
    `).all(startTime) as any[];

    const timeline: Map<string, number> = new Map();

    history.forEach(row => {
      try {
        const entities = JSON.parse(row.entities);
        if (Array.isArray(entities) && entities.length > 1) {
          // Count pairs
          const pairCount = (entities.length * (entities.length - 1)) / 2;
          timeline.set(row.hour, (timeline.get(row.hour) || 0) + pairCount);
        }
      } catch (e) {}
    });

    return Array.from(timeline.entries()).map(([timestamp, count]) => ({
      timestamp,
      count
    })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Gets the most recently seen entities with human-readable "time ago".
   */
  static getLastSeenTracker(limit: number = 10) {
    const entities = db.prepare(`
      SELECT entity_name, entity_type, last_seen
      FROM entity_memory
      ORDER BY last_seen DESC
      LIMIT ?
    `).all(limit) as any[];

    const now = new Date().getTime();

    return entities.map(e => {
      const lastSeenTime = new Date(e.last_seen).getTime();
      const diffMs = now - lastSeenTime;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo = "Just now";
      if (diffDays > 0) timeAgo = `${diffDays}d ago`;
      else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
      else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

      return {
        ...e,
        time_ago: timeAgo,
        is_recent: diffMins < 60 // Highlight if seen in the last hour
      };
    });
  }
}
