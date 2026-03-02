import Database from "better-sqlite3";

const db = new Database("globerner_v2.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    entities TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_type TEXT
  );

  CREATE TABLE IF NOT EXISTS entity_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name TEXT,
    entity_type TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_occurrence_count INTEGER DEFAULT 0,
    average_confidence REAL DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    document_count INTEGER DEFAULT 0,
    rank_score REAL DEFAULT 0,
    behavior_score REAL DEFAULT 0,
    behavior_classification TEXT DEFAULT 'STABLE',
    UNIQUE(entity_name, entity_type)
  );

  CREATE TABLE IF NOT EXISTS entity_occurrences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER,
    occurrence_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_document TEXT,
    confidence REAL,
    related_entities TEXT,
    FOREIGN KEY(entity_id) REFERENCES entity_memory(id)
  );

  CREATE TABLE IF NOT EXISTS relationship_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_a_id INTEGER,
    entity_b_id INTEGER,
    co_occurrence_count INTEGER DEFAULT 0,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    relationship_frequency REAL DEFAULT 0,
    relationship_strength_score REAL DEFAULT 0,
    co_occurrence_trend TEXT DEFAULT 'STABLE',
    UNIQUE(entity_a_id, entity_b_id),
    FOREIGN KEY(entity_a_id) REFERENCES entity_memory(id),
    FOREIGN KEY(entity_b_id) REFERENCES entity_memory(id)
  );

  CREATE TABLE IF NOT EXISTS intelligence_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT,
    related_entities TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    severity TEXT,
    explanation TEXT
  );
`);

// Migrations
const tableInfo = db.prepare("PRAGMA table_info(relationship_memory)").all() as any[];
const columnNames = tableInfo.map(c => c.name);

if (!columnNames.includes('relationship_strength_score')) {
  db.exec("ALTER TABLE relationship_memory ADD COLUMN relationship_strength_score REAL DEFAULT 0");
}
if (!columnNames.includes('co_occurrence_trend')) {
  db.exec("ALTER TABLE relationship_memory ADD COLUMN co_occurrence_trend TEXT DEFAULT 'STABLE'");
}

const entityTableInfo = db.prepare("PRAGMA table_info(entity_memory)").all() as any[];
const entityColumnNames = entityTableInfo.map(c => c.name);
if (!entityColumnNames.includes('rank_score')) {
  db.exec("ALTER TABLE entity_memory ADD COLUMN rank_score REAL DEFAULT 0");
}
if (!entityColumnNames.includes('behavior_score')) {
  db.exec("ALTER TABLE entity_memory ADD COLUMN behavior_score REAL DEFAULT 0");
}
if (!entityColumnNames.includes('behavior_classification')) {
  db.exec("ALTER TABLE entity_memory ADD COLUMN behavior_classification TEXT DEFAULT 'STABLE'");
}

export { db };
