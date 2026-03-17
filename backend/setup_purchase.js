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
        console.log('--- Starting Purchase Module DB Setup ---');

        // 1. Create purchase_requests table
        await client.query(`
            CREATE TABLE IF NOT EXISTS purchase_requests (
                id SERIAL PRIMARY KEY,
                material_id INTEGER,
                material_name TEXT NOT NULL,
                current_stock NUMERIC(10,2),
                requested_quantity NUMERIC(10,2) NOT NULL,
                requested_by TEXT,
                status TEXT DEFAULT 'PENDING_ADMIN_APPROVAL',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('✅ Table purchase_requests checked/created.');

        // 2. Create purchase_orders table
        await client.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id SERIAL PRIMARY KEY,
                request_id INTEGER REFERENCES purchase_requests(id),
                material_id INTEGER,
                material_name TEXT NOT NULL,
                requested_quantity NUMERIC(10,2),
                purchased_quantity NUMERIC(10,2),
                vendor_name TEXT,
                price NUMERIC(15,2),
                created_by TEXT,
                status TEXT DEFAULT 'PENDING_ADMIN_PURCHASE_APPROVAL',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                admin_approval_date TIMESTAMP WITH TIME ZONE
            )
        `);
        console.log('✅ Table purchase_orders checked/created.');

        console.log('--- Purchase Module DB Setup Completed ---');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
