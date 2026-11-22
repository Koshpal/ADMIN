import api from './api';

const A = '/admin/coaching';

export interface MyPermissions { isSuperAdmin: boolean; permissions: string[]; effective: string[]; allPermissions: string[] }
export interface AssignmentRow {
  id: string; status: 'ACTIVE' | 'ENDED'; startedAt: string; endedAt: string | null; reason: string | null; handover: any;
  coach: { id: string; name: string }; employee: { id: string; name: string; company: string | null };
  /** ADMIN = assigned by an admin; BOOKING = created when the employee booked their first coach */
  source?: 'ADMIN' | 'BOOKING'; pendingApproval?: boolean; approvedAt?: string | null;
  /** the programme the employee is currently on; a coach cannot start a session until there is one */
  program?: { id: string; name: string } | null;
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

export interface ConsentText {
  id: string; scope: 'COACHING_PROGRAM' | string; version: number; title: string; body: string;
  disclosures: { key: string; text: string }[]; isCurrent: boolean; isPlaceholder: boolean; createdAt: string;
}

export const coachingAdminService = {
  consentTexts: () => api.get<ConsentText[]>(`${A}/consent-texts`, { params: { scope: 'COACHING_PROGRAM' } }).then((r) => r.data),
  publishConsentText: (body: { title: string; body: string; disclosures: { key: string; text: string }[]; isPlaceholder: boolean }) =>
    api.post<ConsentText>(`${A}/consent-texts`, { scope: 'COACHING_PROGRAM', ...body }).then((r) => r.data),
  myPermissions: () => api.get<MyPermissions>(`${A}/me/permissions`).then((r) => r.data),
  assignments: (params: { status?: string; pending?: boolean; page?: number; pageSize?: number }) =>
    api.get<{ total: number; page: number; pageSize: number; items: AssignmentRow[] }>(`${A}/assignments`, { params }).then((r) => r.data),
  assign: (body: { coachId: string; employeeId: string; reason?: string; importantInformation?: string; programId?: string }) =>
    api.post<AssignResult>(`${A}/assignments`, body).then((r) => r.data),
  approveAssignment: (id: string, programId?: string) => api.post<{ approved: boolean; alreadyApproved: boolean }>(`${A}/assignments/${id}/approve`, programId ? { programId } : {}).then((r) => r.data),
  programs: () => api.get<Program[]>(`${A}/programs`).then((r) => r.data),
  templates: (programId: string) => api.get<Template[]>(`${A}/programs/${programId}/templates`).then((r) => r.data),
  activateTemplate: (id: string) => api.post(`${A}/templates/${id}/activate`).then((r) => r.data),
};

export const apiMessage = (e: any, fallback = 'Something went wrong') => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m ?? fallback;
};
