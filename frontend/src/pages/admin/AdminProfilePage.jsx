import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, Mail, User, Building } from 'lucide-react';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

export const AdminProfilePage = () => {
  const { user } = useAuth();
  const [passwordSaving, setPasswordSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onChangePassword = async (values) => {
    setPasswordSaving(true);
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Admin password changed successfully.');
      reset();
    } catch (err) {
      toast.error(err.message || 'Failed to change admin password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Administrator Profile & Security</h2>
        <p className="text-sm text-slate-500">
          Superuser account credentials and system authorization parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Info Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Administrator Credentials</h3>
              <p className="text-xs text-slate-400">System management profile</p>
            </div>
          </div>

          <div className="mt-5 space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Administrator Name</span>
              <p className="font-semibold text-slate-900 text-sm">{user?.name}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email</span>
              <p className="font-semibold text-slate-900 text-sm">{user?.email}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned System Role</span>
              <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                SYSTEM ADMINISTRATOR
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Employee ID</span>
              <p className="font-mono font-semibold text-slate-700">{user?.employeeId || 'ADM001'}</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Update Password</h3>
              <p className="text-xs text-slate-400">Change superuser password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onChangePassword)} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Current Password
              </label>
              <input
                type="password"
                {...register('currentPassword')}
                placeholder="••••••••"
                className={`mt-1.5 block w-full rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  errors.currentPassword
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                New Password
              </label>
              <input
                type="password"
                {...register('newPassword')}
                placeholder="Minimum 6 characters"
                className={`mt-1.5 block w-full rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  errors.newPassword
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="Repeat new password"
                className={`mt-1.5 block w-full rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  errors.confirmPassword
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;

