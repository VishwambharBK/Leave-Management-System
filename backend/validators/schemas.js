const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  department: z.string().trim().min(2, 'Department is required').optional(),
  designation: z.string().trim().min(2, 'Designation is required').optional(),
});

const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  employeeId: z.string().trim().min(2, 'Employee ID must be at least 2 characters').toUpperCase(),
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  department: z.string().trim().min(2, 'Department is required'),
  designation: z.string().trim().min(2, 'Designation is required'),
  role: z.enum(['employee', 'admin']).default('employee'),
  joiningDate: z.string().optional(),
});

const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  department: z.string().trim().min(2).optional(),
  designation: z.string().trim().min(2).optional(),
  role: z.enum(['employee', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

const applyLeaveSchema = z.object({
  leaveType: z.enum(['Casual Leave', 'Sick Leave', 'Earned Leave'], {
    errorMap: () => ({ message: 'Leave type must be Casual Leave, Sick Leave, or Earned Leave' }),
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(1000),
  attachment: z.string().optional().nullable(),
});

const reviewLeaveSchema = z.object({
  adminRemarks: z.string().trim().max(1000).optional().default(''),
});

const rejectLeaveSchema = z.object({
  adminRemarks: z.string().trim().min(2, 'Rejection reason / remark is mandatory').max(1000),
});

const updatePolicySchema = z.object({
  annualAllocation: z.number().int().min(0, 'Allocation must be a non-negative integer').optional(),
  requiresAttachment: z.boolean().optional(),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  applyLeaveSchema,
  reviewLeaveSchema,
  rejectLeaveSchema,
  updatePolicySchema,
};

