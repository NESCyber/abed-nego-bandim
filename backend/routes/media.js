// backend/routes/media.js
// Public: GET gallery
// Admin: Upload / Delete media files

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── Multer storage config ────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed.'));
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

// GET /api/media — All media (gallery)
router.get('/', async (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM media WHERE 1=1';
  const params = [];
  if (type && ['image', 'video'].includes(type)) {
    sql += ' AND type = ?'; params.push(type);
  }
  sql += ' ORDER BY uploaded_at DESC';
  const [rows] = await db.query(sql, params);
  return res.json({ success: true, data: rows });
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/media — Upload file
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

  const ext  = path.extname(req.file.originalname).toLowerCase();
  const type = /mp4|mov|avi/.test(ext) ? 'video' : 'image';
  const fileUrl = `/uploads/${req.file.filename}`;

  const [result] = await db.query(
    'INSERT INTO media (file_url, type, caption, uploaded_by) VALUES (?,?,?,?)',
    [fileUrl, type, req.body.caption || null, req.user.id]
  );

  return res.status(201).json({ success: true, id: result.insertId, file_url: fileUrl, type });
});

// DELETE /api/media/:id
router.delete('/:id', authenticate, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM media WHERE id=?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Media not found.' });

  const filePath = path.join(__dirname, '..', rows[0].file_url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await db.query('DELETE FROM media WHERE id=?', [req.params.id]);
  return res.json({ success: true, message: 'Media deleted.' });
});

module.exports = router;
