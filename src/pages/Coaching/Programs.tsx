import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { apiMessage, coachingAdminService, type Program, type Template } from '../../services/coaching.service';
import { useToast } from '../../context/ToastContext';

const tone = { ACTIVE: 'bg-green-100 text-green-800', DRAFT: 'bg-amber-100 text-amber-800', ARCHIVED: 'bg-gray-100 text-gray-600' } as const;

/** Program & session-template management. Published versions are immutable; sessions keep the version they ran with. */
export const Programs: React.FC = () => {
  const { showToast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    coachingAdminService.programs().then((p) => { setPrograms(p); if (p[0]) setProgramId(p[0].id); }).catch((e) => showToast(apiMessage(e, 'Failed to load programs.'), 'error')).finally(() => setLoading(false));
  }, [showToast]);
  const loadTemplates = useCallback(async () => {
    if (!programId) return;
    try { setTemplates(await coachingAdminService.templates(programId)); } catch (e) { showToast(apiMessage(e), 'error'); }
  }, [programId, showToast]);
  useEffect(() => { void loadTemplates(); }, [loadTemplates]);

  const activate = async (t: Template) => {
    try { await coachingAdminService.activateTemplate(t.id); showToast(`Session ${t.sessionNumber} v${t.version} is now active.`, 'success'); await loadTemplates(); } catch (e) { showToast(apiMessage(e), 'error'); }
  };

  return (
    <div>
      <PageHeader title="Programs & session templates" breadcrumb="Coaching" subtitle="The script each coach follows. Step timings must add up to the session length." />
      {loading ? <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" /> : !programs.length ? (
        <p className="rounded-2xl bg-[var(--color-bg-card)] p-6 text-sm text-[var(--color-text-secondary)]">No program exists yet. Run the coaching defaults seed, or create one through the API.</p>
      ) : (
        <>
          <select aria-label="Program" value={programId} onChange={(e) => setProgramId(e.target.value)} className="mb-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm">
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p._count.enrollments} enrolled)</option>)}
          </select>
          <ul className="flex flex-col gap-3">
            {templates.map((t) => (
              <li key={t.id} className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">Session {t.sessionNumber} · v{t.version} — {t.title}</p>
                    <p className="mt-1 flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 font-semibold ${tone[t.status]}`}>{t.status}</span>{t.isPlaceholderContent && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Placeholder content</span>}<span className="text-[var(--color-text-tertiary)]">{t.durationMinutes} min · {t.steps.length} steps</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setOpen(open === t.id ? null : t.id)} className="rounded-xl border border-[var(--color-border-primary)] px-3 py-2 text-sm">{open === t.id ? 'Hide' : 'View'} steps</button>
                    {t.status === 'DRAFT' && <button onClick={() => activate(t)} className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white">Publish</button>}
                  </div>
                </div>
                {open === t.id && (
                  <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                    <div><p className="mb-1 text-xs font-bold text-[var(--color-text-secondary)]">Objective</p><p>{t.objective}</p>
                      <p className="mb-1 mt-3 text-xs font-bold text-[var(--color-text-secondary)]">Steps</p><ol className="list-decimal pl-5">{t.steps.map((s) => <li key={s.key}>{s.title} <span className="text-[var(--color-text-tertiary)]">· {s.minutes} min</span></li>)}</ol></div>
                    <div><p className="mb-1 text-xs font-bold text-[var(--color-text-secondary)]">Required notes</p><p>{t.requiredNoteFields.join(', ') || '—'}</p>
                      <p className="mb-1 mt-3 text-xs font-bold text-[var(--color-text-secondary)]">Closing checklist</p><ul className="list-disc pl-5">{t.closingChecklist.map((c) => <li key={c.key}>{c.label}{c.required && ' *'}</li>)}</ul></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">Creating a new draft version (editing scripts) is available through the API; the visual template editor is not built yet.</p>
        </>
      )}
    </div>
  );
};
