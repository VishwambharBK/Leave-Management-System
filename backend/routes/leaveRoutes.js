const express = require('express');
const {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  cancelLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('attachment'), applyLeave);
router.get('/my', getMyLeaves);
router.get('/:id', getLeaveById);
router.patch('/:id/cancel', cancelLeave);

module.exports = router;

