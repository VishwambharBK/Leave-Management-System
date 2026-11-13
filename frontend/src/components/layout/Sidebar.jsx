import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  Scale,
  UserCheck,
  Users,
  Settings2,
  LogOut,
  Building2,
  CalendarCheck2,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const employeeLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Apply Leave', path: '/apply-leave', icon: CalendarPlus },
    { name: 'Leave History', path: '/leave-history', icon: History },
    { name: 'Leave Balance', path: '/leave-balance', icon: Scale },
    { name: 'My Profile', path: '/profile', icon: UserCheck },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Leave Requests', path: '/admin/leave-requests', icon: CalendarCheck2 },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Leave Policies', path: '/admin/policies', icon: Settings2 },
    { name: 'Admin Profile', path: '/admin/profile', icon: UserCheck },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-navy-950 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-20 items-center gap-3 border-b border-navy-900 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">LeaveFlow</h1>
            <p className="text-[11px] text-slate-400">Enterprise LMS</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isAdmin ? 'Administration' : 'Self-Service'}
          </div>

          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-navy-900 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="border-t border-navy-900 p-4">
          <div className="mb-3 rounded-lg bg-navy-900/60 p-3 text-xs">
            <p className="font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-slate-400 truncate">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-blue-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{user?.employeeId}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy-800 bg-navy-900/40 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

