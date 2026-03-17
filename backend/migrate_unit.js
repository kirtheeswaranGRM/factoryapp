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
        console.log('--- Starting Unit Migration ---');

        // Add unit to purchase_requests
        await client.query(`
            ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';
        `);
        console.log('✅ Added unit to purchase_requests.');

        // Add unit to purchase_orders
        await client.query(`
            ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';
        `);
        console.log('✅ Added unit to purchase_orders.');

        console.log('--- Unit Migration Completed ---');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
