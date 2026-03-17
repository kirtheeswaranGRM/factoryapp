const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// Product Inventory
router.get('/products', controllers.getProducts);

// Customer Endpoints
router.get('/customers', controllers.getCustomers);
router.post('/customers', controllers.addCustomer);

// Sales Request Endpoints
router.get('/requests', controllers.getSalesRequests);
router.post('/requests', controllers.createSalesRequest);
router.get('/requests/:id', controllers.getSalesRequestDetails);
router.put('/requests/:id', controllers.updateSalesRequest);
router.post('/requests/:id/approve', controllers.approveSalesRequest);
router.post('/requests/:id/reject', controllers.rejectSalesRequest);

// Invoice Endpoints
router.get('/invoices', controllers.getInvoices);
router.post('/invoices', controllers.createInvoice);
router.put('/invoices/:id/status', controllers.updateInvoiceStatus);
router.get('/invoices/:id/pdf', controllers.generateInvoicePDF);
router.get('/invoices/:id/items', controllers.getInvoiceItems);

module.exports = router;
