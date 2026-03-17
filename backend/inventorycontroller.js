const pool = require('./db');

const getInventoryData = async (req, res) => {
    const { table } = req.query;
    console.log(`[INVENTORY-GET] Table: ${table}`);
    
    const allowed = ['inventory_colors', 'inventory_materials', 'inventory_molds', 'inventory_packing', 'inventory_product'];
    if (!allowed.includes(table)) return res.status(400).json({ error: "Invalid Table" });

    try {
        let sqlQuery = "";
        let mappingFn = (item) => item;

        if (table === 'inventory_product') {
            sqlQuery = "SELECT id, product_name, opening_stock, used_stock, closing_stock, minimum_stock_level, last_update, vendor_name, vendor_price FROM inventory_product";
            mappingFn = (item) => ({ ...item, display_name: item.product_name, stock_qty: item.closing_stock });
        } else if (table === 'inventory_materials') {
            sqlQuery = "SELECT id, material_name, opening_stock, used_stock, minimum_stock_level, unit, closing_stock, vendor_name, vendor_price FROM inventory_materials";
            mappingFn = (item) => ({ ...item, display_name: item.material_name, stock_qty: item.closing_stock });
        } else if (table === 'inventory_colors') {
            sqlQuery = "SELECT id, color_name, stock_qty_kgs FROM inventory_colors";
            mappingFn = (item) => ({ ...item, display_name: item.color_name, stock_qty: item.stock_qty_kgs });
        } else if (table === 'inventory_molds') {
            sqlQuery = "SELECT id, mold_name, cavity_options, cavity_count, cavity_weights, total_weight FROM inventory_molds";
            mappingFn = (item) => {
                let parsedWeights = item.cavity_weights;
                try {
                    if (typeof item.cavity_weights === 'string') {
                        parsedWeights = JSON.parse(item.cavity_weights);
                    }
                } catch (e) {
                    parsedWeights = [];
                }
                return { 
                    ...item, 
                    display_name: item.mold_name, 
                    stock_qty: item.cavity_count || 1,
                    cavity_weights: Array.isArray(parsedWeights) ? parsedWeights : []
                };
            };
        } else if (table === 'inventory_packing') {
            sqlQuery = "SELECT id, item_name, stock_qty_pcs FROM inventory_packing";
            mappingFn = (item) => ({ ...item, display_name: item.item_name, stock_qty: item.stock_qty_pcs });
        }

        if (!sqlQuery) {
            throw new Error(`Unhandled table: ${table}`);
        }

        const result = await pool.query(sqlQuery);
        console.log(`[INVENTORY-COLS] Table ${table} Columns:`, result.fields.map(f => f.name));
        // Sort in JavaScript instead of SQL to avoid sorting by non-existent columns
        const sortedRows = result.rows.sort((a, b) => a.id - b.id);
        const mappedData = sortedRows.map(mappingFn);

        res.status(200).json(mappedData);

    } catch (err) {
        console.error(`❌ DB Error for table ${table}:`, err);
        res.status(500).json({ error: "Database Query Failed", details: err.message });
    }
};

module.exports = getInventoryData;