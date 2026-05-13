import React, { useState, useEffect } from 'react';
import {
  Building2,
  UserCheck,
  Users,
  Activity,
  Video,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { StatsCard } from '../../components/ui/StatsCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { adminService } from '../../services/admin.service';
import { DashboardStats, PlatformAnalytics } from '../../types/admin.types';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#334eac',
  HR: '#17a2b8',
  COACH: '#80b597',
  EMPLOYEE: '#f5a038',
};

const STATUS_COLORS = ['#80b597', '#f55a51', '#f5a038'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const adminName = user.fullName || user.name || user.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [s, a] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getPlatformAnalytics(),
        ]);
        if (mounted) { setStats(s); setAnalytics(a); }
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
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
        <p className="mt-4 text-[var(--color-text-secondary)] text-sm font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const sessionChartData = analytics?.sessionsByStatus?.map((s) => ({
    name: s.status,
    count: (s._count as any) || 0,
  })) || [];

  const roleChartData = analytics?.usersByRole?.map((r) => ({
    name: r.role,
    value: (r._count as any) || 0,
    color: ROLE_COLORS[r.role] || '#999',
  })) || [];

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title={`Good day, ${adminName}`}
        subtitle="Here's an overview of your entire Koshpal platform."
        breadcrumb="Super Admin"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Companies"
          value={stats?.totalCompanies ?? 0}
          icon={Building2}
          subtitle={`${stats?.activeCompanies ?? 0} active`}
          color="var(--color-primary)"
        />
        <StatsCard
          title="Coaches"
          value={stats?.totalCoaches ?? 0}
          icon={UserCheck}
          color="#80b597"
        />
        <StatsCard
          title="Employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          color="#17a2b8"
        />
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={Activity}
          color="#f5a038"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatsCard
          title="Total Sessions"
          value={stats?.totalSessions ?? 0}
          icon={Video}
          color="#334eac"
        />
        <StatsCard
          title="Completed Sessions"
          value={stats?.completedSessions ?? 0}
          icon={CheckCircle2}
          color="#80b597"
          subtitle={
            stats?.totalSessions
              ? `${Math.round(((stats?.completedSessions ?? 0) / stats.totalSessions) * 100)}% completion rate`
              : undefined
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions by Status Bar Chart */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h5 text-[var(--color-text-primary)]">Sessions by Status</h3>
            <TrendingUp className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </div>
          {sessionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionChartData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                  }}
                  cursor={{ fill: 'var(--color-bg-secondary)' }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
              No session data yet.
            </div>
          )}
        </div>

        {/* Users by Role Pie Chart */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-5">
          <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Users by Role</h3>
          {roleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  dataKey="value"
                  labelLine={false}
                >
                  {roleChartData.map((entry, index) => (
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
            <div className="h-[200px] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
              No user data yet.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-primary)]">
            <h3 className="text-h5 text-[var(--color-text-primary)]">Recent Users</h3>
            <button
              onClick={() => navigate('/users')}
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {(stats?.recentActivity || []).slice(0, 6).map((user, i) => (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer ${
                  i !== 0 ? 'border-t border-[var(--color-border-primary)]' : ''
                }`}
                onClick={() => navigate('/users')}
              >
                <Avatar name={user.name || user.email} size="sm" color={ROLE_COLORS[user.role] || '#334eac'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                </div>
                <StatusBadge
                  label={user.role}
                  variant={
                    user.role === 'ADMIN' ? 'info' :
                    user.role === 'COACH' ? 'success' :
                    user.role === 'HR' ? 'warning' : 'neutral'
                  }
                />
              </div>
            ))}
            {(stats?.recentActivity || []).length === 0 && (
              <div className="py-10 text-center text-sm text-[var(--color-text-secondary)]">No recent activity.</div>
            )}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-primary)]">
            <h3 className="text-h5 text-[var(--color-text-primary)]">Top Companies</h3>
            <button
              onClick={() => navigate('/companies')}
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {(analytics?.topCompanies || []).map((company, i) => (
              <div
                key={company.id}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer ${
                  i !== 0 ? 'border-t border-[var(--color-border-primary)]' : ''
                }`}
                onClick={() => navigate('/companies')}
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center font-bold text-[var(--color-primary)] text-sm flex-shrink-0">
                  {company.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{company.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {company.employeeCount} employees · {company.hrCount} HRs
                  </p>
                </div>
                <StatusBadge
                  label={company.status}
                  variant={company.status === 'ACTIVE' ? 'success' : 'error'}
                />
              </div>
            ))}
            {(analytics?.topCompanies || []).length === 0 && (
              <div className="py-10 text-center text-sm text-[var(--color-text-secondary)]">No companies yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-5">
        <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Company', icon: '🏢', path: '/companies', color: '#334eac' },
            { label: 'Add Coach', icon: '👤', path: '/coaches', color: '#80b597' },
            { label: 'Onboard Client', icon: '🚀', path: '/onboarding', color: '#17a2b8' },
            { label: 'View Analytics', icon: '📊', path: '/analytics', color: '#f5a038' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-secondary)] transition-all hover:shadow-sm group"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
