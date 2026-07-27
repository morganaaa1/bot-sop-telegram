const { Markup } = require('telegraf');
const stateManager = require('../middlewares/state');
const supabase = require('../config/supabase');
const { startHandler } = require('./start');

const addSopCommand = async (ctx) => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('Akses ditolak. Fitur ini khusus Admin.');
  }

  stateManager.setState(ctx.from.id, { step: 'SELECTING_CATEGORY' });

  // Tampilkan inline keyboard untuk pilih kategori + tombol batal
  await ctx.reply(
    'Silakan pilih <b>Kategori SOP</b> terlebih dahulu:',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📊 SQL', 'select_cat_SQL'), Markup.button.callback('🐧 Linux', 'select_cat_Linux')],
        [Markup.button.callback('📱 App', 'select_cat_App'), Markup.button.callback('⚙️ General', 'select_cat_General')],
        [Markup.button.callback('❌ Batal', 'cancel_action')]
      ])
    }
  );
};

const selectCategoryHandler = async (ctx) => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('Akses ditolak.');
  }

  const category = ctx.callbackQuery.data.replace('select_cat_', '');
  const chatId = ctx.from.id;

  // Simpan kategori yang dipilih ke state dan lanjut ke step pipeline input
  stateManager.setState(chatId, { step: 'ADD_SOP_PIPELINE', category });

  await ctx.answerCbQuery(`Kategori: ${category}`);
  await ctx.editMessageText(
    `Kategori terpilih: <b>${category}</b>\n\n` +
    `Silakan kirimkan pesan SOP Anda menggunakan format pipeline (dipisahkan karakter <code>|</code>):\n\n` +
    `<code>Judul | Deskripsi | Command/Query</code>\n\n` +
    `<i>Deskripsi dan Command/Query bersifat opsional.</i>\n\n` +
    `<b>Contoh Lengkap:</b>\n` +
    `<code>Restart Nginx | Untuk restart service web server | sudo systemctl restart nginx</code>\n\n` +
    `<b>Contoh Tanpa Deskripsi:</b>\n` +
    `<code>Cek Database | | SELECT * FROM users;</code>\n\n` +
    `Atau tekan tombol <b>Batal</b> di bawah untuk menghentikan.`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_action')]])
    }
  );
};

const handleAdminInput = async (ctx, next) => {
  const chatId = ctx.from.id;
  const state = stateManager.getState(chatId);

  // Jika bukan alur penambahan SOP pipeline, teruskan ke middleware/handler lain
  if (!state || state.step !== 'ADD_SOP_PIPELINE') {
    return next();
  }

  // Jika user membatalkan lewat command /cancel
  if (ctx.message.text === '/cancel') {
    stateManager.clearState(chatId);
    return ctx.reply('❌ Penambahan SOP dibatalkan.', Markup.inlineKeyboard([[Markup.button.callback('🏠 Kembali ke Menu Utama', 'action_home')]]));
  }

  try {
    const rawText = ctx.message.text;
    const parts = rawText.split('|');

    const title = parts[0]?.trim();

    if (!title) {
      return ctx.reply('⚠️ Judul SOP wajib diisi!\nFormat: Judul | Deskripsi | Command/Query', Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_action')]]));
    }

    const description = parts[1] ? parts[1].trim() : '-';
    // Jika ada bagian ke-3 dan seterusnya, gabungkan kembali dengan | (bila kodenya sendiri mengandung |)
    const code_content = parts.length > 2 ? parts.slice(2).join('|').trim() : '';

    const category = state.category || 'General';

    const { error } = await supabase.from('sops').insert([{
      title,
      category,
      description: description || '-',
      code_content: code_content || '',
      created_by: ctx.from.id
    }]);

    stateManager.clearState(chatId);

    if (error) throw error;

    await ctx.reply(
      `✅ <b>SOP berhasil disimpan!</b>\n\n` +
      `<b>Judul:</b> ${title}\n` +
      `<b>Kategori:</b> ${category}\n` +
      `<b>Deskripsi:</b> ${description || '-'}\n` +
      `<b>Code/Query:</b> ${code_content ? 'Tersimpan' : 'Kosong'}`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Kembali ke Menu Utama', 'action_home')]])
      }
    );
  } catch (err) {
    console.error(err);
    stateManager.clearState(chatId);
    await ctx.reply('Terjadi kesalahan saat menyimpan SOP. Silakan coba lagi nanti.');
  }
};

const cancelActionHandler = async (ctx) => {
  const chatId = ctx.from.id;
  stateManager.clearState(chatId);

  // Langsung kembalikan pesan yang ada ke Menu Utama (startHandler) tanpa pesan baru
  return startHandler(ctx);
};

const deleteSopHandler = async (ctx) => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('Akses ditolak.').catch(() => {});
  }

  const callbackData = ctx.callbackQuery.data;
  const sopId = callbackData.replace('del_sop_', '');

  try {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('SOP berhasil dihapus.').catch(() => {});
    }

    const { error } = await supabase.from('sops').delete().eq('id', sopId);
    if (error) throw error;

    await ctx.editMessageText('SOP berhasil dihapus.', Markup.inlineKeyboard([[Markup.button.callback('Kembali ke Daftar', 'list_page_0')]]));
  } catch (err) {
    if (err.description && err.description.includes('message is not modified')) {
      return;
    }
    console.error(err);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('Gagal menghapus SOP.').catch(() => {});
    }
  }
};

module.exports = { addSopCommand, selectCategoryHandler, handleAdminInput, cancelActionHandler, deleteSopHandler };
