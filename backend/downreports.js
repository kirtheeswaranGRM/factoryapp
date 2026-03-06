const pool = require('./db'); // Your PostgreSQL pool
const PDFDocument = require('pdfkit');

exports.monthlySummary = async (req, res) => {
    const { from, to } = req.query;

    try {
        const query = `
            SELECT 
                created_at::date as production_date,
                machine_id,
                product_name, 
                SUM(total_output) as total_produced, 
                COUNT(*) as log_entries
            FROM production_logs
            WHERE created_at::date >= $1 AND created_at::date <= $2
            GROUP BY created_at::date, machine_id, product_name
            ORDER BY created_at::date DESC, machine_id ASC, total_produced DESC
        `;
        const result = await pool.query(query, [from, to]);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Production_Summary.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // --- PDF HEADER ---
        doc.fontSize(20).font('Helvetica-Bold').text('DAILY MACHINE PRODUCTION REPORT', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Range: ${from} to ${to}`, { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        if (result.rows.length === 0) {
            doc.fontSize(12).fillColor('red').text('No data found for the selected range.', 50, 150);
        } else {
            let y = doc.y + 10;
            let currentHeaderDate = "";
            let currentMachineId = "";

            result.rows.forEach((row) => {
                // Formatting the date for display
                const rowDate = new Date(row.production_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });

                // 1. Check if the DATE has changed
                if (currentHeaderDate !== rowDate) {
                    currentHeaderDate = rowDate;
                    currentMachineId = ""; // Reset machine check for the new date
                    
                    // Add extra space before new date (except for the first row)
                    if (y > 150) y += 15; 

                    // Page break check
                    if (y > 700) { doc.addPage(); y = 50; }

                    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5f7a').text(`DATE: ${currentHeaderDate}`, 50, y);
                    y += 20;
                    doc.moveTo(50, y - 5).lineTo(200, y - 5).stroke('#1a5f7a');
                }

                // 2. Check if the MACHINE ID has changed within that date
                if (currentMachineId !== row.machine_id) {
                    currentMachineId = row.machine_id;

                    if (y > 700) { doc.addPage(); y = 50; }

                    doc.fontSize(11).font('Helvetica-Bold').fillColor('#d9534f').text(`Machine ID: ${currentMachineId}`, 60, y);
                    y += 15;

                    // Sub-headers for the table
                    doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
                    doc.text('Product Name', 70, y);
                    doc.text('Total Qty', 350, y);
                    doc.text('Logs', 480, y);
                    y += 15;
                }

                // 3. Print the actual PRODUCT data
                if (y > 750) { doc.addPage(); y = 50; }

                doc.fontSize(10).font('Helvetica').fillColor('black');
                doc.text(row.product_name || 'N/A', 70, y, { width: 250 });
                doc.text(row.total_produced?.toString() || '0', 350, y);
                doc.text(row.log_entries?.toString() || '0', 480, y);
                
                y += 15;
            });
        }

        doc.end();
    } catch (err) {
        console.error("PDF Error:", err);
        res.status(500).send("Internal Server Error: " + err.message);
    }
};