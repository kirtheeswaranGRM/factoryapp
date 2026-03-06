const express = require('express');
const router = express.Router();
const pool = require('./db');
const PDFDocument = require('pdfkit');
const { monthlySummary } = require('./downreports');

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
        
        // Log this to your server terminal to verify data is coming through
        console.log("Found products:", result.rows); 
        
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

// ==========================================
// LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password, userRole } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, username, role FROM users WHERE LOWER(username) = LOWER($1) AND password = $2 AND role = $3',
            [email.trim(), password, userRole]
        );
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials." });
        }
    } catch (err) {
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

router.post('/update_approval', async (req, res) => {
    const { log_id, status, operator_name, rejection_reason } = req.body;
    try {
        await pool.query(
            `UPDATE production_logs 
             SET approval_status = $1, operator_name = $2, rejection_reason = $3 
             WHERE log_id = $4`, 
            [status, operator_name || null, rejection_reason || null, log_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

// ==========================================
// OPERATOR / MACHINE ROUTES
// ==========================================
router.get('/machines', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM machine_status ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/hourly_logs', async (req, res) => {
    const { 
        machine_id, machine_name, shift, total_output, hourly_output, 
        chiller_check, compressor_check, mould_check, machine_check, 
        remarks, timestamp 
    } = req.body;
    try {
        await pool.query(
            `INSERT INTO hourly_logs (machine_id, machine_name, shift, total_output, hourly_output, chiller_check, compressor_check, mould_check, machine_check, remarks, timestamp) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [machine_id, machine_name, shift, total_output, hourly_output, chiller_check, compressor_check, mould_check, machine_check, remarks, timestamp || new Date()]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/machines/power-toggle', async (req, res) => {
    const { action } = req.body;
    console.log(`[POWER-TOGGLE] Action: ${action}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let result;
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
                WHERE status = 'paused' AND stop_reason = 'POWER CUT'
                RETURNING id, machine_name, status, start_time`);
            
            console.log(`[RESUME] Updated ${result.rows.length} machines`);
            if (result.rows.length > 0) console.table(result.rows);
        } else {
            throw new Error(`Invalid action: ${action}`);
        }
        await client.query('COMMIT');
        res.json({ success: true, updatedCount: result?.rows?.length || 0 });
    } catch (err) {
        console.error("[ERROR] /machines/power-toggle:", err);
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { if (client) client.release(); }
});

// UPDATED: Added product_name ($23) to machine status update
router.put('/machine_status/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        status, total_output, start_time, shift, 
        material_type_1, material_qty_1, material_type_2, material_qty_2, 
        material_type_3, material_qty_3, material_type_4, material_qty_4, 
        material_color, color_qty, mold_type, cavity, cycle_timing,
        stop_reason, accumulated_output, hourly_units, session_start_time, resume_time,
        product_name // New Field
    } = req.body;

    try {
        const current = await pool.query('SELECT status FROM machine_status WHERE id = $1', [id]);
        if (current.rows[0]?.status === 'paused' && status === 'running') {
            return res.json({ success: true, message: "Blocked overwrite from active app" });
        }

        const isRunning = status === 'running';
        
        const query = `
            UPDATE machine_status SET 
                status = $1, total_output = $2, start_time = $3, shift = $4,
                material_type_1 = $5, material_qty_1 = $6, material_type_2 = $7, material_qty_2 = $8,
                material_type_3 = $9, material_qty_3 = $10, material_type_4 = $11, material_qty_4 = $12,
                material_color = $13, color_qty = $14, mold_type = $15, cavity = $16, cycle_timing = $17,
                stop_reason = $18, accumulated_output = $19, hourly_units = $20, 
                session_start_time = $21, resume_time = $22,
                product_name = $23 
            WHERE id = $24`;

        const values = [
            status, total_output, isRunning ? start_time : null, shift,
            material_type_1, material_qty_1, material_type_2, material_qty_2,
            material_type_3, material_qty_3, material_type_4, material_qty_4,
            material_color, color_qty, mold_type, cavity, cycle_timing,
            stop_reason, accumulated_output, hourly_units || 0,
            session_start_time, resume_time, product_name, id
        ];

        await pool.query(query, values);
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
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

    try {
        const query = `
            INSERT INTO production_logs (
                machine_id, shift, material_type_1, material_qty_1, material_type_2, material_qty_2, 
                material_type_3, material_qty_3, material_type_4, material_qty_4, 
                material_color, color_qty, mold_type, cavity, cycle_timing,
                start_time, stop_time, total_output, stop_reason, approval_status,
                product_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending', $20)`;

        await pool.query(query, [
            machine_id, shift, material_type_1, material_qty_1, material_type_2, material_qty_2,
            material_type_3, material_qty_3, material_type_4, material_qty_4,
            material_color, color_qty, mold_type, cavity, cycle_timing,
            start_time, stop_time, total_output, stop_reason, product_name
        ]);
        res.status(200).json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
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

router.get('/reports/monthly_summary', monthlySummary);

module.exports = router;
