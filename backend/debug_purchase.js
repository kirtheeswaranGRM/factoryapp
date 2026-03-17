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
        const reqs = await pool.query("SELECT id, material_name, status FROM purchase_requests");
        console.log("--- Purchase Requests ---");
        console.table(reqs.rows);

        const orders = await pool.query("SELECT id, request_id, material_name, status FROM purchase_orders");
        console.log("--- Purchase Orders ---");
        console.table(orders.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
