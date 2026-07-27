require('dotenv').config();
const { Telegraf } = require('telegraf');
const authMiddleware = require('./src/middlewares/auth');

// Handlers
const { startHandler } = require('./src/handlers/start');
const { listSopHandler, viewSopHandler } = require('./src/handlers/sops');
const { searchActionHandler, handleSearchInput } = require('./src/handlers/search');
const { addSopCommand, selectCategoryHandler, handleAdminInput, cancelActionHandler, deleteSopHandler } = require('./src/handlers/admin');

if (!process.env.BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing. Please set it in .env');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Global Middleware
bot.use(authMiddleware);

// Commands
bot.start(startHandler);
bot.command('add', addSopCommand);

// Actions (Inline Keyboard Callbacks)
bot.action('action_home', startHandler);
bot.action('action_search', searchActionHandler);
bot.action('cancel_action', cancelActionHandler);
bot.action(/^list_page_\d+$/, listSopHandler);
bot.action(/^view_sop_.+$/, viewSopHandler);
bot.action(/^del_sop_.+$/, deleteSopHandler);
bot.action(/^select_cat_.+$/, selectCategoryHandler);

// Text Message Handlers (For Conversational States)
// Urutan penting: Admin Input -> Search Input (Middleware akan mengecek state, jika bukan untuknya akan di `next()`)
bot.on('text', handleAdminInput, handleSearchInput);

// Eksekusi Bot (hanya jika dijalankan langsung via node bot.js / npm start, bukan saat di-import oleh Webhook Vercel)
if (require.main === module) {
  bot.launch().then(() => {
    console.log('Bot is running in Polling mode...');
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = bot; // Diexport untuk keperluan webhook nantinya (opsional)
