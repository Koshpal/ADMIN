import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ModalForm } from '../../components/ui/ModalForm';
import { useToast } from '../../context/ToastContext';
import { opsAdmin, type Module, type RosterRow } from '../../services/coachingOps.service';
import { apiMsg, Btn, Card, Empty, Field, fmt, Input, label, Select, Skeleton, Tabs, TextArea, variantOf } from './kit';

const KINDS = ['READING', 'ASSESSMENT', 'ROLE_PLAY', 'SHADOWING', 'SUPERVISED'];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
interface Q { id: string; text: string; options: string[]; correctIndex: number }

const Modules: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Module[] | null>(null);
  const [edit, setEdit] = useState<Module | 'new' | null>(null);
  const [f, setF] = useState({ title: '', kind: 'READING', description: '', content: '', orderIndex: '10', isRequired: true, requiredCount: '1' });
  const [quiz, setQuiz] = useState<Module | null>(null); const [qs, setQs] = useState<Q[]>([{ id: 'q1', text: '', options: ['', ''], correctIndex: 0 }]); const [quizTitle, setQuizTitle] = useState(''); const [pass, setPass] = useState('80');
  const load = useCallback(() => opsAdmin.modules().then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [showToast]);
  useEffect(() => { void load(); }, [load]);
  const open = (m: Module | null) => { setF(m ? { title: m.title, kind: m.kind, description: m.description ?? '', content: m.content ?? '', orderIndex: String(m.orderIndex), isRequired: m.isRequired, requiredCount: String(m.requiredCount) } : { title: '', kind: 'READING', description: '', content: '', orderIndex: String((rows?.length ?? 0) * 10 + 10), isRequired: true, requiredCount: '1' }); setEdit(m ?? 'new'); };
  const save = async () => { try { await opsAdmin.saveModule(edit === 'new' ? null : (edit as Module).id, { key: edit === 'new' ? slug(f.title) : (edit as Module).key, title: f.title.trim(), kind: f.kind, description: f.description || undefined, content: f.content || undefined, orderIndex: Number(f.orderIndex), isRequired: f.isRequired, requiredCount: Number(f.requiredCount) }); showToast('Module saved', 'success'); setEdit(null); await load(); onChanged(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  const saveQuiz = async () => { if (!quiz) return; try { await opsAdmin.createAssessment(quiz.id, { title: quizTitle.trim(), passScore: Number(pass), questions: qs.map((q) => ({ ...q, options: q.options.filter((o) => o.trim()) })) }); showToast('Assessment added', 'success'); setQuiz(null); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <Card title="Modules" action={<Btn tone="primary" onClick={() => open(null)}>Add module</Btn>}>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No modules yet. Build the certification path your coaches must complete — nothing is pre-filled.</Empty> : (
        <ul className="flex flex-col gap-2">{rows.map((m) => (<li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border-primary)] p-3"><div><p className="font-semibold">{m.orderIndex}. {m.title}</p><p className="text-xs text-[var(--color-text-tertiary)]">{label(m.kind)}{m.requiredCount > 1 ? ` · ${m.requiredCount} required` : ''}{m.isRequired ? '' : ' · optional'}{m.kind === 'READING' && m.isPlaceholderContent ? ' · no content yet' : ''}{m.kind === 'ASSESSMENT' ? ` · ${m.assessments.length} assessment(s)` : ''}</p></div>
          <div className="flex gap-2">{m.kind === 'ASSESSMENT' && <Btn onClick={() => { setQuiz(m); setQuizTitle(m.title); setQs([{ id: 'q1', text: '', options: ['', ''], correctIndex: 0 }]); }}>Add assessment</Btn>}<Btn onClick={() => open(m)}>Edit</Btn></div></li>))}</ul>)}
      <ModalForm isOpen={!!edit} title={edit === 'new' ? 'Add module' : 'Edit module'} onClose={() => setEdit(null)} size="lg">
        <div className="flex flex-col gap-3">
          <Field label="Title"><Input value={f.title} maxLength={160} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3"><Field label="Type"><Select value={f.kind} disabled={edit !== 'new'} onChange={(e) => setF({ ...f, kind: e.target.value })}>{KINDS.map((k) => <option key={k} value={k}>{label(k)}</option>)}</Select></Field><Field label="Order"><Input type="number" min={0} value={f.orderIndex} onChange={(e) => setF({ ...f, orderIndex: e.target.value })} /></Field><Field label="Times to complete" hint="Shadowed / supervised sessions"><Input type="number" min={1} value={f.requiredCount} onChange={(e) => setF({ ...f, requiredCount: e.target.value })} /></Field></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isRequired} onChange={(e) => setF({ ...f, isRequired: e.target.checked })} />Required for certification</label>
          <Field label="Description"><Input value={f.description} maxLength={1000} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          {f.kind === 'READING' && <Field label="Reading content" hint="Plain text."><TextArea rows={8} value={f.content} maxLength={50000} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>}
          <div className="flex justify-end gap-2"><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn tone="primary" disabled={!f.title.trim()} onClick={save}>Save</Btn></div>
        </div>
      </ModalForm>
      <ModalForm isOpen={!!quiz} title="Add assessment" subtitle="The answer key is stored on the server and never sent to coaches." onClose={() => setQuiz(null)} size="xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[2fr_1fr] gap-3"><Field label="Title"><Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} /></Field><Field label="Pass mark (%)"><Input type="number" min={1} max={100} value={pass} onChange={(e) => setPass(e.target.value)} /></Field></div>
          {qs.map((q, i) => (<div key={q.id} className="flex flex-col gap-2 rounded-xl border border-[var(--color-border-primary)] p-3"><Field label={`Question ${i + 1}`}><Input value={q.text} maxLength={600} onChange={(e) => setQs(qs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} /></Field>
            {q.options.map((o, k) => (<div key={k} className="flex items-center gap-2"><input type="radio" aria-label={`Correct answer is option ${k + 1}`} checked={q.correctIndex === k} onChange={() => setQs(qs.map((x, j) => (j === i ? { ...x, correctIndex: k } : x)))} /><Input placeholder={`Option ${k + 1}`} value={o} onChange={(e) => setQs(qs.map((x, j) => (j === i ? { ...x, options: x.options.map((y, m) => (m === k ? e.target.value : y)) } : x)))} /></div>))}
            <div className="flex gap-2"><Btn disabled={q.options.length >= 6} onClick={() => setQs(qs.map((x, j) => (j === i ? { ...x, options: [...x.options, ''] } : x)))}>Add option</Btn>{qs.length > 1 && <Btn tone="danger" onClick={() => setQs(qs.filter((_, j) => j !== i))}>Remove question</Btn>}</div></div>))}
          <Btn onClick={() => setQs([...qs, { id: `q${qs.length + 1}`, text: '', options: ['', ''], correctIndex: 0 }])}>Add question</Btn>
          <div className="flex justify-end gap-2"><Btn onClick={() => setQuiz(null)}>Cancel</Btn><Btn tone="primary" disabled={!quizTitle.trim() || qs.some((q) => !q.text.trim() || q.options.filter((o) => o.trim()).length < 2 || !q.options[q.correctIndex]?.trim())} onClick={saveQuiz}>Save assessment</Btn></div>
        </div>
      </ModalForm>
    </Card>
  );
};

const Certification: React.FC<{ nonce: number }> = ({ nonce }) => {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<RosterRow[] | null>(null); const [mods, setMods] = useState<Module[]>([]);
  const [v, setV] = useState({ coachId: '', moduleId: '' }); const [revoke, setRevoke] = useState<RosterRow | null>(null); const [reason, setReason] = useState('');
  const load = useCallback(() => { opsAdmin.roster().then(setRoster).catch((e) => showToast(apiMsg(e), 'error')); opsAdmin.modules().then((m) => setMods(m.filter((x) => ['ROLE_PLAY', 'SHADOWING', 'SUPERVISED'].includes(x.kind)))).catch(() => undefined); }, [showToast]);
  useEffect(() => { void load(); }, [load, nonce]);
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); showToast(ok, 'success'); load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <div className="flex flex-col gap-5">
      <Card title="Coach certification">
        {!roster ? <Skeleton /> : !roster.length ? <Empty>No coaches.</Empty> : (
          <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Coach</th><th>Status</th><th>Valid until</th><th /></tr></thead>
            <tbody>{roster.map((r) => (<tr key={r.coachId} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5 font-semibold">{r.coachName ?? '—'}</td><td><StatusBadge label={label(r.status)} variant={variantOf(r.status)} /> {r.readyForApproval && <span className="text-xs text-[var(--color-success-dark)]">ready for approval</span>}</td><td>{fmt(r.expiresAt)}</td>
              <td className="space-x-2 text-right">{r.readyForApproval && <Btn tone="primary" onClick={() => act(() => opsAdmin.approve(r.coachId), 'Coach certified')}>Approve</Btn>}{r.status === 'CERTIFIED' && <Btn tone="danger" onClick={() => { setRevoke(r); setReason(''); }}>Revoke</Btn>}</td></tr>))}</tbody></table>)}
      </Card>
      <Card title="Verify role-play, shadowing or supervised sessions" action={<span className="text-xs text-[var(--color-text-tertiary)]">Adds one completed occurrence</span>}>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Coach"><Select value={v.coachId} onChange={(e) => setV({ ...v, coachId: e.target.value })}><option value="">Select…</option>{roster?.map((r) => <option key={r.coachId} value={r.coachId}>{r.coachName}</option>)}</Select></Field>
          <Field label="Module"><Select value={v.moduleId} onChange={(e) => setV({ ...v, moduleId: e.target.value })}><option value="">Select…</option>{mods.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</Select></Field>
          <Btn tone="primary" disabled={!v.coachId || !v.moduleId} onClick={() => act(() => opsAdmin.verify(v), 'Progress recorded')}>Record</Btn></div>
      </Card>
      <ModalForm isOpen={!!revoke} title="Revoke certification" subtitle={revoke?.coachName ?? ''} onClose={() => setRevoke(null)} size="sm">
        <div className="flex flex-col gap-3"><Field label="Reason"><TextArea rows={3} value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} /></Field><div className="flex justify-end gap-2"><Btn onClick={() => setRevoke(null)}>Cancel</Btn><Btn tone="danger" disabled={!reason.trim()} onClick={() => { const r = revoke!; setRevoke(null); void act(() => opsAdmin.revoke(r.coachId, reason.trim()), 'Certification revoked'); }}>Revoke</Btn></div></div>
      </ModalForm>
    </div>
  );
};

export const Learning: React.FC = () => {
  const [tab, setTab] = useState('cert'); const [nonce, setNonce] = useState(0);
  return (<div><PageHeader title="Learning & certification" breadcrumb="Coaching" subtitle="Define the path, verify practical steps and certify coaches." />
    <Tabs tabs={[['cert', 'Certification'], ['modules', 'Modules']]} value={tab} onChange={setTab} />{tab === 'cert' ? <Certification nonce={nonce} /> : <Modules onChanged={() => setNonce((n) => n + 1)} />}</div>);
};
