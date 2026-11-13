const express = require('express');
const {
  getProfile,
  updateProfile,
  getLeaveBalance,
  getLeaveHistory,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateProfileSchema } = require('../validators/schemas');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/leave-balance', getLeaveBalance);
router.get('/leave-history', getLeaveHistory);

module.exports = router;

