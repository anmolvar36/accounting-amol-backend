const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, mergeProducts } = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/merge', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), mergeProducts);

router.get('/', getProducts);
router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createProduct);
router.put('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), updateProduct);
router.delete('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), deleteProduct);

module.exports = router;
