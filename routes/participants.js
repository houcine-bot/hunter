const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('../middleware/auth');

function validateParticipant(body) {
  const errors = [];
  const { name, facebook_name, facebook_link, points, status, number, equipment } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    errors.push('الاسم غير صحيح');
  }
  if (facebook_name && (typeof facebook_name !== 'string' || facebook_name.length > 100)) {
    errors.push('اسم الفايسبوك غير صحيح');
  }
  if (facebook_link && (typeof facebook_link !== 'string' || facebook_link.length > 300 || !/^https?:\/\//i.test(facebook_link))) {
    errors.push('رابط الفايسبوك خاصو يبدا بـ http:// أو https://');
  }
  if (points !== undefined && (typeof points !== 'number' || !Number.isFinite(points) || points < 0 || points > 1000000)) {
    errors.push('النقاط غير صحيحة');
  }
  if (status && !['naji', 'maqsi'].includes(status)) {
    errors.push('الحالة غير صحيحة');
  }
  if (number !== undefined && number !== null && (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > 1000000)) {
    errors.push('الرقم غير صحيح');
  }
  if (equipment !== undefined && equipment !== null) {
    if (!Array.isArray(equipment) || equipment.length > 50 || equipment.some((e) => typeof e !== 'string' || e.length > 50)) {
      errors.push('العتاد غير صحيح');
    }
  }

  return errors;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM participants ORDER BY points DESC');
    const parsed = rows.map((r) => ({
      ...r,
      equipment: r.equipment ? (typeof r.equipment === 'string' ? JSON.parse(r.equipment) : r.equipment) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const errors = validateParticipant(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const { name, facebook_name, facebook_link, points, status, number, equipment } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO participants (name, facebook_name, facebook_link, points, status, number, equipment) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), facebook_name || '', facebook_link || '', points || 0, status || 'naji', number ?? null, JSON.stringify(equipment || [])]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'معرف غير صحيح' });
  }

  const errors = validateParticipant(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const { name, facebook_name, facebook_link, points, status, number, equipment } = req.body;

  try {
    await db.query(
      'UPDATE participants SET name = ?, facebook_name = ?, facebook_link = ?, points = ?, status = ?, number = ?, equipment = ? WHERE id = ?',
      [name.trim(), facebook_name || '', facebook_link || '', points || 0, status || 'naji', number ?? null, JSON.stringify(equipment || []), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'معرف غير صحيح' });
  }

  try {
    await db.query('DELETE FROM participants WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ فالسيرفر' });
  }
});

module.exports = router;