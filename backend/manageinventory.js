const { Pool } = require('pg');

const inventoryPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Post@123',
    port: 5432,
});

const manageInventory = async (req, res) => {
    const { method } = req;
    const { table, id } = req.query;
    const { display_name, opening_stock, used_stock, minimum_stock_level, unit } = req.body;

    // Map the generic 'display_name' back to the specific table column name
    const nameColumn = table === 'inventory_product' ? 'product_name' :
                       table === 'inventory_materials' ? 'material_name' :
                       table === 'inventory_colors' ? 'color_name' :
                       table === 'inventory_molds' ? 'mold_name' : 'item_name';

    try {
        if (method === 'POST') {
            // ADD NEW ITEM
            const closing_stock = (parseFloat(opening_stock) || 0) - (parseFloat(used_stock) || 0);
            const sql = `
                INSERT INTO ${table} (${nameColumn}, opening_stock, used_stock, minimum_stock_level, unit, closing_stock)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
            const result = await inventoryPool.query(sql, [display_name, opening_stock, used_stock, minimum_stock_level, unit, closing_stock]);
            return res.status(201).json(result.rows[0]);
        }

        if (method === 'PUT') {
            // UPDATE EXISTING ITEM
            const closing_stock = (parseFloat(opening_stock) || 0) - (parseFloat(used_stock) || 0);
            const sql = `
                UPDATE ${table} 
                SET ${nameColumn} = $1, opening_stock = $2, used_stock = $3, minimum_stock_level = $4, unit = $5, closing_stock = $6
                WHERE id = $7 RETURNING *`;
            const result = await inventoryPool.query(sql, [display_name, opening_stock, used_stock, minimum_stock_level, unit, closing_stock, id]);
            return res.status(200).json(result.rows[0]);
        }

        if (method === 'DELETE') {
            // DELETE ITEM
            await inventoryPool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
            return res.status(200).json({ message: "Deleted successfully" });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Operation Failed", details: err.message });
    }
};

module.exports = manageInventory;