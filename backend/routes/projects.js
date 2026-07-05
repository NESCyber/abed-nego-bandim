// backend/routes/projects.js
// Public: GET projects
// Admin: CREATE / UPDATE / DELETE projects

const express  = require('express');
const db       = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = ['health', 'education', 'infrastructure', 'ict', 'other'];
const VALID_STATUSES   = ['planned', 'ongoing', 'completed'];

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

// GET /api/projects — All projects with optional filters
router.get('/', async (req, res) => {
  const { category, status } = req.query;

  let sql    = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (category && VALID_CATEGORIES.includes(category)) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status && VALID_STATUSES.includes(status)) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const [projects] = await db.query(sql, params);
  return res.json({ success: true, data: projects });
});

// GET /api/projects/:id — Single project
router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
  return res.json({ success: true, data: rows[0] });
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/projects — Create project
router.post('/', authenticate, async (req, res) => {
  const { title, description, category, location, status, image_url } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ success: false, message: 'Title, description, and category are required.' });
  }

  const [result] = await db.query(
    'INSERT INTO projects (title, description, category, location, status, image_url) VALUES (?,?,?,?,?,?)',
    [title, description, category, location || null, status || 'planned', image_url || null]
  );
  return res.status(201).json({ success: true, id: result.insertId, message: 'Project created.' });
});

// PUT /api/projects/:id — Update project
router.put('/:id', authenticate, async (req, res) => {
  const { title, description, category, location, status, image_url } = req.body;
  const [result] = await db.query(
    'UPDATE projects SET title=?, description=?, category=?, location=?, status=?, image_url=? WHERE id=?',
    [title, description, category, location || null, status || 'planned', image_url || null, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
  return res.json({ success: true, message: 'Project updated.' });
});

// DELETE /api/projects/:id — Delete project
router.delete('/:id', authenticate, async (req, res) => {
  const [result] = await db.query('DELETE FROM projects WHERE id=?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
  return res.json({ success: true, message: 'Project deleted.' });
});

module.exports = router;
