const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/impersonate', verifyToken, requireRole(['SUPERADMIN']), authController.impersonate);

module.exports = router;
