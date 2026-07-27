const supabase = require('../config/supabase');

/**
 * Middleware untuk mengecek user di database.
 * Jika belum ada, otomatis register sebagai 'user'.
 * Memasukkan role ke dalam `ctx.state.role`.
 */
const authMiddleware = async (ctx, next) => {
  try {
    const chat_id = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'unknown';

    // Cek apakah user ada di DB
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('chat_id', chat_id)
      .single();

    if (error && error.code === 'PGRST116') { // PGRST116: JSON object requested, multiple (or no) rows returned
      // User belum terdaftar, mari daftarkan
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ chat_id, username, role: 'user' }])
        .select()
        .single();
      
      if (!insertError) {
        user = newUser;
      }
    }

    if (user) {
      ctx.state.user = user;
      ctx.state.role = user.role;
      ctx.state.isAdmin = user.role === 'admin';
    } else {
      ctx.state.user = { chat_id, username, role: 'user' };
      ctx.state.role = 'user';
      ctx.state.isAdmin = false;
    }

    return next();
  } catch (err) {
    console.error('Error in auth middleware:', err);
    // Tetap lanjutkan meski error DB agar bot tidak crash
    ctx.state.isAdmin = false;
    return next();
  }
};

module.exports = authMiddleware;
