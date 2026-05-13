import React, { useState, useEffect, useCallback } from 'react';
import { MoreVertical, Power, Trash2, KeyRound, UserX } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { adminService } from '../../services/admin.service';
import { UserRecord, UserRole } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#334eac',
  COACH: '#80b597',
  HR: '#17a2b8',
  EMPLOYEE: '#f5a038',
};

const ROLE_BADGES: Record<UserRole, 'info' | 'success' | 'warning' | 'neutral'> = {
  ADMIN: 'info',
  COACH: 'success',
  HR: 'warning',
  EMPLOYEE: 'neutral',
};

export const Users: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      showToast('Failed to load users.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, activeFilter, page, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const doAction = async (fn: () => Promise<void>, successMsg: string) => {
    setIsActionLoading(true);
    try {
      await fn();
      showToast(successMsg, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const columns: Column<UserRecord>[] = [
    {
      key: 'fullName',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName || row.email} src={row.profilePhoto} size="sm" color={ROLE_COLORS[row.role]} />
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">{row.fullName}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <StatusBadge label={row.role} variant={ROLE_BADGES[row.role]} />,
    },
    {
      key: 'company',
      label: 'Company',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.company || '—'}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <StatusBadge label={row.isActive ? 'Active' : 'Suspended'} variant={row.isActive ? 'success' : 'error'} />
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Last Login',
      render: (row) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {row.lastLoginAt ? format(new Date(row.lastLoginAt), 'dd MMM yyyy') : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (row) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {format(new Date(row.createdAt), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="relative flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === row.id ? null : row.id); }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {actionMenu === row.id && (
            <div
              className="absolute right-0 top-8 z-20 w-52 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl shadow-lg overflow-hidden"
              onMouseLeave={() => setActionMenu(null)}
            >
              <button
                onClick={() => {
                  setActionMenu(null);
                  setConfirmDialog({
                    open: true,
                    title: 'Reset Password',
                    message: `Reset password for "${row.fullName}"? A new password will be emailed to them.`,
                    action: () => doAction(() => adminService.resetUserPassword(row.id), 'Password reset and email sent.'),
                    variant: 'warning',
                    confirmLabel: 'Reset Password',
                  });
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-primary)]"
              >
                <KeyRound className="w-4 h-4" /> Reset Password
              </button>
              {row.isActive ? (
                <button
                  onClick={() => {
                    setActionMenu(null);
                    setConfirmDialog({
                      open: true,
                      title: 'Suspend User',
                      message: `Suspend "${row.fullName}"? They'll lose platform access.`,
                      action: () => doAction(() => adminService.suspendUser(row.id), 'User suspended.'),
                      variant: 'warning',
                      confirmLabel: 'Suspend',
                    });
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-warning-dark)]"
                >
                  <UserX className="w-4 h-4" /> Suspend
                </button>
              ) : (
                <button
                  onClick={() => { setActionMenu(null); doAction(() => adminService.activateUser(row.id), 'User activated.'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-success-dark)]"
                >
                  <Power className="w-4 h-4" /> Activate
                </button>
              )}
              {row.role !== 'ADMIN' && (
                <>
                  <div className="h-px bg-[var(--color-border-primary)] mx-2" />
                  <button
                    onClick={() => {
                      setActionMenu(null);
                      setConfirmDialog({
                        open: true,
                        title: 'Delete User',
                        message: `Permanently delete "${row.fullName}"? This action cannot be undone.`,
                        action: () => doAction(() => adminService.deleteUser(row.id), 'User deleted.'),
                        variant: 'danger',
                        confirmLabel: 'Delete',
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-error)]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        subtitle="Search, filter, and manage all users across every role."
        breadcrumb="Admin"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search by name or email..." value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
          className="px-3.5 py-2.5 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="HR">HR</option>
          <option value="COACH">Coach</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                activeFilter === f
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">
        <span className="font-semibold text-[var(--color-text-primary)]">{total}</span> users
      </p>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users found matching your search."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        keyExtractor={(u) => u.id}
      />

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.action}
          onCancel={() => setConfirmDialog(null)}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
};
