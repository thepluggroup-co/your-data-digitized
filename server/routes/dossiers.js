/**
 * routes/dossiers.js
 * THE PLUG FINANCE CO — Persistance cloud des dossiers (fichier JSON serveur)
 *
 * GET    /api/dossiers          — liste tous les dossiers cloud
 * GET    /api/dossiers/:id      — récupère un dossier
 * POST   /api/dossiers          — crée ou met à jour un dossier (upsert sur id)
 * DELETE /api/dossiers/:id      — supprime un dossier
 * GET    /api/dossiers/export   — télécharge tous les dossiers en JSON bundle
 * POST   /api/dossiers/import   — importe un bundle JSON (remplace ou fusionne)
 */

const express = require("express");
const fs      = require("fs");
const path    = require("path");

const router   = express.Router();
const DATA_DIR = path.join(__dirname, "../../server/data");
const DB_FILE  = path.join(DATA_DIR, "dossiers.json");

// ── Init ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE))  fs.writeFileSync(DB_FILE, "[]", "utf8");

function readDb() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return []; }
}
function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── GET /api/dossiers ─────────────────────────────────────────────────────────
router.get("/", (_req, res) => {
  const all = readDb();
  // Retourner metadata uniquement (pas les données complètes) pour la liste
  const list = all.map(({ id, nom, client, description, createdAt, updatedAt, syncedAt }) =>
    ({ id, nom, client, description, createdAt, updatedAt, syncedAt })
  );
  res.json({ success: true, count: list.length, dossiers: list });
});

// ── GET /api/dossiers/export ──────────────────────────────────────────────────
router.get("/export", (_req, res) => {
  const all = readDb();
  const filename = `theplug_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/json");
  res.json({ version: "1.0", exportedAt: new Date().toISOString(), count: all.length, dossiers: all });
});

// ── GET /api/dossiers/:id ─────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const d = readDb().find(d => d.id === req.params.id);
  if (!d) return res.status(404).json({ error: "Dossier introuvable" });
  res.json({ success: true, dossier: d });
});

// ── POST /api/dossiers — upsert ───────────────────────────────────────────────
router.post("/", (req, res) => {
  const { dossier } = req.body;
  if (!dossier?.id || !dossier?.nom) {
    return res.status(400).json({ error: "Champs 'id' et 'nom' requis" });
  }
  const all = readDb();
  const idx = all.findIndex(d => d.id === dossier.id);
  const synced = { ...dossier, syncedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = synced;
  else          all.push(synced);
  writeDb(all);
  res.json({ success: true, dossier: synced });
});

// ── DELETE /api/dossiers/:id ──────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const all = readDb();
  const idx = all.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Dossier introuvable" });
  all.splice(idx, 1);
  writeDb(all);
  res.json({ success: true });
});

// ── POST /api/dossiers/import — import bundle ─────────────────────────────────
router.post("/import", (req, res) => {
  const { dossiers, merge = true } = req.body;
  if (!Array.isArray(dossiers)) return res.status(400).json({ error: "'dossiers' doit être un tableau" });
  const now   = new Date().toISOString();
  let current = merge ? readDb() : [];
  let added = 0, updated = 0;
  dossiers.forEach(d => {
    if (!d.id || !d.nom) return;
    const idx = current.findIndex(c => c.id === d.id);
    const entry = { ...d, syncedAt: now };
    if (idx >= 0) { current[idx] = entry; updated++; }
    else          { current.push(entry); added++; }
  });
  writeDb(current);
  res.json({ success: true, added, updated, total: current.length });
});

module.exports = router;
