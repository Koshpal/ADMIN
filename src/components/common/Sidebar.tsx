import React, { useEffect, useState } from 'react';
import { coachingAdminService } from '../../services/coaching.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, UserCheck, Users, BarChart3, Settings, X, ChevronLeft, Rocket, CalendarDays, Link2, BookOpenCheck, LifeBuoy, BookText, ClipboardCheck, Gauge, GraduationCap, Wrench, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

/** `permission`: item is shown only to admins who hold it (enforced again by the API). */
const menuItems: { icon: React.ElementType; label: string; path: string; permission?: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Building2, label: 'Companies', path: '/companies' },
  { icon: UserCheck, label: 'Coaches', path: '/coaches' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: CalendarDays, label: 'Sessions', path: '/sessions' },
  { icon: Link2, label: 'Coach Assignments', path: '/coaching/assignments', permission: 'admin.coaches.read' },
  { icon: BookOpenCheck, label: 'Programs & Templates', path: '/coaching/programs', permission: 'admin.programs.manage' },
  { icon: Gauge, label: 'Coaching Operations', path: '/coaching/operations', permission: 'admin.dashboard.read' },
  { icon: LifeBuoy, label: 'Escalations', path: '/coaching/escalations', permission: 'admin.escalations.manage' },
  { icon: BookText, label: 'Playbook', path: '/coaching/playbook', permission: 'admin.playbook.manage' },
  { icon: ClipboardCheck, label: 'Quality & Supervision', path: '/coaching/quality', permission: 'admin.sessions.audit' },
  { icon: GraduationCap, label: 'Learning & Certification', path: '/coaching/learning', permission: 'admin.certification.approve' },
  { icon: Wrench, label: 'Tools & Worksheets', path: '/coaching/content', permission: 'admin.programs.manage' },
  { icon: ShieldCheck, label: 'Coaching Consent', path: '/coaching/consent', permission: 'admin.consent.manage' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Rocket, label: 'Onboarding', path: '/onboarding' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [allowed, setAllowed] = useState<string[] | null>(null);
  useEffect(() => { coachingAdminService.myPermissions().then((p) => setAllowed(p.effective)).catch(() => setAllowed([])); }, []);
  const visibleItems = menuItems.filter((i) => !i.permission || allowed?.includes(i.permission));

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/50" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-500 ease-in-out bg-[var(--color-bg-card)] border-r border-[var(--color-border-primary)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} lg:translate-x-0 w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 border-b border-[var(--color-border-primary)] h-[89px]">
            {!isCollapsed && (
              <div className="flex items-center gap-3 transition-opacity duration-500">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/logo.png" alt="Koshpal" className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xl font-bold text-[var(--color-text-primary)] font-heading tracking-tight">
                    Koshpal
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] opacity-70">
                    Super Admin
                  </span>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 flex items-center justify-center mx-auto">
                <img src="/logo.png" alt="Koshpal" className="w-8 h-8" />
              </div>
            )}

            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:opacity-80 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            {onToggleCollapse && !isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-2 rounded-lg hover:opacity-80 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                aria-label="Toggle sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1 px-3">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <button
                      onClick={() => { navigate(item.path); onClose(); }}
                      title={isCollapsed ? item.label : undefined}
                      className={`group w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-200 relative ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        active
                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {active && !isCollapsed && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-primary)] rounded-r-full" />
                      )}
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                          active ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className={`flex-1 text-left text-body-md ${active ? 'font-bold' : 'font-medium'}`}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--color-border-primary)]">
            {!isCollapsed ? (
              <div className="px-3 py-2 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
                  Admin Access
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">Full platform control</p>
              </div>
            ) : (
              onToggleCollapse && (
                <div className="flex justify-center">
                  <button
                    onClick={onToggleCollapse}
                    className="hidden lg:block p-2 rounded-lg hover:opacity-80 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                    aria-label="Expand sidebar"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
