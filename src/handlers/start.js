const { Markup } = require('telegraf');

const startHandler = async (ctx) => {
  const role = ctx.state.isAdmin ? '(Admin)' : '(User)';
  let welcomeMsg = `Halo ${ctx.from.first_name}! ${role}\nSelamat datang di Bot SOP L2 Application Support.\n\nSilakan gunakan menu di bawah ini untuk mencari atau melihat daftar SOP/Query/Command.`;

  if (ctx.state.isAdmin) {
    welcomeMsg += `\n\n<i>(Sebagai admin, Anda juga bisa menggunakan perintah /add untuk menambah SOP baru)</i>`;
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔍 Cari SOP', 'action_search')],
    [Markup.button.callback('📜 List SOP', 'list_page_0')]
  ]);

  try {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(welcomeMsg, {
        parse_mode: 'HTML',
        ...keyboard
      });
    } else {
      await ctx.reply(welcomeMsg, {
        parse_mode: 'HTML',
        ...keyboard
      });
    }
  } catch (err) {
    // Jika pesan tidak bisa di-edit (misal kontennya persis sama), kirim sebagai pesan baru
    await ctx.reply(welcomeMsg, {
      parse_mode: 'HTML',
      ...keyboard
    });
  }
};

module.exports = { startHandler };
