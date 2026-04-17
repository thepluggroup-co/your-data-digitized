/**
 * src/lib/ai-service.ts
 * Couche d'abstraction pour tous les appels au backend IA (Express port 3001).
 * Le proxy Vite (/api → localhost:3001) est automatiquement utilisé.
 */

const BASE = "/api/ai";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ChatMessage { role: "user" | "assistant"; content: string; }

export interface ChatResponse {
  reply: string;
  history: ChatMessage[];
}

export interface AnalysisResult {
  summary: string;
  keyRatios: Record<string, unknown>;
  alerts: { type: string; message: string }[];
  extractedData: Record<string, unknown>;
}

export interface ReportResponse {
  success: boolean;
  report: string;
  filename: string;
  reportType: string;
  clientName: string;
}

export interface ScoreResult {
  score: number;
  niveau: "faible" | "moyen" | "élevé";
  details: string[];
  recommandations: string[];
}

export interface AlertItem {
  dossierId: string;
  clientName: string;
  type: string;
  message: string;
  severity: "critique" | "majeur" | "mineur" | "faible";
  action: string;
  score?: number;
}

export interface DailyAlertsResponse {
  success: boolean;
  alerts: AlertItem[];
  summary: string;
  counts: { total: number; critique: number; majeur: number; mineur: number };
  timestamp: string;
}

// ── Helper interne ────────────────────────────────────────────────────────────
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Phase 1 — Chat ────────────────────────────────────────────────────────────
/**
 * Envoie un message à l'assistant IA financier.
 * @param message    Question de l'utilisateur
 * @param context    Données financières du projet (ComputedModel, params, etc.)
 * @param history    Historique de conversation
 */
export async function sendChat(
  message: string,
  context: Record<string, unknown> = {},
  history: ChatMessage[] = [],
): Promise<ChatResponse> {
  return post<ChatResponse>("/chat", { message, context, history });
}

// ── Phase 2 — Analyse document ────────────────────────────────────────────────
/**
 * Analyse un fichier PDF ou Excel par IA.
 * @param file  Fichier sélectionné via <input type="file">
 */
export async function analyzeDocument(file: File): Promise<{
  success: boolean;
  fileName: string;
  fileType: string;
  analysis: AnalysisResult;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/analyze-document`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return res.json();
}

// ── Phase 3 — Génération de rapport ──────────────────────────────────────────
/**
 * Génère un rapport financier narratif.
 * @param reportType   'situation-client' | 'synthese-bancaire' | 'dashboard-mensuel'
 * @param data         Données métier
 * @param clientName   Nom du client (pour l'en-tête et le filename)
 */
export async function generateReport(
  reportType: "situation-client" | "synthese-bancaire" | "dashboard-mensuel",
  data: Record<string, unknown>,
  clientName = "Client",
): Promise<ReportResponse> {
  return post<ReportResponse>("/generate-report", { reportType, data, clientName });
}

/**
 * Retourne les types de rapports disponibles.
 */
export async function getReportTypes(): Promise<{
  types: { id: string; label: string; description: string }[];
}> {
  const res = await fetch(`${BASE}/report-types`);
  return res.json();
}

// ── Phase 4 — Scoring & Alertes ───────────────────────────────────────────────
/**
 * Score un dossier de financement (0-100).
 */
export async function scoreDossier(dossierData: Record<string, unknown>): Promise<ScoreResult> {
  return post<ScoreResult>("/score-dossier", { dossierData });
}

/**
 * Analyse quotidienne d'un portefeuille de dossiers.
 */
export async function getDailyAlerts(
  dossiers: Record<string, unknown>[],
  daysAhead = 30,
): Promise<DailyAlertsResponse> {
  return post<DailyAlertsResponse>("/daily-alerts", { dossiers, daysAhead });
}

/**
 * Génère des recommandations actionnables pour un dossier.
 */
export async function getRecommendations(
  dossierData: Record<string, unknown>,
  context: Record<string, unknown> = {},
): Promise<{ recommandations: { priorite: number; titre: string; detail: string; impact: string; delai: string }[] }> {
  return post("/recommendations", { dossierData, context });
}

// ── Health check ──────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<{
  status: string; modules: string[]; version: string; model: string;
}> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
