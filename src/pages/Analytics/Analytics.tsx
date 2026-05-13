import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { TrendingUp, Users, Building2, Video } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatsCard } from '../../components/ui/StatsCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { adminService } from '../../services/admin.service';
import { PlatformAnalytics, DashboardStats } from '../../types/admin.types';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#334eac',
  HR: '#17a2b8',
  COACH: '#80b597',
  EMPLOYEE: '#f5a038',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#334eac',
  COMPLETED: '#80b597',
  CANCELLED: '#f55a51',
};

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [a, s] = await Promise.all([
          adminService.getPlatformAnalytics(),
          adminService.getDashboardStats(),
        ]);
        if (mounted) { setAnalytics(a); setStats(s); }
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">Loading analytics...</p>
      </div>
    );
  }

  const roleData = (analytics?.usersByRole || []).map((r) => ({
    name: r.role,
    value: (r._count as any) || 0,
    color: ROLE_COLORS[r.role] || '#999',
  }));

  const sessionData = (analytics?.sessionsByStatus || []).map((s) => ({
    name: s.status,
    count: (s._count as any) || 0,
    color: STATUS_COLORS[s.status] || '#999',
  }));

  const completionRate = stats?.totalSessions
    ? Math.round(((stats.completedSessions || 0) / stats.totalSessions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        subtitle="Cross-platform visibility into all activity on Koshpal."
        breadcrumb="Admin"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={(stats?.activeUsers ?? 0) + (stats?.totalHRs ?? 0)} icon={Users} color="#334eac" />
        <StatsCard title="Companies" value={stats?.totalCompanies ?? 0} icon={Building2} color="#17a2b8" />
        <StatsCard title="Total Sessions" value={stats?.totalSessions ?? 0} icon={Video} color="#80b597" />
        <StatsCard title="Completion Rate" value={`${completionRate}%`} icon={TrendingUp} color="#f5a038" subtitle={`${stats?.completedSessions ?? 0} completed`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-5">
          <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Users by Role</h3>
          {roleData.length > 0 ? (
            <div className="flex flex-col gap-3">
              {roleData.map((r) => {
                const total = roleData.reduce((s, x) => s + x.value, 0);
                const pct = total ? Math.round((r.value / total) * 100) : 0;
                return (
                  <div key={r.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--color-text-primary)]">{r.name}</span>
                      <span className="text-[var(--color-text-secondary)]">{r.value} <span className="text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: r.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-[var(--color-text-secondary)]">No data.</div>
          )}
        </div>

        {/* Sessions by Status */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-5">
          <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Sessions by Status</h3>
          {sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sessionData} cx="50%" cy="45%" outerRadius={80} dataKey="count" labelLine={false}>
                  {sessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[var(--color-text-secondary)]">No session data.</div>
          )}
        </div>
      </div>

      {/* Top Companies Table */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border-primary)]">
          <h3 className="text-h5 text-[var(--color-text-primary)]">Top Companies by Employees</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                {['Company', 'Status', 'Employees', 'HRs', 'Capacity', 'Joined'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(analytics?.topCompanies || []).map((c, i) => {
                const capacity = c.employeeLimit > 0 ? Math.round((c.employeeCount / c.employeeLimit) * 100) : 0;
                return (
                  <tr key={c.id} className={`hover:bg-[var(--color-bg-secondary)] transition-colors ${i !== 0 ? 'border-t border-[var(--color-border-primary)]' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[var(--color-text-primary)]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={c.status} variant={c.status === 'ACTIVE' ? 'success' : 'error'} />
                    </td>
                    <td className="px-5 py-4 font-semibold text-sm">{c.employeeCount}</td>
                    <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{c.hrCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden w-20">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(capacity, 100)}%`,
                              backgroundColor: capacity > 80 ? 'var(--color-error)' : capacity > 50 ? 'var(--color-warning)' : 'var(--color-success)',
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--color-text-secondary)]">{capacity}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--color-text-secondary)]">
                      {format(new Date(c.createdAt), 'dd MMM yyyy')}
                    </td>
                  </tr>
                );
              })}
              {(analytics?.topCompanies || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                    No company data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
