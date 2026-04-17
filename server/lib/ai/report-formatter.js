/**
 * lib/ai/report-formatter.js
 * Utilitaires de mise en forme des rapports générés.
 *
 * Usage :
 *   const { markdownToPlainText, generateReportFilename, addReportHeader } = require('./report-formatter');
 */

/**
 * Convertit du Markdown en texte brut lisible.
 * @param {string} markdown
 * @returns {string}
 */
function markdownToPlainText(markdown) {
  return markdown
    .replace(/#{1,6}\s+(.*)/g, "\n$1\n" + "=".repeat(40))   // Titres → soulignés
    .replace(/\*\*(.*?)\*\*/g, "$1")                          // Bold → texte
    .replace(/\*(.*?)\*/g, "$1")                              // Italic → texte
    .replace(/`([^`]+)`/g, "$1")                              // Code inline → texte
    .replace(/^```[\s\S]*?```$/gm, "")                        // Blocs code → supprimés
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")                  // Liens → texte du lien
    .replace(/^\s*[-*+]\s+/gm, "• ")                          // Listes → bullets
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ")        // Listes numérotées
    .replace(/\|.*\|/g, (row) =>                              // Tableaux → espacement
      row.replace(/\|/g, "  ").trim()
    )
    .replace(/^-{3,}$/gm, "─".repeat(40))                     // Séparateurs
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Génère un nom de fichier horodaté pour un rapport.
 * @param {'situation-client'|'synthese-bancaire'|'dashboard-mensuel'|string} reportType
 * @param {string} clientName
 * @returns {string} ex: "2026-04-13_situation-client_KENENERGIE.md"
 */
function generateReportFilename(reportType, clientName = "client") {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Supprimer les accents
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .substring(0, 30)
    .toUpperCase();
  const safeType = reportType.replace(/[^a-zA-Z0-9_\-]/g, "-");
  return `${date}_${safeType}_${safeName}.md`;
}

/**
 * Ajoute un en-tête branded THE PLUG FINANCE CO au rapport.
 * @param {string} content  - Corps du rapport (Markdown)
 * @param {object} metadata - { reportType, clientName, author, date }
 * @returns {string} Rapport avec en-tête
 */
function addReportHeader(content, metadata = {}) {
  const {
    reportType = "Rapport Financier",
    clientName = "—",
    author = "THE PLUG FINANCE CO — Système IA",
    date = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    }),
  } = metadata;

  const reportLabels = {
    "situation-client":  "Rapport de Situation Client",
    "synthese-bancaire": "Note de Synthèse Bancaire",
    "dashboard-mensuel": "Tableau de Bord Mensuel",
  };

  const label = reportLabels[reportType] ?? reportType;

  const header = `---
# THE PLUG FINANCE CO
## KENENERGIE SARL — ${label}

| Champ       | Valeur                              |
|-------------|-------------------------------------|
| Client      | ${clientName}                       |
| Type        | ${label}                            |
| Date        | ${date}                             |
| Généré par  | ${author}                           |
| Référentiel | SYSCOHADA Révisé 2017 / CEMAC       |

---

`;

  return header + content;
}

module.exports = { markdownToPlainText, generateReportFilename, addReportHeader };
