/**
 * lib/ai/scheduler.js
 * Planificateur de tâches IA — analyse quotidienne automatique.
 *
 * Si node-cron est disponible : tâche cron tous les jours à 07h00.
 * Sinon : export d'une fonction manuelle triggerDailyAnalysis().
 *
 * Usage :
 *   const { initScheduler, triggerDailyAnalysis } = require('./scheduler');
 *   initScheduler(getDossiers); // getDossiers() → Promise<Array>
 */

const { runDailyAnalysis, checkEcheances, buildAlertsSummary } = require("./alerts-engine");

let _getDossiers = null; // Injecté par initScheduler

/**
 * Déclenche manuellement l'analyse quotidienne.
 * @returns {Promise<{ alerts: Array, summary: string, timestamp: string }>}
 */
async function triggerDailyAnalysis() {
  if (!_getDossiers) {
    console.warn("[scheduler] Aucune source de dossiers configurée. Appeler initScheduler(fn) d'abord.");
    return { alerts: [], summary: "Aucune source de dossiers configurée.", timestamp: new Date().toISOString() };
  }

  console.log("[scheduler] Démarrage de l'analyse quotidienne…");
  const startTime = Date.now();

  try {
    const dossiers = await Promise.resolve(_getDossiers());
    const [riskAlerts, echeanceAlerts] = await Promise.all([
      runDailyAnalysis(dossiers),
      Promise.resolve(checkEcheances(dossiers, 30)),
    ]);

    const allAlerts = [...riskAlerts, ...echeanceAlerts];
    const summary = buildAlertsSummary(allAlerts);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[scheduler] Analyse terminée en ${elapsed}s — ${allAlerts.length} alerte(s).`);
    console.log(summary);

    return {
      alerts: allAlerts,
      summary,
      timestamp: new Date().toISOString(),
      dossierCount: dossiers.length,
      elapsed: `${elapsed}s`,
    };
  } catch (err) {
    console.error("[scheduler] Erreur lors de l'analyse :", err.message ?? err);
    return {
      alerts: [],
      summary: `Erreur lors de l'analyse : ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Initialise le planificateur.
 * @param {Function} getDossiers - Fonction synchrone ou async retournant le tableau de dossiers
 */
function initScheduler(getDossiers) {
  _getDossiers = getDossiers;

  // Tenter d'utiliser node-cron si disponible
  try {
    const cron = require("node-cron");

    // Analyse quotidienne à 07h00 (heure serveur)
    cron.schedule("0 7 * * *", async () => {
      console.log("[scheduler] Tâche cron déclenchée — 07:00");
      await triggerDailyAnalysis();
    });

    console.log("[scheduler] ✅ Cron initialisé — analyse quotidienne à 07h00");
  } catch {
    console.log("[scheduler] node-cron indisponible — utiliser triggerDailyAnalysis() manuellement.");
  }
}

module.exports = { initScheduler, triggerDailyAnalysis };
