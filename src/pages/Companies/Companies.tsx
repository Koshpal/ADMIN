import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, MoreVertical, Power, Trash2, Edit, BarChart3 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CompanyModal } from './CompanyModal';
import { adminService } from '../../services/admin.service';
import { Company, CompanyStatus } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

export const Companies: React.FC = () => {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    variant: 'danger' | 'warning';
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getCompanies({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setCompanies(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      showToast('Failed to load companies.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, showToast]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleSave = async () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    await fetchCompanies();
    showToast(editingCompany ? 'Company updated.' : 'Company created.', 'success');
  };

  const handleSuspend = async (company: Company) => {
    setIsActionLoading(true);
    try {
      await adminService.suspendCompany(company.id);
      showToast(`${company.name} suspended.`, 'success');
      fetchCompanies();
    } catch {
      showToast('Failed to suspend company.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const handleActivate = async (company: Company) => {
    setIsActionLoading(true);
    try {
      await adminService.activateCompany(company.id);
      showToast(`${company.name} activated.`, 'success');
      fetchCompanies();
    } catch {
      showToast('Failed to activate company.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const handleDelete = async (company: Company) => {
    setIsActionLoading(true);
    try {
      await adminService.deleteCompany(company.id);
      showToast(`${company.name} deleted.`, 'success');
      fetchCompanies();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete company.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: 'name',
      label: 'Company',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm flex-shrink-0">
            {row.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">{row.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{row.domain || 'No domain'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge label={row.status} variant={row.status === 'ACTIVE' ? 'success' : 'error'} />
      ),
    },
    {
      key: 'employeeCount',
      label: 'Employees',
      render: (row) => (
        <div>
          <span className="font-semibold text-[var(--color-text-primary)]">{row.employeeCount}</span>
          <span className="text-[var(--color-text-secondary)]"> / {row.employeeLimit}</span>
        </div>
      ),
    },
    {
      key: 'hrCount',
      label: 'HRs',
      render: (row) => <span className="font-semibold">{row.hrCount}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-[var(--color-text-secondary)] text-xs">
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
                onClick={() => { setEditingCompany(row); setIsModalOpen(true); setActionMenu(null); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-primary)]"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              {row.status === 'ACTIVE' ? (
                <button
                  onClick={() => { setActionMenu(null); setConfirmDialog({ open: true, title: 'Suspend Company', message: `Suspend "${row.name}"? All users will lose access.`, action: () => handleSuspend(row), variant: 'warning' }); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-warning-dark)]"
                >
                  <Power className="w-4 h-4" /> Suspend
                </button>
              ) : (
                <button
                  onClick={() => { setActionMenu(null); handleActivate(row); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-success-dark)]"
                >
                  <Power className="w-4 h-4" /> Activate
                </button>
              )}
              <div className="h-px bg-[var(--color-border-primary)] mx-2" />
              <button
                onClick={() => { setActionMenu(null); setConfirmDialog({ open: true, title: 'Delete Company', message: `Permanently delete "${row.name}"? This cannot be undone.`, action: () => handleDelete(row), variant: 'danger' }); }}
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
        title="Companies"
        subtitle="Manage all organisations on the Koshpal platform."
        breadcrumb="Admin"
        actions={
          <button
            onClick={() => { setEditingCompany(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            placeholder="Search by name or domain..."
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as CompanyStatus | ''); setPage(1); }}
          className="px-3.5 py-2.5 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Summary counts */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{total}</span> companies
        </p>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        emptyMessage="No companies found. Create one to get started."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        keyExtractor={(c) => c.id}
      />

      {/* Company Modal */}
      <CompanyModal
        isOpen={isModalOpen}
        company={editingCompany}
        onClose={() => { setIsModalOpen(false); setEditingCompany(null); }}
        onSave={handleSave}
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.variant === 'danger' ? 'Delete' : 'Suspend'}
          onConfirm={confirmDialog.action}
          onCancel={() => setConfirmDialog(null)}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
};
