import api from './api';

const A = '/admin/coaching';

export interface MyPermissions { isSuperAdmin: boolean; permissions: string[]; effective: string[]; allPermissions: string[] }
export interface AssignmentRow {
  id: string; status: 'ACTIVE' | 'ENDED'; startedAt: string; endedAt: string | null; reason: string | null; handover: any;
  coach: { id: string; name: string }; employee: { id: string; name: string; company: string | null };
}
export interface Program { id: string; name: string; description: string | null; isActive: boolean; _count: { enrollments: number } }
export interface Template {
  id: string; sessionNumber: number; version: number; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; title: string; objective: string;
  durationMinutes: number; isPlaceholderContent: boolean; requiredNoteFields: string[];
  steps: { key: string; title: string; minutes: number }[]; closingChecklist: { key: string; label: string; required: boolean }[];
}
export interface AssignResult {
  reassigned: boolean; unchanged: boolean; handover: any;
  upcomingBookingsWithPreviousCoach: { id: string; slotStart: string }[];
}

export const coachingAdminService = {
  myPermissions: () => api.get<MyPermissions>(`${A}/me/permissions`).then((r) => r.data),
  assignments: (params: { status?: string; page?: number; pageSize?: number }) =>
    api.get<{ total: number; page: number; pageSize: number; items: AssignmentRow[] }>(`${A}/assignments`, { params }).then((r) => r.data),
  assign: (body: { coachId: string; employeeId: string; reason?: string; importantInformation?: string; programId?: string }) =>
    api.post<AssignResult>(`${A}/assignments`, body).then((r) => r.data),
  programs: () => api.get<Program[]>(`${A}/programs`).then((r) => r.data),
  templates: (programId: string) => api.get<Template[]>(`${A}/programs/${programId}/templates`).then((r) => r.data),
  activateTemplate: (id: string) => api.post(`${A}/templates/${id}/activate`).then((r) => r.data),
};

export const apiMessage = (e: any, fallback = 'Something went wrong') => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m ?? fallback;
};
