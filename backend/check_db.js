const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_requests'");
        console.log('Columns in purchase_requests:', res.rows.map(r => r.column_name));
        
        const res2 = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in public schema:', res2.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
