/**
 * routes/ai/alerts.js
 * Routes d'alertes et de scoring IA.
 *
 * POST /api/ai/score-dossier      → Score un dossier
 * POST /api/ai/detect-anomalies   → Détecte anomalies cashflow
 * GET  /api/ai/daily-alerts       → Déclenche l'analyse quotidienne
 * POST /api/ai/recommendations    → Recommandations pour un dossier
 */

const express = require("express");
const { scoreDossier, detectAnomalies, generateRecommendations } = require("../../lib/ai/risk-analyzer");
const { runDailyAnalysis, checkEcheances, buildAlertsSummary } = require("../../lib/ai/alerts-engine");
const { triggerDailyAnalysis } = require("../../lib/ai/scheduler");

const router = express.Router();

/**
 * POST /api/ai/score-dossier
 * Calcule le score de bancabilité d'un dossier (0-100).
 */
router.post("/score-dossier", async (req, res) => {
  const { dossierData } = req.body;
  if (!dossierData || typeof dossierData !== "object") {
    return res.status(400).json({ error: "Champ 'dossierData' manquant ou invalide." });
  }

  try {
    const result = await scoreDossier(dossierData);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[POST /api/ai/score-dossier] Erreur :", err.message ?? err);
    res.status(500).json({ error: err.message ?? "Erreur interne lors du scoring." });
  }
});

/**
 * POST /api/ai/detect-anomalies
 * Analyse des flux de trésorerie pour détecter les anomalies.
 */
router.post("/detect-anomalies", async (req, res) => {
  const { cashflowData } = req.body;
  if (!cashflowData || typeof cashflowData !== "object") {
    return res.status(400).json({ error: "Champ 'cashflowData' manquant ou invalide." });
  }

  try {
    const result = await detectAnomalies(cashflowData);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[POST /api/ai/detect-anomalies] Erreur :", err.message ?? err);
    res.status(500).json({ error: err.message ?? "Erreur interne lors de la détection d'anomalies." });
  }
});

/**
 * GET /api/ai/daily-alerts
 * Déclenche l'analyse quotidienne complète du portefeuille.
 * Accepte un body optionnel : { dossiers: Array } (sinon utilise le scheduler)
 */
router.get("/daily-alerts", async (req, res) => {
  try {
    // Si des dossiers sont fournis dans la query (via body d'un GET étendu ou param)
    // En pratique : appel sans body pour déclencher le scheduler
    const result = await triggerDailyAnalysis();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[GET /api/ai/daily-alerts] Erreur :", err.message ?? err);
    res.status(500).json({ error: err.message ?? "Erreur lors de l'analyse quotidienne." });
  }
});

/**
 * POST /api/ai/daily-alerts
 * Variante POST pour fournir les dossiers directement dans le body.
 */
router.post("/daily-alerts", async (req, res) => {
  const { dossiers = [], daysAhead = 30 } = req.body;
  if (!Array.isArray(dossiers)) {
    return res.status(400).json({ error: "'dossiers' doit être un tableau." });
  }

  try {
    const [riskAlerts, echeanceAlerts] = await Promise.all([
      runDailyAnalysis(dossiers),
      Promise.resolve(checkEcheances(dossiers, daysAhead)),
    ]);

    const allAlerts = [...riskAlerts, ...echeanceAlerts];
    const summary = buildAlertsSummary(allAlerts);

    res.json({
      success: true,
      alerts: allAlerts,
      summary,
      counts: {
        total: allAlerts.length,
        critique: allAlerts.filter((a) => a.severity === "critique").length,
        majeur: allAlerts.filter((a) => a.severity === "majeur").length,
        mineur: allAlerts.filter((a) => ["mineur", "faible"].includes(a.severity)).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/ai/daily-alerts] Erreur :", err.message ?? err);
    res.status(500).json({ error: err.message ?? "Erreur lors de l'analyse." });
  }
});

/**
 * POST /api/ai/recommendations
 * Génère des recommandations actionnables pour un dossier.
 */
router.post("/recommendations", async (req, res) => {
  const { dossierData, context = {} } = req.body;
  if (!dossierData || typeof dossierData !== "object") {
    return res.status(400).json({ error: "Champ 'dossierData' manquant ou invalide." });
  }

  try {
    const result = await generateRecommendations(dossierData, context);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[POST /api/ai/recommendations] Erreur :", err.message ?? err);
    res.status(500).json({ error: err.message ?? "Erreur lors de la génération des recommandations." });
  }
});

module.exports = router;
