const express = require('express');
const router = express.Router();
const packingController = require('./packing_controller');

router.get('/sales-by-batch/:batch_number', packingController.fetchSalesByBatch);
router.post('/packing-list', packingController.createPackingList);
router.get('/packing-list', packingController.getPackingLists);

router.post('/sticker', packingController.createSticker);
router.get('/sticker', packingController.getStickers);
router.get('/sticker/:qr_data', packingController.getStickerByQR);

router.post('/dispatch', packingController.dispatchSticker);
router.get('/dispatch', packingController.getDispatchHistory);

// Packing Material Report Routes
router.get('/materials', packingController.getPackingMaterials);
router.post('/material-report', packingController.createMaterialReport);
router.get('/material-reports', packingController.getMaterialReports);
router.post('/material-report/approve', packingController.approveMaterialReport);
router.post('/material-report/reject', packingController.rejectMaterialReport);

module.exports = router;
