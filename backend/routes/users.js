// backend/routes/users.js
// Super admin only: manage admin users

const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { authenticate, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication + super_admin role
router.use(authenticate, superAdminOnly);

// GET /api/users — List all admin users
router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return res.json({ success: true, data: rows });
});

// POST /api/users — Create new admin user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const hashed = await bcrypt.hash(password, 12);

  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      [name.trim(), email.trim().toLowerCase(), hashed, role === 'super_admin' ? 'super_admin' : 'editor']
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Admin user created.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/users/:id — Update user (name, role, password)
router.put('/:id', async (req, res) => {
  const { name, role, password } = req.body;
  let sql = 'UPDATE users SET name=?, role=?';
  const params = [name, role === 'super_admin' ? 'super_admin' : 'editor'];

  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    const hashed = await bcrypt.hash(password, 12);
    sql += ', password=?';
    params.push(hashed);
  }

  sql += ' WHERE id=?';
  params.push(req.params.id);

  const [result] = await db.query(sql, params);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, message: 'User updated.' });
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }
  const [result] = await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, message: 'User deleted.' });
});

module.exports = router;
