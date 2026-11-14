import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ModalForm } from '../../components/ui/ModalForm';
import { useToast } from '../../context/ToastContext';
import { opsAdmin, type ToolCfg, type Worksheet, type WorksheetField } from '../../services/coachingOps.service';
import { apiMsg, Btn, Card, Empty, Field, fmt, Input, Select, Skeleton, Tabs, TextArea } from './kit';

const SKELETON: Record<string, unknown> = {
  TAX_COMPARE: { cessPct: 0, regimes: { REGIME_NAME: { standardDeduction: 0, allowsDeductions: false, deductionCap: 0, slabs: [{ upTo: 0, ratePct: 0 }, { upTo: null, ratePct: 0 }], rebate: { incomeUpTo: 0, maxRebate: 0 } } } },
  INSURANCE_COVER: { ageBands: [{ maxAge: 0, incomeMultiple: 0 }] },
};
const TITLES: Record<string, string> = { TAX_COMPARE: 'Tax regime comparison', INSURANCE_COVER: 'Life cover estimate' };

const ToolConfigs: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ToolCfg[] | null>(null); const [edit, setEdit] = useState<ToolCfg | null>(null); const [json, setJson] = useState(''); const [year, setYear] = useState(''); const [source, setSource] = useState(''); const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => opsAdmin.toolConfigs().then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [showToast]);
  useEffect(() => { void load(); }, [load]);
  const open = (c: ToolCfg) => { setEdit(c); setJson(JSON.stringify(c.config ?? SKELETON[c.key], null, 2)); setYear(c.taxYear ?? ''); setSource(c.source ?? ''); setErr(null); };
  const save = async () => {
    let config: unknown; try { config = JSON.parse(json); } catch { setErr('This is not valid JSON.'); return; }
    try { await opsAdmin.saveToolConfig(edit!.key, { config, taxYear: year || undefined, source: source || undefined }); showToast('Configuration saved', 'success'); setEdit(null); await load(); } catch (e) { setErr(apiMsg(e)); }
  };
  return (
    <Card title="Region and year specific tools">
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">Tax slabs and insurance multiples are never built into the software. Until you enter and date them here, these two tools tell coaches they are not configured. Enter figures from an official source and record where they came from.</p>
      {!rows ? <Skeleton /> : (
        <ul className="flex flex-col gap-2">{rows.map((c) => (<li key={c.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border-primary)] p-4"><div><p className="font-semibold">{TITLES[c.key] ?? c.key}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{c.configured ? `Tax year ${c.taxYear ?? 'not recorded'} · reviewed ${fmt(c.reviewedAt)} · source: ${c.source ?? 'not recorded'}` : 'Not configured'}</p></div>
          <div className="flex items-center gap-2"><StatusBadge label={c.configured ? 'Configured' : 'Missing'} variant={c.configured ? 'success' : 'warning'} /><Btn onClick={() => open(c)}>{c.configured ? 'Update' : 'Configure'}</Btn></div></li>))}</ul>)}
      <ModalForm isOpen={!!edit} title={edit ? TITLES[edit.key] ?? edit.key : ''} subtitle="The placeholders are zeros to show the shape only; replace every value." onClose={() => setEdit(null)} size="xl">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3"><Field label="Applicable year"><Input value={year} maxLength={20} placeholder="e.g. 2026-27" onChange={(e) => setYear(e.target.value)} /></Field><Field label="Source"><Input value={source} maxLength={300} placeholder="Where these figures come from" onChange={(e) => setSource(e.target.value)} /></Field></div>
          <Field label="Configuration (JSON)"><TextArea rows={16} spellCheck={false} className="font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} /></Field>
          {err && <p role="alert" className="rounded-lg bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">{err}</p>}
          <div className="flex justify-end gap-2"><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn tone="primary" disabled={!source.trim()} onClick={save}>Save</Btn></div>
        </div>
      </ModalForm>
    </Card>
  );
};

const Worksheets: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Worksheet[] | null>(null); const [edit, setEdit] = useState<Worksheet | 'new' | null>(null);
  const [f, setF] = useState({ key: '', title: '', description: '', isActive: true }); const [fields, setFields] = useState<WorksheetField[]>([{ key: 'answer1', label: '', type: 'text' }]);
  const load = useCallback(() => opsAdmin.worksheets().then(setRows).catch((e) => showToast(apiMsg(e), 'error')), [showToast]);
  useEffect(() => { void load(); }, [load]);
  const open = (w: Worksheet | null) => { setF(w ? { key: w.key, title: w.title, description: w.description ?? '', isActive: w.isActive } : { key: '', title: '', description: '', isActive: true }); setFields(w ? w.fields : [{ key: 'answer1', label: '', type: 'text' }]); setEdit(w ?? 'new'); };
  const save = async () => { try { await opsAdmin.saveWorksheet(edit === 'new' ? null : (edit as Worksheet).id, { key: f.key, title: f.title.trim(), description: f.description || undefined, isActive: f.isActive, fields: fields.map((x) => ({ key: x.key, label: x.label.trim(), type: x.type, required: !!x.required })) }); showToast('Worksheet saved', 'success'); setEdit(null); await load(); } catch (e) { showToast(apiMsg(e), 'error'); } };
  return (
    <Card title="Worksheet templates" action={<Btn tone="primary" onClick={() => open(null)}>New worksheet</Btn>}>
      {!rows ? <Skeleton /> : !rows.length ? <Empty>No worksheets yet. Coaches can only assign worksheets that exist here.</Empty> : (
        <ul className="flex flex-col gap-2">{rows.map((w) => (<li key={w.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-primary)] p-3"><div><p className="font-semibold">{w.title}</p><p className="text-xs text-[var(--color-text-tertiary)]">{w.fields.length} question(s){w.isActive ? '' : ' · inactive'}</p></div><Btn onClick={() => open(w)}>Edit</Btn></li>))}</ul>)}
      <ModalForm isOpen={!!edit} title={edit === 'new' ? 'New worksheet' : 'Edit worksheet'} onClose={() => setEdit(null)} size="lg">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3"><Field label="Title"><Input value={f.title} maxLength={160} onChange={(e) => setF({ ...f, title: e.target.value, key: edit === 'new' ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) : f.key })} /></Field><Field label="Key" hint="Fixed once created"><Input value={f.key} disabled={edit !== 'new'} onChange={(e) => setF({ ...f, key: e.target.value })} /></Field></div>
          <Field label="Description"><Input value={f.description} maxLength={1000} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <p className="text-xs font-bold text-[var(--color-text-secondary)]">Questions</p>
          {fields.map((q, i) => (<div key={i} className="grid items-center gap-2 md:grid-cols-[1fr_1.4fr_1fr_auto_auto]"><Input aria-label="Field key" value={q.key} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} /><Input aria-label="Question" placeholder="Question" value={q.label} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <Select aria-label="Answer type" value={q.type} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, type: e.target.value as WorksheetField['type'] } : x)))}><option value="text">Short text</option><option value="longtext">Long text</option><option value="number">Number</option></Select>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!q.required} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />Required</label>
            <button aria-label="Remove question" disabled={fields.length <= 1} onClick={() => setFields(fields.filter((_, j) => j !== i))} className="px-2 text-[var(--color-text-tertiary)] disabled:opacity-30">✕</button></div>))}
          <Btn onClick={() => setFields([...fields, { key: `answer${fields.length + 1}`, label: '', type: 'text' }])}>Add question</Btn>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Available to coaches</label>
          <div className="flex justify-end gap-2"><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn tone="primary" disabled={!f.title.trim() || !f.key || fields.some((q) => !q.label.trim() || !/^[a-z][a-zA-Z0-9_]{0,40}$/.test(q.key))} onClick={save}>Save</Btn></div>
        </div>
      </ModalForm>
    </Card>
  );
};

export const Content: React.FC = () => {
  const [tab, setTab] = useState('worksheets');
  return (<div><PageHeader title="Tools & worksheets" breadcrumb="Coaching" subtitle="What coaches can assign, and the reference figures their calculators use." /><Tabs tabs={[['worksheets', 'Worksheets'], ['config', 'Tax & insurance figures']]} value={tab} onChange={setTab} />{tab === 'worksheets' ? <Worksheets /> : <ToolConfigs />}</div>);
};
