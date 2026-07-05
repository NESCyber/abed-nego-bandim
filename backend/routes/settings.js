// backend/routes/settings.js
// Public: GET site settings
// Admin: UPDATE site settings (e.g. hero image)

const express = require('express');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── Auto-create settings table on first load ──────────────────
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key   VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('⚠️  Could not create settings table:', err.message);
  }
})();

// ─────────────────────────────────────────────────────────────
// PUBLIC — GET /api/settings/:key
// Returns the value for a given setting key
// ─────────────────────────────────────────────────────────────
router.get('/:key', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [req.params.key]
    );
    const value = rows.length > 0 ? rows[0].setting_value : null;
    return res.json({ success: true, key: req.params.key, value });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC — GET /api/settings
// Returns all settings as an object
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN — PUT /api/settings/:key
// Upsert a setting value
// ─────────────────────────────────────────────────────────────
router.put('/:key', authenticate, async (req, res) => {
  const { value } = req.body;
  try {
    await db.query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [req.params.key, value]
    );
    return res.json({ success: true, message: 'Setting updated.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
