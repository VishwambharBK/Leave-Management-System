const Leave = require('../models/Leave');
const LeavePolicy = require('../models/LeavePolicy');
const {
  calculateWorkingDays,
  checkLeaveOverlap,
  getEmployeeLeaveBalances,
} = require('../services/leaveService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private (Employee)
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user._id;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize comparison date to start of today in local/UTC
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startCheck = new Date(start);
    startCheck.setHours(0, 0, 0, 0);

    if (startCheck < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave start date cannot be in the past.',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Leave end date cannot be earlier than start date.',
      });
    }

    // Working days calculation (excluding Sat/Sun)
    const workingDays = calculateWorkingDays(startDate, endDate);
    if (workingDays === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected date range contains no working days (weekends only).',
      });
    }

    // Policy and Attachment check
    const currentYear = start.getFullYear();
    const policy = await LeavePolicy.findOne({ leaveType, year: currentYear });
    if (policy && policy.requiresAttachment && !req.file && !req.body.attachment) {
      return res.status(400).json({
        success: false,
        message: `Supporting document attachment is required for ${leaveType} under company policy.`,
      });
    }

    // Check overlapping leave for this employee
    const overlap = await checkLeaveOverlap(employeeId, startDate, endDate);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `You already have an existing ${overlap.status} leave application (${overlap.leaveType}) overlapping with the selected dates.`,
      });
    }

    // Check available leave balance (allocated - used - pending)
    const balanceData = await getEmployeeLeaveBalances(employeeId, currentYear);
    const typeBalance = balanceData.balances[leaveType];

    if (!typeBalance || typeBalance.available < workingDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance for ${leaveType}. Available: ${
          typeBalance ? typeBalance.available : 0
        } day(s), Requested: ${workingDays} working day(s).`,
      });
    }

    let attachmentPath = null;
    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
    } else if (req.body.attachment) {
      attachmentPath = req.body.attachment;
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays: workingDays,
      reason,
      attachment: attachmentPath,
      status: 'pending',
    });

    // Notify employee
    await createNotification({
      recipient: employeeId,
      title: 'Leave Request Submitted',
      message: `Your ${workingDays}-day ${leaveType} request from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]} was submitted successfully.`,
      type: 'leave_submitted',
      relatedLeave: leave._id,
    });

    // Notify administrators
    await notifyAdmins({
      title: 'New Leave Application Received',
      message: `${req.user.name} (${req.user.employeeId}) submitted a ${workingDays}-day ${leaveType} request.`,
      type: 'leave_submitted',
      relatedLeave: leave._id,
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully.',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current employee's leaves
// @route   GET /api/leaves/my
// @access  Private (Employee)
const getMyLeaves = async (req, res, next) => {
  try {
    const { status, leaveType, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leaves, total] = await Promise.all([
      Leave.find(query).sort(sort).skip(skip).limit(limitNum).populate('reviewedBy', 'name email'),
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

// @desc    Get leave by ID
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'name email employeeId department designation')
      .populate('reviewedBy', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.',
      });
    }

    // Role-based boundary: employee can only see their own leaves
    if (req.user.role !== 'admin' && leave.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this leave record.',
      });
    }

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending leave
// @route   PATCH /api/leaves/:id/cancel
// @access  Private (Employee)
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.',
      });
    }

    if (req.user.role !== 'admin' && leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot cancel another employee’s leave application.',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending leave applications can be cancelled. Current status is '${leave.status}'.`,
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    // Create notifications
    await createNotification({
      recipient: leave.employee,
      title: 'Leave Application Cancelled',
      message: `Your ${leave.leaveType} application was successfully cancelled.`,
      type: 'leave_cancelled',
      relatedLeave: leave._id,
    });

    await notifyAdmins({
      title: 'Leave Application Cancelled',
      message: `${req.user.name} cancelled their ${leave.leaveType} application.`,
      type: 'leave_cancelled',
      relatedLeave: leave._id,
    });

    res.status(200).json({
      success: true,
      message: 'Leave application cancelled successfully.',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  cancelLeave,
};

