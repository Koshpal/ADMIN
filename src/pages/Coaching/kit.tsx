import React from 'react';

export const label = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDT = (iso: string) => `${fmt(iso)}, ${new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
export const variantOf = (s: string): 'success' | 'warning' | 'info' | 'neutral' | 'error' =>
  ['RESOLVED', 'CLOSED', 'COMPLETED', 'PUBLISHED', 'CERTIFIED', 'APPROVED', 'ADDRESSED'].includes(s) ? 'success'
    : ['URGENT', 'EXPIRED', 'REJECTED', 'DECLINED', 'OVER'].includes(s) ? 'error'
      : ['HIGH', 'ACTION_REQUIRED', 'OPEN', 'PENDING', 'IN_REVIEW', 'NEAR', 'PENDING_REVIEW'].includes(s) ? 'warning'
        : ['ASSIGNED', 'UNDER_REVIEW', 'MEDIUM', 'DRAFT', 'SHADOWING', 'SUPERVISED', 'IN_PROGRESS'].includes(s) ? 'info' : 'neutral';

export const Card: React.FC<{ title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className = '' }) => (
  <section className={`rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 ${className}`}>
    {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h2>}{action}</div>}
    {children}
  </section>
);
export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="rounded-xl bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">{children}</p>;
export const Skeleton: React.FC = () => <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" aria-busy="true" />;

const input = 'w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]';
export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label: l, hint, children }) => (
  <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-[var(--color-text-secondary)]">{l}</span>{children}{hint && <span className="text-xs text-[var(--color-text-tertiary)]">{hint}</span>}</label>
);
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${input} ${p.className ?? ''}`} />;
export const TextArea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={`${input} resize-y ${p.className ?? ''}`} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${input} ${p.className ?? ''}`} />;
export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'plain' | 'danger' }> = ({ tone = 'plain', className = '', ...p }) => (
  <button {...p} className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tone === 'primary' ? 'bg-[var(--color-primary)] text-white hover:opacity-90' : tone === 'danger' ? 'border border-[var(--color-error)] text-[var(--color-error)]' : 'border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'} ${className}`} />
);
export const Tabs: React.FC<{ tabs: [string, string][]; value: string; onChange: (v: string) => void }> = ({ tabs, value, onChange }) => (
  <div role="tablist" className="mb-5 flex flex-wrap gap-1 rounded-xl bg-[var(--color-bg-tertiary)] p-1">
    {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${value === k ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>{l}</button>)}
  </div>
);
export const apiMsg = (e: any, fallback = 'Something went wrong') => {
  if (!e?.response) return 'Cannot reach the server. Please check your connection.';
  const d = e.response.data; const m = Array.isArray(d?.message) ? d.message.join(', ') : d?.message;
  return m ?? fallback;
};
