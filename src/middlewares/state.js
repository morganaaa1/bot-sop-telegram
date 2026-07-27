// In-memory state storage (bisa diganti dengan Redis jika butuh skala besar)
const userStates = new Map();

/**
 * Helper state untuk multi-step conversation
 */
const stateManager = {
  setState: (chatId, state) => {
    userStates.set(chatId, state);
  },
  getState: (chatId) => {
    return userStates.get(chatId) || null;
  },
  updateState: (chatId, updates) => {
    const current = userStates.get(chatId) || {};
    userStates.set(chatId, { ...current, ...updates });
  },
  clearState: (chatId) => {
    userStates.delete(chatId);
  }
};

module.exports = stateManager;
