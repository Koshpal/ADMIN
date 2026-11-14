import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ModalForm } from '../../components/ui/ModalForm';
import { useToast } from '../../context/ToastContext';
import { opsAdmin, type Audit, type Correction, type ExceptionRow, type Rule, type SupDetail, type SupSession } from '../../services/coachingOps.service';
import { apiMsg, Btn, Card, Empty, Field, fmt, Input, label, Select, Skeleton, Tabs, TextArea, variantOf } from './kit';

const Audits: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Audit[] | null>(null); const [status, setStatus] = useState('PENDING');
  const [crit, setCrit] = useState<{ key: string; label: string }[]>([]);
  const [open, setOpen] = useState<Audit | null>(null); const [scores, setScores] = useState<Record<string, number>>({}); const [summary, setSummary] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(() => opsAdmin.audits({ status, pageSize: 50 }).then((r) => setRows(r.items)).catch((e) => showToast(apiMsg(e), 'error')), [status, showToast]);
  useEffect(() => { void load(); opsAdmin.criteria().then(setCrit).catch(() => undefined); }, [load]);
  const start = async (a: Audit) => { try { await opsAdmin.claim(a.id); setScores({}); setSummary(''); setOpen(a); } catch (e) { showToast(apiMsg(e), 'error'); } };
  const submit = async () => { if (!open) return; setBusy(true); try { const r = await opsAdmin.scorecard(open.id, { scores: crit.map((c) => ({ criterion: c.key, score: scores[c.key] })), summary: summary || undefined }); showToast(`Scorecard saved (overall ${r.overall})`, 'success'); setOpen(null); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } finally { setBusy(false); } };
  return (
    <Card action={<Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Audit status"><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option></Select>}>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No {status.toLowerCase()} audits. Sampling rules create audits as sessions are completed.</Empty> : (
        <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Coach</th><th>Session</th><th>Completed</th><th>Source</th><th>Score</th><th /></tr></thead>
          <tbody>{rows.map((a) => (<tr key={a.id} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5 font-semibold">{a.coachName ?? '—'}</td><td>#{a.sessionNumber}</td><td>{fmt(a.completedAt)}</td><td>{label(a.source)}</td><td>{a.overall ?? '—'}</td><td className="text-right">{a.status === 'PENDING' && <Btn tone="primary" onClick={() => start(a)}>Score</Btn>}</td></tr>))}</tbody></table>)}
      <ModalForm isOpen={!!open} title="Quality scorecard" subtitle="1 = poor, 5 = excellent. To read the session notes you need the sensitive-data permission and the employee's review consent." onClose={() => setOpen(null)} size="lg">
        <div className="flex flex-col gap-3">
          {crit.map((c) => (<div key={c.key} className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm">{c.label}</span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-pressed={scores[c.key] === n} onClick={() => setScores({ ...scores, [c.key]: n })} className={`h-9 w-9 rounded-lg border text-sm font-semibold ${scores[c.key] === n ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border-primary)]'}`}>{n}</button>)}</div></div>))}
          <Field label="Summary (optional)"><TextArea rows={3} value={summary} maxLength={3000} onChange={(e) => setSummary(e.target.value)} /></Field>
          <div className="flex justify-end gap-2"><Btn onClick={() => setOpen(null)}>Cancel</Btn><Btn tone="primary" disabled={busy || crit.some((c) => !scores[c.key])} onClick={submit}>Submit scorecard</Btn></div>
        </div>
      </ModalForm>
    </Card>
  );
};

const Rules: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Rule[] | null>(null);
  const [f, setF] = useState({ name: '', ratePercent: '10', sessionNumber: '', newCoachFirstN: '' });
  const load = useCallback(() => opsAdmin.rules().then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [showToast]);
  useEffect(() => { void load(); }, [load]);
  const add = async () => { try { await opsAdmin.createRule({ name: f.name.trim(), ratePercent: Number(f.ratePercent), ...(f.sessionNumber ? { sessionNumber: Number(f.sessionNumber) } : {}), ...(f.newCoachFirstN ? { newCoachFirstN: Number(f.newCoachFirstN) } : {}) }); showToast('Rule created', 'success'); setF({ ...f, name: '' }); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  const toggle = async (r: Rule) => { try { await opsAdmin.ruleActive(r.id, !r.isActive); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <Card title="New sampling rule">
        <div className="flex flex-col gap-3">
          <Field label="Name"><Input value={f.name} maxLength={120} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Share of matching sessions to audit (%)"><Input type="number" min={0} max={100} value={f.ratePercent} onChange={(e) => setF({ ...f, ratePercent: e.target.value })} /></Field>
          <Field label="Only session number (optional)"><Input type="number" min={1} max={10} value={f.sessionNumber} onChange={(e) => setF({ ...f, sessionNumber: e.target.value })} /></Field>
          <Field label="Audit every session of a coach until they have completed this many (optional)" hint="Use to supervise new coaches closely."><Input type="number" min={1} value={f.newCoachFirstN} onChange={(e) => setF({ ...f, newCoachFirstN: e.target.value })} /></Field>
          <Btn tone="primary" disabled={!f.name.trim()} onClick={add}>Create rule</Btn>
        </div>
      </Card>
      <Card title="Rules">{!rows ? <Skeleton /> : !rows.length ? <Empty>No rules: no sessions are sampled automatically.</Empty> : (
        <ul className="flex flex-col gap-2">{rows.map((r) => (<li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-primary)] p-3"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-[var(--color-text-tertiary)]">{r.ratePercent}% {r.sessionNumber ? `· session ${r.sessionNumber}` : ''} {r.newCoachFirstN ? `· new-coach ramp-up (${r.newCoachFirstN})` : ''}</p></div><Btn onClick={() => toggle(r)}>{r.isActive ? 'Disable' : 'Enable'}</Btn></li>))}</ul>)}</Card>
    </div>
  );
};

const Exceptions: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ExceptionRow[] | null>(null);
  const load = useCallback(() => opsAdmin.exceptions().then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [showToast]);
  useEffect(() => { void load(); }, [load]);
  const review = async (id: string, which: string, decision: string) => { try { await opsAdmin.reviewException(id, which, decision); showToast(`Exception ${decision.toLowerCase()}`, 'success'); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <Card title="Closure exceptions awaiting review">
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">A coach can close a session without an action plan or a booked next session by stating a reason. Each one lands here.</p>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>Nothing to review.</Empty> : (
        <ul className="flex flex-col gap-3">{rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-[var(--color-border-primary)] p-4 text-sm"><p className="font-semibold">{r.coachName ?? '—'} · session #{r.sessionNumber} · {fmt(r.completedAt)}</p>
            {([['actionPlan', 'No action plan', r.actionPlanException, r.actionPlanExceptionStatus], ['nextSession', 'Next session not booked', r.nextSessionException, r.nextSessionExceptionStatus]] as const).filter((x) => x[3] === 'PENDING_REVIEW').map(([which, title, text]) => (
              <div key={which} className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--color-bg-secondary)] p-3"><div><p className="text-xs font-bold text-[var(--color-text-secondary)]">{title}</p><p>{text}</p></div><div className="flex gap-2"><Btn tone="primary" onClick={() => review(r.id, which, 'APPROVED')}>Accept</Btn><Btn tone="danger" onClick={() => review(r.id, which, 'REJECTED')}>Reject</Btn></div></div>))}</li>))}</ul>)}
    </Card>
  );
};

const Supervision: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<SupSession[] | null>(null); const [status, setStatus] = useState('COMPLETED');
  const [d, setD] = useState<SupDetail | null>(null); const [content, setContent] = useState<Awaited<ReturnType<typeof opsAdmin.supContent>> | null>(null); const [denied, setDenied] = useState<string | null>(null);
  const [cor, setCor] = useState({ fieldKey: '', reason: '' });
  const load = useCallback(() => opsAdmin.supervision({ status: status || undefined, pageSize: 50 }).then((r) => setRows(r.items)).catch((e) => showToast(apiMsg(e), 'error')), [status, showToast]);
  useEffect(() => { void load(); }, [load]);
  const open = async (id: string) => { setContent(null); setDenied(null); setCor({ fieldKey: '', reason: '' }); try { setD(await opsAdmin.supDetail(id)); } catch (e) { showToast(apiMsg(e), 'error'); } };
  const readNotes = async () => { if (!d) return; try { setContent(await opsAdmin.supContent(d.id)); } catch (e: any) { setDenied(e?.response?.data?.code === 'CONSENT_REQUIRED' ? 'The employee has not consented to quality review of their sessions.' : e?.response?.status === 403 ? 'You do not have the sensitive-data permission. A super admin must grant it to you explicitly.' : apiMsg(e)); } };
  const askCorrection = async () => { if (!d) return; try { await opsAdmin.requestCorrection({ sessionId: d.id, fieldKey: cor.fieldKey || undefined, reason: cor.reason.trim() }); showToast('Correction requested. The coach will see it in Learning & quality.', 'success'); setCor({ fieldKey: '', reason: '' }); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <Card action={<Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Session status"><option value="">All</option>{['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>}>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">Metadata only. Employees are shown as a short reference; note content needs a separate permission and the employee's consent, and every read is logged.</p>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No sessions.</Empty> : (
        <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Coach</th><th>Employee</th><th>#</th><th>When</th><th>Status</th><th>Exceptions</th><th /></tr></thead>
          <tbody>{rows.map((s) => (<tr key={s.id} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5 font-semibold">{s.coachName ?? '—'}</td><td className="font-mono text-xs">{s.employeeRef}</td><td>{s.sessionNumber}</td><td>{fmt(s.scheduledStart)}</td><td><StatusBadge label={label(s.status)} variant={variantOf(s.status)} /></td><td>{[s.actionPlanExceptionStatus, s.nextSessionExceptionStatus].filter(Boolean).length ? 'Yes' : '—'}</td><td className="text-right"><Btn onClick={() => open(s.id)}>Inspect</Btn></td></tr>))}</tbody></table>)}
      <ModalForm isOpen={!!d} title={d ? `Session ${d.sessionNumber} (script v${d.templateVersion})` : ''} onClose={() => setD(null)} size="xl">
        {d && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="mb-1 text-xs font-bold text-[var(--color-text-secondary)]">Steps covered</p><ul>{d.steps.map((s) => <li key={s.key}>{s.completed ? '✓' : '○'} {s.title}</li>)}</ul></div>
              <div><p className="mb-1 text-xs font-bold text-[var(--color-text-secondary)]">Closing checklist</p><ul>{d.checklist.map((c) => <li key={c.key}>{c.answered ? '✓' : '○'} {c.key}{c.required ? ' *' : ''}</li>)}</ul>
                <p className="mb-1 mt-3 text-xs font-bold text-[var(--color-text-secondary)]">Closure</p><p>Escalation: {d.closure.escalationAnswer ? label(d.closure.escalationAnswer) : '—'} · Homework: {d.closure.homeworkDecision ? label(d.closure.homeworkDecision) : '—'} · Notes finalised: {d.notesFinalized ? 'yes' : 'no'}{d.actionItems ? ` · Action items ${d.actionItems.completed}/${d.actionItems.total}` : ''}</p></div>
            </div>
            {!content ? <div><Btn onClick={readNotes}>Read session notes (logged)</Btn>{denied && <p role="alert" className="mt-2 rounded-lg bg-[var(--color-warning-bg)] p-3">{denied}</p>}</div> : (
              <div className="rounded-xl bg-[var(--color-bg-secondary)] p-4"><p className="mb-2 text-xs font-bold text-[var(--color-text-secondary)]">Notes — {content.employeeName ?? 'Employee'}</p>
                {content.note ? <dl className="grid gap-2">{Object.entries(content.note).filter(([k, v]) => typeof v === 'string' && v && !['id', 'sessionId', 'authorId'].includes(k)).map(([k, v]) => <div key={k}><dt className="text-xs text-[var(--color-text-tertiary)]">{label(k.replace(/([A-Z])/g, '_$1'))}</dt><dd className="whitespace-pre-wrap">{v}</dd></div>)}</dl> : <p>No notes.</p>}
                {content.addenda.length > 0 && <div className="mt-3"><p className="text-xs font-bold text-[var(--color-text-secondary)]">Addenda</p>{content.addenda.map((a) => <p key={a.id} className="whitespace-pre-wrap">{a.text}</p>)}</div>}</div>)}
            <div className="border-t border-[var(--color-border-primary)] pt-4"><p className="mb-2 text-xs font-bold text-[var(--color-text-secondary)]">Request a note correction</p>
              <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end"><Field label="Field (optional)"><Input placeholder="e.g. keyDiscussion" value={cor.fieldKey} onChange={(e) => setCor({ ...cor, fieldKey: e.target.value })} /></Field><Field label="What needs clarifying?"><Input value={cor.reason} maxLength={2000} onChange={(e) => setCor({ ...cor, reason: e.target.value })} /></Field><Btn disabled={!cor.reason.trim()} onClick={askCorrection}>Send to coach</Btn></div></div>
          </div>)}
      </ModalForm>
    </Card>
  );
};

const Corrections: React.FC = () => {
  const [rows, setRows] = useState<Correction[] | null>(null);
  useEffect(() => { opsAdmin.corrections().then(setRows).catch(() => setRows([])); }, []);
  return (<Card title="Correction requests">{!rows ? <Skeleton /> : !rows.length ? <Empty>None yet.</Empty> : (<ul className="flex flex-col gap-2">{rows.map((c) => (<li key={c.id} className="rounded-xl border border-[var(--color-border-primary)] p-3 text-sm"><div className="flex items-center justify-between"><span className="font-semibold">{c.fieldKey ? label(c.fieldKey.replace(/([A-Z])/g, '_$1')) : 'Session notes'}</span><StatusBadge label={label(c.status)} variant={variantOf(c.status)} /></div><p>{c.reason}</p>{c.response && <p className="mt-1 rounded-lg bg-[var(--color-bg-secondary)] p-2">{c.response}</p>}</li>))}</ul>)}</Card>);
};

export const Quality: React.FC = () => {
  const [tab, setTab] = useState('audits');
  return (<div><PageHeader title="Quality & supervision" breadcrumb="Coaching" subtitle="Audit sampled sessions, review closure exceptions, and supervise without exposing employee data." />
    <Tabs tabs={[['audits', 'Audits'], ['rules', 'Sampling rules'], ['exceptions', 'Closure exceptions'], ['supervision', 'Sessions'], ['corrections', 'Corrections']]} value={tab} onChange={setTab} />
    {tab === 'audits' ? <Audits /> : tab === 'rules' ? <Rules /> : tab === 'exceptions' ? <Exceptions /> : tab === 'supervision' ? <Supervision /> : <Corrections />}</div>);
};
