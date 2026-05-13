export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN';
  isActive: boolean;
  fullName?: string;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
}
