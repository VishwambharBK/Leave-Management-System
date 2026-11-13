const express = require('express');
const { login, logout, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { loginSchema, changePasswordSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

module.exports = router;

