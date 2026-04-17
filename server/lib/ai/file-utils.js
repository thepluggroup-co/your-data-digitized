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
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) return "image";
  return "unknown";
}

/**
 * Lit un fichier Excel/CSV et retourne son contenu sous forme de texte tabulaire.
 * Utilise xlsx si disponible, sinon fs.readFile pour les CSV.
 * @param {string} filePath
 * @returns {string} Contenu texte
 */
function readExcelAsText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // CSV — lecture directe
  if (ext === ".csv") {
    return fs.readFileSync(filePath, "utf-8");
  }

  // Excel — utilise le package xlsx
  try {
    const XLSX = require("xlsx");
    const workbook = XLSX.readFile(filePath);
    const result = [];

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        result.push(`=== Feuille : ${sheetName} ===\n${csv}`);
      }
    });

    return result.join("\n\n") || "(fichier Excel vide)";
  } catch (err) {
    console.warn("[file-utils] xlsx indisponible, lecture brute :", err.message);
    // Fallback : lecture brute du fichier
    return fs.readFileSync(filePath).toString("utf-8", 0, 50000);
  }
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

module.exports = { fileToBase64, detectFileType, readExcelAsText, removeFileSync, ensureUploadsDir };
