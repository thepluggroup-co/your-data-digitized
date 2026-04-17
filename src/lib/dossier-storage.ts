/**
 * THE PLUG FINANCE CO — Dossier persistence layer
 * Saves complete project snapshots in localStorage.
 * Each dossier = one client/project with all its financial data.
 */

import type { EditableParams, SalaryEntry, VentesData, InvEntry, AmortEntry } from "@/contexts/ParametresContext";

export interface DossierData {
  params: EditableParams;
  salairesData: SalaryEntry[];
  ventesData: VentesData;
  investData: InvEntry[];
  amortData: AmortEntry[];
}

export interface Dossier {
  id: string;
  nom: string;
  client?: string;
  description?: string;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
  data: DossierData;
}

const STORAGE_KEY    = "theplug_dossiers";
const ACTIVE_KEY     = "theplug_active_dossier";

// ── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): Dossier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(dossiers: Dossier[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function listDossiers(): Dossier[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDossier(id: string): Dossier | null {
  return readAll().find(d => d.id === id) ?? null;
}

export function createDossier(nom: string, client: string, description: string, data: DossierData): Dossier {
  const now = new Date().toISOString();
  const dossier: Dossier = { id: genId(), nom, client, description, createdAt: now, updatedAt: now, data };
  const all = readAll();
  all.push(dossier);
  writeAll(all);
  return dossier;
}

export function saveDossier(id: string, data: DossierData, meta?: Partial<Pick<Dossier, "nom" | "client" | "description">>): Dossier | null {
  const all = readAll();
  const idx = all.findIndex(d => d.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...meta, data, updatedAt: new Date().toISOString() };
  writeAll(all);
  return all[idx];
}

export function renameDossier(
  id: string,
  nom: string,
  client?: string,
  description?: string,
): Dossier | null {
  const all = readAll();
  const idx = all.findIndex(d => d.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    nom,
    ...(client      !== undefined && { client }),
    ...(description !== undefined && { description }),
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  return all[idx];
}

export function deleteDossier(id: string): void {
  writeAll(readAll().filter(d => d.id !== id));
  if (getActiveDossierId() === id) setActiveDossierId(null);
}

export function duplicateDossier(id: string, newNom: string): Dossier | null {
  const src = getDossier(id);
  if (!src) return null;
  return createDossier(newNom, src.client ?? "", src.description ?? "", JSON.parse(JSON.stringify(src.data)));
}

// ── Active dossier pointer ────────────────────────────────────────────────────

export function getActiveDossierId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveDossierId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

// ── JSON file export / import ─────────────────────────────────────────────────

export function exportDossierJson(dossier: Dossier): void {
  const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${dossier.nom.replace(/\s+/g, "_")}_${dossier.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Recherche / filtre ────────────────────────────────────────────────────────
export function searchDossiers(query: string): Dossier[] {
  const q = query.toLowerCase().trim();
  if (!q) return listDossiers();
  return listDossiers().filter(d =>
    d.nom.toLowerCase().includes(q) ||
    (d.client ?? "").toLowerCase().includes(q) ||
    (d.description ?? "").toLowerCase().includes(q)
  );
}

// ── Statistiques de stockage local ───────────────────────────────────────────
export function getStorageStats(): { count: number; sizeKb: number; maxKb: number; pct: number } {
  const raw   = localStorage.getItem(STORAGE_KEY) ?? "[]";
  const sizeKb = Math.round(new Blob([raw]).size / 1024);
  const maxKb  = 5_120; // ~5 Mo limite localStorage typique
  return { count: readAll().length, sizeKb, maxKb, pct: Math.min(100, Math.round(sizeKb / maxKb * 100)) };
}

// ── Export de tous les dossiers en bundle JSON ────────────────────────────────
export function exportAllDossiers(): void {
  const all = readAll();
  const bundle = { version: "1.0", exportedAt: new Date().toISOString(), count: all.length, dossiers: all };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `theplug_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import d'un bundle multi-dossiers ─────────────────────────────────────────
export function importBundle(dossiers: Dossier[], merge = true): { added: number; updated: number } {
  const current = merge ? readAll() : [];
  let added = 0, updated = 0;
  const now = new Date().toISOString();
  dossiers.forEach(d => {
    if (!d.id || !d.nom || !d.data) return;
    const idx = current.findIndex(c => c.id === d.id);
    if (idx >= 0) { current[idx] = { ...d, updatedAt: now }; updated++; }
    else          { current.push({ ...d, createdAt: now, updatedAt: now }); added++; }
  });
  writeAll(current);
  return { added, updated };
}

// ── Marquer un dossier comme synchronisé (stocke syncedAt) ───────────────────
export function markSynced(id: string, syncedAt: string): void {
  const all = readAll();
  const idx = all.findIndex(d => d.id === id);
  if (idx >= 0) { (all[idx] as Dossier & { syncedAt?: string }).syncedAt = syncedAt; writeAll(all); }
}

export function importDossierJson(file: File): Promise<Dossier> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const obj = JSON.parse(e.target?.result as string) as Dossier;
        // Re-assign id and timestamps to avoid collision
        const now = new Date().toISOString();
        const imported: Dossier = { ...obj, id: genId(), createdAt: now, updatedAt: now };
        const all = readAll();
        all.push(imported);
        writeAll(all);
        resolve(imported);
      } catch {
        reject(new Error("Fichier JSON invalide"));
      }
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsText(file);
  });
}
