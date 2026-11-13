import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import leaveService from '../../services/leaveService';
import toast from 'react-hot-toast';
import { Calendar, Upload, AlertCircle, Info, CheckCircle2, ArrowLeft } from 'lucide-react';

const applyLeaveSchema = z.object({
  leaveType: z.enum(['Casual Leave', 'Sick Leave', 'Earned Leave'], {
    errorMap: () => ({ message: 'Please select a leave category' }),
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters long').max(1000),
});

export const ApplyLeavePage = () => {
  const navigate = useNavigate();
  const [balanceData, setBalanceData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      leaveType: 'Casual Leave',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const selectedType = watch('leaveType');
  const startDateVal = watch('startDate');
  const endDateVal = watch('endDate');

  // Load balances and policy details
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await leaveService.getLeaveBalance();
        if (res.data) {
          setBalanceData(res.data);
        }
      } catch (err) {
        toast.error('Failed to retrieve current leave balance.');
      }
    };
    fetchBalances();
  }, []);

  // Compute working days excluding Saturdays and Sundays
  const calculatedDays = useMemo(() => {
    if (!startDateVal || !endDateVal) return 0;
    const start = new Date(startDateVal);
    const end = new Date(endDateVal);

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    if (end < start) return 0;

    let days = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        days++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
  }, [startDateVal, endDateVal]);

  const currentTypeBalance = balanceData?.balances?.[selectedType];
  const availableDays = currentTypeBalance?.available ?? 0;
  const isAttachmentRequired = currentTypeBalance?.requiresAttachment ?? false;

  const isOverBalance = calculatedDays > availableDays;

  // Today min date string in YYYY-MM-DD format
  const todayStr = new Date().toISOString().split('T')[0];

  const onSubmit = async (values) => {
    if (calculatedDays === 0) {
      toast.error('The selected dates contain 0 working days (weekends only).');
      return;
    }

    if (isOverBalance) {
      toast.error(
        `Insufficient leave balance. You only have ${availableDays} days available for ${selectedType}.`
      );
      return;
    }

    if (isAttachmentRequired && !selectedFile) {
      toast.error(`Company policy requires an attachment document for ${selectedType}.`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('leaveType', values.leaveType);
      formData.append('startDate', values.startDate);
      formData.append('endDate', values.endDate);
      formData.append('reason', values.reason);

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      await leaveService.applyLeave(formData);
      toast.success('Leave application submitted successfully!');
      navigate('/leave-history');
    } catch (err) {
      toast.error(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Apply for Leave</h2>
          <p className="text-sm text-slate-500">
            Submit a new time-off request with automatic working-day calculations.
          </p>
        </div>
      </div>

      {/* Available Balance Cards Ribbon */}
      <div className="grid grid-cols-3 gap-3">
        {['Casual Leave', 'Sick Leave', 'Earned Leave'].map((type) => {
          const bal = balanceData?.balances?.[type];
          const isSelected = selectedType === type;
          return (
            <div
              key={type}
              className={`rounded-xl border p-4 transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <p className="text-xs font-semibold text-slate-600">{type}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">{bal?.available ?? '—'}</span>
                <span className="text-xs text-slate-400">days available</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {bal ? `${bal.used}d used • ${bal.pending}d pending` : 'Loading...'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Application Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('leaveType')}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="Casual Leave">Casual Leave (6 days/yr)</option>
              <option value="Sick Leave">Sick Leave (6 days/yr)</option>
              <option value="Earned Leave">Earned Leave (12 days/yr)</option>
            </select>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  min={todayStr}
                  {...register('startDate')}
                  className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                    errors.startDate ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-xs text-rose-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                End Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  min={startDateVal || todayStr}
                  {...register('endDate')}
                  className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                    errors.endDate ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Automated Working Days Computation Preview */}
          {startDateVal && endDateVal && (
            <div
              className={`rounded-xl border p-4 text-xs transition ${
                calculatedDays === 0 || isOverBalance
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {calculatedDays === 0 || isOverBalance ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
                <div>
                  <span className="font-semibold text-sm">
                    Total working days: {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                  </span>
                  <span className="ml-2 font-normal">
                    (Weekends are automatically excluded from the quota)
                  </span>
                </div>
              </div>
              {isOverBalance && (
                <p className="mt-1.5 font-medium text-rose-700">
                  Notice: Requested working days ({calculatedDays}) exceed your available balance ({availableDays} days).
                </p>
              )}
              {calculatedDays === 0 && (
                <p className="mt-1.5 font-medium text-amber-700">
                  Notice: The selected range only covers Saturday and/or Sunday.
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Reason for Absence <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register('reason')}
              placeholder="State a concise reason for your leave application..."
              className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                errors.reason ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
              }`}
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Document Attachment Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Supporting Attachment {isAttachmentRequired ? '(Required)' : '(Optional)'}
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
                <Upload className="h-4 w-4 text-slate-500" />
                <span>{selectedFile ? 'Change File' : 'Choose Document / Image'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                />
              </label>
              {selectedFile && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-900">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Supported formats: PDF, DOC, DOCX, PNG, JPG (Max 5MB)
            </p>
          </div>

          {/* Submission Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || calculatedDays === 0 || isOverBalance}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting Application...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeavePage;

