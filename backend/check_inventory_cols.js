const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres', host: 'localhost', database: 'postgres', password: 'Post@123', port: 5432,
});
async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory_product'");
        console.log('Columns in inventory_product:', res.rows.map(r => r.column_name));
    } catch (err) { console.error(err); } finally { await pool.end(); }
}
check();
