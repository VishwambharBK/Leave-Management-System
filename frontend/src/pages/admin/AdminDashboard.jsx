import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Users,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  UserMinus,
  Calendar,
  ArrowRight,
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

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        if (res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const monthlyStats = data?.monthlyStats || [];
  const typeDistribution = data?.typeDistribution || [];
  const departmentStats = data?.departmentStats || [];
  const pendingQueue = data?.pendingQueue || [];
  const recentApplications = data?.recentApplications || [];

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 p-6 text-white shadow-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Executive HR Dashboard</h2>
          <p className="mt-1 text-sm text-slate-300">
            Real-time workforce attendance, leave pipeline metrics, and departmental distribution.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/leave-requests"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition"
          >
            <Clock className="h-4 w-4" />
            <span>Review Pending ({summary.pendingRequests || 0})</span>
          </Link>
          <Link
            to="/admin/employees"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            <Users className="h-4 w-4" />
            <span>Manage Employees</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total Employees"
          value={summary.totalEmployees || 0}
          subtitle={`${summary.activeEmployees || 0} Active`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Applications"
          value={summary.totalLeaves || 0}
          subtitle="All records"
          icon={FileCheck2}
          color="indigo"
        />
        <StatCard
          title="Pending Queue"
          value={summary.pendingRequests || 0}
          subtitle="Awaiting Review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Requests"
          value={summary.approvedRequests || 0}
          subtitle="Processed"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Rejected Requests"
          value={summary.rejectedRequests || 0}
          subtitle="Declined"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="On Leave Today"
          value={summary.employeesOnLeaveToday || 0}
          subtitle="Currently Absent"
          icon={UserMinus}
          color="blue"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Leave Requests Trend */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Monthly Applications Overview</h3>
              <p className="text-xs text-slate-500">Distribution of approved and rejected leave filings by month</p>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
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
                <Bar dataKey="approved" fill="#10b981" name="Approved" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#f43f5e" name="Rejected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Type Breakdown Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-semibold text-slate-900">Leave Distribution by Type</h3>
            <p className="text-xs text-slate-500">Volume across leave categories</p>
          </div>
          <div className="mt-4 h-64 w-full">
            {typeDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No leave requests filed yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="type"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
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

      {/* Two Column Section: Action Queue & Department Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Requests Needing Attention */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Pending Action Queue</h3>
              <p className="text-xs text-slate-500">Earliest unreviewed employee leave filings</p>
            </div>
            <Link
              to="/admin/leave-requests?status=pending"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              View all ({summary.pendingRequests || 0}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All clear! No pending leave applications requiring approval.
              </div>
            ) : (
              pendingQueue.map((leave) => (
                <div key={leave._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{leave.employee?.name}</span>
                      <span className="text-xs text-slate-400">({leave.employee?.employeeId})</span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {leave.leaveType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(leave.startDate).toLocaleDateString()} to{' '}
                      {new Date(leave.endDate).toLocaleDateString()} •{' '}
                      <span className="font-semibold text-slate-700">{leave.numberOfDays} days</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 italic line-clamp-1">"{leave.reason}"</p>
                  </div>

                  <Link
                    to="/admin/leave-requests"
                    className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department-Wise Leave Utilization */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h3 className="text-base font-semibold text-slate-900">Department Leave Summary</h3>
            <p className="text-xs text-slate-500">Total workforce and approved absence days per division</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Filings</th>
                  <th className="px-5 py-3">Approved Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentStats.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                      No departmental metrics available
                    </td>
                  </tr>
                ) : (
                  departmentStats.map((dept) => (
                    <tr key={dept.department} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{dept.department}</td>
                      <td className="px-5 py-3.5 text-xs">{dept.employeeCount} staff</td>
                      <td className="px-5 py-3.5 text-xs">{dept.leaveCount} requests</td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700 text-xs">
                        {dept.approvedDays} days
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

