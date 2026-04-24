/**
 * lib/ai/client.js
 * Initialisation du client Anthropic — THE PLUG FINANCE CO
 *
 * Usage :
 *   const { getClient, DEFAULT_MODEL, TOKEN_LIMITS } = require('./client');
 *   const msg = await getClient().messages.create({ ... });
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const Anthropic = require("@anthropic-ai/sdk");

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "[AI] ANTHROPIC_API_KEY manquante dans server/.env — les appels IA seront refusés."
  );
}

/** Singleton mutable — remplacé lors d'un rechargement de clé */
let _client = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

/** Rétrocompatibilité : certains modules importent directement `anthropic` */
let anthropic = _client;

/**
 * Recharge le client Anthropic avec une nouvelle clé API.
 * Appelé depuis la route /api/ai/config/key après écriture dans .env
 */
function reloadApiKey(newKey) {
  process.env.ANTHROPIC_API_KEY = newKey;
  _client = new Anthropic.default({ apiKey: newKey });
  anthropic = _client;
  console.log("[AI] Client Anthropic rechargé avec la nouvelle clé API.");
}

/** Toujours retourne le client courant (après rechargement éventuel) */
function getClient() {
  return _client;
}

/** Modèle par défaut — claude-sonnet-4-6 (le plus récent et capable) */
const DEFAULT_MODEL = "claude-sonnet-4-6";

/** Limites max tokens par usage */
const TOKEN_LIMITS = {
  chat:    4096,
  scoring: 1500,
  report:  4096,
  analyze: 4096,
};

module.exports = { anthropic, getClient, reloadApiKey, DEFAULT_MODEL, TOKEN_LIMITS };
