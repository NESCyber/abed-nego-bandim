// backend/config/db.js
// MySQL connection pool using mysql2/promise

const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'mp_website',
  waitForConnections: true,
  connectionLimit:    100,
  queueLimit:         0,
  charset:            'utf8mb4',
};

// Enable SSL if configured (required by Aiven/Clever Cloud/Tidb)
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

const fs = require('fs');
const path = require('path');

// Test connection and auto-run database initialization on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected successfully');

    try {
      // Check if users table exists
      const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
      if (tables.length === 0) {
        console.log('🔄  No tables found. Initializing database schema from schema.sql...');

        const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');

          // Split statements by semicolon, strip comments, and skip database creation/use statements
          const statements = schemaSql
            .split(';')
            .map(s => {
              let lines = s.split('\n');
              lines = lines.map(line => {
                const idx = line.indexOf('--');
                return idx >= 0 ? line.substring(0, idx) : line;
              });
              return lines.join('\n').trim();
            })
            .filter(s => {
              if (!s) return false;
              const upper = s.toUpperCase();
              if (upper.startsWith('CREATE DATABASE') || upper.startsWith('USE ')) return false;
              return true;
            });

          for (const statement of statements) {
            await conn.query(statement);
          }
          console.log('✅  Database schema initialized and seeded successfully.');
        } else {
          console.error('⚠️  schema.sql file not found at:', schemaPath);
        }
      } else {
        console.log('ℹ️  Database tables already initialized.');
      }
    } catch (migErr) {
      console.error('⚠️  Failed to run database migrations:', migErr.message);
    }

    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed on startup. The server is still running, but database features will fail until database credentials are set correctly in Render:', err);
  }
})();

module.exports = pool;
