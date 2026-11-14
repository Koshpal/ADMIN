import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ModalForm } from '../../components/ui/ModalForm';
import { useToast } from '../../context/ToastContext';
import { ESC_CATEGORIES, ESC_STATUSES, NEXT, opsAdmin, type Contact, type EscDetail, type EscRow } from '../../services/coachingOps.service';
import { apiMsg, Btn, Card, Empty, Field, fmt, fmtDT, Input, label, Select, Skeleton, Tabs, TextArea, variantOf } from './kit';

const me = () => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return (u.id ?? u.userId) as string | undefined; } catch { return undefined; } };

const Detail: React.FC<{ id: string; onClose: () => void; onChanged: () => void }> = ({ id, onClose, onChanged }) => {
  const { showToast } = useToast();
  const [d, setD] = useState<EscDetail | null>(null);
  const [note, setNote] = useState(''); const [internal, setInternal] = useState(true); const [busy, setBusy] = useState(false);
  const load = useCallback(() => opsAdmin.escalation(id).then(setD).catch((e) => showToast(apiMsg(e), 'error')), [id, showToast]);
  useEffect(() => { void load(); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); try { await fn(); showToast(ok, 'success'); setNote(''); await load(); onChanged(); } catch (e) { showToast(apiMsg(e), 'error'); } finally { setBusy(false); } };
  if (!d) return <Skeleton />;
  const next = NEXT[d.status] ?? [];
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap gap-2"><StatusBadge label={label(d.severity)} variant={variantOf(d.severity)} /><StatusBadge label={label(d.status)} variant={variantOf(d.status)} /><StatusBadge label={label(d.category)} variant="neutral" /></div>
      <p className="text-[var(--color-text-secondary)]">Coach: <strong>{d.coachName ?? '—'}</strong> · Employee: <strong>{d.employeeName ?? '—'}</strong></p>
      <p className="whitespace-pre-wrap rounded-xl bg-[var(--color-bg-secondary)] p-3">{d.summary}</p>
      {d.resolutionNote && <p className="rounded-xl bg-[var(--color-success-bg)] p-3"><strong>Outcome:</strong> {d.resolutionNote}</p>}
      <ol className="flex flex-col gap-2 border-l-2 border-[var(--color-border-primary)] pl-4">
        {d.events.map((e) => (<li key={e.id}><span className="text-xs text-[var(--color-text-tertiary)]">{fmtDT(e.createdAt)} · {label(e.actorRole)}{!e.visibleToCoach ? ' · internal' : ''}</span>
          <div>{e.type === 'CREATED' ? 'Raised' : e.type === 'COMMENT' ? e.comment : `${label(e.type)}${e.toStatus ? ` → ${label(e.toStatus)}` : ''}${e.comment ? ` — ${e.comment}` : ''}`}</div></li>))}
      </ol>
      {d.status !== 'CLOSED' && (
        <div className="flex flex-col gap-3 border-t border-[var(--color-border-primary)] pt-4">
          <Field label="Note" hint="Required when resolving or marking action required. Visible to the coach unless sent as an internal comment."><TextArea rows={2} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="flex flex-wrap items-center gap-2">
            {!d.assignedAdminId && me() && <Btn disabled={busy} onClick={() => run(() => opsAdmin.assignEsc(id, me()!), 'Assigned to you')}>Assign to me</Btn>}
            {next.filter((s) => s !== 'ASSIGNED').map((s) => <Btn key={s} tone={s === 'RESOLVED' || s === 'CLOSED' ? 'primary' : 'plain'} disabled={busy} onClick={() => run(() => opsAdmin.statusEsc(id, s, note.trim() || undefined), `Moved to ${label(s)}`)}>{label(s)}</Btn>)}
            <span className="ml-auto flex items-center gap-2"><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />Internal only</label>
              <Btn disabled={busy || !note.trim()} onClick={() => run(() => opsAdmin.commentEsc(id, note.trim(), internal), 'Comment added')}>Comment</Btn></span>
          </div>
        </div>)}
      <div className="flex justify-end"><Btn onClick={onClose}>Close</Btn></div>
    </div>
  );
};

const Queue: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<EscRow[] | null>(null); const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(''); const [severity, setSeverity] = useState(''); const [unassigned, setUnassigned] = useState(false); const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => opsAdmin.escalations({ status: status || undefined, severity: severity || undefined, unassigned: unassigned ? 'true' : undefined, page, pageSize: 25 }).then((r) => { setRows(r.items); setTotal(r.total); }).catch((e) => showToast(apiMsg(e), 'error')), [status, severity, unassigned, page, showToast]);
  useEffect(() => { void load(); }, [load]);
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Status"><Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Open cases</option>{ESC_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select></Field>
        <Field label="Severity"><Select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}><option value="">All</option>{['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select></Field>
        <label className="mb-2.5 flex items-center gap-2 text-sm"><input type="checkbox" checked={unassigned} onChange={(e) => { setUnassigned(e.target.checked); setPage(1); }} />Unassigned only</label>
      </div>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No escalations match.</Empty> : (
        <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Severity</th><th>Category</th><th>Coach</th><th>Status</th><th>Age</th><th /></tr></thead>
          <tbody>{rows.map((r) => (<tr key={r.id} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5"><StatusBadge label={label(r.severity)} variant={variantOf(r.severity)} /></td><td>{label(r.category)}</td><td>{r.coachName ?? '—'}</td><td><StatusBadge label={label(r.status)} variant={variantOf(r.status)} /></td>
            <td className={r.ageHours > 48 ? 'font-semibold text-[var(--color-error)]' : ''}>{r.ageHours < 48 ? `${r.ageHours}h` : `${Math.floor(r.ageHours / 24)}d`}{!r.assignedAdminId && ' · unassigned'}</td><td className="text-right"><Btn onClick={() => setOpen(r.id)}>Open</Btn></td></tr>))}</tbody></table>)}
      {total > 25 && <div className="mt-4 flex justify-end gap-2"><Btn disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Btn><Btn disabled={page * 25 >= total} onClick={() => setPage(page + 1)}>Next</Btn></div>}
      <ModalForm isOpen={!!open} title="Escalation" onClose={() => setOpen(null)} size="lg">{open && <Detail id={open} onClose={() => setOpen(null)} onChanged={load} />}</ModalForm>
    </Card>
  );
};

const blank = { name: '', organisation: '', phone: '', email: '', hours: '', notes: '', category: '' };
const Contacts: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Contact[] | null>(null); const [edit, setEdit] = useState<string | 'new' | null>(null); const [f, setF] = useState(blank); const [busy, setBusy] = useState(false);
  const load = useCallback(() => opsAdmin.contacts(true).then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [showToast]);
  useEffect(() => { void load(); }, [load]);
  const openEdit = (c: Contact | null) => { setF(c ? { name: c.name, organisation: c.organisation ?? '', phone: c.phone ?? '', email: c.email ?? '', hours: c.hours ?? '', notes: c.notes ?? '', category: c.category ?? '' } : blank); setEdit(c ? c.id : 'new'); };
  const save = async () => { setBusy(true); try { const body: Record<string, unknown> = {}; Object.entries(f).forEach(([k, v]) => { if (v.trim()) body[k] = v.trim(); }); await opsAdmin.saveContact(edit === 'new' ? null : edit, body); showToast('Contact saved and marked verified today', 'success'); setEdit(null); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } finally { setBusy(false); } };
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); showToast(ok, 'success'); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <Card title="Escalation contacts" action={<Btn tone="primary" onClick={() => openEdit(null)}>Add contact</Btn>}>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">Coaches see this list when they escalate. Nothing is pre-filled: add only numbers you have verified. Contacts not re-verified within 180 days are flagged to coaches.</p>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No contacts yet.</Empty> : (
        <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Name</th><th>Category</th><th>Reach</th><th>Verified</th><th /></tr></thead>
          <tbody>{rows.map((c) => (<tr key={c.id} className={`border-t border-[var(--color-border-primary)] ${c.isActive ? '' : 'opacity-50'}`}><td className="py-2.5 font-semibold">{c.name}<div className="text-xs font-normal text-[var(--color-text-tertiary)]">{c.organisation}</div></td><td>{c.category ? label(c.category) : 'General'}</td><td>{[c.phone, c.email].filter(Boolean).join(' · ')}</td>
            <td>{fmt(c.verifiedAt)} {c.isStale && c.isActive && <StatusBadge label="Stale" variant="warning" />}</td>
            <td className="space-x-2 text-right"><Btn onClick={() => openEdit(c)}>Edit</Btn>{c.isActive && <Btn onClick={() => act(() => opsAdmin.verifyContact(c.id), 'Marked verified')}>Verify</Btn>}{c.isActive && <Btn tone="danger" onClick={() => act(() => opsAdmin.removeContact(c.id), 'Contact deactivated')}>Deactivate</Btn>}</td></tr>))}</tbody></table>)}
      <ModalForm isOpen={!!edit} title={edit === 'new' ? 'Add contact' : 'Edit contact'} subtitle="Saving counts as verifying the details today." onClose={() => setEdit(null)}>
        <div className="flex flex-col gap-3">
          <Field label="Name"><Input value={f.name} maxLength={120} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Organisation"><Input value={f.organisation} maxLength={120} onChange={(e) => setF({ ...f, organisation: e.target.value })} /></Field>
          <Field label="Category (blank = general)"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">General</option>{ESC_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Phone"><Input value={f.phone} maxLength={40} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Email"><Input type="email" value={f.email} maxLength={160} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field></div>
          <Field label="Hours"><Input value={f.hours} maxLength={120} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
          <Field label="Notes for coaches"><TextArea rows={3} value={f.notes} maxLength={1000} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn tone="primary" disabled={busy || !f.name.trim() || (!f.phone.trim() && !f.email.trim())} onClick={save}>Save</Btn></div>
        </div>
      </ModalForm>
    </Card>
  );
};

export const Escalations: React.FC = () => {
  const [tab, setTab] = useState('queue');
  return (<div><PageHeader title="Escalations" breadcrumb="Coaching" subtitle="Cases raised by coaches, most severe first." /><Tabs tabs={[['queue', 'Case queue'], ['contacts', 'Contacts directory']]} value={tab} onChange={setTab} />{tab === 'queue' ? <Queue /> : <Contacts />}</div>);
};
