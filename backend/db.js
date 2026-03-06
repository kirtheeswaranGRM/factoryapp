const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

pool.connect((err) => {
    if (err) console.error('❌ Database error:', err.stack);
    else console.log('✅ Connected to PostgreSQL');
});

module.exports = pool;