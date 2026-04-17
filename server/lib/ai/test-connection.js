/**
 * lib/ai/test-connection.js
 * Vérifie que la connexion Anthropic fonctionne correctement.
 *
 * Exécution : node server/lib/ai/test-connection.js
 */

const { getClient, DEFAULT_MODEL } = require("./client");

async function testConnection() {
  console.log(`[TEST] Connexion à Anthropic avec le modèle ${DEFAULT_MODEL}…`);

  try {
    const message = await getClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content:
            "Réponds uniquement : 'Connexion THE PLUG FINANCE CO opérationnelle.' — rien d'autre.",
        },
      ],
    });

    const reply = message.content[0]?.text ?? "(réponse vide)";
    console.log("[TEST] ✅ Succès. Réponse :", reply);
    console.log("[TEST] Modèle utilisé :", message.model);
    console.log("[TEST] Tokens consommés :", message.usage);
  } catch (err) {
    console.error("[TEST] ❌ Échec :", err.message ?? err);
    process.exit(1);
  }
}

testConnection();
