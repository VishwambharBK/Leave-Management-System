import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    return api.get('/admin/dashboard');
  },

  getEmployees: async (params = {}) => {
    return api.get('/admin/employees', { params });
  },

  createEmployee: async (data) => {
    return api.post('/admin/employees', data);
  },

  getEmployeeById: async (id) => {
    return api.get(`/admin/employees/${id}`);
  },

  updateEmployee: async (id, data) => {
    return api.put(`/admin/employees/${id}`, data);
  },

  toggleEmployeeStatus: async (id) => {
    return api.patch(`/admin/employees/${id}/status`);
  },

  resetEmployeePassword: async (id, newPassword) => {
    return api.patch(`/admin/employees/${id}/reset-password`, { newPassword });
  },

  getAllLeaves: async (params = {}) => {
    return api.get('/admin/leaves', { params });
  },

  approveLeave: async (id, adminRemarks = '') => {
    return api.patch(`/admin/leaves/${id}/approve`, { adminRemarks });
  },

  rejectLeave: async (id, adminRemarks) => {
    return api.patch(`/admin/leaves/${id}/reject`, { adminRemarks });
  },

  getPolicies: async (year) => {
    return api.get('/policies', { params: { year } });
  },

  updatePolicy: async (id, data) => {
    return api.put(`/policies/${id}`, data);
  },

  getReports: async (year) => {
    return api.get('/admin/reports', { params: { year } });
  },
};

export default adminService;

