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
        console.log('--- Starting Vendor Module DB Setup ---');

        // 1. Create vendors table
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendors (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('✅ Table vendors checked/created.');

        // 2. Create vendor_material_prices table
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_material_prices (
                id SERIAL PRIMARY KEY,
                vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
                material_id INTEGER, -- Reference to inventory_materials id
                price_per_kg NUMERIC(10,2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(vendor_id, material_id)
            )
        `);
        console.log('✅ Table vendor_material_prices checked/created.');

        // 3. Update purchase_requests table
        // We'll check if columns exist before adding them
        const cols = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'purchase_requests'
        `);
        const colNames = cols.rows.map(r => r.column_name);

        if (!colNames.includes('vendor_id')) {
            await client.query('ALTER TABLE purchase_requests ADD COLUMN vendor_id INTEGER REFERENCES vendors(id)');
            console.log('✅ Added vendor_id to purchase_requests.');
        }

        if (!colNames.includes('vendor_name')) {
            await client.query('ALTER TABLE purchase_requests ADD COLUMN vendor_name TEXT');
            console.log('✅ Added vendor_name to purchase_requests.');
        }

        if (!colNames.includes('vendor_price')) {
            await client.query('ALTER TABLE purchase_requests ADD COLUMN vendor_price NUMERIC(15,2)');
            console.log('✅ Added vendor_price to purchase_requests.');
        }

        if (!colNames.includes('total_price')) {
            await client.query('ALTER TABLE purchase_requests ADD COLUMN total_price NUMERIC(15,2)');
            console.log('✅ Added total_price to purchase_requests.');
        }

        console.log('--- Vendor Module DB Setup Completed ---');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
