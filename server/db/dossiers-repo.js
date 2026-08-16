/**
 * server/db/dossiers-repo.js
 * THE PLUG FINANCE CO — Accès aux données des dossiers (SQLite)
 *
 * Couche repository : toute la logique SQL vit ici. Les routes Express
 * (routes/dossiers.js) ne manipulent que des objets JS, comme avant avec
 * le fichier JSON — le contrat de l'API HTTP ne change pas.
 */

const db = require("./connection");

function rowToMeta(row) {
  return {
    id: row.id,
    nom: row.nom,
    client: row.client ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at ?? undefined,
  };
}

function rowToFull(row) {
  return { ...rowToMeta(row), data: JSON.parse(row.data) };
}

function logAudit(dossierId, action) {
  db.prepare("INSERT INTO audit_log (dossier_id, action, at) VALUES (?, ?, ?)")
    .run(dossierId, action, new Date().toISOString());
}

// ── Liste (métadonnées uniquement, triées par dernière modif) ────────────────
function listMeta() {
  const rows = db.prepare("SELECT * FROM dossiers ORDER BY updated_at DESC").all();
  return rows.map(rowToMeta);
}

// ── Récupère un dossier complet ───────────────────────────────────────────────
function getById(id) {
  const row = db.prepare("SELECT * FROM dossiers WHERE id = ?").get(id);
  return row ? rowToFull(row) : null;
}

// ── Upsert (crée ou met à jour, marque syncedAt) ──────────────────────────────
function upsert(dossier) {
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT id, created_at FROM dossiers WHERE id = ?").get(dossier.id);
  const createdAt = existing?.created_at ?? dossier.createdAt ?? now;
  const updatedAt = dossier.updatedAt ?? now;

  db.prepare(`
    INSERT INTO dossiers (id, nom, client, description, data, created_at, updated_at, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nom = excluded.nom, client = excluded.client, description = excluded.description,
      data = excluded.data, updated_at = excluded.updated_at, synced_at = excluded.synced_at
  `).run(
    dossier.id, dossier.nom, dossier.client ?? null, dossier.description ?? null,
    JSON.stringify(dossier.data), createdAt, updatedAt, now
  );

  logAudit(dossier.id, existing ? "update" : "create");
  return getById(dossier.id);
}

// ── Suppression ────────────────────────────────────────────────────────────
function remove(id) {
  const result = db.prepare("DELETE FROM dossiers WHERE id = ?").run(id);
  if (result.changes > 0) logAudit(id, "delete");
  return result.changes > 0;
}

// ── Export complet (bundle) ──────────────────────────────────────────────────
function exportAll() {
  return db.prepare("SELECT * FROM dossiers ORDER BY updated_at DESC").all().map(rowToFull);
}

// ── Import d'un bundle (merge ou remplacement complet) ────────────────────────
function importMany(dossiers, merge = true) {
  const now = new Date().toISOString();
  if (!merge) db.exec("DELETE FROM dossiers");

  let added = 0, updated = 0;
  for (const d of dossiers) {
    if (!d.id || !d.nom) continue;
    const existing = db.prepare("SELECT id, created_at FROM dossiers WHERE id = ?").get(d.id);
    db.prepare(`
      INSERT INTO dossiers (id, nom, client, description, data, created_at, updated_at, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nom = excluded.nom, client = excluded.client, description = excluded.description,
        data = excluded.data, updated_at = excluded.updated_at, synced_at = excluded.synced_at
    `).run(
      d.id, d.nom, d.client ?? null, d.description ?? null,
      JSON.stringify(d.data ?? {}), existing?.created_at ?? d.createdAt ?? now, d.updatedAt ?? now, now
    );
    if (existing) updated++; else added++;
  }
  logAudit("*", `import(${dossiers.length})`);
  const total = db.prepare("SELECT COUNT(*) AS n FROM dossiers").get().n;
  return { added, updated, total };
}

// ── Compte total (utilisé par la migration au démarrage) ─────────────────────
function count() {
  return db.prepare("SELECT COUNT(*) AS n FROM dossiers").get().n;
}

module.exports = { listMeta, getById, upsert, remove, exportAll, importMany, count, logAudit };
