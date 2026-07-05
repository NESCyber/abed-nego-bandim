// backend/routes/dashboard.js
// Admin dashboard statistics

const express = require('express');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [[{ totalMessages }]]  = await db.query('SELECT COUNT(*) AS totalMessages FROM messages');
    const [[{ totalProjects }]]  = await db.query('SELECT COUNT(*) AS totalProjects FROM projects');
    const [[{ totalPosts }]]     = await db.query("SELECT COUNT(*) AS totalPosts FROM posts WHERE status='published'");
    const [[{ pendingMessages }]] = await db.query("SELECT COUNT(*) AS pendingMessages FROM messages WHERE status='pending'");
    const [[{ ongoingProjects }]] = await db.query("SELECT COUNT(*) AS ongoingProjects FROM projects WHERE status='ongoing'");
    const [[{ completedProjects }]] = await db.query("SELECT COUNT(*) AS completedProjects FROM projects WHERE status='completed'");
    const [[{ totalSubscribers }]] = await db.query("SELECT COUNT(*) AS totalSubscribers FROM newsletter_subscribers");

    const [recentMessages] = await db.query(
      'SELECT id, name, category, status, file_url, created_at FROM messages ORDER BY created_at DESC LIMIT 5'
    );
    const [recentPosts] = await db.query(
      'SELECT id, title, status, created_at FROM posts ORDER BY created_at DESC LIMIT 5'
    );

    // Grouping metrics for Chart.js telemetry
    const [messageCategories] = await db.query(
      'SELECT category, COUNT(*) AS count FROM messages GROUP BY category'
    );
    const [projectStatuses] = await db.query(
      'SELECT status, COUNT(*) AS count FROM projects GROUP BY status'
    );

    return res.json({
      success: true,
      stats: {
        totalMessages,
        totalProjects,
        totalPosts,
        pendingMessages,
        ongoingProjects,
        completedProjects,
        totalSubscribers,
      },
      charts: {
        messageCategories,
        projectStatuses,
      },
      recentMessages,
      recentPosts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
