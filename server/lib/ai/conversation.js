/**
 * lib/ai/conversation.js
 * Gestion de l'historique de conversation pour l'assistant IA.
 *
 * Usage :
 *   const { addMessage, buildMessages, truncateHistory } = require('./conversation');
 *
 *   let history = [];
 *   history = addMessage(history, 'user', 'Quel est le DSCR ?');
 *   history = addMessage(history, 'assistant', 'Le DSCR moyen est de 2,85×…');
 *   const messages = buildMessages(history, contextData);
 */

const MAX_HISTORY = 20; // nombre max de messages conservés (10 échanges)

/**
 * Ajoute un message à l'historique et retourne le nouveau tableau.
 * @param {Array}  history - Tableau de messages existant
 * @param {'user'|'assistant'} role
 * @param {string} content
 * @returns {Array} Nouvel historique
 */
function addMessage(history, role, content) {
  if (!["user", "assistant"].includes(role)) {
    throw new Error(`Rôle invalide : ${role}. Attendu : 'user' | 'assistant'`);
  }
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Le contenu du message ne peut pas être vide.");
  }
  return [...history, { role, content: content.trim() }];
}

/**
 * Tronque l'historique aux MAX_HISTORY derniers messages.
 * Conserve toujours un nombre pair (user/assistant) pour éviter les séquences invalides.
 * @param {Array} history
 * @returns {Array}
 */
function truncateHistory(history) {
  if (history.length <= MAX_HISTORY) return history;
  // Garder les derniers MAX_HISTORY messages, mais commencer par un message 'user'
  const truncated = history.slice(-MAX_HISTORY);
  // S'assurer que le premier message est de role 'user'
  const firstUserIdx = truncated.findIndex((m) => m.role === "user");
  return firstUserIdx > 0 ? truncated.slice(firstUserIdx) : truncated;
}

/**
 * Construit le tableau de messages formaté pour l'API Anthropic.
 * Le contexte est injecté dans le premier message utilisateur de la session.
 * @param {Array}  history     - Historique de conversation
 * @param {object} contextData - Données financières optionnelles
 * @returns {Array} Messages prêts pour l'API
 */
function buildMessages(history, contextData = {}) {
  const truncated = truncateHistory(history);

  if (truncated.length === 0) return [];

  // Si du contexte est fourni et que c'est le premier tour, on l'injecte
  // silencieusement dans le dernier message utilisateur
  if (Object.keys(contextData).length > 0 && truncated.length >= 1) {
    const lastUserIdx = [...truncated].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx !== -1) {
      const realIdx = truncated.length - 1 - lastUserIdx;
      const enhanced = [...truncated];
      enhanced[realIdx] = {
        ...enhanced[realIdx],
        content:
          enhanced[realIdx].content +
          `\n\n[Contexte données projet : ${JSON.stringify(contextData)}]`,
      };
      return enhanced;
    }
  }

  return truncated;
}

/**
 * Crée un historique vide.
 * @returns {Array}
 */
function createHistory() {
  return [];
}

module.exports = { addMessage, buildMessages, truncateHistory, createHistory, MAX_HISTORY };
