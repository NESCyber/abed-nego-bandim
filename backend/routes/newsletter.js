// backend/routes/newsletter.js
// Public: POST /api/newsletter/subscribe
// Admin: GET /api/newsletter/subscribers

const express = require('express');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC — POST /subscribe
// ─────────────────────────────────────────────────────────────
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    await db.query(
      'INSERT INTO newsletter_subscribers (email) VALUES (?)',
      [cleanEmail]
    );
    return res.status(201).json({ success: true, message: 'Thank you for subscribing to our newsletter!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ success: true, message: 'This email is already subscribed to our newsletter.' });
    }
    console.error('Newsletter subscription error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN — GET /subscribers
// ─────────────────────────────────────────────────────────────
router.get('/subscribers', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch subscribers error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
