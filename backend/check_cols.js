const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'production_logs'", (err, res) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(res.rows.map(r => r.column_name)));
    }
    pool.end();
});
