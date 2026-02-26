import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.resolve(process.cwd(), 'globerner_v2.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_time INTEGER,
    status TEXT DEFAULT 'completed',
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    text TEXT NOT NULL,
    type TEXT NOT NULL,
    confidence REAL,
    start_index INTEGER,
    end_index INTEGER,
    FOREIGN KEY (document_id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS entity_summary (
    text TEXT,
    type TEXT,
    mentions_count INTEGER DEFAULT 0,
    avg_confidence REAL DEFAULT 0,
    first_seen DATETIME,
    last_seen DATETIME,
    PRIMARY KEY (text, type)
  );

  CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    source_text TEXT,
    source_type TEXT,
    target_text TEXT,
    target_type TEXT,
    strength INTEGER DEFAULT 1,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_text, source_type, target_text, target_type)
  );
`);

export class DBService {
  static saveDocument(doc: { id: string; filename: string; type: string; content: string; processing_time: number; status?: string; error_message?: string }) {
    const stmt = db.prepare('INSERT INTO documents (id, filename, type, content, processing_time, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(doc.id, doc.filename, doc.type, doc.content, doc.processing_time, doc.status || 'completed', doc.error_message || null);
  }

  static saveEntities(entities: any[], documentId: string) {
    const insertEntity = db.prepare('INSERT INTO entities (id, document_id, text, type, confidence, start_index, end_index) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const updateSummary = db.prepare(`
      INSERT INTO entity_summary (text, type, mentions_count, avg_confidence, first_seen, last_seen)
      VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(text, type) DO UPDATE SET
        mentions_count = mentions_count + 1,
        avg_confidence = (avg_confidence * mentions_count + excluded.avg_confidence) / (mentions_count + 1),
        last_seen = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        const id = crypto.randomUUID();
        insertEntity.run(id, documentId, item.text, item.type, item.confidence, item.startIndex, item.endIndex);
        updateSummary.run(item.text, item.type, item.confidence);
      }
    });
    insertMany(entities);
  }

  static saveRelationships(pairs: any[]) {
    const stmt = db.prepare(`
      INSERT INTO relationships (id, source_text, source_type, target_text, target_type, strength)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(source_text, source_type, target_text, target_type) DO UPDATE SET
        strength = strength + 1,
        last_seen = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(crypto.randomUUID(), item.source.text, item.source.type, item.target.text, item.target.type);
      }
    });
    insertMany(pairs);
  }

  static getDocuments() {
    return db.prepare('SELECT * FROM documents ORDER BY processed_at DESC').all();
  }

  static getEntitySummary(text?: string) {
    if (text) {
      return db.prepare('SELECT * FROM entity_summary WHERE text LIKE ?').all(`%${text}%`);
    }
    return db.prepare('SELECT * FROM entity_summary ORDER BY mentions_count DESC').all();
  }

  static getRelationships() {
    return db.prepare('SELECT * FROM relationships WHERE strength > 0 ORDER BY strength DESC').all();
  }

  static getStats() {
    const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get() as any;
    const totalEntities = db.prepare('SELECT COUNT(*) as count FROM entities').get() as any;
    const avgConfidence = db.prepare('SELECT AVG(confidence) as avg FROM entities').get() as any;
    const avgTime = db.prepare('SELECT AVG(processing_time) as avg FROM documents').get() as any;
    const failureRate = db.prepare("SELECT (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents)) as rate FROM documents WHERE status = 'error'").get() as any;
    
    const typeCounts = db.prepare('SELECT type, COUNT(*) as count FROM entities GROUP BY type').all() as any[];
    
    return {
      totalDocuments: totalDocs.count,
      totalEntities: totalEntities.count,
      averageConfidence: avgConfidence.avg || 0,
      averageProcessingTime: avgTime.avg || 0,
      failureRate: failureRate.rate || 0,
      typeDistribution: typeCounts
    };
  }
}
