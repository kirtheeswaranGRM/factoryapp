const { Pool } = require('pg');

const inventoryPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
    max: 5,
});

const getInventoryData = async (req, res) => {
    const { table } = req.query;
    const allowed = ['inventory_colors', 'inventory_materials', 'inventory_molds', 'inventory_packing', 'inventory_product'];

    if (!allowed.includes(table)) return res.status(400).json({ error: "Invalid Table" });

    try {
        let sqlQuery = "";

        switch (table) {
            case 'inventory_product':
                sqlQuery = `SELECT *, product_name AS display_name, closing_stock AS stock_qty FROM inventory_product`;
                break;
            case 'inventory_materials':
                // Mapping material_name -> display_name AND closing_stock -> stock_qty
                sqlQuery = `SELECT *, material_name AS display_name, closing_stock AS stock_qty FROM inventory_materials`;
                break;
            case 'inventory_colors':
                sqlQuery = `SELECT *, color_name AS display_name, stock_qty FROM inventory_colors`;
                break;
            case 'inventory_molds':
                sqlQuery = `SELECT *, mold_name AS display_name, 1 AS stock_qty FROM inventory_molds`;
                break;
            case 'inventory_packing':
                sqlQuery = `SELECT *, item_name AS display_name, stock_qty FROM inventory_packing`;
                break;
            default:
                sqlQuery = `SELECT * FROM ${table}`;
        }

        // Database handles the sorting
        const result = await inventoryPool.query(`${sqlQuery} ORDER BY id ASC`);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error(`❌ DB Error:`, err.message);
        res.status(500).json({ error: "Database Query Failed" });
    }
};

module.exports = getInventoryData;