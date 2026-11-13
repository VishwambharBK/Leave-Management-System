const User = require('../models/User');
const Leave = require('../models/Leave');
const { getEmployeeLeaveBalances, checkLeaveOverlap } = require('../services/leaveService');
const { createNotification } = require('../services/notificationService');

// @desc    Get comprehensive Admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalEmployees,
      activeEmployees,
      totalLeaves,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', isActive: true }),
      Leave.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
    ]);

    // Employees currently on approved leave today
    const onLeaveLeaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: endOfToday },
      endDate: { $gte: today },
    }).populate('employee', 'name email employeeId department designation');

    const employeesOnLeaveCount = new Set(onLeaveLeaves.map((l) => l.employee?._id?.toString())).size;

    // Monthly applications distribution for current year
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const yearLeaves = await Leave.find({
      createdAt: { $gte: startOfYear, $lte: endOfYear },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = monthNames.map((month, idx) => {
      const monthLeaves = yearLeaves.filter((l) => new Date(l.createdAt).getMonth() === idx);
      return {
        month,
        total: monthLeaves.length,
        approved: monthLeaves.filter((l) => l.status === 'approved').length,
        rejected: monthLeaves.filter((l) => l.status === 'rejected').length,
        pending: monthLeaves.filter((l) => l.status === 'pending').length,
      };
    });

    // Leave distribution by type
    const leaveTypes = ['Casual Leave', 'Sick Leave', 'Earned Leave'];
    const typeDistribution = leaveTypes.map((type) => {
      const count = yearLeaves.filter((l) => l.leaveType === type).length;
      const approvedDays = yearLeaves
        .filter((l) => l.leaveType === type && l.status === 'approved')
        .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);
      return {
        type,
        count,
        approvedDays,
      };
    });

    // Department-wise leave statistics
    const employees = await User.find({ role: 'employee' }).select('_id department');
    const deptMap = {};
    employees.forEach((emp) => {
      const dept = emp.department || 'General';
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, employeeCount: 0, leaveCount: 0, approvedDays: 0 };
      }
      deptMap[dept].employeeCount++;
    });

    for (const l of yearLeaves) {
      const emp = employees.find((e) => e._id.toString() === l.employee.toString());
      if (emp) {
        const dept = emp.department || 'General';
        if (deptMap[dept]) {
          deptMap[dept].leaveCount++;
          if (l.status === 'approved') {
            deptMap[dept].approvedDays += l.numberOfDays || 0;
          }
        }
      }
    }
    const departmentStats = Object.values(deptMap);

    // Recent leave applications (latest 5)
    const recentApplications = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employee', 'name employeeId department designation email');

    // Pending requests needing attention (up to 5)
    const pendingQueue = await Leave.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate('employee', 'name employeeId department designation email');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          totalLeaves,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          employeesOnLeaveToday: employeesOnLeaveCount,
        },
        monthlyStats,
        typeDistribution,
        departmentStats,
        recentApplications,
        pendingQueue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees with filters and pagination
// @route   GET /api/admin/employees
// @access  Private (Admin)
const getEmployees = async (req, res, next) => {
  try {
    const { department, search, isActive, page = 1, limit = 10 } = req.query;

    const query = { role: 'employee' };

    if (department && department !== 'all') {
      query.department = department;
    }

    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [employees, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new employee
// @route   POST /api/admin/employees
// @access  Private (Admin)
const createEmployee = async (req, res, next) => {
  try {
    const { name, employeeId, email, password, department, designation, role, joiningDate } = req.body;

    // Check unique email and employeeId
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingId = await User.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this Employee ID already exists.',
      });
    }

    const employee = await User.create({
      name,
      employeeId: employeeId.toUpperCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      department: department || 'General',
      designation: designation || 'Staff',
      role: role || 'employee',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: employee.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee by ID with balances and history
// @route   GET /api/admin/employees/:id
// @access  Private (Admin)
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const balances = await getEmployeeLeaveBalances(employee._id);
    const leaveHistory = await Leave.find({ employee: employee._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        employee,
        balances,
        recentLeaves: leaveHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee information
// @route   PUT /api/admin/employees/:id
// @access  Private (Admin)
const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, department, designation, role, isActive } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    if (email && email.toLowerCase() !== employee.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used by another user.',
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    if (name) employee.name = name.trim();
    if (department) employee.department = department.trim();
    if (designation) employee.designation = designation.trim();
    if (role) employee.role = role;
    if (isActive !== undefined) employee.isActive = isActive;

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: employee.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle employee active status
// @route   PATCH /api/admin/employees/:id/status
// @access  Private (Admin)
const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee account ${employee.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: employee.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reset employee password
// @route   PATCH /api/admin/employees/:id/reset-password
// @access  Private (Admin)
const resetEmployeePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee password has been reset successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave applications with comprehensive filters
// @route   GET /api/admin/leaves
// @access  Private (Admin)
const getAllLeaves = async (req, res, next) => {
  try {
    const {
      status,
      leaveType,
      department,
      employeeId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (leaveType && leaveType !== 'all') {
      query.leaveType = leaveType;
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    if (department && department !== 'all') {
      const deptEmployees = await User.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    if (search) {
      // Find matching employees first
      const matchedEmployees = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const employeeIds = matchedEmployees.map((e) => e._id);

      query.$or = [
        { employee: { $in: employeeIds } },
        { reason: { $regex: search, $options: 'i' } },
        { adminRemarks: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('employee', 'name employeeId department designation email')
        .populate('reviewedBy', 'name email'),
      Leave.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve leave request
// @route   PATCH /api/admin/leaves/:id/approve
// @access  Private (Admin)
const approveLeave = async (req, res, next) => {
  try {
    const { adminRemarks = '' } = req.body;
    const adminId = req.user._id;

    // Atomic find and update condition checking status is pending
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave application is already ${leave.status}. Only pending requests can be approved.`,
      });
    }

    // Check again for overlapping approved leave
    const existingApproved = await Leave.findOne({
      _id: { $ne: leave._id },
      employee: leave.employee._id,
      status: 'approved',
      startDate: { $lte: leave.endDate },
      endDate: { $gte: leave.startDate },
    });

    if (existingApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve: employee already has an approved leave overlapping with these dates.',
      });
    }

    // Verify leave balance again before approving
    const currentYear = new Date(leave.startDate).getFullYear();
    const balanceData = await getEmployeeLeaveBalances(leave.employee._id, currentYear);
    const typeBalance = balanceData.balances[leave.leaveType];

    // When pending, typeBalance.remaining = allocated - used (without pending)
    if (!typeBalance || typeBalance.remaining < leave.numberOfDays) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: Employee only has ${typeBalance ? typeBalance.remaining : 0} remaining days for ${
          leave.leaveType
        }, but requested ${leave.numberOfDays} days.`,
      });
    }

    // Update leave record atomically
    leave.status = 'approved';
    leave.adminRemarks = adminRemarks;
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    await leave.save();

    // Notify employee
    await createNotification({
      recipient: leave.employee._id,
      title: 'Leave Application Approved',
      message: `Your ${leave.numberOfDays}-day ${leave.leaveType} application has been approved. Admin remarks: ${
        adminRemarks || 'None'
      }`,
      type: 'leave_approved',
      relatedLeave: leave._id,
    });

    res.status(200).json({
      success: true,
      message: 'Leave application approved successfully.',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject leave request
// @route   PATCH /api/admin/leaves/:id/reject
// @access  Private (Admin)
const rejectLeave = async (req, res, next) => {
  try {
    const { adminRemarks } = req.body;
    const adminId = req.user._id;

    if (!adminRemarks || adminRemarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason / remark is mandatory when rejecting a leave application.',
      });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave application is already ${leave.status}. Only pending requests can be rejected.`,
      });
    }

    leave.status = 'rejected';
    leave.adminRemarks = adminRemarks.trim();
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    await leave.save();

    // Notify employee
    await createNotification({
      recipient: leave.employee._id,
      title: 'Leave Application Rejected',
      message: `Your ${leave.numberOfDays}-day ${leave.leaveType} application was rejected. Reason: ${adminRemarks.trim()}`,
      type: 'leave_rejected',
      relatedLeave: leave._id,
    });

    res.status(200).json({
      success: true,
      message: 'Leave application rejected.',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate reporting metrics
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const leaves = await Leave.find({
      createdAt: { $gte: startOfYear, $lte: endOfYear },
    }).populate('employee', 'name department');

    const totalDaysApproved = leaves
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        year,
        totalLeaves: leaves.length,
        totalDaysApproved,
        leaves,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

