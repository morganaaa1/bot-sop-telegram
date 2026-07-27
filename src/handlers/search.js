const { Markup } = require('telegraf');
const stateManager = require('../middlewares/state');
const supabase = require('../config/supabase');

const searchActionHandler = async (ctx) => {
  const chatId = ctx.from.id;
  // Set state bahwa user sedang mencari
  stateManager.setState(chatId, { step: 'SEARCHING' });
  await ctx.editMessageText(
    'Silakan ketik kata kunci judul SOP yang ingin Anda cari:',
    Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_action')]])
  );
};

const handleSearchInput = async (ctx, next) => {
  const chatId = ctx.from.id;
  const state = stateManager.getState(chatId);

  // Jika state bukan searching, abaikan middleware ini, lanjut ke handler berikutnya
  if (!state || state.step !== 'SEARCHING') {
    return next();
  }

  const keyword = ctx.message.text;
  
  // Clear state agar kembali normal
  stateManager.clearState(chatId);

  const { data: sops, error } = await supabase
    .from('sops')
    .select('id, title, category')
    .ilike('title', `%${keyword}%`)
    .limit(10);

  if (error) {
    console.error(error);
    return ctx.reply('Terjadi kesalahan pencarian.');
  }

  if (!sops || sops.length === 0) {
    return ctx.reply(`Tidak ditemukan SOP dengan kata kunci "${keyword}".`, Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Kembali ke Menu Utama', 'action_home')]
    ]));
  }

  let text = `<b>Hasil Pencarian untuk "${keyword}":</b>\n`;
  const buttons = sops.map(sop => {
    return [Markup.button.callback(`📖 ${sop.title}`, `view_sop_${sop.id}`)];
  });

  buttons.push([Markup.button.callback('🏠 Kembali ke Menu Utama', 'action_home')]);

  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard(buttons)
  });
};

module.exports = { searchActionHandler, handleSearchInput };
