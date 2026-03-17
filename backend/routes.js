const express = require('express');
const router = express.Router();
const pool = require('./db');
const PDFDocument = require('pdfkit');
const { monthlySummary } = require('./downreports');
const https = require('https');
const querystring = require('querystring');
const bcrypt = require('bcryptjs');

// ==========================================
// INVENTORY ROUTES
// ==========================================
router.get('/inventory/materials', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_materials ORDER BY material_name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/inventory/colors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_colors ORDER BY color_name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});
// ==========================================
// UPDATED PRODUCT ROUTE
// ==========================================
router.get('/inventory/products', async (req, res) => {
    try {
        // Updated table name to singular: inventory_product
        const result = await pool.query('SELECT * FROM inventory_product ORDER BY product_name ASC');
        
        res.json(result.rows);
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json([]);
    }
});

router.get('/inventory/molds', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_molds ORDER BY mold_name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/inventory/packing', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_packing ORDER BY item_name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/inventory/others', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_others ORDER BY item_name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// VENDOR MANAGEMENT ROUTES
// ==========================================
router.get('/vendors', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, 
                   json_agg(json_build_object(
                       'material_id', vmp.material_id, 
                       'category', vmp.category,
                       'material_name', COALESCE(im.material_name, ic.color_name, imo.mold_name), 
                       'price_per_kg', vmp.price_per_kg
                   )) FILTER (WHERE vmp.material_id IS NOT NULL) as materials
            FROM vendors v
            LEFT JOIN vendor_material_prices vmp ON v.id = vmp.vendor_id
            LEFT JOIN inventory_materials im ON vmp.material_id = im.id AND vmp.category = 'Materials'
            LEFT JOIN inventory_colors ic ON vmp.material_id = ic.id AND vmp.category = 'Colors'
            LEFT JOIN inventory_molds imo ON vmp.material_id = imo.id AND vmp.category = 'Molds'
            GROUP BY v.id
            ORDER BY v.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Vendors Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/vendors', async (req, res) => {
    const { name, created_by, category, material_id, price_per_kg } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Create vendor
        const vendorRes = await client.query(
            'INSERT INTO vendors (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, created_by]
        );
        const vendor = vendorRes.rows[0];

        // 2. Add material price if provided
        if (material_id && price_per_kg) {
            await client.query(
                'INSERT INTO vendor_material_prices (vendor_id, material_id, category, price_per_kg) VALUES ($1, $2, $3, $4)',
                [vendor.id, material_id, category || 'Materials', price_per_kg]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(vendor);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Vendor Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.post('/vendors/:id/materials', async (req, res) => {
    const { id } = req.params;
    const { material_id, category, price_per_kg } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO vendor_material_prices (vendor_id, material_id, category, price_per_kg) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (vendor_id, material_id) DO UPDATE SET price_per_kg = EXCLUDED.price_per_kg, category = EXCLUDED.category
             RETURNING *`,
            [id, material_id, category || 'Materials', price_per_kg]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Add/Update Vendor Material Price Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password, userRole } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: "${email}", Role: "${userRole}"`);
    try {
        const result = await pool.query(
            'SELECT id, username, password, role FROM users WHERE LOWER(username) = LOWER($1) AND role = $2',
            [email.trim(), userRole]
        );
        
        console.log(`[LOGIN DEBUG] Found ${result.rows.length} users matching.`);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log(`[LOGIN DEBUG] Comparing password for user: ${user.username}`);
            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`[LOGIN DEBUG] Password match result: ${isMatch}`);
            
            if (isMatch) {
                const { password: _, ...userWithoutPassword } = user;
                res.json({ success: true, user: userWithoutPassword });
            } else {
                res.status(401).json({ success: false, message: "Invalid credentials." });
            }
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials." });
        }
    } catch (err) {
        console.error("[LOGIN ERROR]", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ATTENDANCE LOGGING
// ==========================================
router.post('/head-attendance/log', async (req, res) => {
    const { email, role } = req.body;
    try {
        const checkResult = await pool.query(
            'SELECT * FROM head_attendance WHERE email = $1 AND login_time::date = CURRENT_DATE',
            [email]
        );
        if (checkResult.rows.length > 0) {
            return res.status(200).json({ success: true, message: "Already marked." });
        }
        const result = await pool.query(
            'INSERT INTO head_attendance (email, role) VALUES ($1, $2) RETURNING *',
            [email, role]
        );
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to log attendance" });
    }
});

// ==========================================
// PRODUCTION HEAD ROUTES
// ==========================================
router.get('/head/pending_reports', async (req, res) => {
    try {
        const query = `
            SELECT 
                l.log_id,
                COALESCE(m.machine_name, 'UNIT ' || l.machine_id) AS machine_display_name, 
                l.shift,
                l.product_name,
                l.total_output,
                -- We use CASE to force 'None' (any case) to NULL so CONCAT_WS skips it
                NULLIF(CONCAT_WS(', ', 
                    CASE WHEN LOWER(TRIM(l.material_type_1)) = 'none' THEN NULL ELSE NULLIF(TRIM(l.material_type_1), '') END,
                    CASE WHEN LOWER(TRIM(l.material_type_2)) = 'none' THEN NULL ELSE NULLIF(TRIM(l.material_type_2), '') END,
                    CASE WHEN LOWER(TRIM(l.material_type_3)) = 'none' THEN NULL ELSE NULLIF(TRIM(l.material_type_3), '') END,
                    CASE WHEN LOWER(TRIM(l.material_type_4)) = 'none' THEN NULL ELSE NULLIF(TRIM(l.material_type_4), '') END,
                    CASE WHEN LOWER(TRIM(l.material_color)) = 'none' THEN NULL ELSE NULLIF(TRIM(l.material_color), '') END
                ), '') AS material_list,
                -- Numeric sum for totals
                (COALESCE(l.material_qty_1::numeric, 0) + 
                 COALESCE(l.material_qty_2::numeric, 0) + 
                 COALESCE(l.material_qty_3::numeric, 0) + 
                 COALESCE(l.material_qty_4::numeric, 0) + 
                 COALESCE(l.color_qty::numeric, 0)) AS total_mat_qty,
                l.mold_type,
                l.cavity,
                TO_CHAR((l.stop_time - l.start_time), 'HH24"h "MI"m"') AS run_time_display,
                l.stop_reason,
                l.created_at
            FROM production_logs l
            LEFT JOIN machine_status m ON l.machine_id = m.id
            WHERE l.approval_status = 'pending' OR l.approval_status IS NULL
            ORDER BY l.log_id DESC
        `;
        const result = await pool.query(query);
        
        res.status(200).json(result.rows || []);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/head/update_approval', async (req, res) => {
    const { log_id, status, operator_name, rejection_reason } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            `UPDATE production_logs 
             SET approval_status = $1, operator_name = $2, rejection_reason = $3 
             WHERE log_id = $4`, 
            [status, operator_name || null, rejection_reason || null, log_id]
        );

        let machineName = 'Unknown Machine';
        if (status === 'approved') {
            // Get production details to update stock and get machine name
            const logRes = await client.query(
                `SELECT l.product_name, l.total_output, COALESCE(m.machine_name, 'UNIT ' || l.machine_id) as machine_name 
                 FROM production_logs l 
                 LEFT JOIN machine_status m ON l.machine_id = m.id 
                 WHERE l.log_id = $1`,
                [log_id]
            );
            
            if (logRes.rows.length > 0) {
                const { product_name, total_output, machine_name } = logRes.rows[0];
                machineName = machine_name;
                
                if (product_name && total_output) {
                    // Update inventory product (REMOVED - manual entry required)
                    /*
                    await client.query(
                        'UPDATE inventory_product SET closing_stock = closing_stock + $1 WHERE product_name = $2',
                        [total_output, product_name]
                    );
                    */
                }
            }
        } else {
            // Just get machine name for rejection notification
            const logRes = await client.query(
                `SELECT COALESCE(m.machine_name, 'UNIT ' || l.machine_id) as machine_name 
                 FROM production_logs l 
                 LEFT JOIN machine_status m ON l.machine_id = m.id 
                 WHERE l.log_id = $1`,
                [log_id]
            );
            if (logRes.rows.length > 0) machineName = logRes.rows[0].machine_name;
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Update Approval Error:", err.message);
        res.status(500).json({ error: "Update failed" });
    } finally {
        client.release();
    }
});

// ==========================================
// ADD STOCK (PRODUCTION HEAD)
// ==========================================
router.post('/head/add-stock', async (req, res) => {
    const { table, item_id, vendor_name, qty, invoice } = req.body;
    try {
        let updateColumn = 'closing_stock';
        if (table === 'inventory_colors') updateColumn = 'stock_qty_kgs';
        if (table === 'inventory_packing') updateColumn = 'stock_qty_pcs';
        if (table === 'inventory_others') updateColumn = 'stock_qty';

        await pool.query(
            `UPDATE ${table} SET ${updateColumn} = ${updateColumn} + $1 WHERE id = $2`,
            [parseFloat(qty), item_id]
        );
        
        // Log purchase history or other tracking if needed
        res.json({ success: true });
    } catch (err) {
        console.error("Add Stock Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// OPERATOR / MACHINE ROUTES
// ==========================================
router.get('/machines', async (req, res) => {
    try {
        // Safe Lazy Migrations
        await pool.query("ALTER TABLE machine_status ADD COLUMN IF NOT EXISTS last_report_count INTEGER DEFAULT 0");
        await pool.query("ALTER TABLE machine_status ADD COLUMN IF NOT EXISTS last_report_at TIMESTAMP");

        const result = await pool.query('SELECT * FROM machine_status ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hourly_logs/latest/:machine_id', async (req, res) => {
    const { machine_id } = req.params;
    try {
        // Safe Lazy Migrations
        await pool.query("ALTER TABLE hourly_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
        await pool.query("ALTER TABLE hourly_logs ADD COLUMN IF NOT EXISTS total_count_at_end INTEGER");

        const result = await pool.query(
            'SELECT total_count_at_end, total_output FROM hourly_logs WHERE machine_id = $1 AND status = \'approved\' ORDER BY "timestamp" DESC LIMIT 1',
            [machine_id]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error("Fetch Latest Log Error:", err.message);
        res.status(500).json(null);
    }
});

router.get('/hourly_logs/pending/:machine_id', async (req, res) => {
    const { machine_id } = req.params;
    try {
        // Safe Lazy Migrations
        await pool.query("ALTER TABLE hourly_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
        await pool.query("ALTER TABLE hourly_logs ADD COLUMN IF NOT EXISTS total_count_at_end INTEGER");

        const result = await pool.query(
            'SELECT * FROM hourly_logs WHERE machine_id = $1 AND status = \'pending\' ORDER BY "timestamp" ASC',
            [machine_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Pending Logs Error:", err.message);
        res.status(500).json([]);
    }
});

router.post('/hourly_logs', async (req, res) => {
    const { 
        machine_id, machine_name, shift, total_output, hourly_output, 
        chiller_check, compressor_check, mould_check, machine_check, 
        remarks, timestamp, operator_id, hour_range, status 
    } = req.body;
    
    console.log(`[HOURLY-LOG] Machine: ${machine_name}, Hour: ${hour_range}, Produced: ${hourly_output}, Total: ${total_output}, Operator: ${operator_id}, Status: ${status}`);

    try {
        // Safe Lazy Migrations (ensure columns exist before use)
        await pool.query("ALTER TABLE hourly_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
        await pool.query("ALTER TABLE hourly_logs ADD COLUMN IF NOT EXISTS total_count_at_end INTEGER");

        const tOutput = parseInt(total_output) || 0;
        const hOutput = parseInt(hourly_output) || 0;
        const finalStatus = status || 'pending';

        const existingRes = await pool.query(
            'SELECT id, status FROM hourly_logs WHERE machine_id = $1 AND TRIM(hour_range) = TRIM($2)',
            [machine_id?.toString(), hour_range?.toString()]
        );

        if (existingRes.rows.length > 0) {
            const existing = existingRes.rows[0];
            // Safety: If already approved, do not allow reverting to pending
            if (existing.status === 'approved' && finalStatus === 'pending') {
                return res.json({ success: true, message: "Already approved" });
            }

            await pool.query(
                `UPDATE hourly_logs SET 
                    total_output = $1, hourly_output = $2, 
                    chiller_check = $3, compressor_check = $4, mould_check = $5, machine_check = $6, 
                    remarks = $7, status = $8, operator_id = $9, total_count_at_end = $10
                WHERE id = $11`,
                [
                    tOutput, hOutput, 
                    chiller_check || false, compressor_check || false, mould_check || false, machine_check || false, 
                    remarks || "", finalStatus, operator_id || null, tOutput,
                    existing.id
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO hourly_logs (
                    machine_id, machine_name, shift, total_output, hourly_output, 
                    chiller_check, compressor_check, mould_check, machine_check, 
                    remarks, "timestamp", operator_id, hour_range, status, total_count_at_end
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                [
                    machine_id, machine_name, shift || null, tOutput, hOutput, 
                    chiller_check || false, compressor_check || false, mould_check || false, machine_check || false, 
                    remarks || "", timestamp || new Date(), operator_id || null, hour_range || "", finalStatus, tOutput
                ]
            );
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Hourly Log Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.put('/machines/power-toggle', async (req, res) => {
    const { action } = req.body;
    console.log(`[POWER-TOGGLE] Action: ${action}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let result = null; 
        
        if (action === 'pause') {
            result = await client.query(`
                UPDATE machine_status 
                SET 
                    accumulated_output = COALESCE(accumulated_output, 0) + COALESCE(
                        FLOOR(EXTRACT(EPOCH FROM (now() - start_time)) / NULLIF(cycle_timing, 0)) * COALESCE(cavity, 1), 0
                    )::integer,
                    total_output = COALESCE(total_output, 0) + COALESCE(
                        FLOOR(EXTRACT(EPOCH FROM (now() - start_time)) / NULLIF(cycle_timing, 0)) * COALESCE(cavity, 1), 0
                    )::integer,
                    status = 'paused', 
                    start_time = NULL, 
                    stop_reason = 'POWER CUT'
                WHERE LOWER(status) = 'running'
                RETURNING id, machine_name, accumulated_output, total_output`); 

            console.log(`[PAUSE] Updated ${result.rows.length} machines`);
            if (result.rows.length > 0) console.table(result.rows);
        } else if (action === 'resume') {
            result = await client.query(`
                UPDATE machine_status 
                SET 
                    status = 'running', 
                    start_time = now(), 
                    resume_time = now(), 
                    session_start_time = COALESCE(session_start_time, now()), 
                    stop_reason = NULL 
                WHERE LOWER(status) = 'paused' AND stop_reason = 'POWER CUT'
                RETURNING id, machine_name, status, start_time`);
            
            console.log(`[RESUME] Updated ${result.rows.length} machines`);
            if (result.rows.length > 0) console.table(result.rows);
        } else if (action === 'stop') {
            result = await client.query(`
                UPDATE machine_status 
                SET 
                    accumulated_output = COALESCE(accumulated_output, 0) + COALESCE(
                        FLOOR(EXTRACT(EPOCH FROM (now() - start_time)) / NULLIF(cycle_timing, 0)) * COALESCE(cavity, 1), 0
                    )::integer,
                    total_output = COALESCE(total_output, 0) + COALESCE(
                        FLOOR(EXTRACT(EPOCH FROM (now() - start_time)) / NULLIF(cycle_timing, 0)) * COALESCE(cavity, 1), 0
                    )::integer,
                    status = 'idle', 
                    start_time = NULL, 
                    session_start_time = NULL,
                    resume_time = NULL,
                    stop_reason = 'STOP ALL COMMAND'
                WHERE LOWER(status) != 'idle'
                RETURNING id, machine_name, status`); 
            
            console.log(`[STOP-ALL] Updated ${result.rows.length} machines`);
            if (result.rows.length > 0) console.table(result.rows);
        } else {
            throw new Error(`Invalid action: ${action}`);
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        console.error("[ERROR] /machines/power-toggle:", err);
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { 
        if (client) client.release(); 
    }
});

router.get('/machine_status/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM machine_status WHERE id = $1', [parseInt(id)]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Machine not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATED: Added product_name ($23) to machine status update
router.put('/machine_status/:id', async (req, res) => {
    const { id: rawId } = req.params;
    const id = parseInt(rawId);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid machine ID" });
    const { 
        status, total_output, start_time, shift, 
        material_type_1, material_qty_1, material_type_2, material_qty_2, 
        material_type_3, material_qty_3, material_type_4, material_qty_4, 
        material_color, color_qty, mold_type, cavity, cycle_timing,
        stop_reason, accumulated_output, hourly_units, session_start_time, resume_time,
        product_name, last_report_at, last_report_count // Added last_report_count
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Lazy Migrations (ensure columns exist before use)
        await client.query("ALTER TABLE machine_status ADD COLUMN IF NOT EXISTS last_report_count INTEGER DEFAULT 0");
        await client.query("ALTER TABLE machine_status ADD COLUMN IF NOT EXISTS last_report_at TIMESTAMP");

        const currentRes = await client.query('SELECT status FROM machine_status WHERE id = $1', [id]);
        const currentStatus = currentRes.rows[0]?.status;

        // PREVENT accidental status reset on screen refresh if machine is active
        // Only allow status change to idle if explicitly asked via 'stop' action
        if ((currentStatus === 'running' || currentStatus === 'paused') && status === 'idle') {
            console.log(`[BLOCK] Prevented status overwrite from ${currentStatus} to ${status} for ID ${id}`);
            await client.query('ROLLBACK');
            return res.json({ success: true, message: "Blocked idle overwrite while machine is active" });
        }

        const normalizedStatus = status === 'stop' ? 'idle' : status;
        const isRunning = normalizedStatus === 'running';
        const startingNow = isRunning && currentStatus !== 'running';
        
        const query = `
            UPDATE machine_status SET 
                status = COALESCE($1, status), 
                total_output = COALESCE($2, total_output), 
                start_time = $3, 
                shift = COALESCE($4, shift),
                material_type_1 = COALESCE($5, material_type_1), 
                material_qty_1 = COALESCE($6, material_qty_1), 
                material_type_2 = COALESCE($7, material_type_2), 
                material_qty_2 = COALESCE($8, material_qty_2),
                material_type_3 = COALESCE($9, material_type_3), 
                material_qty_3 = COALESCE($10, material_qty_3), 
                material_type_4 = COALESCE($11, material_type_4), 
                material_qty_4 = COALESCE($12, material_qty_4),
                material_color = COALESCE($13, material_color), 
                color_qty = COALESCE($14, color_qty), 
                mold_type = COALESCE($15, mold_type), 
                cavity = COALESCE($16, cavity), 
                cycle_timing = COALESCE($17, cycle_timing),
                stop_reason = COALESCE($18, stop_reason), 
                accumulated_output = COALESCE($19, accumulated_output), 
                hourly_units = COALESCE($20, hourly_units), 
                session_start_time = $21, 
                resume_time = $22,
                product_name = COALESCE($23, product_name),
                last_report_at = COALESCE($24, last_report_at),
                last_report_count = COALESCE($25, last_report_count)
            WHERE id = $26`;

        const values = [
            normalizedStatus || null, 
            total_output !== undefined ? total_output : null, 
            start_time || null, 
            shift || null,
            material_type_1 || null, material_qty_1 !== undefined ? material_qty_1 : null,
            material_type_2 || null, material_qty_2 !== undefined ? material_qty_2 : null,
            material_type_3 || null, material_qty_3 !== undefined ? material_qty_3 : null,
            material_type_4 || null, material_qty_4 !== undefined ? material_qty_4 : null,
            material_color || null, color_qty !== undefined ? color_qty : null,
            mold_type || null, cavity !== undefined ? cavity : null, cycle_timing !== undefined ? cycle_timing : null,
            stop_reason || null, accumulated_output !== undefined ? accumulated_output : null, hourly_units !== undefined ? hourly_units : null,
            session_start_time || null, resume_time || null, product_name || null, last_report_at || null, 
            last_report_count !== undefined ? last_report_count : null, id
        ];

        await client.query(query, values);

        // Auto Material Consumption logic - ONLY ON START
        if (startingNow) {
            const materialsToUpdate = [
                { name: material_type_1, qty: material_qty_1 },
                { name: material_type_2, qty: material_qty_2 },
                { name: material_type_3, qty: material_qty_3 },
                { name: material_type_4, qty: material_qty_4 }
            ];

            for (const mat of materialsToUpdate) {
                if (mat.name && mat.name.toLowerCase() !== 'none' && parseFloat(mat.qty) > 0) {
                    console.log(`[CONSUMPTION] Deducting ${mat.qty} from ${mat.name}`);
                    const updateRes = await client.query(
                        `UPDATE inventory_materials 
                         SET used_stock = COALESCE(used_stock, 0) + $1, 
                             closing_stock = COALESCE(closing_stock, 0) - $1
                         WHERE LOWER(TRIM(material_name)) = LOWER(TRIM($2)) AND COALESCE(closing_stock, 0) >= $1
                         RETURNING *`,
                        [parseFloat(mat.qty), mat.name]
                    );
                    if (updateRes.rows.length === 0) {
                        console.error(`[CONSUMPTION ERROR] Insufficient stock or material not found: ${mat.name}`);
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: `Insufficient stock or material not found: ${mat.name}` });
                    }
                }
            }

            if (material_color && material_color.toLowerCase() !== 'none' && material_color.toLowerCase() !== 'natural' && parseFloat(color_qty) > 0) {
                console.log(`[CONSUMPTION] Deducting ${color_qty} kgs from color ${material_color}`);
                const colorUpdateRes = await client.query(
                    `UPDATE inventory_colors 
                     SET stock_qty_kgs = COALESCE(stock_qty_kgs, 0) - $1 
                     WHERE LOWER(TRIM(color_name)) = LOWER(TRIM($2)) AND (COALESCE(stock_qty_kgs, 0) - $1) >= 0
                     RETURNING *`,
                    [parseFloat(color_qty), material_color]
                );
                if (colorUpdateRes.rows.length === 0) {
                    console.error(`[CONSUMPTION ERROR] Insufficient color stock for ${material_color}`);
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: `Insufficient color stock or color not found: ${material_color}` });
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) { 
        if (client) await client.query('ROLLBACK');
        console.error(`[PUT-MACHINE-STATUS ERROR] ID: ${id}, Error: ${err.message}`);
        res.status(500).json({ error: err.message }); 
    } finally {
        if (client) client.release();
    }
});

// NEW: Subtract material from inventory while machine is running (Supports Batch)
router.post('/inventory/subtract', async (req, res) => {
    const { materials, machine_id, session_start_time } = req.body;
    // materials = [{ material_name, category, quantity }, ...]
    
    if (!Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ error: 'No materials provided' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const mat of materials) {
            const { material_name, category, quantity } = mat;
            const qty = parseFloat(quantity);
            if (isNaN(qty) || qty <= 0) continue; // Skip invalid entries

            if (category === 'Colors') {
                const result = await client.query(
                    `UPDATE inventory_colors 
                     SET stock_qty_kgs = COALESCE(stock_qty_kgs, 0) - $1 
                     WHERE color_name = $2 AND (COALESCE(stock_qty_kgs, 0) - $1) >= 0
                     RETURNING *`,
                    [qty, material_name]
                );
                if (result.rows.length === 0) throw new Error(`Insufficient color stock for ${material_name}`);
            } else {
                // Default to inventory_materials
                const result = await client.query(
                    `UPDATE inventory_materials 
                     SET used_stock = COALESCE(used_stock, 0) + $1, 
                         closing_stock = COALESCE(closing_stock, 0) - $1
                     WHERE material_name = $2 AND COALESCE(closing_stock, 0) >= $1
                     RETURNING *`,
                    [qty, material_name]
                );
                if (result.rows.length === 0) throw new Error(`Insufficient material stock for ${material_name}`);
            }

            // Log the material addition for traceability
            await client.query(
                `INSERT INTO material_usage_logs (machine_id, session_start_time, material_name, category, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [machine_id || null, session_start_time || null, material_name, category, qty]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error(`[SUBTRACTION ERROR] ${err.message}`);
        res.status(400).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// UPDATED: Added product_name to production logs
router.post('/production_logs', async (req, res) => {
    const { 
        machine_id, shift, material_type_1, material_qty_1, material_type_2, material_qty_2, 
        material_type_3, material_qty_3, material_type_4, material_qty_4, 
        material_color, color_qty, mold_type, cavity, cycle_timing,
        start_time, stop_time, total_output, stop_reason,
        product_name // New Field
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const query = `
            INSERT INTO production_logs (
                machine_id, shift, material_type_1, material_qty_1, material_type_2, material_qty_2, 
                material_type_3, material_qty_3, material_type_4, material_qty_4, 
                material_color, color_qty, mold_type, cavity, cycle_timing,
                start_time, stop_time, total_output, stop_reason, approval_status,
                product_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending', $20)`;

        await client.query(query, [
                machine_id, shift, material_type_1, material_qty_1, material_type_2, material_qty_2,
                material_type_3, material_qty_3, material_type_4, material_qty_4,
                material_color, color_qty, mold_type, cavity, cycle_timing,
                start_time, stop_time, total_output, stop_reason, product_name
            ]);

        await client.query('COMMIT');
        res.status(200).json({ success: true });
    } catch (err) { 
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message }); 
    } finally {
        client.release();
    }
});

// ==========================================
// VENDOR FETCH BY MATERIAL (PRODUCTION HEAD)
// ==========================================
router.get('/vendors/material/:material_id', async (req, res) => {
    const { material_id } = req.params;
    const { category } = req.query;
    try {
        const result = await pool.query(`
            SELECT v.id, v.name, vmp.price_per_kg
            FROM vendors v
            JOIN vendor_material_prices vmp ON v.id = vmp.vendor_id
            WHERE vmp.material_id = $1 AND vmp.category = $2
            ORDER BY v.name ASC
        `, [material_id, category || 'Materials']);
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Vendors by Material Error:", err.message);
        res.status(500).json([]);
    }
});

// ==========================================
// PURCHASE REQUESTS (PRODUCTION HEAD)
// ==========================================
router.get('/inventory/low-stock', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT *, material_name as display_name, closing_stock as current_stock FROM inventory_materials WHERE closing_stock < 50 ORDER BY material_name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/purchase/requests', async (req, res) => {
    let { 
        material_id, 
        material_name, 
        is_new_material,
        category, 
        unit,
        current_stock, 
        requested_quantity, 
        requested_by, 
        vendor_id, 
        vendor_name, 
        is_new_vendor,
        vendor_price, 
        total_price 
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. If new material for 'Others', create it in inventory_others
        if (is_new_material && category === 'Others') {
            const matRes = await client.query(
                'INSERT INTO inventory_others (item_name, stock_qty) VALUES ($1, 0) RETURNING id',
                [material_name]
            );
            material_id = matRes.rows[0].id;
        }

        // 2. If new vendor, create it
        if (is_new_vendor) {
            const vendorRes = await client.query(
                'INSERT INTO vendors (name, created_by) VALUES ($1, $2) RETURNING id',
                [vendor_name, requested_by]
            );
            vendor_id = vendorRes.rows[0].id;

            // Link vendor with material price
            if (material_id) {
                await client.query(
                    `INSERT INTO vendor_material_prices (vendor_id, material_id, category, price_per_kg) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (vendor_id, material_id, category) DO UPDATE SET price_per_kg = EXCLUDED.price_per_kg`,
                    [vendor_id, material_id, category || 'Materials', vendor_price]
                );
            }
        }

        // 3. Create purchase request
        const result = await client.query(
            `INSERT INTO purchase_requests (
                material_id, material_name, category, unit, current_stock, requested_quantity, 
                requested_by, vendor_id, vendor_name, vendor_price, total_price, status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING_ADMIN_APPROVAL') 
             RETURNING *`,
            [
                material_id, material_name, category || 'Materials', unit || 'kg', current_stock, requested_quantity, 
                requested_by, vendor_id, vendor_name, vendor_price, total_price
            ]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Purchase Request Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.get('/purchase/requests', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM purchase_requests ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Alias for accounts frontend
router.get('/purchase-requests', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM purchase_requests ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.patch('/purchase/requests/:id', async (req, res) => {
    const { id } = req.params;
    const { material_name, requested_quantity, vendor_name, vendor_price, total_price } = req.body;
    try {
        const result = await pool.query(
            `UPDATE purchase_requests 
             SET material_name = COALESCE($1, material_name),
                 requested_quantity = COALESCE($2, requested_quantity),
                 vendor_name = COALESCE($3, vendor_name),
                 vendor_price = COALESCE($4, vendor_price),
                 total_price = COALESCE($5, total_price)
             WHERE id = $6 RETURNING *`,
            [material_name, requested_quantity, vendor_name, vendor_price, total_price, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Update Purchase Request Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/purchase/requests/:id/approve', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Update purchase request status
        const requestResult = await client.query(
            "UPDATE purchase_requests SET status = 'APPROVED_BY_ADMIN' WHERE id = $1 RETURNING *",
            [id]
        );
        
        if (requestResult.rows.length === 0) {
            throw new Error('Purchase request not found');
        }
        
        const request = requestResult.rows[0];
        
        // 2. Create a purchase order record so it shows up in Accounts/History
        // This integrates with the existing "Accounts Purchase (debit)" section
        await client.query(
            `INSERT INTO purchase_orders (
                request_id, material_id, material_name, category, unit, requested_quantity, 
                purchased_quantity, vendor_name, price, created_by, 
                status, admin_approval_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'APPROVED_BY_ADMIN', NOW())`,
            [
                request.id, 
                request.material_id, 
                request.material_name,
                request.category || 'Materials',
                request.unit || 'kg',
                request.requested_quantity,
                request.requested_quantity, 
                request.vendor_name,
                request.total_price || (request.vendor_price * request.requested_quantity),
                request.requested_by
            ]
        );
        
        await client.query('COMMIT');
        res.json(request);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Approve Request Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.get('/purchase/requests/approved', async (req, res) => {
    try {
        // Only show approved requests that haven't been turned into a purchase order yet
        const result = await pool.query(`
            SELECT pr.* 
            FROM purchase_requests pr
            LEFT JOIN purchase_orders po ON pr.id = po.request_id
            WHERE pr.status = 'APPROVED_BY_ADMIN' AND po.id IS NULL
            ORDER BY pr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// PURCHASE ORDERS (ACCOUNTS & ADMIN)
// ==========================================
router.post('/purchase/orders', async (req, res) => {
    const { request_id, material_id, material_name, category, requested_quantity, purchased_quantity, vendor_name, price, created_by } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO purchase_orders (request_id, material_id, material_name, category, requested_quantity, purchased_quantity, vendor_name, price, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [request_id, material_id, material_name, category || 'Materials', requested_quantity, purchased_quantity, vendor_name, price, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alias for accounts frontend
router.post('/purchase-orders', async (req, res) => {
    const { request_id, material_id, material_name, category, requested_quantity, purchased_quantity, vendor_name, price, created_by } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO purchase_orders (request_id, material_id, material_name, category, requested_quantity, purchased_quantity, vendor_name, price, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [request_id, material_id, material_name, category || 'Materials', requested_quantity, purchased_quantity, vendor_name, price, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/purchase/orders/pending', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM purchase_orders WHERE status = 'PENDING_ADMIN_PURCHASE_APPROVAL' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Alias for accounts frontend
router.get('/purchase-orders/pending', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM purchase_orders WHERE status = 'PENDING_ADMIN_PURCHASE_APPROVAL' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/purchase/orders/history', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM purchase_orders WHERE status = 'APPROVED_BY_ADMIN' ORDER BY admin_approval_date DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Alias for accounts frontend
router.get('/purchase-orders/history', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM purchase_orders WHERE status = 'APPROVED_BY_ADMIN' ORDER BY admin_approval_date DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.patch('/purchase/orders/:id/approve', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Approve the purchase order
        const result = await client.query(
            "UPDATE purchase_orders SET status = 'APPROVED_BY_ADMIN', admin_approval_date = NOW() WHERE id = $1 RETURNING *",
            [id]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Purchase order not found');
        }
        
        const po = result.rows[0];
        
        // 2. Automatically update inventory
        const qty = parseFloat(po.purchased_quantity);
        const matId = po.material_id;
        const cat = po.category || 'Materials';

        if (cat === 'Materials') {
            await client.query(
                "UPDATE inventory_materials SET closing_stock = closing_stock + $1 WHERE id = $2",
                [qty, matId]
            );
        } else if (cat === 'Colors') {
            await client.query(
                "UPDATE inventory_colors SET stock_qty_kgs = stock_qty_kgs + $1 WHERE id = $2",
                [qty, matId]
            );
        } else if (cat === 'Molds') {
            await client.query(
                "UPDATE inventory_molds SET stock_count = stock_count + $1 WHERE id = $2",
                [Math.round(qty), matId]
            );
        } else if (cat === 'Packing') {
            await client.query(
                "UPDATE inventory_packing SET stock_qty_pcs = stock_qty_pcs + $1 WHERE id = $2",
                [Math.round(qty), matId]
            );
        } else if (cat === 'Others') {
            await client.query(
                "UPDATE inventory_others SET stock_qty = stock_qty + $1 WHERE id = $2",
                [qty, matId]
            );
        }
        
        await client.query('COMMIT');
        res.json(po);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Purchase Order Approval Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.get('/purchase/requests/:id/invoice', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM purchase_requests WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send("Request not found");
        
        const request = result.rows[0];
        
        // Only allow download if approved
        if (request.status !== 'APPROVED_BY_ADMIN' && request.status !== 'COMPLETED') {
            // Check if it's already a purchase order
            const poResult = await pool.query('SELECT * FROM purchase_orders WHERE request_id = $1', [id]);
            if (poResult.rows.length === 0) {
                return res.status(403).send("Request pending admin approval");
            }
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PurchaseInvoice_${id}.pdf`);
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Invoice #: PI-${request.id}`, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Request Date: ${new Date(request.created_at).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Vendor Info
        doc.fontSize(12).font('Helvetica-Bold').text('Vendor Details:');
        doc.fontSize(10).font('Helvetica').text(`Vendor Name: ${request.vendor_name}`);
        doc.moveDown();

        // Requester Info
        doc.fontSize(12).font('Helvetica-Bold').text('Requester Details:');
        doc.fontSize(10).font('Helvetica').text(`Requested By: ${request.requested_by}`);
        doc.moveDown();

        // Table
        doc.fontSize(12).font('Helvetica-Bold').text('Purchase Details:');
        const tableTop = 260;
        doc.font('Helvetica-Bold').text('Material', 50, tableTop);
        doc.text('Qty (kg)', 250, tableTop, { width: 80, align: 'right' });
        doc.text('Price/kg', 350, tableTop, { width: 80, align: 'right' });
        doc.text('Total', 450, tableTop, { width: 100, align: 'right' });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        doc.text(request.material_name, 50, y, { width: 200 });
        doc.text(request.requested_quantity.toString(), 250, y, { width: 80, align: 'right' });
        doc.text(`₹${request.vendor_price}`, 350, y, { width: 80, align: 'right' });
        doc.text(`₹${request.total_price || (request.requested_quantity * request.vendor_price)}`, 450, y, { width: 100, align: 'right' });

        doc.moveTo(50, y + 20).lineTo(550, y + 20).stroke();
        doc.fontSize(12).font('Helvetica-Bold').text(`Grand Total: ₹${request.total_price || (request.requested_quantity * request.vendor_price)}`, 400, y + 40, { width: 150, align: 'right' });
        
        doc.moveDown(5);
        doc.fontSize(10).font('Helvetica').text('Authorized Signature', 50, y + 120);
        doc.text('Production Head', 400, y + 120, { align: 'right' });

        doc.end();
    } catch (err) {
        console.error("PDF Gen Error:", err.message);
        res.status(500).send("Error generating PDF");
    }
});

router.get('/purchase/orders/:id/pdf', async (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.query;
    try {
        const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send("Order not found");
        
        const order = result.rows[0];
        
        // Only allow download if approved or if admin
        if (order.status !== 'APPROVED_BY_ADMIN' && isAdmin !== 'true') {
            return res.status(403).send("Order pending admin approval");
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PurchaseOrder_${id}.pdf`);
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Order #: ${order.id}`, { align: 'right' });
        doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Vendor Details:');
        doc.fontSize(10).font('Helvetica').text(`Vendor Name: ${order.vendor_name}`);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Item Details:');
        const tableTop = 200;
        doc.font('Helvetica-Bold').text('Material', 50, tableTop);
        doc.text('Qty', 350, tableTop, { width: 100, align: 'right' });
        doc.text('Total Price', 450, tableTop, { width: 100, align: 'right' });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        doc.text(order.material_name, 50, y, { width: 300 });
        doc.text(order.purchased_quantity.toString(), 350, y, { width: 100, align: 'right' });
        doc.text(`₹${order.price}`, 450, y, { width: 100, align: 'right' });

        doc.moveTo(50, y + 20).lineTo(550, y + 20).stroke();
        doc.fontSize(12).font('Helvetica-Bold').text(`Grand Total: ₹${order.price}`, 400, y + 40, { width: 150, align: 'right' });
        
        doc.moveDown(4);
        doc.fontSize(10).font('Helvetica').text('Authorized Signature', 50, y + 100);
        doc.text('Accounts Department', 400, y + 100, { align: 'right' });

        doc.end();
    } catch (err) {
        res.status(500).send("Error generating PDF");
    }
});

// ==========================================
// ATTENDANCE & OPERATORS
// ==========================================
router.get('/operators/:shift', async (req, res) => {
    const { shift } = req.params;
    try {
        const result = await pool.query("SELECT operator_id, name FROM operators WHERE assigned_shift = $1", [shift]);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.post('/operators/add', async (req, res) => {
    const { operator_id, name, assigned_shift } = req.body;
    try {
        await pool.query('INSERT INTO operators (operator_id, name, assigned_shift) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [operator_id, name, assigned_shift]);
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/operators/remove/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM operators WHERE operator_id = $1', [req.params.id]);
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reports/operator_list_pdf', async (req, res) => {
    try {
        const result = await pool.query('SELECT operator_id, name, assigned_shift FROM operators ORDER BY assigned_shift ASC, name ASC');
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
        doc.fontSize(20).text('MASTER OPERATOR LIST', { align: 'center' });
        doc.moveDown();
        result.rows.forEach(op => {
            doc.fontSize(10).text(`${op.operator_id} | ${op.name} | ${op.assigned_shift}`);
        });
        doc.end();
    } catch (err) { res.status(500).send("PDF Error"); }
});

router.post('/attendance/enroll', async (req, res) => {
    try {
        for (let r of req.body) {
            await pool.query(
                `INSERT INTO attendance (staff_id, staff_name, shift, status, attendance_date) 
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (staff_id, attendance_date) DO UPDATE SET status = EXCLUDED.status`,
                [r.staff_id, r.staff_name, r.shift, r.status, r.attendance_date]
            );
        }
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/attendance/check', async (req, res) => {
    const { date, shift } = req.query;
    try {
        const result = await pool.query('SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND shift = $2', [date, shift]);
        res.status(200).json({ alreadyMarked: parseInt(result.rows[0]?.count || 0) > 0 });
    } catch (err) { res.status(500).json({ alreadyMarked: false }); }
});

router.get('/attendance/report', async (req, res) => {
    const { from, to, shift } = req.query;
    try {
        const query = `SELECT * FROM attendance WHERE attendance_date BETWEEN $1 AND $2 AND shift = $3 ORDER BY staff_name ASC`;
        const result = await pool.query(query, [from, to, shift]);
        const doc = new PDFDocument({ margin: 20, layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
        doc.text(`Attendance Report: ${shift}`, { align: 'center' });
        result.rows.forEach(r => {
            doc.text(`${r.staff_name} | ${r.status}`);
        });
        doc.end();
    } catch (err) { res.status(500).send("Error"); }
});

// ==========================================
// OPERATOR SHIFT REPORT ROUTES
// ==========================================
router.post('/operator_report', async (req, res) => {
    const { 
        machine_id, machine_name, operator_name, shift, 
        total_production_count, total_production_weight_gm, total_production_weight_kg, 
        wastage, run_start_time, run_end_time 
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO operator_report (
                machine_id, machine_name, operator_name, shift, 
                total_production_count, total_production_weight_gm, total_production_weight_kg, 
                wastage, run_start_time, run_end_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                machine_id, machine_name, operator_name, shift, 
                total_production_count, total_production_weight_gm, total_production_weight_kg, 
                wastage, run_start_time, run_end_time
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Operator Report Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/operator_report', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM operator_report ORDER BY timestamp DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/operator_report/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM operator_report WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Report not found');
        const report = result.rows[0];

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=operator_report_${id}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('OPERATOR SHIFT REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Details
        const drawRow = (label, value) => {
            doc.fontSize(12).font('Helvetica-Bold').text(label + ":", 50, doc.y, { continued: true });
            doc.font('Helvetica').text(" " + (value || 'N/A'), 150, doc.y);
            doc.moveDown(0.5);
        };

        drawRow('Report ID', report.id);
        drawRow('Operator', report.operator_name);
        drawRow('Machine', report.machine_name);
        drawRow('Shift', report.shift);
        drawRow('Total Count', report.total_production_count + " PCS");
        drawRow('Total Weight', report.total_production_weight_gm + " gm (" + report.total_production_weight_kg + " kg)");
        
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('Wastage Notes:');
        doc.fontSize(10).font('Helvetica').text(report.wastage || 'No wastage reported.', { width: 500, align: 'left' });
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        
        drawRow('Run Start', new Date(report.run_start_time).toLocaleString());
        drawRow('Run End', new Date(report.run_end_time).toLocaleString());
        drawRow('Submitted At', new Date(report.timestamp).toLocaleString());

        doc.end();
    } catch (err) {
        console.error("PDF Gen Error:", err);
        res.status(500).send('Error generating PDF');
    }
});

router.get('/reports/monthly_summary', monthlySummary);

module.exports = router;
