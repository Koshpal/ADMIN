import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ModalForm } from '../../components/ui/ModalForm';
import { useToast } from '../../context/ToastContext';
import { opsAdmin, type PbRow, type PbVersion } from '../../services/coachingOps.service';
import { apiMsg, Btn, Card, Empty, Field, fmt, Input, label, Select, Skeleton, TextArea, variantOf } from './kit';

const me = () => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return (u.id ?? u.userId) as string | undefined; } catch { return undefined; } };
const STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];

/** Playbook content workflow: draft → review → approve (not by the author) → publish. */
export const Playbook: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<PbRow[] | null>(null);
  const [open, setOpen] = useState<PbVersion | 'new' | null>(null);
  const [f, setF] = useState({ title: '', category: '', summary: '', body: '', tags: '' });
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => opsAdmin.playbook(status || undefined).then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [status, showToast]);
  useEffect(() => { void load(); }, [load]);

  const edit = async (id: string | null) => {
    if (!id) { setF({ title: '', category: '', summary: '', body: '', tags: '' }); setOpen('new'); return; }
    try { const v = await opsAdmin.pbVersion(id); setF({ title: v.title, category: v.category, summary: v.summary ?? '', body: v.body, tags: v.tags.join(', ') }); setOpen(v); } catch (e) { showToast(apiMsg(e), 'error'); }
  };
  const tags = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const save = async () => {
    setBusy(true);
    try {
      if (open === 'new') await opsAdmin.pbCreate({ title: f.title, category: f.category, summary: f.summary || undefined, body: f.body, tags });
      else if (open) await opsAdmin.pbEdit(open.id, { title: f.title, summary: f.summary, body: f.body, tags });
      showToast('Draft saved', 'success'); setOpen(null); await load();
    } catch (e) { showToast(apiMsg(e), 'error'); } finally { setBusy(false); }
  };
  const act = async (id: string, a: 'submit' | 'approve' | 'reject' | 'publish' | 'archive', ok: string) => { try { await opsAdmin.pbAct(id, a); showToast(ok, 'success'); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  const newVersion = async (articleId: string) => { try { await opsAdmin.pbNewVersion(articleId); showToast('New draft version created', 'success'); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  const editable = open !== 'new' && open?.status !== 'DRAFT';

  return (
    <div>
      <PageHeader title="Playbook" breadcrumb="Coaching" subtitle="Coaches only ever see published articles. The reviewer cannot be the author." actions={<Btn tone="primary" onClick={() => edit(null)}>New article</Btn>} />
      <Card action={<Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>}>
        {!rows ? <Skeleton /> : !rows.length ? <Empty>No playbook content yet. Koshpal's own guidance must be written and approved here — nothing is pre-filled.</Empty> : (
          <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-text-tertiary)]"><tr><th className="py-2">Title</th><th>Category</th><th>Version</th><th>Status</th><th>Updated</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-border-primary)]"><td className="py-2.5 font-semibold">{r.title}</td><td>{r.category}</td><td>v{r.version}</td><td><StatusBadge label={label(r.status)} variant={variantOf(r.status)} /></td><td>{fmt(r.updatedAt)}</td>
                <td className="space-x-2 text-right">
                  <Btn onClick={() => edit(r.id)}>{r.status === 'DRAFT' ? 'Edit' : 'View'}</Btn>
                  {r.status === 'DRAFT' && <Btn onClick={() => act(r.id, 'submit', 'Submitted for review')}>Submit</Btn>}
                  {r.status === 'IN_REVIEW' && r.authorId !== me() && <><Btn tone="primary" onClick={() => act(r.id, 'approve', 'Approved')}>Approve</Btn><Btn onClick={() => act(r.id, 'reject', 'Sent back to draft')}>Reject</Btn></>}
                  {r.status === 'IN_REVIEW' && r.authorId === me() && <span className="text-xs text-[var(--color-text-tertiary)]">Awaiting another reviewer</span>}
                  {r.status === 'APPROVED' && <Btn tone="primary" onClick={() => act(r.id, 'publish', 'Published to coaches')}>Publish</Btn>}
                  {r.status === 'PUBLISHED' && <><Btn onClick={() => newVersion(r.articleId)}>New version</Btn><Btn tone="danger" onClick={() => act(r.id, 'archive', 'Archived')}>Withdraw</Btn></>}
                </td></tr>))}</tbody></table>)}
      </Card>
      <ModalForm isOpen={!!open} title={open === 'new' ? 'New article' : editable ? 'Article (read only)' : 'Edit draft'} onClose={() => setOpen(null)} size="xl">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3"><Field label="Title"><Input disabled={editable} value={f.title} maxLength={160} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field><Field label="Category"><Input disabled={open !== 'new'} value={f.category} maxLength={60} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field></div>
          <Field label="Summary"><Input disabled={editable} value={f.summary} maxLength={400} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
          <Field label="Body" hint="Plain text. It is shown to coaches exactly as written."><TextArea disabled={editable} rows={12} value={f.body} maxLength={50000} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
          <Field label="Tags (comma separated)"><Input disabled={editable} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Btn onClick={() => setOpen(null)}>Close</Btn>{!editable && <Btn tone="primary" disabled={busy || !f.title.trim() || !f.body.trim() || (open === 'new' && !f.category.trim())} onClick={save}>Save draft</Btn>}</div>
        </div>
      </ModalForm>
    </div>
  );
};
