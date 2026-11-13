import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  KeyRound,
  Power,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
} from 'lucide-react';

const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  employeeId: z.string().trim().min(2, 'Employee ID is required').toUpperCase(),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().trim().min(2, 'Department is required'),
  designation: z.string().trim().min(2, 'Designation is required'),
  role: z.enum(['employee', 'admin']).default('employee'),
});

const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  department: z.string().trim().min(2, 'Department is required'),
  designation: z.string().trim().min(2, 'Designation is required'),
  role: z.enum(['employee', 'admin']),
});

export const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [statusToggleEmployee, setStatusToggleEmployee] = useState(null);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [viewEmployeeDetail, setViewEmployeeDetail] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await adminService.getEmployees({
        search: searchQuery,
        department: departmentFilter,
        isActive: activeFilter,
        page,
        limit: 10,
      });

      if (res.data) {
        setEmployees(res.data.employees || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      toast.error('Failed to load employee list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, activeFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors, isSubmitting: createSubmitting },
  } = useForm({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: '',
      employeeId: '',
      email: '',
      password: '',
      department: 'Engineering',
      designation: 'Software Engineer',
      role: 'employee',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm({
    resolver: zodResolver(updateEmployeeSchema),
  });

  const onCreateEmployee = async (values) => {
    try {
      await adminService.createEmployee(values);
      toast.success(`Employee ${values.name} created successfully.`);
      resetCreateForm();
      setCreateModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to create employee');
    }
  };

  const onOpenEdit = (emp) => {
    setEditEmployee(emp);
    resetEditForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      role: emp.role,
    });
  };

  const onUpdateEmployee = async (values) => {
    if (!editEmployee) return;
    try {
      await adminService.updateEmployee(editEmployee._id, values);
      toast.success('Employee updated successfully.');
      setEditEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to update employee');
    }
  };

  const onConfirmToggleStatus = async () => {
    if (!statusToggleEmployee) return;
    try {
      await adminService.toggleEmployeeStatus(statusToggleEmployee._id);
      toast.success(
        `Account ${statusToggleEmployee.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      setStatusToggleEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status.');
    }
  };

  const onResetPassword = async () => {
    if (!resetPasswordEmployee || newPasswordVal.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      await adminService.resetEmployeePassword(resetPasswordEmployee._id, newPasswordVal);
      toast.success(`Password reset for ${resetPasswordEmployee.name}.`);
      setResetPasswordEmployee(null);
      setNewPasswordVal('');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  const onViewDetail = async (emp) => {
    try {
      const res = await adminService.getEmployeeById(emp._id);
      if (res.data) {
        setViewEmployeeDetail(res.data);
      }
    } catch (err) {
      toast.error('Failed to load employee details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Employee Management</h2>
          <p className="text-sm text-slate-500">
            Provision staff profiles, configure organizational roles, and maintain credentials.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
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

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">Employee ID</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs text-slate-400">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{emp.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-700">
                      {emp.employeeId}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{emp.email}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">{emp.department}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">{emp.designation}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={emp.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewDetail(emp)}
                          title="View Balances & History"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onOpenEdit(emp)}
                          title="Edit Employee"
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResetPasswordEmployee(emp);
                            setNewPasswordVal('');
                          }}
                          title="Reset Password"
                          className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setStatusToggleEmployee(emp)}
                          title={emp.isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`rounded-lg p-1.5 transition ${
                            emp.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
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
              Page {pagination.page} of {pagination.pages} ({pagination.total} staff)
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

      {/* Create Employee Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New Employee"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit(onCreateEmployee)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                {...registerCreate('name')}
                placeholder="Jane Doe"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              {createErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{createErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Employee ID *</label>
              <input
                type="text"
                {...registerCreate('employeeId')}
                placeholder="EMP101"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase"
              />
              {createErrors.employeeId && (
                <p className="mt-1 text-xs text-rose-600">{createErrors.employeeId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                {...registerCreate('email')}
                placeholder="jane.doe@company.com"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              {createErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{createErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Initial Password *</label>
              <input
                type="password"
                {...registerCreate('password')}
                placeholder="Minimum 6 characters"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              {createErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{createErrors.password.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Department *</label>
              <select
                {...registerCreate('department')}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Management">Management</option>
                <option value="Support">Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Designation *</label>
              <input
                type="text"
                {...registerCreate('designation')}
                placeholder="Software Engineer"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">System Role *</label>
              <select
                {...registerCreate('role')}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {createSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        title="Edit Employee Information"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit(onUpdateEmployee)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              {...registerEdit('name')}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              {...registerEdit('email')}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Department</label>
              <input
                type="text"
                {...registerEdit('department')}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Designation</label>
              <input
                type="text"
                {...registerEdit('designation')}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditEmployee(null)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {editSubmitting ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={!!resetPasswordEmployee}
        onClose={() => setResetPasswordEmployee(null)}
        title="Admin Password Reset"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Set a new temporary password for{' '}
            <span className="font-semibold text-slate-900">{resetPasswordEmployee?.name}</span> (
            {resetPasswordEmployee?.employeeId}).
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              New Password
            </label>
            <input
              type="password"
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetPasswordEmployee(null)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              disabled={newPasswordVal.length < 6}
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition"
            >
              Set New Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Toggle Active Confirmation */}
      <ConfirmDialog
        isOpen={!!statusToggleEmployee}
        onClose={() => setStatusToggleEmployee(null)}
        onConfirm={onConfirmToggleStatus}
        title={
          statusToggleEmployee?.isActive ? 'Deactivate Employee Account' : 'Activate Employee Account'
        }
        message={
          statusToggleEmployee?.isActive
            ? `Are you sure you want to deactivate ${statusToggleEmployee?.name}'s account? The employee will no longer be able to log in. Their historical leave records remain intact.`
            : `Re-activate ${statusToggleEmployee?.name}'s account to restore login and leave application access?`
        }
        confirmText={statusToggleEmployee?.isActive ? 'Deactivate' : 'Activate'}
        type={statusToggleEmployee?.isActive ? 'danger' : 'success'}
      />

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewEmployeeDetail}
        onClose={() => setViewEmployeeDetail(null)}
        title="Employee File & Leave Status"
        maxWidth="max-w-xl"
      >
        {viewEmployeeDetail && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Staff Profile</h4>
              <p className="font-semibold text-slate-900 text-sm">
                {viewEmployeeDetail.employee?.name} ({viewEmployeeDetail.employee?.employeeId})
              </p>
              <p className="text-slate-500">
                {viewEmployeeDetail.employee?.department} • {viewEmployeeDetail.employee?.designation} •{' '}
                {viewEmployeeDetail.employee?.email}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                Current Leave Balances
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {['Casual Leave', 'Sick Leave', 'Earned Leave'].map((t) => {
                  const b = viewEmployeeDetail.balances?.balances?.[t];
                  return (
                    <div key={t} className="rounded-lg border border-slate-200 p-2.5 bg-white">
                      <p className="font-semibold text-slate-800">{t}</p>
                      <p className="mt-1 text-sm font-bold text-blue-600">
                        {b ? b.available : 0}d available
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {b ? `${b.used}d used • ${b.pending}d pending` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                Recent Leave Filings
              </h4>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {viewEmployeeDetail.recentLeaves?.length === 0 ? (
                  <p className="p-3 text-slate-400">No leave records filed.</p>
                ) : (
                  viewEmployeeDetail.recentLeaves?.map((l) => (
                    <div key={l._id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{l.leaveType}</span>
                        <span className="ml-2 text-slate-400 font-normal">
                          {new Date(l.startDate).toLocaleDateString()} ({l.numberOfDays}d)
                        </span>
                      </div>
                      <Badge status={l.status} size="sm" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeManagementPage;

