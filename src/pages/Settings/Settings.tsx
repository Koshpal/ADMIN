import React, { useState } from 'react';
import { Shield, Bell, Palette, Globe, Lock, Mail, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/auth.service';
import { FormField, Input, PrimaryButton, SecondaryButton } from '../../components/ui/ModalForm';

const sections = [
  { id: 'profile', label: 'Admin Profile', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'platform', label: 'Platform', icon: Globe },
  { id: 'email', label: 'Email & SMTP', icon: Mail },
];

const DEFAULT_NOTIFICATIONS = {
  newCompany: true,
  newCoach: true,
  systemAlerts: true,
  weeklyReport: false,
};

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('profile');

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const toggleNotification = (key: keyof typeof DEFAULT_NOTIFICATIONS) => {
    setNotifications((prev: typeof DEFAULT_NOTIFICATIONS) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('admin_notifications', JSON.stringify(next));
      return next;
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current) {
      showToast('Current password is required.', 'error');
      return;
    }
    if (passwordForm.newPass.length < 8) {
      showToast('New password must be at least 8 characters.', 'warning');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setIsChangingPw(true);
    try {
      await authService.changePassword(passwordForm.current, passwordForm.newPass);
      showToast('Password changed successfully.', 'success');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPw(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-5 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold">
                {(user.email || 'A')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-h5 text-[var(--color-text-primary)]">{user.fullName || user.email || 'Admin'}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Super Admin</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name">
                <Input value={user.fullName || ''} readOnly placeholder="Full name" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={user.email || ''} readOnly />
              </FormField>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Profile editing for the admin account is done through the database or by contacting your system administrator.
            </p>
          </div>
        );

      case 'security':
        return (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <FormField label="Current Password" required>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="New Password" required hint="Minimum 8 characters">
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPass: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm New Password" required>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <PrimaryButton type="submit" isLoading={isChangingPw}>Change Password</PrimaryButton>

            <div className="mt-6 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] space-y-2">
              <p className="text-label text-[var(--color-text-primary)]">Security Tips</p>
              {['Use a strong, unique password', 'Enable 2FA for extra protection', 'Never share admin credentials', 'Review activity logs regularly'].map((tip) => (
                <p key={tip} className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                  {tip}
                </p>
              ))}
            </div>
          </form>
        );

      case 'appearance':
        return (
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
              <div>
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">Dark Mode</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Toggle between light and dark theme.</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-tertiary)]'
                }`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Theme preference is saved locally in your browser.</p>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-3 max-w-md">
            {([
              { key: 'newCompany' as const, label: 'New Company Registration', desc: 'Get notified when a new company is added.' },
              { key: 'newCoach' as const, label: 'Coach Account Created', desc: 'Receive alerts when a new coach joins.' },
              { key: 'systemAlerts' as const, label: 'System Alerts', desc: 'Critical platform health and error notifications.' },
              { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Weekly summary of platform activity.' },
            ]).map((n) => {
              const isOn = notifications[n.key];
              return (
                <div key={n.key} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-semibold text-sm text-[var(--color-text-primary)]">{n.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{n.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification(n.key)}
                    role="switch"
                    aria-checked={isOn}
                    aria-label={`Toggle ${n.label}`}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      isOn ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-secondary)]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      isOn ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        );

      case 'platform':
        return (
          <div className="space-y-4 max-w-md">
            <div className="p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] space-y-3">
              <p className="text-label text-[var(--color-text-primary)]">Portal URLs</p>
              {[
                { label: 'Admin Portal', value: 'http://localhost:5173' },
                { label: 'HR Portal', value: 'http://localhost:5175' },
                { label: 'Coach Portal', value: 'http://localhost:5176' },
                { label: 'Employee Portal', value: 'http://localhost:5174' },
                { label: 'API Server', value: 'http://localhost:3000' },
              ].map((p) => (
                <div key={p.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{p.label}</span>
                  <code className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-1 rounded text-[var(--color-text-primary)]">{p.value}</code>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              These are development URLs. Update them in environment variables for production.
            </p>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4 max-w-md">
            <div className="p-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] text-sm text-[var(--color-warning-dark)]">
              <strong>⚠️ SMTP Configuration</strong><br />
              Email credentials are configured via environment variables on the server. Update <code className="text-xs bg-white/50 px-1 rounded">.env</code> on the backend server.
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] space-y-2">
              <p className="text-label text-[var(--color-text-primary)]">Required Variables</p>
              {['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].map((v) => (
                <code key={v} className="block text-xs bg-[var(--color-bg-tertiary)] px-3 py-1.5 rounded text-[var(--color-text-primary)]">{v}</code>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Manage your admin account and platform preferences." breadcrumb="Admin" />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 hidden sm:block">
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
            {sections.map((s, i) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-all ${
                    i !== 0 ? 'border-t border-[var(--color-border-primary)]' : ''
                  } ${
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {s.label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile section selector */}
        <div className="sm:hidden w-full">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mb-4"
          >
            {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-6">
          <h2 className="text-h4 text-[var(--color-text-primary)] mb-5">
            {sections.find((s) => s.id === activeSection)?.label}
          </h2>
          {renderSection()}
        </div>
      </div>
    </div>
  );
};
