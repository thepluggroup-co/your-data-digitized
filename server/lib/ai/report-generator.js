/**
 * lib/ai/report-generator.js
 * Génération de rapports financiers narratifs par IA.
 *
 * Types de rapports :
 *   - 'situation-client'   → Rapport de situation financière client
 *   - 'synthese-bancaire'  → Note de synthèse pour dossier bancaire
 *   - 'dashboard-mensuel'  → Tableau de bord narratif mensuel
 *
 * Usage :
 *   const { generateReport } = require('./report-generator');
 *   const report = await generateReport('situation-client', clientData, { format: 'text', language: 'fr' });
 *
 * Exemples de data payload :
 *
 * // situation-client
 * {
 *   client: { nom: "KENENERGIE SARL", promoteur: "KENGOUM NGASSA", secteur: "Énergie" },
 *   dossier: { nom: "BP 2027-2031", montantDemande: 5000000000 },
 *   ratios: { dscr: 2.85, autonomie: 0.32, tir: 0.3487 },
 *   resultats: { beneficeNetN4: 1200000000, caGlobal: 18000000000 }
 * }
 *
 * // synthese-bancaire
 * {
 *   projet: { nom: "KENENERGIE SARL", secteur: "Infrastructure électrique", pays: "Cameroun" },
 *   financement: { endettementLT: 5000000000, capitalSocial: 410000000 },
 *   ratios: { dscr: [2.85, 3.2, 3.8, 4.1, 4.5], levier: [4.1, 3.2, 2.5, 1.8, 0.5] },
 *   verdict: "BANCABLE", score: 78
 * }
 *
 * // dashboard-mensuel
 * {
 *   periode: "Avril 2026", dossiers: 12, alertesCritiques: 2,
 *   ca: 850000000, benefice: 120000000, nouveauxClients: 3
 * }
 */

const { getClient, DEFAULT_MODEL, TOKEN_LIMITS } = require("./client");

const REPORT_SYSTEM = `Tu es le rédacteur de rapports financiers de THE PLUG FINANCE CO (KENENERGIE SARL).
Tes rapports sont professionnels, précis et destinés à des banquiers ou investisseurs institutionnels CEMAC.
Rédige toujours en français, avec des chiffres en FCFA, et utilise le format Markdown structuré (titres ##, listes, tableaux).`;

/** Templates de prompts par type de rapport */
const REPORT_PROMPTS = {
  "situation-client": (data) => `
Génère un **Rapport de Situation Financière Client** complet pour le dossier suivant.

DONNÉES :
${JSON.stringify(data, null, 2)}

Structure attendue (Markdown) :
## 1. Identification du Client
## 2. Situation Financière Actuelle
## 3. Analyse des Ratios Clés
## 4. Points Forts
## 5. Points d'Attention
## 6. Recommandations
## 7. Conclusion et Avis

Sois précis sur les chiffres. Cite les ratios avec leurs normes OHADA. Longueur : 600-900 mots.`,

  "synthese-bancaire": (data) => `
Génère une **Note de Synthèse Bancaire** pour présentation en comité de crédit.

DONNÉES DU DOSSIER :
${JSON.stringify(data, null, 2)}

Structure attendue (Markdown) :
## SYNTHÈSE BANCAIRE — THE PLUG FINANCE CO
### Présentation du Projet
### Structure de Financement
### Analyse de la Bancabilité
| Critère | Valeur | Norme | Statut |
### DSCR et Capacité de Remboursement
### Risques Identifiés et Mitigants
### Verdict et Recommandation du Comité

Ton : formel, synthétique, orienté décision. Longueur : 500-700 mots.`,

  "dashboard-mensuel": (data) => `
Génère un **Tableau de Bord Mensuel Narratif** pour THE PLUG FINANCE CO.

DONNÉES DE LA PÉRIODE :
${JSON.stringify(data, null, 2)}

Structure attendue (Markdown) :
## Tableau de Bord — ${data.periode ?? "Période"}
### Faits Marquants
### Performance du Portefeuille
### Alertes Actives
### Actions Prioritaires du Mois Prochain
### Indicateurs Clés (tableau)

Ton : exécutif, direct, orienté action. Longueur : 400-600 mots.`,
};

/**
 * Génère un rapport financier selon le type demandé.
 * @param {'situation-client'|'synthese-bancaire'|'dashboard-mensuel'} reportType
 * @param {object} data    - Données métier
 * @param {object} options - { format: 'text'|'structured', language: 'fr' }
 * @returns {Promise<string>} Rapport en Markdown
 */
async function generateReport(reportType, data, options = {}) {
  const promptFn = REPORT_PROMPTS[reportType];
  if (!promptFn) {
    throw new Error(`Type de rapport inconnu : "${reportType}". Disponibles : ${Object.keys(REPORT_PROMPTS).join(", ")}`);
  }

  const userPrompt = promptFn(data);

  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_LIMITS.report,
      system: REPORT_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0]?.text ?? "(rapport vide)";
    return options.format === "text" ? markdownToText(content) : content;
  } catch (err) {
    console.error("[report-generator] Erreur :", err.message ?? err);
    throw new Error(`Génération du rapport "${reportType}" échouée : ${err.message}`);
  }
}

/** Shortcut : rapport de situation client */
async function generateClientSituation(clientData) {
  return generateReport("situation-client", clientData);
}

/** Shortcut : note de synthèse bancaire */
async function generateBankNote(dossierData) {
  return generateReport("synthese-bancaire", dossierData);
}

/** Shortcut : tableau de bord mensuel narratif */
async function generateMonthlyDashboard(periodData) {
  return generateReport("dashboard-mensuel", periodData);
}

/** Conversion Markdown vers texte brut simple */
function markdownToText(md) {
  return md
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\|/g, " ")
    .replace(/[-]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = {
  generateReport,
  generateClientSituation,
  generateBankNote,
  generateMonthlyDashboard,
  REPORT_PROMPTS,
};
