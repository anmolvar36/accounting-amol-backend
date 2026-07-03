const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Superadmin only routes
router.use(verifyToken, requireRole(['SUPERADMIN']));

router.get('/', companyController.getAllCompanies);
router.post('/', companyController.createCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);
router.patch('/:id/status', companyController.updateStatus);

module.exports = router;
