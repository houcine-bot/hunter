const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [naji] = await db.query("SELECT COUNT(*) AS c FROM participants WHERE status = 'naji'");
    const [maqsi] = await db.query("SELECT COUNT(*) AS c FROM participants WHERE status = 'maqsi'");
    const [ranking] = await db.query('SELECT name, facebook_name, points, status FROM participants ORDER BY points DESC');
    const [stage] = await db.query('SELECT current_stage FROM settings WHERE id = 1');
    res.json({
      naji: naji[0].c,
      maqsi: maqsi[0].c,
      ranking,
      stage: stage.length ? stage[0].current_stage : ''
    });
  } catch (err) {
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

router.put('/stage', requireAuth, async (req, res) => {
  const { stage } = req.body;

  if (typeof stage !== 'string' || stage.length === 0 || stage.length > 100) {
    return res.status(400).json({ error: 'المرحلة غير صحيحة' });
  }

  try {
    await db.query(
      'INSERT INTO settings (id, current_stage) VALUES (1, ?) ON DUPLICATE KEY UPDATE current_stage = VALUES(current_stage)',
      [stage.trim()]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

module.exports = router;