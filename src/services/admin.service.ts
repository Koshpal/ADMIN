import api from './api';
import {
  Company,
  CreateCompanyPayload,
  Coach,
  CreateCoachPayload,
  CreateHrPayload,
  UserRecord,
  DashboardStats,
  PlatformAnalytics,
  PaginatedResponse,
  CompanyStatus,
  UserRole,
  OnboardingPayload,
  AdminSession,
  BookingStatus,
} from '../types/admin.types';

export const adminService = {
  // ─── Dashboard ───────────────────────────────────────────────────────────
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
    const { data } = await api.get('/admin/analytics');
    return data;
  },

  // ─── Companies ───────────────────────────────────────────────────────────
  getCompanies: async (params?: {
    search?: string;
    status?: CompanyStatus;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Company>> => {
    const { data } = await api.get('/admin/companies', { params });
    return data;
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const { data } = await api.get(`/admin/companies/${id}`);
    return data;
  },

  createCompany: async (payload: CreateCompanyPayload): Promise<Company> => {
    const { data } = await api.post('/admin/companies', payload);
    return data;
  },

  updateCompany: async (id: string, payload: Partial<CreateCompanyPayload>): Promise<Company> => {
    const { data } = await api.patch(`/admin/companies/${id}`, payload);
    return data;
  },

  suspendCompany: async (id: string): Promise<void> => {
    await api.patch(`/admin/companies/${id}/suspend`);
  },

  activateCompany: async (id: string): Promise<void> => {
    await api.patch(`/admin/companies/${id}/activate`);
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/admin/companies/${id}`);
  },

  getCompanyAnalytics: async (id: string) => {
    const { data } = await api.get(`/admin/companies/${id}/analytics`);
    return data;
  },

  // ─── Coaches ─────────────────────────────────────────────────────────────
  getCoaches: async (params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Coach>> => {
    const { data } = await api.get('/admin/coaches', { params });
    return data;
  },

  createCoach: async (payload: CreateCoachPayload): Promise<{ id: string; email: string }> => {
    const { data } = await api.post('/admin/coaches', payload);
    return data;
  },

  updateCoach: async (id: string, payload: Partial<CreateCoachPayload>): Promise<void> => {
    await api.patch(`/admin/coaches/${id}`, payload);
  },

  activateCoach: async (id: string): Promise<void> => {
    await api.patch(`/admin/coaches/${id}/activate`);
  },

  deactivateCoach: async (id: string): Promise<void> => {
    await api.patch(`/admin/coaches/${id}/deactivate`);
  },

  deleteCoach: async (id: string): Promise<void> => {
    await api.delete(`/admin/coaches/${id}`);
  },

  // ─── HRs ─────────────────────────────────────────────────────────────────
  createHr: async (payload: CreateHrPayload): Promise<{ id: string; email: string }> => {
    const { data } = await api.post('/admin/hrs', payload);
    return data;
  },

  // ─── Users ───────────────────────────────────────────────────────────────
  getUsers: async (params?: {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    companyId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<UserRecord>> => {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  getUserById: async (id: string): Promise<UserRecord> => {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  updateUser: async (id: string, payload: Partial<UserRecord>): Promise<void> => {
    await api.patch(`/admin/users/${id}`, payload);
  },

  suspendUser: async (id: string): Promise<void> => {
    await api.patch(`/admin/users/${id}/suspend`);
  },

  activateUser: async (id: string): Promise<void> => {
    await api.patch(`/admin/users/${id}/activate`);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  resetUserPassword: async (id: string): Promise<void> => {
    await api.post(`/admin/users/${id}/reset-password`);
  },

  // ─── Sessions ────────────────────────────────────────────────────────────
  getSessions: async (params?: {
    search?: string;
    status?: BookingStatus;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AdminSession>> => {
    const { data } = await api.get('/admin/sessions', { params });
    return data;
  },

  getSessionById: async (id: string): Promise<AdminSession> => {
    const { data } = await api.get(`/admin/sessions/${id}`);
    return data;
  },

  // ─── Onboarding ──────────────────────────────────────────────────────────
  onboardCompany: async (payload: OnboardingPayload) => {
    const { data } = await api.post('/admin/onboarding', payload);
    return data;
  },
};
