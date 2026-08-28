// Connessione al database SQLite e applicazione dello schema all'avvio
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('./env');

// Assicura che la cartella del database esista
const dbDir = path.dirname(env.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(env.dbPath);
db.pragma('foreign_keys = ON');

// Applica lo schema (idempotente grazie a IF NOT EXISTS)
const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
