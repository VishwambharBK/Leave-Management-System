const express = require('express');
const {
  getDashboardStats,
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  resetEmployeePassword,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  getReports,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  reviewLeaveSchema,
  rejectLeaveSchema,
} = require('../validators/schemas');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/employees', getEmployees);
router.post('/employees', validate(createEmployeeSchema), createEmployee);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', validate(updateEmployeeSchema), updateEmployee);
router.patch('/employees/:id/status', toggleEmployeeStatus);
router.patch('/employees/:id/reset-password', resetEmployeePassword);

router.get('/leaves', getAllLeaves);
router.patch('/leaves/:id/approve', validate(reviewLeaveSchema), approveLeave);
router.patch('/leaves/:id/reject', validate(rejectLeaveSchema), rejectLeave);

router.get('/reports', getReports);

module.exports = router;

