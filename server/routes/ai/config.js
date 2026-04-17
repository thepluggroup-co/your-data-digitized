/**
 * routes/ai/config.js
 * THE PLUG FINANCE CO — Configuration de l'intégration Claude IA
 *
 * GET  /api/ai/config        — statut connexion, clé masquée, modèle
 * POST /api/ai/config/key    — mettre à jour la clé API dans .env
 * POST /api/ai/config/test   — tester la connexion Claude
 * POST /api/ai/config/install — installer les dépendances serveur
 */

const express    = require("express");
const router     = express.Router();
const fs         = require("fs");
const path       = require("path");
const { execSync } = require("child_process");

const ENV_FILE = path.join(__dirname, "../../.env");

// ── Helpers ───────────────────────────────────────────────────────────────────

function readEnvFile() {
  try { return fs.readFileSync(ENV_FILE, "utf8"); }
  catch { return ""; }
}

function writeEnvValue(key, value) {
  let content = readEnvFile();
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trim() + `\n${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_FILE, content, "utf8");
}

function maskKey(key) {
  if (!key || key.length < 20) return null;
  return key.slice(0, 14) + "•".repeat(24) + key.slice(-6);
}

function getClientModule() {
  // On évite le cache require pour récupérer le module à jour
  return require("../../lib/ai/client");
}

// ── GET /api/ai/config ────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const { DEFAULT_MODEL, TOKEN_LIMITS } = getClientModule();
  const key    = process.env.ANTHROPIC_API_KEY || "";
  const hasKey = key.length > 20 && key.startsWith("sk-ant-");

  res.json({
    hasKey,
    maskedKey:    hasKey ? maskKey(key) : null,
    keyPrefix:    hasKey ? key.slice(0, 14) + "…" : null,
    model:        DEFAULT_MODEL,
    tokenLimits:  TOKEN_LIMITS,
    nodeVersion:  process.version,
    serverVersion:"1.0.0",
    envFile:      fs.existsSync(ENV_FILE) ? "présent" : "absent",
  });
});

// ── POST /api/ai/config/test — tester la connexion ───────────────────────────
router.post("/test", async (req, res) => {
  const { getClient, DEFAULT_MODEL } = getClientModule();
  const key = process.env.ANTHROPIC_API_KEY || "";
  if (!key || key.length < 20) {
    return res.status(400).json({ error: "Aucune clé API configurée." });
  }
  try {
    const start = Date.now();
    const msg = await getClient().messages.create({
      model:      DEFAULT_MODEL,
      max_tokens: 10,
      messages:   [{ role: "user", content: 'Réponds juste "OK".' }],
    });
    res.json({
      success:    true,
      latencyMs:  Date.now() - start,
      model:      DEFAULT_MODEL,
      response:   msg.content?.[0]?.text ?? "",
    });
  } catch (err) {
    res.status(502).json({ error: err.message ?? "Connexion échouée." });
  }
});

// ── POST /api/ai/config/key — sauvegarder une nouvelle clé ───────────────────
router.post("/key", (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string") {
    return res.status(400).json({ error: "Champ 'apiKey' requis." });
  }
  const trimmed = apiKey.trim();
  if (trimmed.length < 40 || !trimmed.startsWith("sk-ant-")) {
    return res.status(400).json({ error: "Clé invalide — doit commencer par 'sk-ant-' (40+ caractères)." });
  }
  try {
    writeEnvValue("ANTHROPIC_API_KEY", trimmed);
    getClientModule().reloadApiKey(trimmed);
    console.log("[config] Clé API mise à jour et client rechargé.");
    res.json({ success: true, maskedKey: maskKey(trimmed) });
  } catch (err) {
    res.status(500).json({ error: err.message ?? "Erreur d'écriture .env." });
  }
});

// ── POST /api/ai/config/install — installer les dépendances serveur ──────────
router.post("/install", (req, res) => {
  const serverDir = path.join(__dirname, "../..");
  try {
    console.log("[config] Installation des dépendances serveur…");
    const output = execSync("npm install --no-fund --no-audit", {
      cwd: serverDir,
      timeout: 120_000,
      encoding: "utf8",
    });
    console.log("[config] npm install terminé.");
    res.json({ success: true, output: output.slice(0, 2000) });
  } catch (err) {
    res.status(500).json({
      error:  err.message ?? "Erreur lors de npm install.",
      stderr: err.stderr?.slice(0, 1000) ?? "",
    });
  }
});

module.exports = router;
