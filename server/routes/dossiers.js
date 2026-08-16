/**
 * routes/dossiers.js
 * THE PLUG FINANCE CO — Persistance des dossiers (base SQLite, server/db/)
 *
 * GET    /api/dossiers          — liste tous les dossiers (métadonnées)
 * GET    /api/dossiers/:id      — récupère un dossier complet
 * POST   /api/dossiers          — crée ou met à jour un dossier (upsert sur id)
 * DELETE /api/dossiers/:id      — supprime un dossier
 * GET    /api/dossiers/export   — télécharge tous les dossiers en JSON bundle
 * POST   /api/dossiers/import   — importe un bundle JSON (remplace ou fusionne)
 */

const express = require("express");
const repo    = require("../db/dossiers-repo");
const { migrateLegacyJsonIfEmpty } = require("../db/migrate-legacy-json");

const router = express.Router();

migrateLegacyJsonIfEmpty();

// ── GET /api/dossiers ─────────────────────────────────────────────────────────
router.get("/", (_req, res) => {
  const list = repo.listMeta();
  res.json({ success: true, count: list.length, dossiers: list });
});

// ── GET /api/dossiers/export ──────────────────────────────────────────────────
router.get("/export", (_req, res) => {
  const all = repo.exportAll();
  const filename = `theplug_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/json");
  res.json({ version: "1.0", exportedAt: new Date().toISOString(), count: all.length, dossiers: all });
});

// ── GET /api/dossiers/:id ─────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const d = repo.getById(req.params.id);
  if (!d) return res.status(404).json({ error: "Dossier introuvable" });
  res.json({ success: true, dossier: d });
});

// ── POST /api/dossiers — upsert ───────────────────────────────────────────────
router.post("/", (req, res) => {
  const { dossier } = req.body;
  if (!dossier?.id || !dossier?.nom) {
    return res.status(400).json({ error: "Champs 'id' et 'nom' requis" });
  }
  const synced = repo.upsert(dossier);
  res.json({ success: true, dossier: synced });
});

// ── DELETE /api/dossiers/:id ──────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const ok = repo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "Dossier introuvable" });
  res.json({ success: true });
});

// ── POST /api/dossiers/import — import bundle ─────────────────────────────────
router.post("/import", (req, res) => {
  const { dossiers, merge = true } = req.body;
  if (!Array.isArray(dossiers)) return res.status(400).json({ error: "'dossiers' doit être un tableau" });
  const result = repo.importMany(dossiers, merge);
  res.json({ success: true, ...result });
});

module.exports = router;
