const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: [true, 'Leave type is required'],
      enum: ['Casual Leave', 'Sick Leave', 'Earned Leave'],
    },
    annualAllocation: {
      type: Number,
      required: [true, 'Annual allocation is required'],
      min: [0, 'Allocation cannot be negative'],
    },
    requiresAttachment: {
      type: Boolean,
      default: false,
    },
    year: {
      type: Number,
      required: [true, 'Leave year is required'],
      default: () => new Date().getFullYear(),
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leavePolicySchema.index({ leaveType: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);

