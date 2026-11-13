import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleBasedRoute from './routes/RoleBasedRoute';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import ApplyLeavePage from './pages/employee/ApplyLeavePage';
import LeaveHistoryPage from './pages/employee/LeaveHistoryPage';
import LeaveBalancePage from './pages/employee/LeaveBalancePage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import LeaveRequestsPage from './pages/admin/LeaveRequestsPage';
import EmployeeManagementPage from './pages/admin/EmployeeManagementPage';
import LeavePolicyPage from './pages/admin/LeavePolicyPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Root Redirect component based on auth state and role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes inside Main Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Employee Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['employee']} />}>
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="/apply-leave" element={<ApplyLeavePage />} />
                <Route path="/leave-history" element={<LeaveHistoryPage />} />
                <Route path="/leave-balance" element={<LeaveBalancePage />} />
                <Route path="/profile" element={<EmployeeProfilePage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/leave-requests" element={<LeaveRequestsPage />} />
                <Route path="/admin/employees" element={<EmployeeManagementPage />} />
                <Route path="/admin/policies" element={<LeavePolicyPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
              </Route>
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

