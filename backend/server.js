// backend/server.js
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const postsRoutes     = require('./routes/posts');
const projectsRoutes  = require('./routes/projects');
const messagesRoutes  = require('./routes/messages');
const mediaRoutes     = require('./routes/media');
const usersRoutes     = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const setupRoutes     = require('./routes/setup');
const settingsRoutes  = require('./routes/settings');
const newsletterRoutes = require('./routes/newsletter');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS: open for all origins (works for any local setup) ────
app.use(cors({ origin: true, credentials: true }));

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded media files ────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Serve ENTIRE frontend from the backend ────────────────────
// Access everything at http://localhost:3000  (no CORS issues)
const frontendPages = path.join(__dirname, '..', 'frontend', 'pages');
const frontendRoot  = path.join(__dirname, '..', 'frontend');

app.use(express.static(frontendPages));              // serves HTML pages
app.use('/css', express.static(path.join(frontendRoot, 'css')));  // serves CSS
app.use('/js',  express.static(path.join(frontendRoot, 'js')));   // serves JS

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests.' },
}));
app.use('/api/messages', rateLimit({
  windowMs: 60 * 60 * 1000, max: 30,
  message: { success: false, message: 'Too many submissions.' },
}));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'running', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/posts',     postsRoutes);
app.use('/api/projects',  projectsRoutes);
app.use('/api/messages',  messagesRoutes);
app.use('/api/media',     mediaRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/setup',     setupRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);

// ── Catch-all: any unknown route → index.html ─────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPages, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error.' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     Dr. Abed-Nego Lamangin Bandim — MP Site     ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Website :  http://localhost:${PORT}                 ║`);
  console.log(`║  Admin   :  http://localhost:${PORT}/admin-login.html║`);
  console.log(`║  API     :  http://localhost:${PORT}/api/health      ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
});

module.exports = app;
