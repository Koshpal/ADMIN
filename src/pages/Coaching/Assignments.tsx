import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { ModalForm } from '../../components/ui/ModalForm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { adminService } from '../../services/admin.service';
import { apiMessage, coachingAdminService, type AssignResult, type AssignmentRow, type Program } from '../../services/coaching.service';
import type { Coach, UserRecord } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

const input = 'w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]';
const label = 'mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]';

export const Assignments: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'ACTIVE' | 'ENDED' | ''>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await coachingAdminService.assignments({ status: status || undefined, page, pageSize: PAGE });
      setRows(r.items); setTotal(r.total);
    } catch (e) { showToast(apiMessage(e, 'Failed to load assignments.'), 'error'); } finally { setLoading(false); }
  }, [status, page, showToast]);
  useEffect(() => { void load(); }, [load]);

  const columns: Column<AssignmentRow>[] = [
    { key: 'employee', label: 'Employee', render: (r) => <div><p className="font-semibold">{r.employee.name}</p><p className="text-xs text-[var(--color-text-tertiary)]">{r.employee.company ?? '—'}</p></div> },
    { key: 'coach', label: 'Coach', render: (r) => r.coach.name },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'} label={r.status === 'ACTIVE' ? 'Active' : 'Ended'} /> },
    { key: 'period', label: 'Period', render: (r) => `${format(new Date(r.startedAt), 'd MMM yyyy')}${r.endedAt ? ` → ${format(new Date(r.endedAt), 'd MMM yyyy')}` : ' → present'}` },
    { key: 'reason', label: 'Reason', render: (r) => r.reason ?? '—' },
  ];

  return (
    <div>
      <PageHeader title="Coach assignments" subtitle="Assign and reassign employees. History is never overwritten." breadcrumb="Coaching"
        actions={<>
          <select aria-label="Status filter" value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(1); }} className={`${input} !w-auto`}>
            <option value="ACTIVE">Active</option><option value="ENDED">Ended</option><option value="">All</option>
          </select>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"><UserPlus className="h-4 w-4" />Assign employee</button>
        </>} />
      <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={(r) => r.id} page={page} total={total} pageSize={PAGE}
        totalPages={Math.max(1, Math.ceil(total / PAGE))} onPageChange={setPage} emptyMessage="No assignments yet." />
      {open && <AssignModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />}
    </div>
  );
};

const AssignModal: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const { showToast } = useToast();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [employees, setEmployees] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ coachId: '', employeeId: '', programId: '', reason: '', importantInformation: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssignResult | null>(null);

  useEffect(() => {
    adminService.getCoaches({ isActive: true, pageSize: 100 }).then((r) => setCoaches(r.data)).catch(() => showToast('Could not load coaches.', 'error'));
    coachingAdminService.programs().then((p) => { const act = p.filter((x) => x.isActive); setPrograms(act); if (act[0]) setForm((f) => ({ ...f, programId: act[0].id })); }).catch(() => { /* needs the programs permission; optional here */ });
  }, [showToast]);
  useEffect(() => {
    const t = setTimeout(() => { adminService.getUsers({ role: 'EMPLOYEE' as any, isActive: true, search: search || undefined, pageSize: 20 }).then((r) => setEmployees(r.data)).catch(() => {}); }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { coachId: form.coachId, employeeId: form.employeeId, ...(form.programId && { programId: form.programId }), ...(form.reason.trim() && { reason: form.reason.trim() }), ...(form.importantInformation.trim() && { importantInformation: form.importantInformation.trim() }) };
      const r = await coachingAdminService.assign(body);
      if (r.unchanged) { showToast('Employee is already assigned to that coach.', 'success'); onDone(); return; }
      if (r.upcomingBookingsWithPreviousCoach.length) setResult(r); else { showToast('Assignment saved.', 'success'); onDone(); }
    } catch (err) { showToast(apiMessage(err), 'error'); } finally { setBusy(false); }
  };

  if (result) {
    return (
      <ModalForm isOpen title="Reassigned — action needed" onClose={onDone} size="md">
        <p className="text-sm text-[var(--color-text-secondary)]">The employee has {result.upcomingBookingsWithPreviousCoach.length} upcoming booking(s) still on the previous coach's calendar. They are not cancelled automatically — the previous coach no longer has access to this employee, so please have them cancelled or rebooked.</p>
        <ul className="mt-3 list-disc pl-5 text-sm">{result.upcomingBookingsWithPreviousCoach.map((b) => <li key={b.id}>{format(new Date(b.slotStart), 'd MMM yyyy, h:mm a')}</li>)}</ul>
        <button onClick={onDone} className="mt-5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white">Done</button>
      </ModalForm>
    );
  }
  return (
    <ModalForm isOpen title="Assign employee to coach" subtitle="If the employee already has a coach, this reassigns them and records a handover." onClose={onClose} size="md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div><label className={label} htmlFor="a-search">Employee</label>
          <input id="a-search" className={`${input} mb-2`} placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select id="a-emp" aria-label="Employee" required size={5} className={input} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            {employees.map((u) => <option key={u.id} value={u.id}>{u.fullName} — {u.company ?? 'no company'}</option>)}
          </select></div>
        <div><label className={label} htmlFor="a-coach">Coach</label>
          <select id="a-coach" required className={input} value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })}><option value="">Select a coach…</option>{coaches.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></div>
        <div><label className={label} htmlFor="a-prog">Program (enrols the employee if not already)</label>
          <select id="a-prog" className={input} value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}><option value="">Don't change enrolment</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className={label} htmlFor="a-reason">Reason (required when reassigning)</label><input id="a-reason" maxLength={500} className={input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        <div><label className={label} htmlFor="a-info">Important handover information (optional)</label><textarea id="a-info" rows={3} maxLength={2000} className={input} value={form.importantInformation} onChange={(e) => setForm({ ...form, importantInformation: e.target.value })} />
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Do not include sensitive financial details. The handover automatically carries stage, last session, and open action items — never note text.</p></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-[var(--color-border-primary)] px-4 py-2.5 text-sm">Cancel</button>
          <button disabled={busy || !form.coachId || !form.employeeId} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save assignment'}</button></div>
      </form>
    </ModalForm>
  );
};
