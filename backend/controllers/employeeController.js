const User = require('../models/User');
const Leave = require('../models/Leave');
const { getEmployeeLeaveBalances } = require('../services/leaveService');

// @desc    Get current employee profile
// @route   GET /api/employees/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const employee = await User.findById(req.user._id).select('-password');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update permitted profile fields (Name only for employee, role & empId locked)
// @route   PUT /api/employees/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    const employee = await User.findById(req.user._id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    if (name) {
      employee.name = name.trim();
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: employee.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave balance breakdown
// @route   GET /api/employees/leave-balance
// @access  Private
const getLeaveBalance = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const balanceData = await getEmployeeLeaveBalances(req.user._id, year);

    res.status(200).json({
      success: true,
      data: balanceData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave history
// @route   GET /api/employees/leave-history
// @access  Private
const getLeaveHistory = async (req, res, next) => {
  try {
    const { status, leaveType, search, page = 1, limit = 10 } = req.query;

    const query = { employee: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (leaveType && leaveType !== 'all') {
      query.leaveType = leaveType;
    }

    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { adminRemarks: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [leaves, total] = await Promise.all([
      Leave.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('reviewedBy', 'name email'),
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

module.exports = {
  getProfile,
  updateProfile,
  getLeaveBalance,
  getLeaveHistory,
};

