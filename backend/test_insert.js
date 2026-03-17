const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

async function testInsert() {
    let material_id = 1;
    let material_name = 'Reliance AM650';
    let current_stock = 10;
    let requested_quantity = 10;
    let requested_by = 'test@factory.com';
    let vendor_price = 10; // User says they gave 10
    let vendor_name = ''; // Assume they didn't specify name

    try {
        console.log('--- Simulating Backend Logic ---');
        console.log('Input:', { material_id, vendor_price, vendor_name });

        if (!vendor_name || !vendor_price) {
            const matResult = await pool.query(
                'SELECT vendor_name, vendor_price FROM inventory_materials WHERE id = $1',
                [material_id]
            );
            console.log('Found in inventory_materials:', matResult.rows[0]);
            if (matResult.rows.length > 0) {
                if (!vendor_name) vendor_name = matResult.rows[0].vendor_name;
                if (!vendor_price) vendor_price = matResult.rows[0].vendor_price;
            }
        }

        console.log('Final to insert:', { vendor_name, vendor_price });

        const result = await pool.query(
            `INSERT INTO purchase_requests (material_id, material_name, current_stock, requested_quantity, requested_by, vendor_price, vendor_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [material_id, material_name, current_stock, requested_quantity, requested_by, vendor_price, vendor_name]
        );
        console.log('Inserted Row:', result.rows[0]);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

testInsert();
