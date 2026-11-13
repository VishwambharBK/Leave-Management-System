const Leave = require('../models/Leave');
const LeavePolicy = require('../models/LeavePolicy');

const DEFAULT_POLICIES = [
  { leaveType: 'Casual Leave', annualAllocation: 6, requiresAttachment: false },
  { leaveType: 'Sick Leave', annualAllocation: 6, requiresAttachment: false },
  { leaveType: 'Earned Leave', annualAllocation: 12, requiresAttachment: false },
];

/**
 * Calculates working days between two dates, excluding Saturdays (6) and Sundays (0).
 */
const calculateWorkingDays = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Normalize times to midnight UTC to avoid timezone drift
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) {
    return 0;
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
};

/**
 * Fetch active policies for a given year or seed defaults if none exist.
 */
const getPoliciesForYear = async (year = new Date().getFullYear()) => {
  let policies = await LeavePolicy.find({ year });

  if (!policies || policies.length === 0) {
    const defaults = DEFAULT_POLICIES.map((p) => ({
      ...p,
      year,
    }));
    try {
      await LeavePolicy.insertMany(defaults, { ordered: false });
    } catch {
      // Ignore duplicates in concurrent race conditions
    }
    policies = await LeavePolicy.find({ year });
  }

  return policies;
};

/**
 * Check if the requested date range overlaps with any existing Pending or Approved leaves.
 */
const checkLeaveOverlap = async (employeeId, startDate, endDate, excludeLeaveId = null) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const query = {
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    // Condition for date interval overlap:
    // Existing leave start <= Requested end AND Existing leave end >= Requested start
    startDate: { $lte: end },
    endDate: { $gte: start },
  };

  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }

  const overlappingLeave = await Leave.findOne(query);
  return overlappingLeave;
};

/**
 * Calculate dynamic, authoritative leave balances for an employee in a given year (Jan 1 - Dec 31).
 * Important business rules:
 * - Only approved leave counts as used leave.
 * - Pending leave is shown separately.
 * - Pending requests are considered when checking available balance to prevent overbooking.
 * - Rejected and cancelled requests do not reduce balance.
 * - Balances are maintained independently for each leave type.
 */
const getEmployeeLeaveBalances = async (employeeId, year = new Date().getFullYear()) => {
  const policies = await getPoliciesForYear(year);

  const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  // Fetch all leaves for this employee within the leave year
  const leaves = await Leave.find({
    employee: employeeId,
    startDate: { $gte: startOfYear, $lte: endOfYear },
  });

  const balances = {};
  let totalAllocated = 0;
  let totalUsed = 0;
  let totalPending = 0;
  let totalAvailable = 0;

  policies.forEach((policy) => {
    const allocated = policy.annualAllocation;

    // Sum used (approved) days
    const usedDays = leaves
      .filter((l) => l.leaveType === policy.leaveType && l.status === 'approved')
      .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    // Sum pending days
    const pendingDays = leaves
      .filter((l) => l.leaveType === policy.leaveType && l.status === 'pending')
      .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    const available = Math.max(0, allocated - usedDays - pendingDays);
    const remaining = Math.max(0, allocated - usedDays);

    balances[policy.leaveType] = {
      allocated,
      used: usedDays,
      pending: pendingDays,
      available, // after taking into account both approved and pending
      remaining, // allocation minus approved only
      requiresAttachment: policy.requiresAttachment,
    };

    totalAllocated += allocated;
    totalUsed += usedDays;
    totalPending += pendingDays;
    totalAvailable += available;
  });

  return {
    year,
    balances,
    totalAllocated,
    totalUsed,
    totalPending,
    totalAvailable,
    totalRemaining: Math.max(0, totalAllocated - totalUsed),
  };
};

module.exports = {
  calculateWorkingDays,
  getPoliciesForYear,
  checkLeaveOverlap,
  getEmployeeLeaveBalances,
};

