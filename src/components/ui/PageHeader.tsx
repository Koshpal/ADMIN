import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      {breadcrumb && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
          {breadcrumb}
        </p>
      )}
      <h1 className="text-h2 text-[var(--color-text-primary)]">{title}</h1>
      {subtitle && <p className="text-body-md text-[var(--color-text-secondary)] mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
  </div>
);
