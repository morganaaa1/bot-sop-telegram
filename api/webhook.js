const bot = require('../bot');

// Entry point Webhook Vercel (CommonJS export)
module.exports = async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
      if (!res.headersSent) {
        res.status(200).send('OK');
      }
    } else {
      res.status(200).json({
        status: 'active',
        service: 'Telegram Bot SOP Webhook Endpoint',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error in Webhook:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Server Error' });
    }
  }
};
