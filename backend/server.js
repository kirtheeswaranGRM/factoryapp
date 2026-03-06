const express = require('express');
const cors = require('cors');
const config = require('./apiconfig');
const routes = require('./routes');
const downreports = require('./downreports');

// 1. Make sure this filename matches exactly!
const inventorycontroller = require('./inventorycontroller'); 

const app = express();
app.use(cors());
app.use(express.json());

// 2. Separate Inventory API
app.get('/head/inventory', inventorycontroller);

// 3. Your main routes
app.use('/', routes);

// This URL MUST match what your frontend 'handleDownload' creates
app.get('/reports/monthly_summary', downreports.monthlySummary);

app.listen(config.PORT, config.HOST, () => {
    console.log(`✅ Server Live at: ${config.LOCAL_URL}`);
});