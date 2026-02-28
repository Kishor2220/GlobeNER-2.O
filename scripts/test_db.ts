import Database from "better-sqlite3";

const db = new Database("globerner_v2.db");

console.log("Tables:");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log("Entity History:");
const history = db.prepare("SELECT * FROM entity_history LIMIT 5").all();
console.log(history);
