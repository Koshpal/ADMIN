import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical, Power, Trash2, Edit, Star } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CoachModal } from './CoachModal';
import { adminService } from '../../services/admin.service';
import { Coach } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

export const Coaches: React.FC = () => {
  const { showToast } = useToast();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchCoaches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getCoaches({
        search: search || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        page,
        pageSize: PAGE_SIZE,
      });
      setCoaches(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      showToast('Failed to load coaches.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, activeFilter, page, showToast]);

  useEffect(() => { fetchCoaches(); }, [fetchCoaches]);

  const handleSave = async () => {
    setIsModalOpen(false);
    setEditingCoach(null);
    await fetchCoaches();
    showToast(editingCoach ? 'Coach updated.' : 'Coach created and credentials sent.', 'success');
  };

  const handleToggleStatus = async (coach: Coach, activate: boolean) => {
    setIsActionLoading(true);
    try {
      if (activate) await adminService.activateCoach(coach.id);
      else await adminService.deactivateCoach(coach.id);
      showToast(`Coach ${activate ? 'activated' : 'deactivated'}.`, 'success');
      fetchCoaches();
    } catch {
      showToast('Failed to update coach status.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const handleDelete = async (coach: Coach) => {
    setIsActionLoading(true);
    try {
      await adminService.deleteCoach(coach.id);
      showToast('Coach deleted.', 'success');
      fetchCoaches();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete coach.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const columns: Column<Coach>[] = [
    {
      key: 'fullName',
      label: 'Coach',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName || row.email} src={row.profilePhoto} size="md" color="#80b597" />
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">{row.fullName || '—'}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'expertise',
      label: 'Specialization',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.expertise || []).slice(0, 2).map((e) => (
            <span key={e} className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-dark)]">
              {e}
            </span>
          ))}
          {(row.expertise || []).length > 2 && (
            <span className="text-xs text-[var(--color-text-tertiary)]">+{(row.expertise || []).length - 2}</span>
          )}
          {(row.expertise || []).length === 0 && <span className="text-xs text-[var(--color-text-tertiary)]">—</span>}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-[var(--color-warning)]" fill="currentColor" />
          <span className="text-sm font-semibold">{row.rating ? Number(row.rating).toFixed(1) : '—'}</span>
        </div>
      ),
    },
    {
      key: 'totalSessions',
      label: 'Sessions',
      render: (row) => <span className="font-semibold">{row.totalSessions}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <StatusBadge label={row.isActive ? 'Active' : 'Inactive'} variant={row.isActive ? 'success' : 'error'} />
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
              className="absolute right-0 top-8 z-20 w-48 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl shadow-lg overflow-hidden"
              onMouseLeave={() => setActionMenu(null)}
            >
              <button
                onClick={() => { setEditingCoach(row); setIsModalOpen(true); setActionMenu(null); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-primary)]"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              {row.isActive ? (
                <button
                  onClick={() => { setActionMenu(null); setConfirmDialog({ open: true, title: 'Deactivate Coach', message: `Deactivate "${row.fullName}"? They won't be able to log in.`, action: () => handleToggleStatus(row, false), variant: 'warning', confirmLabel: 'Deactivate' }); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-warning-dark)]"
                >
                  <Power className="w-4 h-4" /> Deactivate
                </button>
              ) : (
                <button
                  onClick={() => { setActionMenu(null); handleToggleStatus(row, true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-success-dark)]"
                >
                  <Power className="w-4 h-4" /> Activate
                </button>
              )}
              <div className="h-px bg-[var(--color-border-primary)] mx-2" />
              <button
                onClick={() => { setActionMenu(null); setConfirmDialog({ open: true, title: 'Delete Coach', message: `Permanently delete "${row.fullName}"? This cannot be undone.`, action: () => handleDelete(row), variant: 'danger', confirmLabel: 'Delete' }); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-error)]"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Coaches"
        subtitle="Manage all coaches on the Koshpal platform."
        breadcrumb="Admin"
        actions={
          <button
            onClick={() => { setEditingCoach(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Coach
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search by name or email..." value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
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
        <span className="font-semibold text-[var(--color-text-primary)]">{total}</span> coaches
      </p>

      <DataTable
        columns={columns}
        data={coaches}
        isLoading={isLoading}
        emptyMessage="No coaches found. Add one to get started."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        keyExtractor={(c) => c.id}
      />

      <CoachModal
        isOpen={isModalOpen}
        coach={editingCoach}
        onClose={() => { setIsModalOpen(false); setEditingCoach(null); }}
        onSave={handleSave}
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
