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
        console.log('--- Starting Category Column Migration ---');

        // Add category to vendor_material_prices
        await client.query(`
            ALTER TABLE vendor_material_prices ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Materials';
        `);
        console.log('✅ Added category to vendor_material_prices.');

        // Add category to purchase_requests
        await client.query(`
            ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Materials';
        `);
        console.log('✅ Added category to purchase_requests.');

        // Add category to purchase_orders
        await client.query(`
            ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Materials';
        `);
        console.log('✅ Added category to purchase_orders.');

        // Add stock_count to inventory_molds
        await client.query(`
            ALTER TABLE inventory_molds ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0;
        `);
        console.log('✅ Added stock_count to inventory_molds.');

        // Update unique constraint on vendor_material_prices
        try {
            await client.query('ALTER TABLE vendor_material_prices DROP CONSTRAINT IF EXISTS vendor_material_prices_vendor_id_material_id_key');
            await client.query('ALTER TABLE vendor_material_prices ADD CONSTRAINT vendor_material_prices_composite_key UNIQUE(vendor_id, material_id, category)');
            console.log('✅ Updated unique constraint on vendor_material_prices.');
        } catch (e) {
            console.log('Unique constraint update note:', e.message);
        }

        console.log('--- Category Column Migration Completed ---');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
