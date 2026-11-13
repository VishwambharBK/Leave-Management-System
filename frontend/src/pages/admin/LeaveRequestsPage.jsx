import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export const LeaveRequestsPage = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [detailLeave, setDetailLeave] = useState(null);
  const [actionLeave, setActionLeave] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [remarks, setRemarks] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllLeaves({
        status: statusFilter,
        leaveType: typeFilter,
        department: departmentFilter,
        search: searchQuery,
        page,
        limit: 10,
      });

      if (res.data) {
        setLeaves(res.data.leaves || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      toast.error('Failed to load leave applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter, departmentFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeaves();
  };

  const handleOpenAction = (leave, type) => {
    setActionLeave(leave);
    setActionType(type);
    setRemarks('');
  };

  const handleExecuteAction = async () => {
    if (!actionLeave) return;

    if (actionType === 'reject' && !remarks.trim()) {
      toast.error('Rejection remarks are mandatory.');
      return;
    }

    setActionSubmitting(true);
    try {
      if (actionType === 'approve') {
        await adminService.approveLeave(actionLeave._id, remarks);
        toast.success(`Leave application approved for ${actionLeave.employee?.name}.`);
      } else {
        await adminService.rejectLeave(actionLeave._id, remarks);
        toast.success(`Leave application rejected for ${actionLeave.employee?.name}.`);
      }
      setActionLeave(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err.message || `Failed to ${actionType} application.`);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manage Leave Requests</h2>
        <p className="text-sm text-slate-500">
          Review, approve, or reject employee leave filings with balance validation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, ID, reason..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Categories</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Earned Leave">Earned Leave</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Management">Management</option>
            <option value="Support">Support</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Leave Category</th>
                <th className="px-5 py-3.5">Date Span</th>
                <th className="px-5 py-3.5">Days</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Applied Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-xs text-slate-400">
                    No leave requests match the current filters.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{leave.employee?.name}</div>
                      <div className="text-xs text-slate-400">
                        {leave.employee?.employeeId} • {leave.employee?.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">
                      {leave.employee?.department || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{leave.leaveType}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {new Date(leave.startDate).toLocaleDateString()} to{' '}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {leave.numberOfDays} {leave.numberOfDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={leave.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailLeave(leave)}
                          title="View Details"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenAction(leave, 'approve')}
                              title="Approve Request"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAction(leave, 'reject')}
                              title="Reject Request"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailLeave}
        onClose={() => setDetailLeave(null)}
        title="Leave Application Details"
        maxWidth="max-w-xl"
      >
        {detailLeave && (
          <div className="space-y-4 text-xs">
            {/* Employee Block */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Applicant Information
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Name:</span>
                  <p className="font-semibold text-slate-900">{detailLeave.employee?.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Employee ID:</span>
                  <p className="font-semibold text-slate-900">{detailLeave.employee?.employeeId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <p className="text-slate-700">{detailLeave.employee?.email}</p>
                </div>
                <div>
                  <span className="text-slate-400">Department / Role:</span>
                  <p className="text-slate-700">
                    {detailLeave.employee?.department} • {detailLeave.employee?.designation}
                  </p>
                </div>
              </div>
            </div>

            {/* Leave Details */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Leave Category:</span>
                <span className="font-semibold text-slate-900">{detailLeave.leaveType}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Requested Working Days:</span>
                <span className="font-bold text-blue-600">{detailLeave.numberOfDays} days</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Effective Dates:</span>
                <span>
                  {new Date(detailLeave.startDate).toLocaleDateString()} to{' '}
                  {new Date(detailLeave.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Status:</span>
                <Badge status={detailLeave.status} />
              </div>
            </div>

            {/* Reason */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Reason for Absence:</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 italic">
                "{detailLeave.reason}"
              </div>
            </div>

            {/* Attachment */}
            {detailLeave.attachment && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Attachment:</span>
                <a
                  href={detailLeave.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100 transition"
                >
                  <FileText className="h-4 w-4" />
                  <span>Open Attached Document</span>
                </a>
              </div>
            )}

            {/* Admin Remarks if reviewed */}
            {detailLeave.adminRemarks && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Administrator Remarks:</span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800">
                  {detailLeave.adminRemarks}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Dialog (Approve / Reject) */}
      <Modal
        isOpen={!!actionLeave}
        onClose={() => setActionLeave(null)}
        title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        maxWidth="max-w-md"
      >
        {actionLeave && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {actionType === 'approve'
                ? `You are approving a ${actionLeave.numberOfDays}-day ${actionLeave.leaveType} application for ${actionLeave.employee?.name}. Leave balance will be deducted immediately.`
                : `You are rejecting the leave application for ${actionLeave.employee?.name}. A clear reason is required.`}
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Administrator Remarks {actionType === 'reject' ? '(Mandatory)' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Optional approval note or coverage comments...'
                    : 'Provide the specific reason for rejecting this leave request...'
                }
                className="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionLeave(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting || (actionType === 'reject' && !remarks.trim())}
                onClick={handleExecuteAction}
                className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionSubmitting
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequestsPage;

