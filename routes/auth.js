const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كثيرة، حاول بعد قليل' }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const match = await bcrypt.compare(password, rows[0].password);

    if (!match) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'خطأ فالسيرفر' });
      }
      req.session.adminId = rows[0].id;
      req.session.username = rows[0].username;
      res.json({ success: true });
    });
  }  catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get('/check', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.adminId) });
});

module.exports = router;
