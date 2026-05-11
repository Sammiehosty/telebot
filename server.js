const express = require('express');
const mysql = require('mysql2/promise');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const webpush = require('web-push');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- 1. CRITICAL MIDDLEWARE ---
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging for cPanel
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- 2. UPLOADS DIRECTORY ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- 3. DATABASE CONNECTION ---
const dbConfig = {
  host: 'localhost',
  user: 'sammarle_fundsbot', 
  password: 'sammarle_fundsbot', 
  database: 'sammarle_fundsbot',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000
};
const db = mysql.createPool(dbConfig);

// --- 4. PUSH NOTIFICATION SETUP ---
const vapidKeys = {
  publicKey: 'BC8Y-D6E_fVz_W3O3ITBm_Xvv6rE1E_Br9o615R',
  privateKey: 'YOUR_PRIVATE_KEY_HERE' 
};
try {
  webpush.setVapidDetails('mailto:admin@fundstube.sammiehost.com', vapidKeys.publicKey, vapidKeys.privateKey);
} catch (e) { console.error('Push Init Error'); }

const sendWebPush = async (payload) => {
  try {
    const [subs] = await db.query('SELECT * FROM push_subscriptions');
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth }}, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 410) await db.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
      }
    }
  } catch (err) { console.error('Web Push Error:', err.message); }
};

// --- 5. BOT ENGINE ---
let bot;
const initBot = async () => {
  try {
    const [rows] = await db.query('SELECT bot_token, welcome_message, success_message, no_message, channel_link, success_link, admin_telegram_id FROM bot_config WHERE id = 1');
    const conf = rows[0];
    const token = conf?.bot_token || '8418339543:AAEtlWmjk7qFeyp3kdu-8xpqX4yrilCfueA';

    if (token && token.includes(':')) {
      if (bot) try { bot.stop(); } catch (e) {}
      bot = new Telegraf(token);

      const sendAdminNotify = async (text) => {
        try {
          const [idRows] = await db.query('SELECT admin_telegram_id FROM bot_config WHERE id = 1');
          const adminId = idRows[0]?.admin_telegram_id;
          if (adminId) await bot.telegram.sendMessage(adminId, `🔔 <b>ADMIN:</b>\n${text}`, { parse_mode: 'HTML' });
        } catch (e) {}
      };

      bot.start(async (ctx) => {
        const { id, first_name, username } = ctx.from;
        await db.query('INSERT INTO subscribers (telegram_id, first_name, username) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status="active"', [id, first_name, username]);
        sendAdminNotify(`User ${first_name} (@${username || id}) started the bot.`);
        sendWebPush({ title: 'New Subscriber', body: `${first_name} joined.`, url: '/subscribers' });
        ctx.reply(conf?.welcome_message || 'Are you ready?', {
          reply_markup: { inline_keyboard: [[{ text: 'Yes', callback_data: 'answer_yes' }, { text: 'No', callback_data: 'answer_no' }]] }
        });
      });

      bot.action('answer_yes', async (ctx) => {
        const [rows] = await db.query('SELECT success_message, success_link FROM bot_config WHERE id = 1');
        const conf = rows[0];
        const text = conf?.success_message || 'Goto www.youtube.com and get started';
        const link = conf?.success_link || 'https://www.youtube.com';
        
        await ctx.answerCbQuery();
        await ctx.reply(text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 Visit Site', url: link }]
            ]
          }
        });
        sendAdminNotify(`${ctx.from.first_name} clicked YES.`);
      });

      bot.action('answer_no', async (ctx) => {
        const [c] = await db.query('SELECT no_message, channel_link FROM bot_config WHERE id = 1');
        await ctx.answerCbQuery();
        await ctx.reply(c[0]?.no_message || 'OK', {
          reply_markup: { inline_keyboard: [[{ text: 'Join Group', url: c[0]?.channel_link || 'https://t.me' }]] }
        });
        sendAdminNotify(`${ctx.from.first_name} clicked NO.`);
      });

      bot.on('text', async (ctx) => {
        if (ctx.message.text.startsWith('/')) return;
        const { id, first_name } = ctx.from;
        await db.query('INSERT INTO messages (telegram_id, direction, message_text) VALUES (?, "inbound", ?)', [id, ctx.message.text]);
        sendAdminNotify(`New Message: ${ctx.message.text}`);
        sendWebPush({ title: 'Support Incoming', body: `${first_name}: ${ctx.message.text}`, url: '/inbox' });
      });

      bot.launch();
      await db.query('UPDATE bot_config SET status = "online" WHERE id = 1');
      console.log('✅ Bot Active');
    }
  } catch (err) { console.error('Bot Init Error:', err.message); }
};

// --- 6. API ROUTES ---
const router = express.Router();

// Root/Status (Must be top of router)
router.get('/status', (req, res) => res.json({ status: 'Online', message: 'TeleBot API Ready', time: new Date() }));

// Auth
router.post('/login', async (req, res) => {
  const { password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM app_users WHERE username = "admin"');
    if (users.length === 0) {
      if (password === 'admin123') return res.json({ success: true, user: { username: 'admin' } });
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }
    const user = users[0];
    const dbPass = user.password_hash || user.password;
    if (password === dbPass) return res.json({ success: true, user });
    res.status(401).json({ success: false });
  } catch (e) { password === 'admin123' ? res.json({success:true}) : res.status(500).json({ error: e.message }); }
});

// Config
router.get('/config', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM bot_config WHERE id = 1');
  res.json(rows[0] || {});
});

router.post('/config', async (req, res) => {
  const d = req.body;
  try {
    await db.query(`
      INSERT INTO bot_config 
      (id, bot_token, bot_name, welcome_message, success_message, no_message, channel_link, success_link, admin_telegram_id, status) 
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 'offline') 
      ON DUPLICATE KEY UPDATE 
      bot_token=VALUES(bot_token), bot_name=VALUES(bot_name), welcome_message=VALUES(welcome_message), 
      success_message=VALUES(success_message), no_message=VALUES(no_message), channel_link=VALUES(channel_link), 
      success_link=VALUES(success_link), admin_telegram_id=VALUES(admin_telegram_id)
    `, [d.bot_token, d.bot_name, d.welcome_message, d.success_message, d.no_message, d.channel_link, d.success_link, d.admin_telegram_id]);
    initBot();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Subscribers
router.get('/subscribers', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM subscribers ORDER BY joined_at DESC');
  res.json(rows);
});

router.put('/subscribers/:id', async (req, res) => {
  await db.query('UPDATE subscribers SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

// Broadcast
router.post('/broadcast', upload.single('media'), async (req, res) => {
  const { message } = req.body;
  if (!bot) return res.status(503).json({ error: 'Bot offline' });
  try {
    const [subs] = await db.query('SELECT telegram_id FROM subscribers WHERE status = "active"');
    let count = 0;
    for (const sub of subs) {
      try {
        if (req.file) {
          if (req.file.mimetype.startsWith('image')) await bot.telegram.sendPhoto(sub.telegram_id, { source: fs.createReadStream(req.file.path) }, { caption: message });
          else await bot.telegram.sendVideo(sub.telegram_id, { source: fs.createReadStream(req.file.path) }, { caption: message });
        } else await bot.telegram.sendMessage(sub.telegram_id, message);
        count++;
      } catch (e) {}
    }
    await db.query('INSERT INTO broadcast_history (message_text, media_url, media_type, target_count) VALUES (?, ?, ?, ?)', [message || '', req.file ? `/uploads/${req.file.filename}`:null, req.file ? (req.file.mimetype.startsWith('image')?'image':'video'):null, count]);
    res.json({ success: true, count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/broadcast/history', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM broadcast_history ORDER BY created_at DESC');
  res.json(rows);
});

router.delete('/broadcast/:id', async (req, res) => {
  await db.query('DELETE FROM broadcast_history WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Conversations (Unified Logic)
router.get('/conversations', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.telegram_id, s.first_name, s.username, m.message_text, m.created_at, m.direction, m.is_read
      FROM subscribers s
      LEFT JOIN messages m ON s.telegram_id = m.telegram_id AND m.id = (SELECT MAX(id) FROM messages WHERE telegram_id = s.telegram_id)
      ORDER BY COALESCE(m.created_at, s.joined_at) DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/messages/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM messages WHERE telegram_id = ? ORDER BY created_at ASC', [req.params.id]);
  await db.query('UPDATE messages SET is_read = TRUE WHERE telegram_id = ? AND direction = "inbound"', [req.params.id]);
  res.json(rows);
});

router.post('/messages/reply', upload.single('media'), async (req, res) => {
  try {
    const { telegram_id, message_text } = req.body;
    if (req.file) {
      if (req.file.mimetype.startsWith('image')) await bot.telegram.sendPhoto(telegram_id, { source: fs.createReadStream(req.file.path) }, { caption: message_text });
      else await bot.telegram.sendVideo(telegram_id, { source: fs.createReadStream(req.file.path) }, { caption: message_text });
    } else await bot.telegram.sendMessage(telegram_id, message_text);
    await db.query('INSERT INTO messages (telegram_id, direction, message_text, media_url, media_type) VALUES (?, "outbound", ?, ?, ?)', [telegram_id, message_text || '', req.file ? `/uploads/${req.file.filename}`:null, req.file ? (req.file.mimetype.startsWith('image')?'image':'video'):null]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/sync/telegram', async (req, res) => {
  if (!bot) return res.status(500).json({ error: 'Offline' });
  const updates = await bot.telegram.getUpdates(0, 100);
  let count = 0;
  for (const u of updates) {
    if (u.message?.text && !u.message.text.startsWith('/')) {
      const { from, text, date } = u.message;
      const [existing] = await db.query('SELECT id FROM messages WHERE telegram_id = ? AND message_text = ? AND created_at = FROM_UNIXTIME(?)', [from.id, text, date]);
      if (existing.length === 0) {
        await db.query('INSERT IGNORE INTO subscribers (telegram_id, first_name) VALUES (?, ?)', [from.id, from.first_name]);
        await db.query('INSERT INTO messages (telegram_id, direction, message_text, created_at) VALUES (?, "inbound", ?, FROM_UNIXTIME(?))', [from.id, text, date]);
        count++;
      }
    }
  }
  res.json({ success: true, synced: count });
});

router.post('/push/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;
  await db.query('INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE p256dh=VALUES(p256dh), auth=VALUES(auth)', [endpoint, keys.p256dh, keys.auth]);
  res.json({ success: true });
});

router.put('/admin/password', async (req, res) => {
  await db.query('UPDATE app_users SET password_hash = ? WHERE username = "admin"', [req.body.newPassword]);
  res.json({ success: true });
});

// --- 7. MOUNT ---
app.use('/api', router);
app.use('/', router);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log('API Engine Active'); initBot(); });
