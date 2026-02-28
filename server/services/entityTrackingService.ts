import Database from "better-sqlite3";

export class EntityTrackingService {
  static trackEntities(db: Database.Database, entities: any[], documentSource: string, sessionId: string = 'default') {
    if (!entities || entities.length === 0) return;

    const insertHistory = db.prepare(`
      INSERT INTO entity_history (entity_text, entity_type, document_source, confidence, session_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const upsertStats = db.prepare(`
      INSERT INTO entity_statistics (entity_text, entity_type, total_occurrences, last_seen)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(entity_text, entity_type) DO UPDATE SET
        total_occurrences = total_occurrences + 1,
        last_seen = CURRENT_TIMESTAMP
    `);

    const insertRelationship = db.prepare(`
      INSERT INTO entity_relationships (entity1_text, entity1_type, entity2_text, entity2_type, document_source, session_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      const uniqueEntities: {text: string, type: string}[] = [];
      const seen = new Set<string>();

      // Track individual entities
      for (const entity of entities) {
        const text = entity.text || entity.word;
        const type = entity.type || entity.entity_group || "UNKNOWN";
        const confidence = entity.score || entity.confidence || 1.0;

        if (!text) continue;

        insertHistory.run(text, type, documentSource, confidence, sessionId);
        upsertStats.run(text, type);

        const key = `${text}::${type}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEntities.push({ text, type });
        }
      }

      // Track relationships (co-occurrences in the same document)
      for (let i = 0; i < uniqueEntities.length; i++) {
        for (let j = i + 1; j < uniqueEntities.length; j++) {
          const e1 = uniqueEntities[i];
          const e2 = uniqueEntities[j];
          
          // Sort alphabetically to avoid duplicate undirected edges (A->B vs B->A)
          const [first, second] = e1.text.localeCompare(e2.text) < 0 ? [e1, e2] : [e2, e1];
          
          insertRelationship.run(first.text, first.type, second.text, second.type, documentSource, sessionId);
        }
      }
    })();
  }
}

