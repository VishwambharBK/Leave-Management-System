import api from './api';

export const employeeService = {
  getProfile: async () => {
    return api.get('/employees/profile');
  },

  updateProfile: async (data) => {
    return api.put('/employees/profile', data);
  },

  getNotifications: async (params = {}) => {
    return api.get('/notifications', { params });
  },

  markNotificationAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllNotificationsAsRead: async () => {
    return api.patch('/notifications/read-all');
  },
};

export default employeeService;

