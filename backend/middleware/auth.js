// backend/middleware/auth.js
// JWT authentication + role-based access control

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token. Attaches req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Restrict route to super_admin only.
 * Must be used AFTER authenticate().
 */
function superAdminOnly(req, res, next) {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Super admin access required.' });
}

module.exports = { authenticate, superAdminOnly };
