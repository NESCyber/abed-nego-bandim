// backend/routes/messages.js
// Public: POST (submit from constituency portal)
// Admin: GET all, update status, delete

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const nodemailer = require('nodemailer');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = ['report_issue', 'request_support', 'suggest_idea', 'general'];
const VALID_STATUSES   = ['pending', 'in_progress', 'resolved'];

// ── Multer Storage Setup for Portal Attachments ───────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'msg-' + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|docx|doc|txt/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, word documents, and text files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/messages — Submit from constituency portal
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { name, contact, category, message } = req.body;

  if (!name || !contact || !message) {
    return res.status(400).json({ success: false, message: 'Name, contact, and message are required.' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category.' });
  }

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await db.query(
      'INSERT INTO messages (name, contact, category, message, file_url) VALUES (?,?,?,?,?)',
      [name.trim(), contact.trim(), category || 'general', message.trim(), fileUrl]
    );

    // Trigger automated confirmation email if contact is an email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(contact.trim())) {
      sendConfirmationEmail(contact.trim(), name.trim(), category || 'general', message.trim(), result.insertId)
        .catch(mailErr => console.warn('📧 Email confirmation failed to send:', mailErr.message));
    }

    return res.status(201).json({ success: true, id: result.insertId, message: 'Message submitted successfully. Thank you!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

// GET /api/messages — All messages (admin)
router.get('/', authenticate, async (req, res) => {
  const { status, category } = req.query;
  let sql = 'SELECT * FROM messages WHERE 1=1';
  const params = [];

  if (status && VALID_STATUSES.includes(status)) {
    sql += ' AND status = ?'; params.push(status);
  }
  if (category && VALID_CATEGORIES.includes(category)) {
    sql += ' AND category = ?'; params.push(category);
  }
  sql += ' ORDER BY created_at DESC';

  const [rows] = await db.query(sql, params);
  return res.json({ success: true, data: rows });
});

// GET /api/messages/:id — Single message
router.get('/:id', authenticate, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, data: rows[0] });
});

// PATCH /api/messages/:id/status — Update status
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  const [result] = await db.query('UPDATE messages SET status=? WHERE id=?', [status, req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, message: 'Status updated.' });
});

// DELETE /api/messages/:id
router.delete('/:id', authenticate, async (req, res) => {
  const [result] = await db.query('DELETE FROM messages WHERE id=?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, message: 'Message deleted.' });
});

// ── Helper: Send confirmation email to constituents ──────────
async function sendConfirmationEmail(toEmail, name, category, messageText, ticketId) {
  if (!process.env.SMTP_USER) {
    console.log('📧 SMTP credentials not set in .env. Skipping automated portal receipt email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT) || 2525,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const categoryLabels = {
    report_issue: 'Issue Report',
    request_support: 'Support Request',
    suggest_idea: 'Idea Suggestion',
    general: 'General Inquiry'
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Office of Dr. Abed-Nego Bandim, MP" <baazumah@parliament.gh>',
    to: toEmail,
    subject: `Portal Receipt: ${categoryLabels[category] || 'Constituency Engagement'} - Ticket #${ticketId}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #2d3748; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #0d2b1a; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #0d2b1a; margin: 0; font-family: 'Outfit', sans-serif;">Office of Hon. Dr. Abed-Nego Bandim, MP</h2>
          <p style="margin: 4px 0 0; font-size: 0.85rem; color: #c9a84c; font-weight: bold; text-transform: uppercase;">Bunkpurugu Constituency Portal</p>
        </div>
        
        <p>Dear <strong>${name}</strong>,</p>
        
        <p>Thank you for reaching out to the Member of Parliament's office. This is an automated email confirming that we have successfully received your submission through the Constituency Portal.</p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #0d2b1a; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #0d2b1a; font-size: 0.95rem;">Ticket Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #718096; width: 120px;">Ticket ID:</td>
              <td style="padding: 4px 0; color: #2d3748;">#${ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #718096;">Category:</td>
              <td style="padding: 4px 0; color: #2d3748;">${categoryLabels[category] || category}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #718096; vertical-align: top;">Message:</td>
              <td style="padding: 4px 0; color: #4a5568; white-space: pre-wrap;">${messageText}</td>
            </tr>
          </table>
        </div>
        
        <p>Your request is currently under review by our administrative team. We will investigate the details and get back to you within <strong>5 to 7 working days</strong>.</p>
        
        <p style="margin-top: 24px;">Sincerely,</p>
        <p style="margin: 0; font-weight: bold; color: #0d2b1a;">Constituency Management Team</p>
        <p style="margin: 0; font-size: 0.8rem; color: #718096;">Parliament of Ghana</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 16px;">
        <div style="text-align: center; font-size: 0.75rem; color: #a0aec0;">
          This is an automated notification. Please do not reply directly to this email.<br>
          For urgent enquiries, call <strong>+233 302 633 030 Ext 4124</strong> or visit the Constituency Office.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Automated portal confirmation email sent successfully to ${toEmail}`);
}

module.exports = router;
