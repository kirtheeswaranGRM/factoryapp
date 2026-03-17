const express = require('express');
const cors = require('cors');
const config = require('./apiconfig');
const routes = require('./routes');
const bcrypt = require('bcryptjs');
const salesRouter = require('./sales/routes');
const packingRouter = require('./packing_routes');
const accountsRouter = require('../accounts/backend/routes');
const downreports = require('./downreports');

// 1. Make sure this filename matches exactly!
const inventorycontroller = require('./inventorycontroller'); 

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 2. Separate Inventory API
app.get('/head/inventory', inventorycontroller);

// 3. Sales Routes
app.use('/sales', salesRouter);

// 3.1 Packing Routes
app.use('/packing', packingRouter);

// 3.1 Accounts Routes
app.use('/accounts', accountsRouter(express, bcrypt));

// 4. Your main routes
app.use('/api', routes);
app.use('/', routes);

// This URL MUST match what your frontend 'handleDownload' creates
app.get('/reports/monthly_summary', downreports.monthlySummary);

app.listen(config.PORT, config.HOST, () => {
    console.log(`✅ Server Live at: ${config.LOCAL_URL}`);
});