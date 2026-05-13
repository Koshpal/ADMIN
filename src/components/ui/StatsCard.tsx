import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'var(--color-primary)',
}) => {
  return (
    <div className="rounded-2xl border shadow-sm hover:shadow-md transition-all h-[160px] p-5 bg-[var(--color-bg-card)] border-[var(--color-border-primary)] group flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              trend.isPositive
                ? 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)]'
                : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
            }`}
          >
            {trend.isPositive ? '+' : '−'}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold font-heading text-[var(--color-text-primary)]">{value}</p>
        {subtitle && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
