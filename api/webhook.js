const bot = require('../bot');

// File ini menjadi entry point webhook untuk Vercel
// Vercel Serverless Function format (Req, Res)
export default async function handler(req, res) {
  try {
    // Telegraf menyediakan fitur handleUpdate untuk memproses raw body dari Webhook Telegram
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
      if (!res.headersSent) {
        res.status(200).send('OK');
      }
    } else {
      res.status(200).send('Bot SOP Webhook Endpoint is active.');
    }
  } catch (err) {
    console.error('Error in Webhook:', err);
    res.status(500).send('Error');
  }
}
