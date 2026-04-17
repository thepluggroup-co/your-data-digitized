/**
 * routes/ai/analyze.js
 * Route : POST /api/ai/analyze-document
 *
 * Accepte multipart/form-data avec champ "file" (PDF, Excel, CSV).
 * Réponse : { success: true, analysis: { summary, keyRatios, alerts, extractedData } }
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const { analyzePDF, analyzeExcel } = require("../../lib/ai/document-analyzer");
const { fileToBase64, detectFileType, readExcelAsText, removeFileSync, ensureUploadsDir } = require("../../lib/ai/file-utils");

const router = express.Router();

// Dossier temporaire pour les uploads
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
ensureUploadsDir(UPLOADS_DIR);

// Configuration multer — stockage disque, limite 20 Mo
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté : ${ext}. Formats acceptés : ${allowed.join(", ")}`));
    }
  },
});

/**
 * POST /api/ai/analyze-document
 * Analyse un fichier financier uploadé et retourne les données extraites.
 */
router.post("/analyze-document", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Aucun fichier fourni. Champ attendu : 'file'." });
  }

  const { path: filePath, originalname } = req.file;
  const fileType = detectFileType(originalname);

  try {
    let analysis;

    if (fileType === "pdf") {
      const base64 = fileToBase64(filePath);
      analysis = await analyzePDF(base64, originalname);
    } else if (fileType === "excel") {
      const textContent = readExcelAsText(filePath);
      analysis = await analyzeExcel(textContent, originalname);
    } else {
      removeFileSync(filePath);
      return res.status(400).json({
        success: false,
        error: `Type de fichier non analysable : "${originalname}". Formats supportés : PDF, Excel (.xlsx/.xls), CSV.`,
      });
    }

    res.json({ success: true, fileName: originalname, fileType, analysis });
  } catch (err) {
    console.error("[POST /api/ai/analyze-document] Erreur :", err.message ?? err);
    res.status(500).json({ success: false, error: err.message ?? "Erreur interne lors de l'analyse." });
  } finally {
    // Supprimer le fichier temporaire dans tous les cas
    removeFileSync(filePath);
  }
});

module.exports = router;
