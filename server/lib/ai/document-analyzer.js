/**
 * lib/ai/document-analyzer.js
 * Analyse de documents financiers (PDF, Excel) par IA.
 *
 * Usage :
 *   const { analyzePDF, analyzeExcel } = require('./document-analyzer');
 *
 *   // PDF
 *   const base64 = fileToBase64('./rapport.pdf');
 *   const result = await analyzePDF(base64, 'rapport.pdf');
 *   // → { summary, keyRatios, alerts, extractedData }
 *
 *   // Excel
 *   const text = readExcelAsText('./bilan.xlsx');
 *   const result = await analyzeExcel(text, 'bilan.xlsx');
 */

const { getClient, DEFAULT_MODEL, TOKEN_LIMITS } = require("./client");

/** Prompt système commun pour l'analyse de documents financiers */
const ANALYZE_SYSTEM = `Tu es un analyste financier expert de THE PLUG FINANCE CO, spécialisé dans :
- L'extraction de données financières (bilans, CEP, tableaux de financement)
- Les normes comptables OHADA/SYSCOHADA
- Les ratios bancaires CEMAC/UEMOA

IMPÉRATIF : Réponds UNIQUEMENT en JSON pur, sans markdown, sans backticks, sans texte avant ou après.
Format de sortie exact :
{
  "summary": "résumé exécutif en 3-5 phrases",
  "keyRatios": {
    "ca": null,
    "beneficeNet": null,
    "caf": null,
    "dscr": null,
    "autonomie": null,
    "levier": null,
    "autres": {}
  },
  "alerts": [
    { "type": "critique|majeur|mineur", "message": "description de l'alerte" }
  ],
  "extractedData": {
    "annees": [],
    "bilans": {},
    "resultats": {},
    "ratiosDetectes": {}
  }
}
Si une valeur n'est pas trouvée dans le document, retourne null pour ce champ.`;

/**
 * Analyse un document PDF envoyé en base64.
 * @param {string} base64Data - Contenu PDF encodé en base64
 * @param {string} fileName   - Nom du fichier (pour le contexte)
 * @returns {Promise<{summary, keyRatios, alerts, extractedData}>}
 */
async function analyzePDF(base64Data, fileName) {
  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_LIMITS.analyze,
      system: ANALYZE_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Analyse ce document financier "${fileName}" et extrais toutes les données structurées selon le format JSON demandé.`,
            },
          ],
        },
      ],
    });

    return parseJsonResponse(response.content[0]?.text ?? "{}");
  } catch (err) {
    console.error("[document-analyzer] Erreur PDF :", err.message ?? err);
    throw new Error(`Analyse PDF échouée pour "${fileName}" : ${err.message}`);
  }
}

/**
 * Analyse un document Excel/CSV fourni sous forme de texte.
 * @param {string} textContent - Contenu texte du fichier Excel (CSV multi-feuilles)
 * @param {string} fileName
 * @returns {Promise<{summary, keyRatios, alerts, extractedData}>}
 */
async function analyzeExcel(textContent, fileName) {
  // Tronquer si trop long pour éviter de dépasser le contexte
  const MAX_CHARS = 40000;
  const truncated = textContent.length > MAX_CHARS
    ? textContent.slice(0, MAX_CHARS) + "\n[... contenu tronqué pour respecter la limite de tokens]"
    : textContent;

  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_LIMITS.analyze,
      system: ANALYZE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Analyse ce fichier financier "${fileName}" (contenu tabulaire) et extrais toutes les données selon le format JSON demandé.\n\nCONTENU DU FICHIER :\n${truncated}`,
        },
      ],
    });

    return parseJsonResponse(response.content[0]?.text ?? "{}");
  } catch (err) {
    console.error("[document-analyzer] Erreur Excel :", err.message ?? err);
    throw new Error(`Analyse Excel échouée pour "${fileName}" : ${err.message}`);
  }
}

/**
 * Parse la réponse Claude en JSON, avec fallback en cas d'erreur.
 * @param {string} text
 * @returns {object}
 */
function parseJsonResponse(text) {
  // Nettoyer d'éventuels backticks markdown
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn("[document-analyzer] Réponse non-JSON, wrapping :", cleaned.slice(0, 200));
    return {
      summary: cleaned.slice(0, 500),
      keyRatios: {},
      alerts: [{ type: "mineur", message: "Impossible de parser la réponse en JSON structuré." }],
      extractedData: {},
    };
  }
}

module.exports = { analyzePDF, analyzeExcel };
