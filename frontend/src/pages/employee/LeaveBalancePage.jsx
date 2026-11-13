import React, { useState, useEffect } from 'react';
import leaveService from '../../services/leaveService';
import toast from 'react-hot-toast';
import { Scale, Info, CheckCircle2, Clock, Calendar, ShieldCheck } from 'lucide-react';

export const LeaveBalancePage = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async (selectedYear) => {
    setLoading(true);
    try {
      const res = await leaveService.getLeaveBalance(selectedYear);
      if (res.data) {
        setBalanceData(res.data);
      }
    } catch (err) {
      toast.error('Failed to retrieve leave balance breakdown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance(year);
  }, [year]);

  const balances = balanceData?.balances || {};
  const totalAllocated = balanceData?.totalAllocated || 24;
  const totalUsed = balanceData?.totalUsed || 0;
  const totalPending = balanceData?.totalPending || 0;
  const totalAvailable = balanceData?.totalAvailable || 24;

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leave Balance & Quota</h2>
          <p className="text-sm text-slate-500">
            Authoritative breakdown of leave entitlements, approved deductions, and pending holds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Leave Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y} (Jan 1 - Dec 31)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Yearly Quota</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalAllocated} days</p>
          <p className="mt-1 text-[11px] text-slate-400">Standard enterprise policy</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-emerald-600">Total Approved (Used)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{totalUsed} days</p>
          <p className="mt-1 text-[11px] text-slate-400">Formal deductions applied</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-amber-600">Total In-Review (Pending)</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{totalPending} days</p>
          <p className="mt-1 text-[11px] text-slate-400">Temporary holds on quota</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-blue-600">Available to Request</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{totalAvailable} days</p>
          <p className="mt-1 text-[11px] text-slate-400">Remaining minus pending holds</p>
        </div>
      </div>

      {/* Cards per Leave Category */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {['Casual Leave', 'Sick Leave', 'Earned Leave'].map((type) => {
          const item = balances[type] || {
            allocated: 0,
            used: 0,
            pending: 0,
            available: 0,
            remaining: 0,
          };
          const percentUsed =
            item.allocated > 0 ? Math.round((item.used / item.allocated) * 100) : 0;
          const percentPending =
            item.allocated > 0 ? Math.round((item.pending / item.allocated) * 100) : 0;

          return (
            <div
              key={type}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">{type}</h3>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {item.allocated} days / year
                  </span>
                </div>

                {/* Balance Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Utilization</span>
                    <span className="font-semibold text-slate-700">{percentUsed}% used</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      style={{ width: `${percentUsed}%` }}
                      className="h-full bg-emerald-500 transition-all duration-300"
                      title={`Used: ${item.used}d`}
                    />
                    <div
                      style={{ width: `${percentPending}%` }}
                      className="h-full bg-amber-400 transition-all duration-300"
                      title={`Pending: ${item.pending}d`}
                    />
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-500">Approved Deductions:</span>
                    <p className="mt-1 font-bold text-emerald-700 text-sm">{item.used} days</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-500">Pending Approvals:</span>
                    <p className="mt-1 font-bold text-amber-700 text-sm">{item.pending} days</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-500">Net Balance Remaining:</span>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{item.remaining} days</p>
                  </div>
                  <div className="rounded-xl bg-blue-50/50 p-3 border border-blue-100">
                    <span className="text-blue-700 font-medium">Available Right Now:</span>
                    <p className="mt-1 font-bold text-blue-700 text-sm">{item.available} days</p>
                  </div>
                </div>
              </div>

              {item.requiresAttachment && (
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 p-2 rounded-lg">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Medical / supporting certificate required when applying.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Business Rules Explanation Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Enterprise Leave Calculation Policy
        </h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-800 mb-1">Approved Deductions Only</h4>
            <p>
              Leave days are permanently subtracted from your net annual balance only after formal administrator approval.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-800 mb-1">Overbooking Prevention</h4>
            <p>
              Pending applications hold their requested working days against your available balance to ensure concurrent requests cannot overbook your quota.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-800 mb-1">Weekend Exemption</h4>
            <p>
              Saturdays and Sundays occurring within your leave dates are automatically excluded and not charged against your entitlement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalancePage;

