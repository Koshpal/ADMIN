import api from './api';

const A = '/admin/coaching';
const get = <T,>(url: string, params?: object) => api.get<T>(`${A}${url}`, { params }).then((r) => r.data);
const post = <T,>(url: string, body?: object) => api.post<T>(`${A}${url}`, body).then((r) => r.data);
const put = <T,>(url: string, body?: object) => api.put<T>(`${A}${url}`, body).then((r) => r.data);
const del = <T,>(url: string) => api.delete<T>(`${A}${url}`).then((r) => r.data);

export type Page<T> = { total: number; items: T[] };
export const ESC_STATUSES = ['CREATED', 'ASSIGNED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED'] as const;
export const ESC_CATEGORIES = ['FINANCIAL_DISTRESS', 'WELLBEING_CONCERN', 'LEGAL_ISSUE', 'FRAUD_OR_SCAM', 'SAFETY_CONCERN', 'CONDUCT_OR_COMPLAINT', 'OTHER'] as const;
export const NEXT: Record<string, string[]> = {
  CREATED: ['ASSIGNED', 'UNDER_REVIEW'], ASSIGNED: ['UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED'], UNDER_REVIEW: ['ACTION_REQUIRED', 'RESOLVED'],
  ACTION_REQUIRED: ['UNDER_REVIEW', 'RESOLVED'], RESOLVED: ['CLOSED', 'UNDER_REVIEW'], CLOSED: [],
};

export interface EscRow { id: string; category: string; severity: string; status: string; coachName: string | null; assignedAdminId: string | null; createdAt: string; ageHours: number }
export interface EscEvent { id: string; type: string; fromStatus: string | null; toStatus: string | null; comment: string | null; actorRole: string; visibleToCoach: boolean; createdAt: string }
export interface EscDetail { id: string; category: string; severity: string; status: string; summary: string; coachName: string | null; employeeName: string | null; assignedAdminId: string | null; resolutionNote: string | null; events: EscEvent[] }
export interface Contact { id: string; category: string | null; name: string; organisation: string | null; phone: string | null; email: string | null; hours: string | null; notes: string | null; isActive: boolean; verifiedAt: string; isStale: boolean }
export interface PbRow { id: string; articleId: string; slug: string; category: string; title: string; version: number; status: string; authorId: string; updatedAt: string }
export interface PbVersion extends PbRow { summary: string | null; body: string; tags: string[] }
export interface Dashboard {
  coaches: number; employees: number; assignedEmployees: number; unassignedEmployees: number;
  sessionsLast30Days: Record<string, number>; openEscalations: Record<string, number>; pendingAudits: number; pendingClosureExceptions: number; openCorrectionRequests: number; staleEscalationContacts: number;
}
export interface WorkloadRow { coachId: string; coachName: string | null; activeEmployees: number; capacityTarget: number; utilizationPct: number; band: 'OK' | 'NEAR' | 'OVER'; sessionsNext7Days: number; overdueToStart: number }
export interface Performance { coachId: string; coachName: string | null; scheduled: number; completed: number; noShows: number; cancelled: number; avgDurationMinutes: number | null; closureExceptionRatePct: number | null; auditedSessions: number; avgQualityScore: number | null; openCorrections: number; escalationsRaised: number }
export interface Audit { id: string; sessionId: string; status: 'PENDING' | 'COMPLETED'; source: string; auditorId: string | null; sessionNumber: number; completedAt: string; coachName: string | null; overall: number | null }
export interface Rule { id: string; name: string; isActive: boolean; ratePercent: number; sessionNumber: number | null; newCoachFirstN: number | null }
export interface SupSession { id: string; sessionNumber: number; status: string; scheduledStart: string; completedAt: string | null; employeeRef: string; coachName: string | null; actionPlanExceptionStatus: string | null; nextSessionExceptionStatus: string | null }
export interface SupDetail { id: string; sessionNumber: number; status: string; templateVersion: number; playbookVersionRef: string | null; steps: { key: string; title: string; completed: boolean }[]; checklist: { key: string; required: boolean; answered: boolean }[]; closure: Record<string, string | null>; notesFinalized: boolean; actionItems: { total: number; completed: number } | null }
export interface ExceptionRow { id: string; sessionNumber: number; completedAt: string | null; coachName: string | null; actionPlanException: string | null; actionPlanExceptionStatus: string | null; nextSessionException: string | null; nextSessionExceptionStatus: string | null }
export interface Correction { id: string; sessionId: string; fieldKey: string | null; reason: string; status: string; response: string | null; createdAt: string }
export interface Module { id: string; key: string; title: string; kind: string; description: string | null; content: string | null; orderIndex: number; isRequired: boolean; requiredCount: number; isActive: boolean; isPlaceholderContent: boolean; assessments: { id: string; title: string }[] }
export interface RosterRow { coachId: string; coachName: string | null; status: string; certifiedAt: string | null; expiresAt: string | null; readyForApproval: boolean }
export interface ToolCfg { key: string; configured: boolean; taxYear: string | null; source: string | null; reviewedAt: string | null; config: any }
export interface WorksheetField { key: string; label: string; type: 'text' | 'number' | 'longtext'; required?: boolean }
export interface Worksheet { id: string; key: string; title: string; description: string | null; fields: WorksheetField[]; isActive: boolean }

export const opsAdmin = {
  dashboard: () => get<Dashboard>('/dashboard'), workload: () => get<{ capacityTarget: number; totalSlotsFree: number; coaches: WorkloadRow[] }>('/workload'),
  handovers: () => get<{ totalHandovers: number; avgTenureDays: number | null; byReason: Record<string, number>; outgoingByCoach: { coachName: string; handovers: number }[] }>('/handovers'),
  performance: () => get<Performance[]>('/performance'), settings: () => get<Record<string, number | boolean>>('/settings'), setSetting: (k: string, value: number | boolean) => put<Record<string, number | boolean>>(`/settings/${k}`, { value }),
  escalations: (p: object) => get<Page<EscRow>>('/escalations', p), escalation: (id: string) => get<EscDetail>(`/escalations/${id}`),
  assignEsc: (id: string, adminId: string) => post(`/escalations/${id}/assign`, { adminId }), statusEsc: (id: string, status: string, note?: string, visibleToCoach = true) => post(`/escalations/${id}/status`, { status, note, visibleToCoach }),
  commentEsc: (id: string, comment: string, internal: boolean) => post(`/escalations/${id}/comments`, { comment, internal }),
  contacts: (includeInactive = true) => get<Contact[]>('/contacts', { includeInactive: String(includeInactive) }),
  saveContact: (id: string | null, body: object) => (id ? put<Contact>(`/contacts/${id}`, body) : post<Contact>('/contacts', body)), verifyContact: (id: string) => post(`/contacts/${id}/verify`), removeContact: (id: string) => del(`/contacts/${id}`),
  playbook: (status?: string) => get<PbRow[]>('/playbook', { status }), pbVersion: (id: string) => get<PbVersion>(`/playbook/${id}`),
  pbCreate: (body: object) => post<PbVersion>('/playbook', body), pbEdit: (id: string, body: object) => put(`/playbook/${id}`, body), pbNewVersion: (articleId: string) => post(`/playbook/articles/${articleId}/versions`),
  pbAct: (id: string, act: 'submit' | 'approve' | 'reject' | 'publish' | 'archive') => post(`/playbook/${id}/${act}`),
  toolConfigs: () => get<ToolCfg[]>('/tools/config'), saveToolConfig: (key: string, body: object) => put(`/tools/config/${key}`, body),
  worksheets: () => get<Worksheet[]>('/worksheets'), saveWorksheet: (id: string | null, body: object) => (id ? put(`/worksheets/${id}`, body) : post('/worksheets', body)),
  criteria: () => get<{ key: string; label: string }[]>('/quality/criteria'), rules: () => get<Rule[]>('/quality/rules'), createRule: (b: object) => post('/quality/rules', b), ruleActive: (id: string, isActive: boolean) => put(`/quality/rules/${id}/active`, { isActive }),
  audits: (p: object) => get<Page<Audit>>('/quality/audits', p), manualAudit: (sessionId: string) => post('/quality/audits', { sessionId }), claim: (id: string) => post(`/quality/audits/${id}/claim`),
  scorecard: (id: string, b: object) => post<{ overall: number }>(`/quality/audits/${id}/scorecard`, b), exceptions: () => get<ExceptionRow[]>('/quality/exceptions'),
  reviewException: (sid: string, which: string, decision: string) => post(`/quality/exceptions/${sid}/review`, { which, decision }),
  supervision: (p: object) => get<Page<SupSession>>('/supervision/sessions', p), supDetail: (id: string) => get<SupDetail>(`/supervision/sessions/${id}`),
  supContent: (id: string) => get<{ employeeName: string | null; note: Record<string, string> | null; actionItems: { title: string; kind: string; status: string }[]; addenda: { id: string; text: string; createdAt: string }[] }>(`/supervision/sessions/${id}/content`),
  corrections: (p?: object) => get<Correction[]>('/supervision/corrections', p), requestCorrection: (b: object) => post('/supervision/corrections', b),
  modules: () => get<Module[]>('/learning/modules'), saveModule: (id: string | null, b: object) => (id ? put(`/learning/modules/${id}`, b) : post('/learning/modules', b)),
  createAssessment: (moduleId: string, b: object) => post(`/learning/modules/${moduleId}/assessments`, b), verify: (b: object) => post('/learning/verify', b),
  roster: () => get<RosterRow[]>('/certification'), approve: (coachId: string, notes?: string) => post(`/certification/${coachId}/approve`, { notes }), revoke: (coachId: string, reason: string) => post(`/certification/${coachId}/revoke`, { reason }),
};
