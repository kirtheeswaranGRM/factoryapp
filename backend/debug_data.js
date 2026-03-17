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
        console.log("--- Purchase Requests ---");
        const reqs = await pool.query("SELECT * FROM purchase_requests");
        console.table(reqs.rows);

        console.log("--- Purchase Orders ---");
        const orders = await pool.query("SELECT * FROM purchase_orders");
        console.table(orders.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
