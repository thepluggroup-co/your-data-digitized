/**
 * server/db/connection.js
 * THE PLUG FINANCE CO — Connexion base de données (SQLite natif Node.js)
 *
 * Utilise le module intégré `node:sqlite` (Node >= 22.5) : aucune dépendance
 * native à compiler/installer. Le fichier de base vit dans server/data/theplug.db,
 * à côté de l'ancien dossiers.json (conservé tel quel comme trace historique).
 */

const path = require("path");
const fs   = require("fs");

let DatabaseSync;
try {
  ({ DatabaseSync } = require("node:sqlite"));
} catch {
  throw new Error(
    "[db] Le module 'node:sqlite' est indisponible sur ce runtime. " +
    "Node.js >= 22.5 est requis (Node >= 24 recommandé, aucun flag nécessaire). " +
    `Version actuelle : ${process.version}.`
  );
}

const DATA_DIR = path.join(__dirname, "../data");
const DB_FILE  = path.join(DATA_DIR, "theplug.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS dossiers (
    id          TEXT PRIMARY KEY,
    nom         TEXT NOT NULL,
    client      TEXT,
    description TEXT,
    data        TEXT NOT NULL,   -- JSON: { params, salairesData, ventesData, investData, amortData }
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    synced_at   TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at ON dossiers(updated_at);
  CREATE INDEX IF NOT EXISTS idx_dossiers_nom         ON dossiers(nom);

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    dossier_id TEXT NOT NULL,
    action     TEXT NOT NULL,    -- 'create' | 'update' | 'delete' | 'import'
    at         TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_dossier_id ON audit_log(dossier_id);
`);

module.exports = db;
