const { Markup } = require('telegraf');
const supabase = require('../config/supabase');
const { formatSopDetail } = require('../utils/formatter');

const ITEMS_PER_PAGE = 5;

const listSopHandler = async (ctx) => {
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery().catch(() => {});
    }

    // Ambil page dari callback data (contoh: list_page_0)
    const callbackData = ctx.callbackQuery.data;
    const page = parseInt(callbackData.split('_')[2]) || 0;
    
    // Hitung offset
    const offset = page * ITEMS_PER_PAGE;

    // Fetch data dari Supabase
    const { data: sops, error, count } = await supabase
      .from('sops')
      .select('id, title, category', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) throw error;

    if (!sops || sops.length === 0) {
      return ctx.editMessageText('Belum ada SOP yang tersimpan.', 
        Markup.inlineKeyboard([[Markup.button.callback('🔙 Kembali ke Awal', 'action_home')]])
      );
    }

    let text = `<b>Daftar SOP (Halaman ${page + 1}):</b>\n\n`;
    const buttons = sops.map(sop => {
      return [Markup.button.callback(`📖 ${sop.title}`, `view_sop_${sop.id}`)];
    });

    // Navigasi prev/next
    const navButtons = [];
    if (page > 0) {
      navButtons.push(Markup.button.callback('⬅️ Prev', `list_page_${page - 1}`));
    }
    if (offset + ITEMS_PER_PAGE < count) {
      navButtons.push(Markup.button.callback('Next ➡️', `list_page_${page + 1}`));
    }
    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }

    buttons.push([Markup.button.callback('🔙 Kembali ke Awal', 'action_home')]);

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    });

  } catch (err) {
    if (err.description && err.description.includes('message is not modified')) {
      return; // Abaikan error jika pesan/tombol yang diedit persis sama
    }
    console.error(err);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('Terjadi kesalahan saat mengambil daftar SOP.').catch(() => {});
    }
  }
};

const viewSopHandler = async (ctx) => {
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery().catch(() => {});
    }

    const callbackData = ctx.callbackQuery.data;
    const sopId = callbackData.replace('view_sop_', '');

    const { data: sop, error } = await supabase
      .from('sops')
      .select('*')
      .eq('id', sopId)
      .single();

    if (error) throw error;

    if (!sop) {
      return ctx.answerCbQuery('SOP tidak ditemukan.').catch(() => {});
    }

    const htmlContent = formatSopDetail(sop);

    const buttons = [];
    if (ctx.state.isAdmin) {
      buttons.push([
        Markup.button.callback('✏️ Edit', `edit_sop_${sopId}`),
        Markup.button.callback('🗑️ Hapus', `del_sop_${sopId}`)
      ]);
    }
    buttons.push([Markup.button.callback('🔙 Kembali ke Daftar', 'list_page_0')]);

    await ctx.editMessageText(htmlContent, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    });
  } catch (err) {
    if (err.description && err.description.includes('message is not modified')) {
      return; // Abaikan error jika konten persis sama
    }
    console.error(err);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('Terjadi kesalahan saat memuat SOP.').catch(() => {});
    }
  }
};

module.exports = { listSopHandler, viewSopHandler };
