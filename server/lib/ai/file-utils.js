/**
 * lib/ai/file-utils.js
 * Utilitaires de lecture et conversion de fichiers.
 *
 * Usage :
 *   const { fileToBase64, detectFileType, readExcelAsText } = require('./file-utils');
 */

const fs = require("fs");
const path = require("path");

/**
 * Convertit un fichier en chaîne base64.
 * @param {string} filePath - Chemin absolu du fichier
 * @returns {string} Contenu base64
 */
function fileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

/**
 * Détecte le type de fichier à partir de son nom.
 * @param {string} fileName
 * @returns {'pdf' | 'excel' | 'image' | 'unknown'}
 */
function detectFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if ([".xlsx", ".xls", ".csv"].includes(ext)) return "excel";
  if ([".docx", ".doc"].includes(ext)) return "word";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) return "image";
  return "unknown";
}

/**
 * Extrait le texte d'un fichier Word .docx via mammoth.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function readWordAsText(filePath) {
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "(document Word vide)";
}

/**
 * Lit un fichier Excel/CSV et retourne son contenu sous forme de tableaux Markdown.
 * Chaque feuille est rendue avec en-têtes de colonnes explicites.
 * @param {string} filePath
 * @param {number} maxCharsPerSheet - Limite par feuille (défaut 150 000)
 * @returns {string} Contenu texte multi-feuilles en Markdown
 */
function readExcelAsText(filePath, maxCharsPerSheet = 150_000) {
  const ext = path.extname(filePath).toLowerCase();

  // CSV — lecture directe
  if (ext === ".csv") {
    const raw = fs.readFileSync(filePath, "utf-8");
    const truncated = raw.length > maxCharsPerSheet ? raw.slice(0, maxCharsPerSheet) + "\n[tronqué]" : raw;
    // Convertir CSV en tableau Markdown
    return csvToMarkdown(truncated);
  }

  // Excel — utilise le package xlsx
  try {
    const XLSX = require("xlsx");
    const workbook = XLSX.readFile(filePath, { cellFormula: false, cellHTML: false, raw: false });
    const sheets = workbook.SheetNames;

    const parts = [`CLASSEUR EXCEL — ${sheets.length} feuille(s) : ${sheets.join(" | ")}\n`];

    sheets.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet["!ref"]) {
        parts.push(`=== Feuille : ${sheetName} ===\n(feuille vide)\n`);
        return;
      }

      const range = XLSX.utils.decode_range(sheet["!ref"]);
      const nRows = range.e.r - range.s.r + 1;
      const nCols = range.e.c - range.s.c + 1;

      // Récupérer toutes les lignes comme tableau de tableaux (préserve l'ordre et les en-têtes)
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

      // Supprimer les lignes entièrement vides en fin de tableau
      while (rows.length > 0 && rows[rows.length - 1].every(c => String(c).trim() === "")) rows.pop();

      if (rows.length === 0) {
        parts.push(`=== Feuille : ${sheetName} ===\n(feuille vide)\n`);
        return;
      }

      // Calculer la largeur max de chaque colonne
      const maxCols = Math.max(...rows.map(r => r.length));
      const colWidths = Array(maxCols).fill(0);
      rows.forEach(row => {
        for (let c = 0; c < maxCols; c++) {
          colWidths[c] = Math.max(colWidths[c], String(row[c] ?? "").length);
        }
      });

      // Construire le tableau Markdown
      const mdLines = [];
      rows.forEach((row, ri) => {
        const cells = Array.from({ length: maxCols }, (_, c) => String(row[c] ?? "").trim());
        mdLines.push("| " + cells.join(" | ") + " |");
        // Séparateur après la première ligne (en-têtes)
        if (ri === 0) {
          mdLines.push("|" + cells.map((_, c) => "-".repeat(Math.max(colWidths[c], 3) + 2)).join("|") + "|");
        }
      });

      const header = `=== Feuille : "${sheetName}" (${nRows} lignes × ${nCols} colonnes) ===`;
      const body = mdLines.join("\n");
      const full = `${header}\n${body}`;

      parts.push(full.length > maxCharsPerSheet
        ? full.slice(0, maxCharsPerSheet) + `\n[... feuille tronquée — ${full.length} chars total]`
        : full);
    });

    return parts.join("\n\n");
  } catch (err) {
    console.warn("[file-utils] Erreur lecture Excel :", err.message);
    return fs.readFileSync(filePath).toString("latin1").slice(0, 80_000);
  }
}

/** Convertit un CSV brut en tableau Markdown */
function csvToMarkdown(csv) {
  const lines = csv.split("\n").filter(l => l.trim());
  if (lines.length === 0) return csv;
  const rows = lines.map(l => l.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
  const maxCols = Math.max(...rows.map(r => r.length));
  const mdLines = rows.map((row, ri) => {
    const cells = Array.from({ length: maxCols }, (_, c) => row[c] ?? "");
    const line = "| " + cells.join(" | ") + " |";
    if (ri === 0) return line + "\n|" + Array(maxCols).fill("---").join("|") + "|";
    return line;
  });
  return mdLines.join("\n");
}

/**
 * Supprime un fichier de façon silencieuse (ne lève pas d'erreur si absent).
 * @param {string} filePath
 */
function removeFileSync(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Ignoré
  }
}

/**
 * Crée le dossier uploads/ s'il n'existe pas.
 * @param {string} uploadsDir
 */
function ensureUploadsDir(uploadsDir) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

module.exports = { fileToBase64, detectFileType, readExcelAsText, readWordAsText, removeFileSync, ensureUploadsDir };
