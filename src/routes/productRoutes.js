const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, mergeProducts, getExpiryReport, getOrderList, getStockInventory } = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/merge', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), mergeProducts);
router.get('/expiry-report', getExpiryReport);
router.get('/order-list', getOrderList);
router.get('/stock-inventory', getStockInventory);


router.get('/', getProducts);
router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createProduct);
router.put('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), updateProduct);
router.delete('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), deleteProduct);

module.exports = router;
