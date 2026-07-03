const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.get('/', requireRole(['COMPANY_ADMIN', 'SUPERADMIN']), getLogs);

module.exports = router;
