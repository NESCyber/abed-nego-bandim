// backend/routes/posts.js
// Public: GET posts
// Admin: CREATE / UPDATE / DELETE posts

const express  = require('express');
const db       = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

// GET /api/posts — All published posts (paginated)
router.get('/', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 6);
  const offset = (page - 1) * limit;

  try {
    const [posts] = await db.query(
      `SELECT p.id, p.title, p.content, p.image_url, p.created_at, u.name AS author
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.status = 'published'
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM posts WHERE status = 'published'"
    );

    return res.json({ success: true, data: posts, total, page, limit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/posts/:id — Single post
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, u.name AS author
     FROM posts p LEFT JOIN users u ON p.author_id = u.id
     WHERE p.id = ? AND p.status = 'published'`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Post not found.' });
  return res.json({ success: true, data: rows[0] });
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES (require authentication)
// ─────────────────────────────────────────────────────────────

// GET /api/posts/admin/all — All posts including drafts
router.get('/admin/all', authenticate, async (req, res) => {
  const [posts] = await db.query(
    `SELECT p.id, p.title, p.status, p.created_at, u.name AS author
     FROM posts p LEFT JOIN users u ON p.author_id = u.id
     ORDER BY p.created_at DESC`
  );
  return res.json({ success: true, data: posts });
});

// POST /api/posts — Create post
router.post('/', authenticate, async (req, res) => {
  const { title, content, image_url, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required.' });
  }

  const [result] = await db.query(
    'INSERT INTO posts (title, content, image_url, status, author_id) VALUES (?, ?, ?, ?, ?)',
    [title, content, image_url || null, status || 'draft', req.user.id]
  );
  return res.status(201).json({ success: true, id: result.insertId, message: 'Post created.' });
});

// PUT /api/posts/:id — Update post
router.put('/:id', authenticate, async (req, res) => {
  const { title, content, image_url, status } = req.body;
  const [result] = await db.query(
    'UPDATE posts SET title=?, content=?, image_url=?, status=? WHERE id=?',
    [title, content, image_url || null, status || 'draft', req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Post not found.' });
  return res.json({ success: true, message: 'Post updated.' });
});

// DELETE /api/posts/:id — Delete post
router.delete('/:id', authenticate, async (req, res) => {
  const [result] = await db.query('DELETE FROM posts WHERE id=?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Post not found.' });
  return res.json({ success: true, message: 'Post deleted.' });
});

module.exports = router;
