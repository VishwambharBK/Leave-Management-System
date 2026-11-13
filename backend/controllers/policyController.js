const LeavePolicy = require('../models/LeavePolicy');
const { getPoliciesForYear } = require('../services/leaveService');

// @desc    Get all policies for a year
// @route   GET /api/policies
// @access  Private (Employee/Admin)
const getPolicies = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const policies = await getPoliciesForYear(year);

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific leave policy
// @route   PUT /api/policies/:id
// @access  Private (Admin)
const updatePolicy = async (req, res, next) => {
  try {
    const { annualAllocation, requiresAttachment } = req.body;

    const policy = await LeavePolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Leave policy not found.',
      });
    }

    if (annualAllocation !== undefined) {
      policy.annualAllocation = annualAllocation;
    }
    if (requiresAttachment !== undefined) {
      policy.requiresAttachment = requiresAttachment;
    }
    policy.updatedBy = req.user._id;

    await policy.save();

    res.status(200).json({
      success: true,
      message: `${policy.leaveType} policy updated successfully.`,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPolicies,
  updatePolicy,
};

