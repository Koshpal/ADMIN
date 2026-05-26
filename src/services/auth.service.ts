import api from './api';
import { AdminUser } from '../types/auth.types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: AdminUser }> => {
    const response = await api.post('/auth/login', { email, password, role: 'ADMIN' });
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async (): Promise<AdminUser> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post(`/auth/reset-password/${token}`, { newPassword });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
