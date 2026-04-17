/**
 * dossier-cloud.ts
 * Synchronisation cloud des dossiers via le serveur Express (port 3001).
 * Le proxy Vite (/api → localhost:3001) est utilisé automatiquement.
 */

import type { Dossier } from "./dossier-storage";

const BASE = "/api/dossiers";

export type CloudStatus = "synced" | "local-only" | "cloud-only" | "conflict";

export interface CloudMeta {
  id: string;
  nom: string;
  client?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Liste metadata cloud ───────────────────────────────────────────────────────
export async function listCloud(): Promise<CloudMeta[]> {
  const r = await req<{ dossiers: CloudMeta[] }>("/");
  return r.dossiers;
}

// ── Récupère un dossier complet depuis le cloud ───────────────────────────────
export async function fetchFromCloud(id: string): Promise<Dossier> {
  const r = await req<{ dossier: Dossier }>(`/${id}`);
  return r.dossier;
}

// ── Pousse un dossier vers le cloud ───────────────────────────────────────────
export async function pushToCloud(dossier: Dossier): Promise<Dossier & { syncedAt: string }> {
  const r = await req<{ dossier: Dossier & { syncedAt: string } }>("/", {
    method: "POST",
    body: JSON.stringify({ dossier }),
  });
  return r.dossier;
}

// ── Supprime un dossier du cloud ──────────────────────────────────────────────
export async function deleteFromCloud(id: string): Promise<void> {
  await req(`/${id}`, { method: "DELETE" });
}

// ── Export bundle cloud (téléchargement direct) ───────────────────────────────
export function downloadCloudBackup(): void {
  const a = document.createElement("a");
  a.href = `${BASE}/export`;
  a.download = "";
  a.click();
}

// ── Import bundle vers le cloud ───────────────────────────────────────────────
export async function importBundleToCloud(
  dossiers: Dossier[],
  merge = true,
): Promise<{ added: number; updated: number; total: number }> {
  return req<{ added: number; updated: number; total: number }>("/import", {
    method: "POST",
    body: JSON.stringify({ dossiers, merge }),
  });
}

// ── Vérifie si le serveur cloud est disponible ────────────────────────────────
export async function checkCloudAvailable(): Promise<boolean> {
  try {
    await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

// ── Calcule le statut de sync d'un dossier local vs cloud ────────────────────
export function getSyncStatus(
  local: Dossier,
  cloudMeta: CloudMeta | undefined,
): CloudStatus {
  if (!cloudMeta)                                          return "local-only";
  if (local.updatedAt > (cloudMeta.syncedAt ?? ""))        return "conflict";
  return "synced";
}
