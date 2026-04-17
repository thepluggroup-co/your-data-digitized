/**
 * routes/ai/chat.js
 * Route : POST /api/ai/chat
 *
 * Body : { message: string, context?: object, history?: Array }
 * Réponse : { reply: string, history: Array }
 */

const express = require("express");
const { sendMessage } = require("../../lib/ai/assistant");
const { addMessage, buildMessages } = require("../../lib/ai/conversation");

const router = express.Router();

/**
 * POST /api/ai/chat
 * Lance un échange avec l'assistant IA.
 */
router.post("/chat", async (req, res) => {
  const { message, context = {}, history = [] } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Le champ 'message' est requis et ne peut pas être vide." });
  }

  try {
    // Construire l'historique enrichi avec le contexte
    const messagesForApi = buildMessages(history, context);

    // Appel à Claude — l'historique est passé directement, le système prompt reste dans assistant.js
    const reply = await sendMessage(message.trim(), context, messagesForApi);

    // Mettre à jour l'historique côté client
    let updatedHistory = addMessage(history, "user", message.trim());
    updatedHistory = addMessage(updatedHistory, "assistant", reply);

    res.json({ reply, history: updatedHistory });
  } catch (err) {
    console.error("[POST /api/ai/chat] Erreur :", err.message ?? err);
    res.status(500).json({ error: "Erreur interne lors de la génération de la réponse IA." });
  }
});

module.exports = router;
