export type CompanyStatus = 'ACTIVE' | 'INACTIVE';
export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE' | 'COACH';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  status: CompanyStatus;
  employeeLimit: number;
  employeeCount: number;
  hrCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  domain?: string;
  employeeLimit: number;
  status?: CompanyStatus;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  website?: string;
}

export interface Coach {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  fullName: string;
  expertise: string[];
  bio?: string;
  rating?: number;
  successRate?: number;
  clientsHelped?: number;
  phone?: string;
  location?: string;
  timezone: string;
  profilePhoto?: string;
  totalSessions: number;
}

export interface CreateCoachPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string[];
  bio?: string;
  experience?: number;
  password?: string;
  timezone?: string;
  location?: string;
  languages?: string[];
}

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  fullName: string;
  company?: string;
  companyId?: string;
  profilePhoto?: string;
}

export interface CreateHrPayload {
  fullName: string;
  email: string;
  companyId: string;
  phone?: string;
  designation?: string;
  password?: string;
}

export interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalCoaches: number;
  totalEmployees: number;
  totalHRs: number;
  activeUsers: number;
  totalSessions: number;
  completedSessions: number;
  recentActivity: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface PlatformAnalytics {
  companiesByMonth: Array<{ createdAt: string; _count: number }>;
  sessionsByStatus: Array<{ status: BookingStatus; _count: number }>;
  usersByRole: Array<{ role: UserRole; _count: number }>;
  topCompanies: Array<{
    id: string;
    name: string;
    status: CompanyStatus;
    employeeCount: number;
    hrCount: number;
    employeeLimit: number;
    createdAt: string;
  }>;
}

export type NoteVisibility = 'PRIVATE' | 'SHARED';

export interface AdminSession {
  id: string;
  status: BookingStatus;
  slotStart: string;
  slotEnd: string;
  meetingLink: string;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  coach: {
    id: string;
    email: string;
    fullName: string;
    profilePhoto?: string;
    bio?: string;
    expertise?: string[];
    location?: string;
  };
  employee: {
    id: string;
    email: string;
    fullName: string;
    profilePhoto?: string;
    phone?: string;
    company?: string;
    companyId?: string;
  };
  coachNote?: {
    notes: string;
    visibility: NoteVisibility;
    createdAt: string;
  } | null;
  feedback?: {
    rating: number;
    feedbackText: string;
    createdAt: string;
  } | null;
}

export interface OnboardingPayload {
  company: CreateCompanyPayload;
  hr: Omit<CreateHrPayload, 'companyId'>;
  coach?: CreateCoachPayload;
}
