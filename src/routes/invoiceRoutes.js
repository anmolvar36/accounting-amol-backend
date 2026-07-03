const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices } = require('../controllers/invoiceController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createInvoice);
router.get('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), getInvoices);

module.exports = router;
