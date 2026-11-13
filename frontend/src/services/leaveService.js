import api from './api';

export const leaveService = {
  applyLeave: async (formData) => {
    // If formData is FormData instance (for file uploads)
    if (formData instanceof FormData) {
      return api.post('/leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/leaves', formData);
  },

  getMyLeaves: async (params = {}) => {
    return api.get('/leaves/my', { params });
  },

  getLeaveById: async (id) => {
    return api.get(`/leaves/${id}`);
  },

  cancelLeave: async (id) => {
    return api.patch(`/leaves/${id}/cancel`);
  },

  getLeaveBalance: async (year) => {
    return api.get('/employees/leave-balance', { params: { year } });
  },
};

export default leaveService;

