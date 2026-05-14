const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  port: process.env.DB_PORT || 3306,
  password: process.env.DB_PASSWORD || 'Kathir@143',
  database: process.env.DB_NAME || 'schoolDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Quick connection check when this module is loaded so startup errors are visible
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    console.log('MySQL pool connected to', process.env.DB_NAME || 'schoolDB');
    conn.release();
  } catch (err) {
    console.error('MySQL connection error:', err.message || err);
  }
}

testConnection();

module.exports = pool;
