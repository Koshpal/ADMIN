import React, { useCallback, useEffect, useState } from 'react';
import { Plus, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../../components/ui/PageHeader';
import { ModalForm } from '../../components/ui/ModalForm';
import { apiMessage, coachingAdminService, type ConsentText } from '../../services/coaching.service';
import { useToast } from '../../context/ToastContext';

const input = 'w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]';
const label = 'mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]';

/** Wording to start from. It is generic and clearly marked as a placeholder: legal/compliance should replace it. */
const STARTER = {
  title: 'Consent to financial wellness coaching',
  body: 'Koshpal offers one-to-one financial wellness coaching. A coach will talk with you about your money, help you set goals and give you simple action steps.\n\nCoaching is educational. It is not investment, tax or legal advice, and it is not therapy.\n\nYou can withdraw this consent at any time from your profile. Your coach will then lose access to your information straight away.',
  disclosures: [
    { key: 'purpose', text: 'I understand coaching is educational financial guidance, not investment, tax or legal advice.' },
    { key: 'data_use', text: 'I agree my assigned coach can see my coaching intake answers and notes from our sessions, and the financial information I choose to share with them.' },
    { key: 'hr_privacy', text: 'I understand my employer (HR) only sees combined, anonymous figures and never my individual information.' },
  ],
};

const slug = (t: string, taken: Set<string>) => {
  const base = t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').split('_').slice(0, 4).join('_').slice(0, 40) || 'point';
  let k = base; let n = 2;
  while (taken.has(k)) k = `${base}_${n++}`;
  return k;
};

export const Consent: React.FC = () => {
  const { showToast } = useToast();
  const [texts, setTexts] = useState<ConsentText[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try { setTexts(await coachingAdminService.consentTexts()); }
    catch (e) { showToast(apiMessage(e, 'Failed to load the consent wording.'), 'error'); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { void load(); }, [load]);

  const current = texts.find((t) => t.isCurrent) ?? null;
  const older = texts.filter((t) => !t.isCurrent);

  return (
    <div>
      <PageHeader title="Coaching consent" breadcrumb="Coaching"
        subtitle="The wording employees read and accept before they can book a coach. Publishing creates a new version; earlier versions are kept."
        actions={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />{current ? 'Publish new version' : 'Publish consent wording'}</button>} />

      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" /> : !current ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-[var(--color-warning)]/40 bg-[var(--color-warning-bg)] p-5 text-sm text-[var(--color-warning-dark)]">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">No consent wording is published.</p>
            <p className="mt-1">Employees see “Coaching consent is not available yet”, cannot accept, and so cannot book a coach. Publish the wording to switch coaching on.</p>
          </div>
        </div>
      ) : (
        <section className="rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{current.title}</h2>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-green-800">Live · v{current.version}</span>
            {current.isPlaceholder && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-800">Placeholder wording</span>}
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Published {format(new Date(current.createdAt), 'd MMM yyyy, h:mm a')}. Employees who already agreed keep their consent; everyone else sees this version.</p>
          <p className="mt-4 whitespace-pre-line text-sm text-[var(--color-text-secondary)]">{current.body}</p>
          <p className="mt-5 text-sm font-semibold text-[var(--color-text-primary)]">Points the employee must tick</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--color-text-secondary)]">{current.disclosures.map((d) => <li key={d.key}>{d.text}</li>)}</ul>
        </section>
      )}

      {older.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">Earlier versions</h3>
          <ul className="divide-y divide-[var(--color-border-primary)] rounded-2xl bg-[var(--color-bg-card)] shadow-sm">
            {older.map((t) => <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm"><span>v{t.version} · {t.title}{t.isPlaceholder ? ' (placeholder)' : ''}</span><span className="text-xs text-[var(--color-text-tertiary)]">{format(new Date(t.createdAt), 'd MMM yyyy')}</span></li>)}
          </ul>
        </section>
      )}

      {open && <PublishModal hasCurrent={!!current} onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />}
    </div>
  );
};

const PublishModal: React.FC<{ hasCurrent: boolean; onClose: () => void; onDone: () => void }> = ({ hasCurrent, onClose, onDone }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [points, setPoints] = useState<string[]>(['']);
  const [placeholder, setPlaceholder] = useState(false);
  const [busy, setBusy] = useState(false);

  const useStarter = () => { setTitle(STARTER.title); setBody(STARTER.body); setPoints(STARTER.disclosures.map((d) => d.text)); setPlaceholder(true); };
  const cleaned = points.map((p) => p.trim()).filter(Boolean);
  const valid = title.trim() && body.trim() && cleaned.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      const taken = new Set<string>();
      const disclosures = cleaned.map((text) => { const key = slug(text, taken); taken.add(key); return { key, text }; });
      await coachingAdminService.publishConsentText({ title: title.trim(), body: body.trim(), disclosures, isPlaceholder: placeholder });
      showToast('Consent wording published. Employees can now accept it.', 'success');
      onDone();
    } catch (err) { showToast(apiMessage(err, 'Could not publish the wording.'), 'error'); } finally { setBusy(false); }
  };

  return (
    <ModalForm isOpen title={hasCurrent ? 'Publish a new version' : 'Publish consent wording'} subtitle="Employees must tick every point below before they can agree." onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <button type="button" onClick={useStarter} className="text-xs font-semibold text-[var(--color-primary)] underline">Fill with starter wording (placeholder, replace with approved text)</button>
        <div><label className={label} htmlFor="c-title">Title</label><input id="c-title" className={input} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className={label} htmlFor="c-body">What the employee reads</label><textarea id="c-body" rows={7} className={input} value={body} maxLength={20000} onChange={(e) => setBody(e.target.value)} /></div>
        <div>
          <span className={label}>Points to tick (at least one)</span>
          <div className="space-y-2">
            {points.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label={`Point ${i + 1}`} className={input} value={p} maxLength={1000} placeholder="e.g. I understand my coach can see my notes" onChange={(e) => setPoints(points.map((x, j) => (j === i ? e.target.value : x)))} />
                {points.length > 1 && <button type="button" aria-label={`Remove point ${i + 1}`} onClick={() => setPoints(points.filter((_, j) => j !== i))} className="rounded-xl border border-[var(--color-border-primary)] px-3 text-[var(--color-text-tertiary)]"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          {points.length < 20 && <button type="button" onClick={() => setPoints([...points, ''])} className="mt-2 text-xs font-semibold text-[var(--color-primary)]">+ Add a point</button>}
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={placeholder} onChange={(e) => setPlaceholder(e.target.checked)} />This wording is still a placeholder (employees see a notice)</label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-[var(--color-border-primary)] px-4 py-2.5 text-sm font-semibold">Cancel</button>
          <button type="submit" disabled={!valid || busy} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Publishing…' : 'Publish'}</button>
        </div>
      </form>
    </ModalForm>
  );
};
