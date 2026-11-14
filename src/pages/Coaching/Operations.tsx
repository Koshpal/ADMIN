import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { opsAdmin, type Dashboard, type Performance, type WorkloadRow } from '../../services/coachingOps.service';
import { apiMsg, Btn, Card, Empty, Field, Input, label, Skeleton, Tabs, variantOf } from './kit';

const Stat: React.FC<{ title: string; value: React.ReactNode; hint?: string; tone?: 'warn' }> = ({ title, value, hint, tone }) => (
  <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">{title}</p>
    <p className={`mt-1 text-2xl font-bold ${tone === 'warn' ? 'text-[var(--color-warning-dark)]' : 'text-[var(--color-text-primary)]'}`}>{value}</p>{hint && <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>}</div>
);

const Overview: React.FC = () => {
  const { showToast } = useToast();
  const [d, setD] = useState<Dashboard | null>(null);
  useEffect(() => { opsAdmin.dashboard().then(setD).catch((e) => showToast(apiMsg(e), 'error')); }, [showToast]);
  if (!d) return <Skeleton />;
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat title="Coaches" value={d.coaches} /><Stat title="Employees assigned" value={`${d.assignedEmployees}/${d.employees}`} hint={`${d.unassignedEmployees} without a coach`} tone={d.unassignedEmployees ? 'warn' : undefined} />
      <Stat title="Sessions (30 days)" value={d.sessionsLast30Days.COMPLETED ?? 0} hint={`${d.sessionsLast30Days.NO_SHOW ?? 0} no-shows · ${d.sessionsLast30Days.CANCELLED ?? 0} cancelled`} />
      <Stat title="Open escalations" value={sum(d.openEscalations)} hint={`${d.openEscalations.URGENT ?? 0} urgent · ${d.openEscalations.HIGH ?? 0} high`} tone={d.openEscalations.URGENT ? 'warn' : undefined} />
      <Stat title="Audits pending" value={d.pendingAudits} /><Stat title="Closure exceptions to review" value={d.pendingClosureExceptions} tone={d.pendingClosureExceptions ? 'warn' : undefined} />
      <Stat title="Open correction requests" value={d.openCorrectionRequests} /><Stat title="Stale escalation contacts" value={d.staleEscalationContacts} hint="Not verified in 180 days" tone={d.staleEscalationContacts ? 'warn' : undefined} />
    </div>
  );
};

const Workload: React.FC = () => {
  const [w, setW] = useState<{ capacityTarget: number; totalSlotsFree: number; coaches: WorkloadRow[] } | null>(null);
  const [h, setH] = useState<Awaited<ReturnType<typeof opsAdmin.handovers>> | null>(null);
  useEffect(() => { opsAdmin.workload().then(setW).catch(() => undefined); opsAdmin.handovers().then(setH).catch(() => undefined); }, []);
  return (
    <div className="flex flex-col gap-5">
      <Card title="Coach capacity" action={w && <span className="text-sm text-[var(--color-text-secondary)]">Target {w.capacityTarget} each · {w.totalSlotsFree} places free</span>}>
        {!w ? <Skeleton /> : !w.coaches.length ? <Empty>No active coaches.</Empty> : (
          <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Coach</th><th>Employees</th><th className="w-1/3">Utilisation</th><th>Next 7 days</th><th>Overdue to start</th></tr></thead>
            <tbody>{w.coaches.map((c) => (<tr key={c.coachId} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5 font-semibold">{c.coachName ?? '—'}</td><td>{c.activeEmployees}/{c.capacityTarget}</td>
              <td><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]"><div className={`h-full ${c.band === 'OVER' ? 'bg-[var(--color-error)]' : c.band === 'NEAR' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-primary)]'}`} style={{ width: `${Math.min(100, c.utilizationPct)}%` }} /></div><StatusBadge label={`${c.utilizationPct}%`} variant={variantOf(c.band)} /></div></td><td>{c.sessionsNext7Days}</td><td className={c.overdueToStart ? 'font-semibold text-[var(--color-error)]' : ''}>{c.overdueToStart}</td></tr>))}</tbody></table>)}
      </Card>
      <Card title="Handovers (last 180 days)">
        {!h ? <Skeleton /> : !h.totalHandovers ? <Empty>No reassignments in this period.</Empty> : (
          <div className="grid gap-5 md:grid-cols-3"><div><p className="text-3xl font-bold">{h.totalHandovers}</p><p className="text-sm text-[var(--color-text-secondary)]">reassignments · average tenure {h.avgTenureDays ?? '—'} days</p></div>
            <div><p className="mb-1 text-xs font-bold text-[var(--color-text-secondary)]">Reasons</p><ul className="text-sm">{Object.entries(h.byReason).map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><strong>{v}</strong></li>)}</ul></div>
            <div><p className="mb-1 text-xs font-bold text-[var(--color-text-secondary)]">Handed over from</p><ul className="text-sm">{h.outgoingByCoach.map((c) => <li key={c.coachName} className="flex justify-between"><span>{c.coachName}</span><strong>{c.handovers}</strong></li>)}</ul></div></div>)}
      </Card>
    </div>
  );
};

const Perf: React.FC = () => {
  const [rows, setRows] = useState<Performance[] | null>(null);
  useEffect(() => { opsAdmin.performance().then(setRows).catch(() => setRows([])); }, []);
  return (
    <Card title="Coach performance (last 90 days)">
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No coaches.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Coach</th><th>Completed</th><th>No-shows</th><th>Avg length</th><th>Exceptions</th><th>Quality score</th><th>Open fixes</th><th>Escalations</th></tr></thead>
          <tbody>{rows.map((r) => (<tr key={r.coachId} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5 font-semibold">{r.coachName ?? '—'}</td><td>{r.completed}/{r.scheduled}</td><td>{r.noShows}</td><td>{r.avgDurationMinutes != null ? `${r.avgDurationMinutes} min` : '—'}</td><td>{r.closureExceptionRatePct != null ? `${r.closureExceptionRatePct}%` : '—'}</td><td>{r.avgQualityScore != null ? `${r.avgQualityScore} (${r.auditedSessions})` : 'Not audited'}</td><td>{r.openCorrections}</td><td>{r.escalationsRaised}</td></tr>))}</tbody></table></div>)}
      <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">Quality scores come only from completed audits. A blank means the coach has not been audited yet, not that they scored zero.</p>
    </Card>
  );
};

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [s, setS] = useState<Record<string, number | boolean> | null>(null); const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => { opsAdmin.settings().then((r) => { setS(r); setDraft(Object.fromEntries(Object.entries(r).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, String(v)]))); }).catch(() => undefined); }, []);
  const save = async (k: string, v: number | boolean) => { try { setS(await opsAdmin.setSetting(k, v)); showToast('Saved', 'success'); } catch (e) { showToast(apiMsg(e), 'error'); } };
  if (!s) return <Skeleton />;
  const num: [string, string, string][] = [['coach.capacityTarget', 'Coach capacity target', 'Employees one coach is expected to carry. A planning target, not a hard limit.'], ['hr.minCohortSize', 'HR minimum group size', 'HR figures about groups smaller than this are hidden.'], ['certification.validityMonths', 'Certification validity (months)', 'How long a new certification lasts.']];
  return (
    <Card title="Programme settings"><div className="flex max-w-xl flex-col gap-5">
      {num.map(([k, l, hint]) => (<div key={k} className="flex items-end gap-3"><div className="flex-1"><Field label={l} hint={hint}><Input type="number" min={1} value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /></Field></div><Btn disabled={!draft[k] || Number(draft[k]) === s[k]} onClick={() => save(k, Number(draft[k]))}>Save</Btn></div>))}
      <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border-primary)] p-4 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={!!s['certification.gateEnabled']} onChange={(e) => save('certification.gateEnabled', e.target.checked)} />
        <span><strong>Require certification before coaches run sessions</strong><br /><span className="text-[var(--color-text-secondary)]">Off by default. Turn on only after your coaches have been certified, otherwise they will be blocked from starting sessions.</span></span></label>
    </div></Card>
  );
};

export const Operations: React.FC = () => {
  const [tab, setTab] = useState('overview');
  return (<div><PageHeader title="Coaching operations" breadcrumb="Coaching" subtitle="Capacity, handovers, performance and programme settings." />
    <Tabs tabs={[['overview', 'Overview'], ['workload', 'Capacity & handovers'], ['performance', 'Performance'], ['settings', 'Settings']]} value={tab} onChange={setTab} />
    {tab === 'overview' ? <Overview /> : tab === 'workload' ? <Workload /> : tab === 'performance' ? <Perf /> : <Settings />}</div>);
};
