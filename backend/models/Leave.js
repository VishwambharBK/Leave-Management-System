const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required'],
    },
    leaveType: {
      type: String,
      required: [true, 'Leave type is required'],
      enum: {
        values: ['Casual Leave', 'Sick Leave', 'Earned Leave'],
        message: '{VALUE} is not a valid leave type',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Number of days must be at least 1'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is mandatory'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters long'],
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    attachment: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound and single indexes
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });
leaveSchema.index({ leaveType: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);

