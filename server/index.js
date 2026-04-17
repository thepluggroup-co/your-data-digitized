/**
 * server/index.js
 * THE PLUG FINANCE CO — Serveur Express IA
 *
 * Démarrage :
 *   cd server && npm install && node index.js
 *   (ou : npm run dev  pour le mode watch)
 *
 * Le frontend Vite (port 8080) proxy toutes les requêtes /api/* vers ce serveur (port 3001).
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware globaux ────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging middleware pour /api/ai/* ─────────────────────────────────────────
app.use("/api/ai", (req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[AI] ${ts} ${req.method} ${req.originalUrl}`);
  next();
});

// ── CORS (pour le dev Vite) ───────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Routes IA (Phases 1–4) ────────────────────────────────────────────────────
const chatRoutes      = require("./routes/ai/chat");
const analyzeRoutes   = require("./routes/ai/analyze");
const reportRoutes    = require("./routes/ai/reports");
const alertsRoutes    = require("./routes/ai/alerts");
const configRoutes    = require("./routes/ai/config");
const dossierRoutes   = require("./routes/dossiers");

app.use("/api/ai",       chatRoutes);
app.use("/api/ai",       analyzeRoutes);
app.use("/api/ai",       reportRoutes);
app.use("/api/ai",       alertsRoutes);
app.use("/api/ai/config", configRoutes);
app.use("/api/dossiers", dossierRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/ai/health", (_req, res) => {
  res.json({
    status: "ok",
    modules: ["chat", "analyzer", "reports", "alerts"],
    version: "1.0.0",
    model: require("./lib/ai/client").DEFAULT_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 pour routes /api/* inconnues ─────────────────────────────────────────
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
});

// ── Gestionnaire d'erreurs global ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[server] Erreur non gérée :", err.message ?? err);

  // Erreur multer (fichier trop grand, type invalide, etc.)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Fichier trop volumineux (max 20 Mo)." });
  }

  res.status(500).json({ error: err.message ?? "Erreur interne du serveur." });
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────────────────┐`);
  console.log(`│  THE PLUG FINANCE CO — Serveur IA                    │`);
  console.log(`│  http://localhost:${PORT}/api/ai/health               │`);
  console.log(`│  Modèle : ${require("./lib/ai/client").DEFAULT_MODEL.padEnd(30)}│`);
  console.log(`└─────────────────────────────────────────────────────┘\n`);

  // Initialiser le scheduler (analyse quotidienne à 07h00)
  // Passer ici une fonction qui retourne tes dossiers depuis la base de données
  // Exemple : require('./lib/ai/scheduler').initScheduler(() => getDossiersFromDB());
  // Pour l'instant, le scheduler est inactif (aucune source de données connectée).
  console.log("[scheduler] En attente de la configuration de la source de données.");
});

module.exports = app; // Pour les tests
