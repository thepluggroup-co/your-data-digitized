/**
 * lib/ai/alerts-engine.js
 * Moteur d'alertes quotidiennes — analyse du portefeuille de dossiers.
 *
 * Usage :
 *   const { runDailyAnalysis, checkEcheances, buildAlertsSummary } = require('./alerts-engine');
 *
 *   const alerts = await runDailyAnalysis(allDossiers);
 *   const echeancesAlerts = checkEcheances(dossiers, 30);
 *   const summary = buildAlertsSummary([...alerts, ...echeancesAlerts]);
 */

const { scoreDossier } = require("./risk-analyzer");

/**
 * Lance l'analyse quotidienne de tous les dossiers.
 * Identifie les dossiers à risque et génère des alertes triées par sévérité.
 *
 * @param {Array} allDossiers - Tableau de dossiers { id, nom, client, ratios, ... }
 * @returns {Promise<Array<{ dossierId, clientName, type, message, severity, action, score }>>}
 */
async function runDailyAnalysis(allDossiers) {
  if (!Array.isArray(allDossiers) || allDossiers.length === 0) {
    return [];
  }

  const alerts = [];

  // Analyser chaque dossier en parallèle (max 5 simultanés pour respecter les rate limits)
  const BATCH_SIZE = 5;
  for (let i = 0; i < allDossiers.length; i += BATCH_SIZE) {
    const batch = allDossiers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((dossier) => analyzeSingleDossier(dossier))
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        alerts.push(...result.value);
      } else {
        console.error(
          `[alerts-engine] Erreur dossier ${batch[idx]?.id ?? idx} :`,
          result.reason?.message ?? result.reason
        );
        alerts.push({
          dossierId: batch[idx]?.id ?? `unknown-${idx}`,
          clientName: batch[idx]?.client ?? "Inconnu",
          type: "analyse_echouee",
          message: `Analyse impossible : ${result.reason?.message ?? "erreur inconnue"}`,
          severity: "mineur",
          action: "Vérifier les données du dossier",
          score: null,
        });
      }
    });
  }

  // Trier : critique → majeur → mineur
  const severityOrder = { critique: 0, majeur: 1, moyen: 2, faible: 3, mineur: 4 };
  return alerts.sort(
    (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
  );
}

/**
 * Analyse un seul dossier et retourne ses alertes.
 * @param {object} dossier
 * @returns {Promise<Array>}
 */
async function analyzeSingleDossier(dossier) {
  const alerts = [];
  const result = await scoreDossier(dossier);

  if (result.error) {
    return [{
      dossierId: dossier.id,
      clientName: dossier.client ?? dossier.nom,
      type: "erreur_scoring",
      message: result.error,
      severity: "mineur",
      action: "Vérifier les données",
      score: null,
    }];
  }

  const { score, niveau, recommandations = [] } = result;

  // Alerte selon le niveau de risque
  if (niveau === "élevé" || score < 40) {
    alerts.push({
      dossierId: dossier.id,
      clientName: dossier.client ?? dossier.nom,
      type: "risque_eleve",
      message: `Score de bancabilité critique : ${score}/100 (${niveau}). ${recommandations[0] ?? "Action urgente requise."}`,
      severity: "critique",
      action: recommandations[0] ?? "Réviser le dossier en urgence",
      score,
    });
  } else if (niveau === "moyen" || score < 70) {
    alerts.push({
      dossierId: dossier.id,
      clientName: dossier.client ?? dossier.nom,
      type: "risque_moyen",
      message: `Score de bancabilité à surveiller : ${score}/100. ${recommandations[0] ?? ""}`,
      severity: "majeur",
      action: recommandations[0] ?? "Revue du dossier recommandée",
      score,
    });
  }

  return alerts;
}

/**
 * Identifie les dossiers avec des échéances dans les N prochains jours.
 * @param {Array}  dossiers   - Dossiers avec champ `echeances: [{ date, montant, type }]`
 * @param {number} daysAhead  - Horizon en jours (défaut : 30)
 * @returns {Array<{ dossierId, clientName, type, message, severity, action, echeance }>}
 */
function checkEcheances(dossiers, daysAhead = 30) {
  const now = new Date();
  const limit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const alerts = [];

  dossiers.forEach((dossier) => {
    const echeances = dossier.echeances ?? [];
    echeances.forEach((ech) => {
      const echDate = new Date(ech.date);
      if (echDate >= now && echDate <= limit) {
        const daysLeft = Math.ceil((echDate - now) / (1000 * 60 * 60 * 24));
        const montantFormate = ech.montant
          ? new Intl.NumberFormat("fr-FR").format(ech.montant) + " FCFA"
          : "montant inconnu";

        alerts.push({
          dossierId: dossier.id,
          clientName: dossier.client ?? dossier.nom,
          type: "echeance_proche",
          message: `Échéance dans ${daysLeft} jour(s) — ${ech.type ?? "remboursement"} : ${montantFormate}`,
          severity: daysLeft <= 7 ? "critique" : daysLeft <= 15 ? "majeur" : "mineur",
          action: `Préparer le décaissement avant le ${echDate.toLocaleDateString("fr-FR")}`,
          echeance: { date: ech.date, montant: ech.montant, type: ech.type, daysLeft },
        });
      }
    });
  });

  return alerts.sort((a, b) => (a.echeance?.daysLeft ?? 999) - (b.echeance?.daysLeft ?? 999));
}

/**
 * Construit un résumé texte lisible des alertes du jour.
 * @param {Array} alerts
 * @returns {string}
 */
function buildAlertsSummary(alerts) {
  if (alerts.length === 0) {
    return "✅ Aucune alerte active — tous les dossiers sont dans les normes.";
  }

  const critiques = alerts.filter((a) => a.severity === "critique");
  const majeurs   = alerts.filter((a) => a.severity === "majeur");
  const mineurs   = alerts.filter((a) => ["mineur", "faible"].includes(a.severity));

  const lines = [
    `📊 RAPPORT D'ALERTES THE PLUG FINANCE CO — ${new Date().toLocaleDateString("fr-FR")}`,
    `${"─".repeat(50)}`,
    `Total : ${alerts.length} alerte(s) | 🔴 ${critiques.length} critiques | 🟡 ${majeurs.length} majeures | 🔵 ${mineurs.length} mineures`,
    "",
  ];

  if (critiques.length > 0) {
    lines.push("🔴 ALERTES CRITIQUES :");
    critiques.forEach((a) => lines.push(`  • [${a.clientName}] ${a.message}`));
    lines.push("");
  }
  if (majeurs.length > 0) {
    lines.push("🟡 ALERTES MAJEURES :");
    majeurs.forEach((a) => lines.push(`  • [${a.clientName}] ${a.message}`));
    lines.push("");
  }
  if (mineurs.length > 0) {
    lines.push("🔵 POINTS D'ATTENTION :");
    mineurs.forEach((a) => lines.push(`  • [${a.clientName}] ${a.message}`));
  }

  return lines.join("\n");
}

module.exports = { runDailyAnalysis, checkEcheances, buildAlertsSummary };
