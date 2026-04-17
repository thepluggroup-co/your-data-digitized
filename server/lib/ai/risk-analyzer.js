/**
 * lib/ai/risk-analyzer.js
 * Scoring de risque et détection d'anomalies par IA — THE PLUG FINANCE CO
 *
 * Usage :
 *   const { scoreDossier, detectAnomalies, generateRecommendations } = require('./risk-analyzer');
 *
 *   // Exemple dossierData :
 *   {
 *     id: "d001",
 *     nom: "BP KENENERGIE 2027",
 *     client: "KENGOUM NGASSA",
 *     montantDemande: 5000000000,
 *     ratios: {
 *       dscr: [2.85, 3.2, 3.8, 4.1, 4.5],
 *       autonomie: [0.28, 0.32, 0.38, 0.44, 0.52],
 *       levier: [4.1, 3.2, 2.5, 1.8, 0.5],
 *       icr: [3.5, 4.2, 5.1, 6.3, 8.1],
 *       margeEbe: [22, 25, 28, 31, 34]
 *     },
 *     resultats: { beneficeN: 280000000, beneficeN4: 1200000000 },
 *     echeances: [{ date: "2027-12-31", montant: 400000000 }]
 *   }
 *
 *   // Exemple cashflowData :
 *   {
 *     mois: ["Jan", "Fév", "Mar", "Avr"],
 *     encaissements: [100000000, 120000000, 80000000, 200000000],
 *     decaissements: [90000000, 115000000, 150000000, 85000000],
 *     soldes: [10000000, 5000000, -70000000, 115000000]
 *   }
 */

const { getClient, DEFAULT_MODEL, TOKEN_LIMITS } = require("./client");

const RISK_SYSTEM = `Tu es l'analyste de risques de THE PLUG FINANCE CO, expert en:
- Scoring de dossiers de financement (normes OHADA/CEMAC)
- Détection d'anomalies dans les flux de trésorerie
- Génération de recommandations actionnables

IMPÉRATIF : Réponds UNIQUEMENT en JSON pur, sans markdown, sans backticks, sans texte en dehors du JSON.`;

/**
 * Score un dossier de financement sur 100 et identifie les risques.
 * @param {object} dossierData
 * @returns {Promise<{ score: number, niveau: string, details: string[], recommandations: string[] }>}
 */
async function scoreDossier(dossierData) {
  const prompt = `Score ce dossier de financement de 0 à 100 selon les normes bancaires OHADA/CEMAC.

DOSSIER :
${JSON.stringify(dossierData, null, 2)}

Critères de scoring (pondération) :
- DSCR ≥ 1,3× : 25 points (≥ 1,0× : 12 pts, < 1,0× : 0 pt)
- Autonomie ≥ 25% : 20 points (≥ 15% : 10 pts, < 15% : 0 pt)
- Marge EBE ≥ 20% : 20 points (≥ 10% : 10 pts, < 10% : 0 pt)
- Résultat net positif toutes années : 15 points
- FRN positif toutes années : 10 points
- TIR > 15% : 10 points

Retourne ce JSON exact (aucun autre texte) :
{
  "score": <entier 0-100>,
  "niveau": "faible|moyen|élevé",
  "details": ["explication point par point"],
  "recommandations": ["recommandation actionnable 1", "recommandation actionnable 2"]
}`;

  return callJsonApi(prompt, TOKEN_LIMITS.scoring, "scoreDossier");
}

/**
 * Détecte les anomalies dans des données de flux de trésorerie.
 * @param {object} cashflowData
 * @returns {Promise<{ anomalies: Array<{ type, description, severity }> }>}
 */
async function detectAnomalies(cashflowData) {
  const prompt = `Analyse ces données de flux de trésorerie et détecte toutes les anomalies.

DONNÉES :
${JSON.stringify(cashflowData, null, 2)}

Cherche : soldes négatifs, volatilité excessive (>50% d'une période à l'autre), tendances décroissantes, décaissements anormaux.

Retourne ce JSON exact (aucun autre texte) :
{
  "anomalies": [
    {
      "type": "solde_negatif|volatilite|tendance_negative|decaissement_anormal|autre",
      "description": "description précise de l'anomalie",
      "severity": "critique|majeur|mineur",
      "periodes": ["périodes affectées"],
      "valeurs": {}
    }
  ]
}
Si aucune anomalie : retourner { "anomalies": [] }`;

  return callJsonApi(prompt, TOKEN_LIMITS.scoring, "detectAnomalies");
}

/**
 * Génère des recommandations actionnables pour améliorer un dossier.
 * @param {object} dossierData
 * @param {object} context     - Contexte additionnel (marché, contraintes, etc.)
 * @returns {Promise<Array<{ priorite, titre, detail, impact, delai }>>}
 */
async function generateRecommendations(dossierData, context = {}) {
  const prompt = `Génère des recommandations actionnables pour améliorer ce dossier de financement.

DOSSIER :
${JSON.stringify(dossierData, null, 2)}

CONTEXTE :
${JSON.stringify(context, null, 2)}

Retourne ce JSON exact (aucun autre texte) :
{
  "recommandations": [
    {
      "priorite": 1,
      "titre": "titre court",
      "detail": "explication détaillée avec chiffres",
      "impact": "impact attendu sur les ratios",
      "delai": "immédiat|court_terme|moyen_terme",
      "categorie": "structure_capital|endettement|exploitation|fiscalite|autre"
    }
  ]
}
Trie par priorité décroissante. Maximum 6 recommandations.`;

  return callJsonApi(prompt, TOKEN_LIMITS.scoring, "generateRecommendations");
}

/**
 * Appel générique à Claude avec parsing JSON et fallback.
 */
async function callJsonApi(prompt, maxTokens, fnName) {
  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system: RISK_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text ?? "{}";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      console.warn(`[risk-analyzer/${fnName}] Réponse non-JSON :`, cleaned.slice(0, 200));
      return { error: "Réponse non structurée", raw: cleaned.slice(0, 500) };
    }
  } catch (err) {
    console.error(`[risk-analyzer/${fnName}] Erreur Anthropic :`, err.message ?? err);
    throw new Error(`${fnName} échoué : ${err.message}`);
  }
}

module.exports = { scoreDossier, detectAnomalies, generateRecommendations };
