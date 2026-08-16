/**
 * server/db/migrate-legacy-json.js
 * Migration ponctuelle : importe l'ancien server/data/dossiers.json (fichier plat)
 * dans la base SQLite au premier démarrage après mise à niveau, si la base est vide.
 */

const fs   = require("fs");
const path = require("path");
const repo = require("./dossiers-repo");

const LEGACY_FILE = path.join(__dirname, "../data/dossiers.json");

function migrateLegacyJsonIfEmpty() {
  if (repo.count() > 0) return; // déjà peuplée, rien à faire
  if (!fs.existsSync(LEGACY_FILE)) return;

  let legacy;
  try {
    legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, "utf8"));
  } catch {
    return;
  }
  if (!Array.isArray(legacy) || legacy.length === 0) return;

  const { added } = repo.importMany(legacy, true);
  console.log(`[db] Migration depuis dossiers.json : ${added} dossier(s) importé(s) dans SQLite.`);
}

module.exports = { migrateLegacyJsonIfEmpty };
