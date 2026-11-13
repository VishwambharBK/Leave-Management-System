import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import employeeService from '../../services/employeeService';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Building, Briefcase, Calendar, ShieldCheck } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

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

export const EmployeeProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onUpdateProfile = async (values) => {
    setProfileSaving(true);
    try {
      const res = await employeeService.updateProfile({ name: values.name });
      updateUser(res.data);
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const onChangePassword = async (values) => {
    setPasswordSaving(true);
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully.');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Personal Profile & Security</h2>
        <p className="text-sm text-slate-500">
          Manage your contact credentials and authentication preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Profile Details</h3>
              <p className="text-xs text-slate-400">Corporate identity and assignments</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                {...registerProfile('name')}
                className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  profileErrors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {profileErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{profileErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employee Identification
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span className="font-semibold">{user?.employeeId}</span>
                <span className="ml-auto text-[11px] text-slate-400">(Read-only)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{user?.email}</span>
                <span className="ml-auto text-[11px] text-slate-400">(Read-only)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.department}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Designation
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.designation}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {profileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-400">Maintain credential security</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Current Password
              </label>
              <input
                type="password"
                {...registerPassword('currentPassword')}
                placeholder="••••••••"
                className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  passwordErrors.currentPassword
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-xs text-rose-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                New Password
              </label>
              <input
                type="password"
                {...registerPassword('newPassword')}
                placeholder="Minimum 6 characters"
                className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  passwordErrors.newPassword
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-xs text-rose-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                {...registerPassword('confirmPassword')}
                placeholder="Repeat new password"
                className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-1 ${
                  passwordErrors.confirmPassword
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{passwordErrors.confirmPassword.message}</p>
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

export default EmployeeProfilePage;

