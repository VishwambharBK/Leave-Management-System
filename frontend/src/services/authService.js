import api from './api';

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem('lms_token', res.data.token);
      localStorage.setItem('lms_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
    }
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    if (res.data) {
      localStorage.setItem('lms_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  changePassword: async (passwords) => {
    const res = await api.put('/auth/change-password', passwords);
    return res;
  },
};

export default authService;

