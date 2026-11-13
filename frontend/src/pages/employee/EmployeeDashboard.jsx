import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import leaveService from '../../services/leaveService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  PlusCircle,
  History,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [balRes, leavesRes] = await Promise.all([
          leaveService.getLeaveBalance(),
          leaveService.getMyLeaves({ limit: 5 }),
        ]);

        if (balRes.data) {
          setBalanceData(balRes.data);
        }
        if (leavesRes.data) {
          setRecentLeaves(leavesRes.data.leaves || []);
        }
      } catch (err) {
        console.error('Failed to load employee dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const balances = balanceData?.balances || {};
  const totalAllocated = balanceData?.totalAllocated || 24;
  const totalUsed = balanceData?.totalUsed || 0;
  const totalPending = balanceData?.totalPending || 0;
  const totalRemaining = balanceData?.totalRemaining || 24;

  const approvedLeavesCount = recentLeaves.filter((l) => l.status === 'approved').length;
  const rejectedLeavesCount = recentLeaves.filter((l) => l.status === 'rejected').length;

  // Chart data: Leave Breakdown
  const utilizationData = Object.keys(balances).map((type) => ({
    name: type.replace(' Leave', ''),
    Allocated: balances[type].allocated,
    Used: balances[type].used,
    Pending: balances[type].pending,
    Available: balances[type].available,
  }));

  // Status Pie Data
  const statusPieData = [
    { name: 'Used (Approved)', value: totalUsed, color: '#10b981' },
    { name: 'Pending Review', value: totalPending, color: '#f59e0b' },
    { name: 'Available Remaining', value: Math.max(0, totalRemaining - totalPending), color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.name}!</h2>
          <p className="text-sm text-slate-500">
            {user?.department} • {user?.designation} ({user?.employeeId})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/apply-leave"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Apply Leave</span>
          </Link>
          <Link
            to="/leave-history"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <History className="h-4 w-4" />
            <span>Leave History</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total Allocated"
          value={`${totalAllocated}d`}
          subtitle="Jan - Dec"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Used (Approved)"
          value={`${totalUsed}d`}
          subtitle="Deducted"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Remaining"
          value={`${totalRemaining}d`}
          subtitle="Net Balance"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Pending"
          value={`${totalPending}d`}
          subtitle="Awaiting admin"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Req"
          value={approvedLeavesCount}
          subtitle="Recent count"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Rejected Req"
          value={rejectedLeavesCount}
          subtitle="Recent count"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leave Type Breakdown Bar Chart */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Leave Balance by Category</h3>
              <p className="text-xs text-slate-500">Allocated vs Used vs Available for current leave year</p>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Allocated" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Used" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Status Distribution Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-semibold text-slate-900">Annual Utilization</h3>
            <p className="text-xs text-slate-500">Share of approved and pending days</p>
          </div>
          <div className="mt-4 h-64 w-full">
            {statusPieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No leave activities recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Leave History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Applications</h3>
            <p className="text-xs text-slate-500">Latest leave requests submitted from your account</p>
          </div>
          <Link
            to="/leave-history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            View all history →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Leave Type</th>
                <th className="px-5 py-3">Start Date</th>
                <th className="px-5 py-3">End Date</th>
                <th className="px-5 py-3">Days</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                    No recent leave applications found. Click Apply Leave to create one.
                  </td>
                </tr>
              ) : (
                recentLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{leave.leaveType}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {leave.numberOfDays} {leave.numberOfDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={leave.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 truncate max-w-xs">
                      {leave.adminRemarks || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

