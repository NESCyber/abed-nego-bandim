// backend/routes/setup.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');

const router = express.Router();

// GET /api/setup — setup form
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Setup</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; max-width: 520px; margin: 40px auto; padding: 20px; background:#f4f6f5; }
        .card { background:white; border-radius:10px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.1); }
        h2 { color:#1a4a2e; margin-top:0; }
        label { display:block; font-weight:bold; margin-bottom:5px; font-size:0.9rem; }
        input { width:100%; padding:11px; margin-bottom:16px; border:1.5px solid #ccc; border-radius:6px; font-size:1rem; }
        input:focus { outline:none; border-color:#2d6a4f; }
        button { background:#2d6a4f; color:white; padding:13px; border:none; border-radius:6px; font-size:1rem; cursor:pointer; width:100%; font-weight:bold; }
        button:hover { background:#1a4a2e; }
        .note { background:#fff8e1; border-left:4px solid #f9a825; padding:12px 16px; margin-bottom:20px; font-size:0.88rem; border-radius:4px; }
        .debug { background:#f5f5f5; border:1px solid #ddd; border-radius:6px; padding:12px; margin-top:16px; font-family:monospace; font-size:0.82rem; word-break:break-all; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🔧 Admin Setup</h2>
        <div class="note">
          Fill in the form below to create or reset your admin account.
          The password you enter here is what you will use to login.
        </div>
        <form method="POST" action="/api/setup">
          <label>Full Name</label>
          <input type="text" name="name" value="Super Admin" required>
          <label>Email Address</label>
          <input type="email" name="email" value="admin@bandim-mp.gh" required>
          <label>Password (choose anything, min 6 chars)</label>
          <input type="text" name="password" placeholder="e.g. MyPassword123" required>
          <button type="submit">✅ Create / Reset Admin Account</button>
        </form>

        <div style="margin-top:20px;text-align:center;">
          <a href="/api/setup/check" style="color:#2d6a4f;font-size:0.88rem;">🔍 Check current users in database</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// POST /api/setup — create/reset admin
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  console.log('=== SETUP REQUEST ===');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Password length:', password?.length);

  if (!name || !email || !password) {
    return res.send('<p style="color:red">All fields required. <a href="/api/setup">Back</a></p>');
  }

  try {
    // Generate hash
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password.trim(), saltRounds);
    console.log('Hash generated:', hashed.substring(0, 20) + '...');

    // Verify hash works immediately
    const testMatch = await bcrypt.compare(password.trim(), hashed);
    console.log('Hash self-test:', testMatch ? 'PASS ✅' : 'FAIL ❌');

    if (!testMatch) {
      return res.send('<p style="color:red">bcrypt self-test failed. Please restart Node and try again.</p>');
    }

    // Delete existing user with this email
    await db.query('DELETE FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    console.log('Old user deleted (if existed)');

    // Insert fresh
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashed, 'super_admin']
    );
    console.log('New user inserted, ID:', result.insertId);

    // Read back from DB to confirm
    const [check] = await db.query('SELECT id, name, email, role, password FROM users WHERE id = ?', [result.insertId]);
    const savedUser = check[0];
    console.log('Saved user:', savedUser.email, 'role:', savedUser.role);

    // Final verification: compare password against what's in DB
    const finalCheck = await bcrypt.compare(password.trim(), savedUser.password);
    console.log('Final DB verification:', finalCheck ? 'PASS ✅' : 'FAIL ❌');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Setup Complete</title>
        <style>
          * { box-sizing:border-box; }
          body { font-family:Arial,sans-serif; max-width:520px; margin:40px auto; padding:20px; background:#f4f6f5; }
          .card { background:white; border-radius:10px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.1); }
          h2 { color:#2e7d32; margin-top:0; }
          .row { background:#f5f5f5; padding:12px 16px; border-radius:6px; margin:8px 0; font-family:monospace; }
          .status { font-weight:bold; color:${finalCheck ? '#2e7d32' : '#c62828'}; }
          a.btn { display:block; text-align:center; margin-top:20px; background:#2d6a4f; color:white; padding:13px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:1rem; }
          a.btn:hover { background:#1a4a2e; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${finalCheck ? '✅ Setup Successful!' : '❌ Something went wrong'}</h2>
          <p>Here are your login credentials:</p>
          <div class="row"><strong>Email:</strong> ${savedUser.email}</div>
          <div class="row"><strong>Password:</strong> ${password.trim()}</div>
          <div class="row"><strong>Role:</strong> ${savedUser.role}</div>
          <div class="row"><strong>DB Verification:</strong> <span class="status">${finalCheck ? 'PASSED — login will work' : 'FAILED — contact support'}</span></div>
          <a class="btn" href="/admin-login.html">→ Go to Admin Login</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Setup error:', err);
    res.send(`
      <div style="font-family:Arial;max-width:500px;margin:40px auto;padding:20px;">
        <h3 style="color:red">❌ Database Error</h3>
        <pre style="background:#fff0f0;padding:12px;border-radius:6px;">${err.message}</pre>
        <p>Make sure MySQL is running and your .env DB settings are correct.</p>
        <a href="/api/setup">← Try again</a>
      </div>
    `);
  }
});

// GET /api/setup/check — shows all users in DB (for debugging)
router.get('/check', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at, LEFT(password,30) as hash_preview FROM users');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DB Check</title>
        <style>
          body { font-family:Arial,sans-serif; max-width:700px; margin:40px auto; padding:20px; }
          table { width:100%; border-collapse:collapse; }
          th,td { padding:10px 12px; border:1px solid #ddd; text-align:left; font-size:0.88rem; }
          th { background:#1a4a2e; color:white; }
          tr:nth-child(even) { background:#f5f5f5; }
          a { color:#2d6a4f; }
        </style>
      </head>
      <body>
        <h2>👥 Users in Database (${users.length} found)</h2>
        ${users.length === 0
          ? '<p style="color:red">No users found! Go to <a href="/api/setup">/api/setup</a> to create one.</p>'
          : `<table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Hash Preview</th><th>Created</th></tr></thead>
              <tbody>
                ${users.map(u => `<tr>
                  <td>${u.id}</td>
                  <td>${u.name}</td>
                  <td>${u.email}</td>
                  <td>${u.role}</td>
                  <td style="font-family:monospace;font-size:0.75rem">${u.hash_preview}...</td>
                  <td>${u.created_at}</td>
                </tr>`).join('')}
              </tbody>
            </table>`
        }
        <br>
        <a href="/api/setup">← Back to Setup</a> &nbsp;|&nbsp;
        <a href="/admin-login.html">Admin Login →</a>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`<p style="color:red">DB Error: ${err.message}</p>`);
  }
});

module.exports = router;
