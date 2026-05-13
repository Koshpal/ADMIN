import React from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)] border-[var(--color-success)]/30',
  error: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/30',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-primary)] border-[var(--color-primary)]/20',
  neutral: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${styles[variant]}`}>
    {label}
  </span>
);
