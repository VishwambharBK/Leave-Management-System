import React, { useState, useEffect } from 'react';
import leaveService from '../../services/leaveService';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { Search, Filter, Ban, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const LeaveHistoryPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Cancel dialog state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await leaveService.getMyLeaves({
        status: statusFilter,
        leaveType: typeFilter,
        search: searchQuery,
        page,
        limit: 10,
      });

      if (res.data) {
        setLeaves(res.data.leaves || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeaves();
  };

  const handleConfirmCancel = async () => {
    if (!selectedLeave) return;
    setCancelLoading(true);
    try {
      await leaveService.cancelLeave(selectedLeave._id);
      toast.success('Leave application cancelled successfully.');
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel application.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leave History</h2>
        <p className="text-sm text-slate-500">
          Track and manage your submitted leave requests, approvals, and administrator notes.
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
            placeholder="Search by reason or remarks..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
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
          </div>

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
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Ref ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Dates</th>
                <th className="px-5 py-3.5">Working Days</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Admin Remarks</th>
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
                    No leave applications matched the search criteria.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-800">
                      #{l._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{l.leaveType}</td>
                    <td className="px-5 py-4 text-xs">
                      <div>
                        {new Date(l.startDate).toLocaleDateString()} to{' '}
                        {new Date(l.endDate).toLocaleDateString()}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Applied {new Date(l.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {l.numberOfDays} {l.numberOfDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-5 py-4 text-xs max-w-xs truncate text-slate-600" title={l.reason}>
                      {l.reason}
                      {l.attachment && (
                        <a
                          href={l.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                        >
                          <FileText className="h-3 w-3" /> View attachment
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={l.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {l.adminRemarks || '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {l.status === 'pending' && (
                        <button
                          onClick={() => setSelectedLeave(l)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          <Ban className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      )}
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

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmDialog
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Leave Application"
        message={`Are you sure you want to cancel your ${selectedLeave?.numberOfDays}-day ${selectedLeave?.leaveType} application? This action cannot be undone.`}
        confirmText="Yes, Cancel Leave"
        type="danger"
        isLoading={cancelLoading}
      />
    </div>
  );
};

export default LeaveHistoryPage;

