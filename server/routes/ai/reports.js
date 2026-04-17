/**
 * routes/ai/reports.js
 * Routes de génération de rapports IA.
 *
 * POST /api/ai/generate-report
 *   Body : { reportType: string, data: object, clientName?: string }
 *   Réponse : { success: true, report: string, filename: string }
 *
 * GET /api/ai/report-types
 *   Réponse : { types: [{ id, label, description }] }
 */

const express = require("express");
const { generateReport } = require("../../lib/ai/report-generator");
const { addReportHeader, generateReportFilename } = require("../../lib/ai/report-formatter");

const router = express.Router();

/** Types de rapports disponibles avec leurs descriptions */
const REPORT_TYPES = [
  {
    id: "situation-client",
    label: "Situation Client",
    description: "Rapport de situation financière complète d'un client / dossier. Inclut ratios, points forts/faibles, recommandations.",
    requiredFields: ["client", "ratios"],
  },
  {
    id: "synthese-bancaire",
    label: "Synthèse Bancaire",
    description: "Note de synthèse pour présentation en comité de crédit bancaire. Verdict de bancabilité, analyse DSCR, risques.",
    requiredFields: ["projet", "financement", "ratios"],
  },
  {
    id: "dashboard-mensuel",
    label: "Dashboard Mensuel",
    description: "Tableau de bord narratif mensuel : faits marquants, alertes, indicateurs clés, actions prioritaires.",
    requiredFields: ["periode"],
  },
];

/**
 * GET /api/ai/report-types
 * Retourne la liste des types de rapports disponibles.
 */
router.get("/report-types", (_req, res) => {
  res.json({ types: REPORT_TYPES });
});

/**
 * POST /api/ai/generate-report
 * Génère un rapport financier IA selon le type et les données fournis.
 */
router.post("/generate-report", async (req, res) => {
  const { reportType, data, clientName = "Client" } = req.body;

  if (!reportType || typeof reportType !== "string") {
    return res.status(400).json({
      success: false,
      error: "Champ 'reportType' manquant. Types disponibles : " +
        REPORT_TYPES.map((t) => t.id).join(", "),
    });
  }

  if (!data || typeof data !== "object") {
    return res.status(400).json({
      success: false,
      error: "Champ 'data' manquant ou invalide. Doit être un objet JSON.",
    });
  }

  const typeConfig = REPORT_TYPES.find((t) => t.id === reportType);
  if (!typeConfig) {
    return res.status(400).json({
      success: false,
      error: `Type "${reportType}" inconnu. Types disponibles : ${REPORT_TYPES.map((t) => t.id).join(", ")}`,
    });
  }

  try {
    // Générer le rapport brut
    const rawReport = await generateReport(reportType, data, { format: "structured", language: "fr" });

    // Ajouter l'en-tête branded
    const fullReport = addReportHeader(rawReport, {
      reportType,
      clientName,
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    });

    const filename = generateReportFilename(reportType, clientName);

    res.json({ success: true, report: fullReport, filename, reportType, clientName });
  } catch (err) {
    console.error("[POST /api/ai/generate-report] Erreur :", err.message ?? err);
    res.status(500).json({ success: false, error: err.message ?? "Erreur interne lors de la génération du rapport." });
  }
});

module.exports = router;
