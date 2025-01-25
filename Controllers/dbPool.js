// db.js
const mysql = require('mysql2/promise');

// Create a connection pool
const dbCredentials={
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 25060,
    ssl: { rejectUnauthorized: false },
}

const dbPool = mysql.createPool(dbCredentials)


module.exports = dbPool;
