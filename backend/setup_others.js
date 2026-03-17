const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log('--- Starting Inventory Others DB Setup ---');

        // Create inventory_others table
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_others (
                id SERIAL PRIMARY KEY,
                item_name TEXT NOT NULL,
                stock_qty NUMERIC DEFAULT 0
            )
        `);
        console.log('✅ Table inventory_others checked/created.');

        console.log('--- Inventory Others DB Setup Completed ---');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
