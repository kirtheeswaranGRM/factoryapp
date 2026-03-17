const pool = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COMPANY_DETAILS = {
    name: 'ADHI MANGALA INDUSTRIES',
    tagline: 'MANUFACTURER OF THIN-WALL CONTAINER',
    regd_office: '18 C New Ramnad Road, Madurai - 625 004',
    contact: '0452 2310892, +91-9330966666',
    email: 'aadhimangalam@gmail.com',
    factory_address: '108/1, Sattatham Village, Puliyur Panchayat, SIVAGANGAI - 630561.',
    gstin: '33AATFA4119K1Z8',
    bank_name: 'CITY UNION BANK',
    bank_acc: '512120020095063',
    bank_ifsc: 'CIUB0000283'  
};

const numberToWords = (num) => {
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];

    const inWords = (n) => {
        n = Math.floor(n);
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
        if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + (n % 100 !== 0 ? 'AND ' + inWords(n % 100) : '');
        if (n < 100000) return inWords(Math.floor(n / 1000)) + 'THOUSAND ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'LAKH ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
        return '';
    };

    let str = inWords(num);
    if (!str || str.trim() === '') str = 'ZERO ';
    return 'RUPEES ' + str + 'ONLY';
};

// TASK 2: Sales Home Page – Product Inventory View
exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT *, product_name AS display_name, closing_stock AS stock_qty FROM inventory_product ORDER BY product_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching sales products:", err.message);
        res.status(500).json([]);
    }
};

// TASK 3: Customer Page (Create and List Customers)
exports.getCustomers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sales_customers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
};

exports.addCustomer = async (req, res) => {
    const { name, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO sales_customers (name, category) VALUES ($1, $2) RETURNING id',
            [name, category]
        );
        res.json({ success: true, customerId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: "Failed to add customer" });
    }
};

// History Endpoint
exports.getInvoices = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT h.*, COALESCE(c.name, h.customer_name_manual) as customer_name 
            FROM sales_history h
            LEFT JOIN sales_customers c ON h.customer_id = c.id
            ORDER BY h.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
};

// Batch Number Generator Helper
const generateBatchNumber = async () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${yy}${mm}`;
    
    // Check both sales_requests and sales_history just in case
    const result = await pool.query(
        "SELECT batch_number FROM sales_requests WHERE batch_number LIKE $1 ORDER BY batch_number DESC LIMIT 1",
        [`${prefix}%`]
    );
    
    let nextSeqNum = 1;
    if (result.rows.length > 0) {
        const lastBatch = result.rows[0].batch_number;
        const lastSeqStr = lastBatch.substring(4);
        nextSeqNum = parseInt(lastSeqStr, 10) + 1;
    }
    
    return `${prefix}${nextSeqNum.toString().padStart(5, '0')}`;
};

// Sales Request Endpoints
exports.getSalesRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sr.*, c.name as customer_name 
            FROM sales_requests sr
            LEFT JOIN sales_customers c ON sr.customer_id = c.id
            ORDER BY sr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching sales requests:", err.message);
        res.status(500).json([]);
    }
};

exports.createSalesRequest = async (req, res) => {
    const { customer_id, customer_name_manual, items, total_amount, created_by, gst_enabled, gst_amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const batch_number = await generateBatchNumber();
        
        const requestRes = await client.query(
            `INSERT INTO sales_requests 
            (batch_number, customer_id, customer_name_manual, total_amount, status, created_by, gst_enabled, gst_amount) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [batch_number, customer_id || null, customer_name_manual || null, total_amount, 'Pending approval', created_by, gst_enabled || false, gst_amount || 0]
        );
        const requestId = requestRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO sales_request_items 
                (sales_request_id, product_id, product_name, quantity, unit_price, line_total) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [requestId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, requestId, batch_number });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error creating sales request:", err.message);
        res.status(500).json({ error: "Failed to create sales request" });
    } finally {
        client.release();
    }
};

exports.getSalesRequestDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const requestRes = await pool.query(`
            SELECT sr.*, c.name as customer_name 
            FROM sales_requests sr
            LEFT JOIN sales_customers c ON sr.customer_id = c.id
            WHERE sr.id = $1
        `, [id]);
        
        if (requestRes.rows.length === 0) return res.status(404).json({ error: "Request not found" });
        
        const itemsRes = await pool.query('SELECT * FROM sales_request_items WHERE sales_request_id = $1', [id]);
        
        res.json({
            ...requestRes.rows[0],
            items: itemsRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch details" });
    }
};

exports.updateSalesRequest = async (req, res) => {
    const { id } = req.params;
    const { items, total_amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'UPDATE sales_requests SET total_amount = $1 WHERE id = $2',
            [total_amount, id]
        );
        
        // Simple strategy: delete and re-insert items
        await client.query('DELETE FROM sales_request_items WHERE sales_request_id = $1', [id]);
        
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_request_items 
                (sales_request_id, product_id, product_name, quantity, unit_price, line_total) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
            );
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: "Failed to update request" });
    } finally {
        client.release();
    }
};

exports.approveSalesRequest = async (req, res) => {
    const { id } = req.params;
    const { approved_by } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const requestRes = await client.query('SELECT * FROM sales_requests WHERE id = $1', [id]);
        if (requestRes.rows.length === 0) throw new Error("Request not found");
        const sr = requestRes.rows[0];
        
        if (sr.status === 'Approved') {
            return res.status(400).json({ error: "Already approved" });
        }
        
        // 1. Update status
        await client.query(
            'UPDATE sales_requests SET status = $1, approved_by = $2 WHERE id = $3',
            ['Approved', approved_by, id]
        );
        
        // 2. Create entry in sales_history
        const historyRes = await client.query(
            `INSERT INTO sales_history 
            (batch_number, invoice_number, sales_request_id, customer_id, customer_name_manual, total_amount, status, approved_by, gst_enabled, gst_amount) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [sr.batch_number, sr.batch_number, sr.id, sr.customer_id, sr.customer_name_manual, sr.total_amount, 'Approved', approved_by, sr.gst_enabled, sr.gst_amount]
        );
        const historyId = historyRes.rows[0].id;
        
        // 3. Copy items
        const itemsRes = await client.query('SELECT * FROM sales_request_items WHERE sales_request_id = $1', [id]);
        for (const item of itemsRes.rows) {
            await client.query(
                `INSERT INTO sales_history_items 
                (sales_history_id, product_id, product_name, quantity, unit_price, line_total) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [historyId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
            );
        }
        
        await client.query('COMMIT');
        res.json({ success: true, message: "Request approved and moved to history" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error approving request:", err.message);
        res.status(500).json({ error: err.message || "Failed to approve request" });
    } finally {
        client.release();
    }
};

exports.rejectSalesRequest = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE sales_requests SET status = $1 WHERE id = $2', ['Rejected', id]);
        res.json({ success: true, message: "Request rejected" });
    } catch (err) {
        res.status(500).json({ error: "Failed to reject request" });
    }
};

// Approval Endpoint for Admin
exports.updateInvoiceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query(
            'UPDATE sales_invoices SET approval_status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ success: true, message: `Invoice ${status}` });
    } catch (err) {
        res.status(500).json({ error: "Failed to update status" });
    }
};

// TASK 4: Invoice Page (Create + Download Invoice PDF)
exports.createInvoice = async (req, res) => {
    const { customer_id, customer_name, category, products, total_amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const invoiceRes = await client.query(
            'INSERT INTO sales_invoices (customer_id, customer_name, category, total_amount, approval_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [customer_id || null, customer_name, category, total_amount, 'pending']
        );
        const invoiceId = invoiceRes.rows[0].id;

        for (const p of products) {
            await client.query(
                'INSERT INTO sales_invoice_items (invoice_id, product_id, product_name, quantity, price_per_unit, line_total) VALUES ($1, $2, $3, $4, $5, $6)',
                [invoiceId, p.product_id, p.product_name, p.quantity, p.price_per_unit, p.line_total]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, invoiceId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: "Failed to create invoice" });
    } finally {
        client.release();
    }
};

exports.generateInvoicePDF = async (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.query; 
    try {
        const historyRes = await pool.query(`
            SELECT h.*, COALESCE(c.name, h.customer_name_manual) as customer_name 
            FROM sales_history h
            LEFT JOIN sales_customers c ON h.customer_id = c.id
            WHERE h.id = $1
        `, [id]);
        
        if (historyRes.rows.length === 0) return res.status(404).send("Invoice history not found");
        
        const invoice = historyRes.rows[0];

        if (invoice.status !== 'Approved' && invoice.status !== 'Invoiced' && isAdmin !== 'true') {
            return res.status(403).send("Invoice pending admin approval");
        }
        
        const itemsRes = await pool.query(`
            SELECT 
                i.*, 
                COALESCE(NULLIF(i.product_name, ''), p.product_name) as final_product_name 
            FROM sales_history_items i
            LEFT JOIN inventory_product p ON i.product_id = p.id
            WHERE i.sales_history_id = $1
        `, [id]);
        const items = itemsRes.rows;

        // Ensure numeric values to prevent NaN
        const totalTaxable = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
        
        // Always calculate 9% CGST and 9% SGST as requested
        const cgst = totalTaxable * 0.09;
        const sgst = totalTaxable * 0.09;
        const grandTotal = Math.round(totalTaxable + cgst + sgst);

        const roundOff = Number(invoice.round_off || (grandTotal - (totalTaxable + cgst + sgst)));

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.batch_number}.pdf`);
        
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        doc.pipe(res);

        const pageWidth = 535;
        const startX = 30;
        const startY = 30;

        // DRAW MAIN BORDER
        doc.rect(startX, startY, pageWidth, 780).stroke();

        // LOGO
        try {
            const logoPath = path.join(__dirname, '..', 'logo.jpeg');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, startX + 5, startY + 5, { width: 45 });
            }
        } catch (e) {
            console.log("Logo skip in PDF:", e.message);
        }

        // HEADER SECTION
        doc.fontSize(16).font('Helvetica-Bold').text(COMPANY_DETAILS.name, startX + 55, startY + 10);
        doc.fontSize(8).font('Helvetica-Bold').text(COMPANY_DETAILS.tagline, startX + 55, startY + 28);
        
        doc.fontSize(8).font('Helvetica-Bold').text('Regd.Office :', startX + 285, startY + 10);
        doc.fontSize(8).font('Helvetica').text(COMPANY_DETAILS.regd_office, startX + 345, startY + 10, { width: 180 });
        doc.text(`Contact : ${COMPANY_DETAILS.contact}`, startX + 345, startY + 28);
        doc.text(`E-Mail : ${COMPANY_DETAILS.email}`, startX + 345, startY + 38);

        doc.fontSize(7).font('Helvetica-Bold').fillColor('red').text(`Factory At: ${COMPANY_DETAILS.factory_address}`, startX + 10, startY + 45);
        doc.fillColor('black');
        doc.moveTo(startX, startY + 60).lineTo(startX + pageWidth, startY + 60).stroke();

        // INVOICE DETAILS
        doc.fontSize(8).font('Helvetica');
        doc.text(`GSTIN Number: ${COMPANY_DETAILS.gstin}`, startX + 5, startY + 65);
        doc.text(`Tax Reverse Charge: NO`, startX + 5, startY + 75);
        doc.text(`Invoice No: ${invoice.invoice_number}`, startX + 5, startY + 85);
        doc.text(`Invoice Date: ${new Date(invoice.created_at).toLocaleDateString('en-GB')}`, startX + 5, startY + 95);

        doc.fontSize(10).font('Helvetica-Bold').text('GST SALES', startX + 195, startY + 65);
        doc.text('CREDIT', startX + 205, startY + 78);

        doc.fontSize(7).font('Helvetica').text('Despatched through:', startX + 285, startY + 65);
        doc.text('Vehicle No:', startX + 285, startY + 75);
        doc.text('Terms of Payment: immediate', startX + 285, startY + 85);
        doc.text('Due on:', startX + 285, startY + 95);

        doc.moveTo(startX + 280, startY + 60).lineTo(startX + 280, startY + 110).stroke();
        doc.moveTo(startX, startY + 110).lineTo(startX + pageWidth, startY + 110).stroke();

        // PARTY DETAILS
        doc.fontSize(8).font('Helvetica-Bold').text('Details of Receiver (Billed to)', startX + 5, startY + 115);
        doc.text('Details of consignee (Shipped to)', startX + 285, startY + 115);
        
        const partyY = startY + 130;
        doc.font('Helvetica').text(`Name: ${invoice.customer_name || ''}`, startX + 5, partyY);
        doc.text(`Address: ${invoice.customer_address || ''}`, startX + 5, partyY + 10, { width: 250 });
        doc.text(`GSTIN: ${invoice.customer_gstin || ''}`, startX + 5, partyY + 55);

        doc.text(`Name: ${invoice.customer_name || ''}`, startX + 285, partyY);
        doc.text(`Address: ${invoice.customer_address || ''}`, startX + 285, partyY + 10, { width: 250 });
        doc.text(`GSTIN: ${invoice.customer_gstin || ''}`, startX + 285, partyY + 55);

        doc.moveTo(startX + 280, startY + 110).lineTo(startX + 280, startY + 210).stroke();
        doc.moveTo(startX, startY + 210).lineTo(startX + pageWidth, startY + 210).stroke();

        // TABLE
        const tableTop = startY + 210;
        const colX = [startX, startX + 25, startX + 135, startX + 185, startX + 235, startX + 275, startX + 315, startX + 365, startX + 415, startX + 475];
        const headers = ['SL.NO', 'Description of Goods', 'HSN Code', 'Alt.Qty', 'Colour', 'UOM', 'QTY', 'Rate', 'Taxable Value'];

        doc.fontSize(7).font('Helvetica-Bold');
        headers.forEach((h, i) => {
            doc.text(h, colX[i], tableTop + 5, { width: (colX[i+1] || startX + pageWidth) - colX[i], align: 'center' });
            if (i > 0) doc.moveTo(colX[i], tableTop).lineTo(colX[i], tableTop + 250).stroke();
        });
        doc.moveTo(startX, tableTop + 20).lineTo(startX + pageWidth, tableTop + 20).stroke();

        let currentY = tableTop + 25;
        let totalQty = 0;
        items.forEach((item, index) => {
            doc.font('Helvetica').fontSize(7);
            doc.text(index + 1, colX[0], currentY, { width: 25, align: 'center' });
            doc.text(item.final_product_name || '', colX[1] + 3, currentY);
            doc.text(item.hsn || '39231090', colX[2], currentY, { width: 50, align: 'center' });
            doc.text(item.quantity.toString(), colX[6], currentY, { width: 50, align: 'center' });
            doc.text(Number(item.unit_price).toFixed(2), colX[7], currentY, { width: 50, align: 'center' });
            doc.text(Number(item.line_total).toFixed(2), colX[8], currentY, { width: 60, align: 'right' });
            totalQty += Number(item.quantity);
            currentY += 15;
        });

        // TOTALS & TAX BOX
        const tableBottom = tableTop + 250;
        doc.moveTo(startX, tableBottom).lineTo(startX + pageWidth, tableBottom).stroke();
        doc.fontSize(8).font('Helvetica-Bold').text(totalQty.toString(), colX[6], tableBottom + 5, { width: 50, align: 'center' });

        const taxBoxWidth = 160; 
        const taxBoxX = startX + pageWidth - taxBoxWidth;
        doc.moveTo(taxBoxX, tableBottom).lineTo(taxBoxX, tableBottom + 100).stroke();
        
        const renderTaxRow = (label, value, y) => {
            doc.font('Helvetica').fontSize(8).text(label, taxBoxX + 5, y);
            doc.text(Number(value).toFixed(2), startX + pageWidth - 55, y, { width: 50, align: 'right' });
        };

        renderTaxRow('Total', totalTaxable, tableBottom + 5);
        renderTaxRow('cgst @ 9%', cgst, tableBottom + 16);
        renderTaxRow('sgst @ 9%', sgst, tableBottom + 27);
        renderTaxRow('Forwarding', 0, tableBottom + 38);
        renderTaxRow('Postage', 0, tableBottom + 49);
        renderTaxRow('R.Off', roundOff, tableBottom + 60);
        
        doc.moveTo(taxBoxX, tableBottom + 72).lineTo(startX + pageWidth, tableBottom + 72).stroke();
        doc.font('Helvetica-Bold').fontSize(8).text('Invoice Total', taxBoxX + 5, tableBottom + 78);
        doc.text(grandTotal.toFixed(2), startX + pageWidth - 55, tableBottom + 78, { width: 50, align: 'right' });

        // FOOTER & BANK
        doc.font('Helvetica').fontSize(8).text('Rupees (In words):', startX + 5, tableBottom + 5);
        doc.font('Helvetica-Bold').text(numberToWords(grandTotal), startX + 5, tableBottom + 15, { width: 380 });

        const bankY = tableBottom + 40;
        doc.fontSize(8).font('Helvetica-Bold').text(COMPANY_DETAILS.name, startX + 70, bankY);
        doc.font('Helvetica').fontSize(8).text(COMPANY_DETAILS.bank_name, startX + 70, bankY + 10);
        doc.text(`A/C NO: ${COMPANY_DETAILS.bank_acc}`, startX + 70, bankY + 20);
        doc.text(`IFSC CODE: ${COMPANY_DETAILS.bank_ifsc}`, startX + 70, bankY + 30);

        // HSN SUMMARY
        const hsnY = tableBottom + 100;
        doc.fontSize(7).font('Helvetica-Bold').text('Amount of Tax Subject to Reverse Charge', startX, hsnY - 10, { align: 'center', width: pageWidth });
        
        doc.rect(startX, hsnY, pageWidth, 55).stroke();
        doc.moveTo(startX, hsnY + 15).lineTo(startX + pageWidth, hsnY + 15).stroke();
        
        // Vertical lines for HSN table
        const hsnCols = [startX, startX + 110, startX + 220, startX + 260, startX + 310, startX + 350, startX + 400, startX + pageWidth];
        hsnCols.forEach(x => {
            doc.moveTo(x, hsnY).lineTo(x, hsnY + 55).stroke();
        });

        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('E Way Bill No:', startX + 5, hsnY - 22);
        doc.text('E Way Bill Dt:', startX + pageWidth - 100, hsnY - 22);

        doc.text('HSN', startX, hsnY + 5, { width: 110, align: 'center' });
        doc.text('TAXABLE VALUE', startX + 110, hsnY + 5, { width: 110, align: 'center' });
        
        doc.text('CGST', startX + 220, hsnY + 2, { width: 90, align: 'center' });
        doc.moveTo(startX + 220, hsnY + 9).lineTo(startX + 310, hsnY + 9).stroke();
        doc.text('RATE', startX + 220, hsnY + 10, { width: 40, align: 'center' });
        doc.text('AMOUNT', startX + 260, hsnY + 10, { width: 50, align: 'center' });

        doc.text('SGST', startX + 310, hsnY + 2, { width: 90, align: 'center' });
        doc.moveTo(startX + 310, hsnY + 9).lineTo(startX + 400, hsnY + 9).stroke();
        doc.text('RATE', startX + 310, hsnY + 10, { width: 40, align: 'center' });
        doc.text('AMOUNT', startX + 350, hsnY + 10, { width: 50, align: 'center' });

        doc.text('TOTAL TAX AMOUNT', startX + 400, hsnY + 5, { width: 135, align: 'center' });

        doc.font('Helvetica').fontSize(7);
        doc.text('39231090', startX, hsnY + 20, { width: 110, align: 'center' });
        doc.text(totalTaxable.toFixed(2), startX + 110, hsnY + 20, { width: 110, align: 'center' });
        
        doc.text('9%', startX + 220, hsnY + 20, { width: 40, align: 'center' });
        doc.text(cgst.toFixed(2), startX + 260, hsnY + 20, { width: 50, align: 'center' });
        doc.text('9%', startX + 310, hsnY + 20, { width: 40, align: 'center' });
        doc.text(sgst.toFixed(2), startX + 350, hsnY + 20, { width: 50, align: 'center' });
        doc.text((cgst + sgst).toFixed(2), startX + 400, hsnY + 20, { width: 135, align: 'center' });

        doc.font('Helvetica-Bold').text('TOTAL', startX, hsnY + 40, { width: 110, align: 'right' });
        doc.text(totalTaxable.toFixed(2), startX + 110, hsnY + 40, { width: 110, align: 'center' });
        doc.text(cgst.toFixed(2), startX + 260, hsnY + 40, { width: 50, align: 'center' });
        doc.text(sgst.toFixed(2), startX + 350, hsnY + 40, { width: 50, align: 'center' });
        doc.text((cgst + sgst).toFixed(2), startX + 400, hsnY + 40, { width: 135, align: 'center' });

        const finalY = hsnY + 65;
        doc.fontSize(7).font('Helvetica-Bold').text('TERMS & CONDITION OF SALE', startX, finalY - 8, { align: 'center', width: pageWidth });
        doc.rect(startX, finalY, pageWidth, 60).stroke();
        doc.moveTo(startX + 340, finalY).lineTo(startX + 340, finalY + 60).stroke();
        
        doc.font('Helvetica').fontSize(6);
        const terms = "Declaration: We declare that this invoice shows the actual price of the goods. Goods once sold cannot be taken back or exchanged. No claims allowed after the goods have left our godown. Our responsibility ceases as soon as the goods leave our Godown. Interest @ 36% p.a. will be charged on accounts not paid within";
        doc.text(terms, startX + 5, finalY + 5, { width: 330 });

        doc.fontSize(7).font('Helvetica-Bold').text(COMPANY_DETAILS.name, startX + 345, finalY + 5, { align: 'center', width: 185 });
        doc.text('Authorised Signatory', startX + 345, finalY + 45, { align: 'center', width: 185 });

        doc.end();
    } catch (err) {
        console.error("PDF Gen Error:", err.message);
        res.status(500).send("Error generating PDF");
    }
};

exports.getInvoiceItems = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM sales_history_items WHERE sales_history_id = $1',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching invoice items:", err.message);
        res.status(500).json([]);
    }
};
