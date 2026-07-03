const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), getCustomers);
router.post('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), createCustomer);
router.put('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), updateCustomer);
router.delete('/:id', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), deleteCustomer);

module.exports = router;
