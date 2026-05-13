import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Users,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  Rocket,
  Shield,
  CalendarDays,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Building2, label: 'Companies', path: '/companies' },
  { icon: UserCheck, label: 'Coaches', path: '/coaches' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: CalendarDays, label: 'Sessions', path: '/sessions' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Rocket, label: 'Onboarding', path: '/onboarding' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-h3 text-[var(--color-text-primary)]">Koshpal</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] opacity-70">
                    Super Admin
                  </span>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-white" />
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
            {onToggleCollapse && isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-2 rounded-lg hover:opacity-80 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] absolute bottom-6 left-1/2 -translate-x-1/2"
                aria-label="Expand sidebar"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
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
          {!isCollapsed && (
            <div className="p-4 border-t border-[var(--color-border-primary)]">
              <div className="px-3 py-2 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
                  Admin Access
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">Full platform control</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
