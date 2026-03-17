const pool = require('./db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');

// Ensure upload directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const QR_DIR = path.join(UPLOADS_DIR, 'qrcodes');
const PDF_DIR = path.join(UPLOADS_DIR, 'pdfs');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR);
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR);

// 1. Fetch sales data by batch number
exports.fetchSalesByBatch = async (req, res) => {
    const { batch_number } = req.params;
    try {
        const result = await pool.query(`
            SELECT h.*, COALESCE(c.name, h.customer_name_manual) as customer_name 
            FROM sales_history h
            LEFT JOIN sales_customers c ON h.customer_id = c.id
            WHERE h.batch_number = $1
        `, [batch_number]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Invalid batch number" });
        }

        const history = result.rows[0];
        const itemsRes = await pool.query('SELECT * FROM sales_history_items WHERE sales_history_id = $1', [history.id]);
        
        res.json({
            ...history,
            items: itemsRes.rows
        });
    } catch (err) {
        console.error("Fetch Sales by Batch Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. Create Packing List
exports.createPackingList = async (req, res) => {
    const { batch_number, sales_history_id, customer_id, customer_name, items, created_by, prod_head_name } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const plRes = await client.query(
            `INSERT INTO packing_list (batch_number, sales_history_id, customer_id, customer_name, created_by) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [batch_number, sales_history_id, customer_id, customer_name, created_by]
        );
        const packingListId = plRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO packing_list_item (packing_list_id, product_id, product_name, quantity) 
                 VALUES ($1, $2, $3, $4)`,
                [packingListId, item.product_id, item.product_name, item.quantity]
            );
        }

        // Generate PDF
        const filename = `PackingList_${batch_number}.pdf`;
        const filePath = path.join(PDF_DIR, filename);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).text('PACKING LIST', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Batch Number: ${batch_number}`);
        doc.text(`Customer: ${customer_name}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Created By: ${prod_head_name || 'Prod Head'}`);
        doc.moveDown();

        doc.fontSize(14).text('Products:');
        doc.moveDown(0.5);
        items.forEach(item => {
            doc.fontSize(12).text(`- ${item.product_name}: ${item.quantity}`);
        });

        doc.end();

        await client.query('COMMIT');
        res.json({ success: true, packingListId, pdf_url: `/uploads/pdfs/${filename}` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Packing List Error:", err.message);
        res.status(500).json({ error: "Failed to create packing list" });
    } finally {
        client.release();
    }
};

// 3. List Packing Lists
exports.getPackingLists = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pl.*, u.username as created_by_name 
            FROM packing_list pl
            LEFT JOIN users u ON pl.created_by = u.id
            ORDER BY pl.created_at DESC
        `);
        
        // Add summary
        for (let row of result.rows) {
            const itemsRes = await pool.query('SELECT product_name, quantity FROM packing_list_item WHERE packing_list_id = $1', [row.id]);
            row.items_summary = itemsRes.rows.map(i => `${i.product_name} (${i.quantity})`).join(', ');
            row.pdf_url = `/uploads/pdfs/PackingList_${row.batch_number}.pdf`;

            // Fetch latest material report status
            const reportRes = await pool.query('SELECT status FROM packing_material_report WHERE packing_list_id = $1 ORDER BY created_at DESC LIMIT 1', [row.id]);
            row.material_report_status = reportRes.rows.length > 0 ? reportRes.rows[0].status : null;
        }
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch packing lists" });
    }
};

// 4. Create Sticker
exports.createSticker = async (req, res) => {
    const { packing_list_id, batch_number, customer_name, weight, items } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const stickerNumber = `STK-${Date.now()}`;
        const qrData = stickerNumber; // Or batch_number
        const qrFilename = `QR_${stickerNumber}.png`;
        const qrPath = path.join(QR_DIR, qrFilename);

        await qrcode.toFile(qrPath, qrData);

        const pdfFilename = `Sticker_${stickerNumber}.pdf`;
        const pdfPathLocal = path.join(PDF_DIR, pdfFilename);

        const stickerRes = await client.query(
            `INSERT INTO packing_sticker (packing_list_id, sticker_number, batch_number, weight, qr_data, qr_image_path, pdf_path) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [packing_list_id, stickerNumber, batch_number, weight, qrData, `/uploads/qrcodes/${qrFilename}`, `/uploads/pdfs/${pdfFilename}`]
        );

        // Generate Sticker PDF
        const doc = new PDFDocument({ size: [400, 250], margin: 15 });
        const stream = fs.createWriteStream(pdfPathLocal);
        doc.pipe(stream);

        const leftColX = 20;
        const rightColX = 160;
        let currentY = 30;

        // Left Column: Batch No & QR Code
        doc.fontSize(22).font('Helvetica-Bold').text('Batch No:', leftColX, currentY);
        doc.fontSize(22).text(batch_number, leftColX, currentY + 25);
        
        if (fs.existsSync(qrPath)) {
            doc.image(qrPath, leftColX, currentY + 60, { width: 120 });
        }

        // Right Column: Details
        doc.fontSize(22).font('Helvetica').text(`Customer: ${customer_name}`, rightColX, currentY);
        doc.text(`Weight: ${weight} KG`, rightColX, currentY + 40);
        
        doc.fontSize(20).text('Products:', rightColX, currentY + 90);
        
        let itemY = currentY + 120;
        doc.fontSize(18);
        items.forEach(item => {
            doc.text(`${item.product_name}: ${item.quantity}`, rightColX, itemY);
            itemY += 25;
        });

        doc.end();

        await client.query('COMMIT');
        res.json({ success: true, sticker_number: stickerNumber });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Sticker Error:", err.message);
        res.status(500).json({ error: "Failed to create sticker" });
    } finally {
        client.release();
    }
};

// 5. List Stickers
exports.getStickers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM packing_sticker ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stickers" });
    }
};

// 6. Get Sticker by QR Data
exports.getStickerByQR = async (req, res) => {
    const { qr_data } = req.params;
    try {
        const result = await pool.query(`
            SELECT s.*, pl.customer_name 
            FROM packing_sticker s
            JOIN packing_list pl ON s.packing_list_id = pl.id
            WHERE s.qr_data = $1 OR s.sticker_number = $1
        `, [qr_data]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Sticker not found" });

        const sticker = result.rows[0];
        const itemsRes = await pool.query('SELECT * FROM packing_list_item WHERE packing_list_id = $1', [sticker.packing_list_id]);
        
        res.json({
            ...sticker,
            items: itemsRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sticker details" });
    }
};

// 7. Dispatch
exports.dispatchSticker = async (req, res) => {
    const { sticker_id, dispatched_by } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if already dispatched
        const checkRes = await client.query('SELECT status, packing_list_id, batch_number, sticker_number, weight FROM packing_sticker WHERE id = $1', [sticker_id]);
        if (checkRes.rows.length === 0) throw new Error("Sticker not found");
        if (checkRes.rows[0].status === 'Dispatched') throw new Error("Already dispatched");

        const { packing_list_id, batch_number, sticker_number, weight } = checkRes.rows[0];

        // Get items and customer info
        const plRes = await client.query('SELECT customer_id, customer_name FROM packing_list WHERE id = $1', [packing_list_id]);
        const { customer_id, customer_name } = plRes.rows[0];
        const itemsRes = await client.query('SELECT * FROM packing_list_item WHERE packing_list_id = $1', [packing_list_id]);
        const items = itemsRes.rows;

        // 1. Inventory update for Products
        for (const item of items) {
            const updateRes = await client.query(
                `UPDATE inventory_product 
                 SET used_stock = COALESCE(used_stock, 0) + $1,
                     closing_stock = COALESCE(closing_stock, 0) - $1 
                 WHERE (LOWER(TRIM(product_name)) = LOWER(TRIM($2)) OR id = $3) AND (COALESCE(closing_stock, 0) - $1) >= 0
                 RETURNING *`,
                [Math.round(parseFloat(item.quantity)), item.product_name, item.product_id]
            );

            if (updateRes.rows.length === 0) {
                throw new Error(`Insufficient stock for product: ${item.product_name}`);
            }
        }

        // 2. Inventory update for Packing Materials (from Approved Reports)
        const materialReportsRes = await client.query(
            `SELECT id FROM packing_material_report WHERE packing_list_id = $1 AND status = 'Approved'`,
            [packing_list_id]
        );

        for (const report of materialReportsRes.rows) {
            const materialItemsRes = await client.query(
                `SELECT * FROM packing_material_report_item WHERE report_id = $1`,
                [report.id]
            );

            for (const materialItem of materialItemsRes.rows) {
                const qty = Math.round(parseFloat(materialItem.quantity));
                const updateMatRes = await client.query(
                    `UPDATE inventory_packing 
                     SET stock_qty_pcs = stock_qty_pcs - $1 
                     WHERE id = $2 AND (stock_qty_pcs - $1) >= 0
                     RETURNING *`,
                    [qty, materialItem.packing_material_id]
                );

                if (updateMatRes.rows.length === 0) {
                    const nameRes = await client.query('SELECT item_name FROM inventory_packing WHERE id = $1', [materialItem.packing_material_id]);
                    throw new Error(`Insufficient stock for packing material: ${nameRes.rows[0]?.item_name || 'Unknown'}`);
                }
            }

            // Mark the material report as Dispatched
            await client.query(
                `UPDATE packing_material_report SET status = 'Dispatched' WHERE id = $1`,
                [report.id]
            );
        }

        // Create Dispatch record
        const dispatchRes = await client.query(
            `INSERT INTO dispatch (batch_number, packing_list_id, packing_sticker_id, customer_id, customer_name, dispatched_by) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [batch_number, packing_list_id, sticker_id, customer_id, customer_name, dispatched_by]
        );
        const dispatchId = dispatchRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO dispatch_item (dispatch_id, product_id, product_name, quantity) 
                 VALUES ($1, $2, $3, $4)`,
                [dispatchId, item.product_id, item.product_name, item.quantity]
            );
        }

        // Update sticker status
        await client.query('UPDATE packing_sticker SET status = \'Dispatched\' WHERE id = $1', [sticker_id]);
        await client.query('UPDATE packing_list SET status = \'Dispatched\' WHERE id = $1', [packing_list_id]);

        // Generate Dispatch PDF
        const pdfFilename = `Dispatch_${batch_number}_${sticker_number}.pdf`;
        const pdfPathLocal = path.join(PDF_DIR, pdfFilename);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPathLocal);
        doc.pipe(stream);

        doc.fontSize(20).text('DISPATCH NOTE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Batch Number: ${batch_number}`);
        doc.text(`Sticker Number: ${sticker_number}`);
        doc.text(`Customer: ${customer_name}`);
        doc.text(`Weight: ${weight} KG`);
        doc.text(`Dispatch Date: ${new Date().toLocaleString()}`);
        doc.moveDown();

        doc.fontSize(14).text('Products:');
        items.forEach(item => {
            doc.text(`- ${item.product_name}: ${item.quantity}`);
        });

        doc.end();

        await client.query('UPDATE dispatch SET pdf_path = $1 WHERE id = $2', [`/uploads/pdfs/${pdfFilename}`, dispatchId]);

        await client.query('COMMIT');
        res.json({ success: true, dispatchId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Dispatch Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// 8. Dispatch History
exports.getDispatchHistory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, u.username as dispatched_by_name 
            FROM dispatch d
            LEFT JOIN users u ON d.dispatched_by = u.id
            ORDER BY d.dispatched_at DESC
        `);
        
        // Fetch items for each dispatch
        for (let row of result.rows) {
            const itemsRes = await pool.query('SELECT product_name, quantity FROM dispatch_item WHERE dispatch_id = $1', [row.id]);
            row.items_summary = itemsRes.rows.map(i => `${i.product_name} (${i.quantity})`).join(', ');
        }
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch dispatch history" });
    }
};

// 9. Get Packing Materials
exports.getPackingMaterials = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, item_name, stock_qty_pcs FROM inventory_packing ORDER BY item_name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch packing materials" });
    }
};

// 10. Create Material Report
exports.createMaterialReport = async (req, res) => {
    const { packing_list_id, batch_number, created_by, items } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const reportRes = await client.query(
            `INSERT INTO packing_material_report (packing_list_id, batch_number, created_by) 
             VALUES ($1, $2, $3) RETURNING id`,
            [packing_list_id, batch_number, created_by]
        );
        const reportId = reportRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO packing_material_report_item (report_id, packing_material_id, quantity) 
                 VALUES ($1, $2, $3)`,
                [reportId, item.packing_material_id, item.quantity]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, reportId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Material Report Error:", err.message);
        res.status(500).json({ error: "Failed to create material report" });
    } finally {
        client.release();
    }
};

// 11. Get Material Reports (with optional filter)
exports.getMaterialReports = async (req, res) => {
    const { status, batch_number } = req.query;
    try {
        let query = `
            SELECT r.*, u.username as creator_name, a.username as approver_name
            FROM packing_material_report r
            LEFT JOIN users u ON r.created_by = u.id
            LEFT JOIN users a ON r.approved_by = a.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND r.status = $${params.length}`;
        }
        if (batch_number) {
            params.push(`%${batch_number}%`);
            query += ` AND r.batch_number LIKE $${params.length}`;
        }

        query += " ORDER BY r.created_at DESC";

        const result = await pool.query(query, params);
        
        // Fetch items for each report
        for (let row of result.rows) {
            const itemsRes = await pool.query(`
                SELECT ri.*, ip.item_name 
                FROM packing_material_report_item ri
                JOIN inventory_packing ip ON ri.packing_material_id = ip.id
                WHERE ri.report_id = $1
            `, [row.id]);
            row.items = itemsRes.rows;
        }

        res.json(result.rows);
    } catch (err) {
        console.error("Get Material Reports Error:", err.message);
        res.status(500).json({ error: "Failed to fetch material reports" });
    }
};

// 12. Approve Material Report
exports.approveMaterialReport = async (req, res) => {
    const { report_id, approved_by } = req.body;
    console.log(`[APPROVE-MATERIAL] Report ID: ${report_id}, Approved By: ${approved_by}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check report status
        const reportRes = await client.query('SELECT status, batch_number FROM packing_material_report WHERE id = $1', [report_id]);
        if (reportRes.rows.length === 0) throw new Error("Report not found");
        console.log(`[APPROVE-MATERIAL] Report current status: ${reportRes.rows[0].status}`);
        if (reportRes.rows[0].status !== 'Pending') throw new Error("Report is already " + reportRes.rows[0].status);

        // Update report status to Approved (but DO NOT subtract stock yet, subtraction happens on Dispatch)
        await client.query(
            `UPDATE packing_material_report 
             SET status = 'Approved', approved_by = $1, approved_at = NOW() 
             WHERE id = $2`,
            [approved_by, report_id]
        );

        await client.query('COMMIT');
        console.log(`[APPROVE-MATERIAL] Report ${report_id} marked as Approved (Stock will be deducted on Dispatch)`);
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Approve Material Report Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// 13. Reject Material Report
exports.rejectMaterialReport = async (req, res) => {
    const { report_id, approved_by } = req.body; // approved_by is the one rejecting
    try {
        await pool.query(
            `UPDATE packing_material_report 
             SET status = 'Rejected', approved_by = $1, approved_at = NOW() 
             WHERE id = $2 AND status = 'Pending'`,
            [approved_by, report_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to reject material report" });
    }
};
