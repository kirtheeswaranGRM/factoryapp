const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

async function checkData() {
    try {
        const result = await pool.query(`
            SELECT id, material_id, material_name, requested_quantity, vendor_price, vendor_name, status 
            FROM purchase_requests 
            WHERE id = 7
        `);
        console.table(result.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
