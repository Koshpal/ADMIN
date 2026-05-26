import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Plus, Trash2, UserPlus,
  Mail, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { ModalForm, FormField, Input, Select, PrimaryButton, SecondaryButton } from '../../components/ui/ModalForm';
import { adminService } from '../../services/admin.service';
import type { Company, CreateCompanyPayload, UserRecord } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

interface CompanyModalProps {
  isOpen: boolean;
  company: Company | null;   // null → create mode
  onClose: () => void;
  onSave: () => void;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media', 'Consulting', 'Other',
];

const emptyForm: CreateCompanyPayload = {
  name: '', domain: '', employeeLimit: 50, status: 'ACTIVE',
  email: '', phone: '', address: '', industry: '', website: '',
};

const newHrEntry = () => ({ fullName: '', email: '', phone: '', designation: '' });
type HrEntry = ReturnType<typeof newHrEntry>;

// ── helpers ──────────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = (v: string) => !v.trim() || /^[+\d\s\-()]{7,20}$/.test(v.trim());

// ─────────────────────────────────────────────────────────────────────────────

export const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, company, onClose, onSave }) => {
  const { showToast } = useToast();
  const isEditMode = !!company;

  // ── tab state (edit only) ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'details' | 'hr'>('details');

  // ── company form ─────────────────────────────────────────────────────────
  const [form, setForm] = useState<CreateCompanyPayload>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateCompanyPayload, string>>>({});
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // ── existing HRs ─────────────────────────────────────────────────────────
  const [existingHrs, setExistingHrs] = useState<UserRecord[]>([]);
  const [loadingHrs, setLoadingHrs] = useState(false);

  // ── new HR entries ────────────────────────────────────────────────────────
  const [newHrs, setNewHrs] = useState<HrEntry[]>([]);
  const [hrErrors, setHrErrors] = useState<Record<string, string>>({});
  const [isSavingHrs, setIsSavingHrs] = useState(false);
  const [addedHrEmails, setAddedHrEmails] = useState<string[]>([]);

  // ── reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('details');
    setFormErrors({});
    setNewHrs([]);
    setHrErrors({});
    setAddedHrEmails([]);

    if (company) {
      setForm({
        name:          company.name,
        domain:        company.domain        || '',
        employeeLimit: company.employeeLimit,
        status:        company.status,
        email:         '',
        phone:         '',
        address:       '',
        industry:      '',
        website:       '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [company, isOpen]);

  // ── fetch existing HRs when tab is opened ────────────────────────────────
  useEffect(() => {
    if (!isOpen || !isEditMode || activeTab !== 'hr') return;
    const fetch = async () => {
      setLoadingHrs(true);
      try {
        const res = await adminService.getUsers({
          role: 'HR',
          companyId: company!.id,
          pageSize: 100,
        });
        setExistingHrs(res.data);
      } catch {
        showToast('Failed to load HR admins.', 'error');
      } finally {
        setLoadingHrs(false);
      }
    };
    fetch();
  }, [isOpen, isEditMode, activeTab, company, showToast]);

  // ── company details form ──────────────────────────────────────────────────
  const set = <K extends keyof CreateCompanyPayload>(k: K, v: CreateCompanyPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validateCompany = () => {
    const e: Partial<Record<keyof CreateCompanyPayload, string>> = {};
    if (!form.name.trim()) e.name = 'Company name is required.';
    if (form.employeeLimit < 1) e.employeeLimit = 'Must be at least 1.';
    if (form.employeeLimit > 100000) e.employeeLimit = 'Employee limit cannot exceed 100,000.';
    if (form.email && !isValidEmail(form.email)) e.email = 'Please enter a valid email address.';
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Enter a valid phone number (7–20 digits).';
    if (form.website && !/^https?:\/\/.+\..+/.test(form.website.trim())) e.website = 'Website must start with http:// or https://';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCompany()) return;
    setIsSavingCompany(true);
    try {
      if (company) {
        await adminService.updateCompany(company.id, form);
      } else {
        await adminService.createCompany(form);
      }
      onSave();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save company.', 'error');
    } finally {
      setIsSavingCompany(false);
    }
  };

  // ── new HR management ─────────────────────────────────────────────────────
  const setHrField = (idx: number, k: keyof HrEntry, v: string) => {
    setNewHrs((prev) => prev.map((h, i) => i === idx ? { ...h, [k]: v } : h));
    const key = `hr${idx}_${k}`;
    if (hrErrors[key]) setHrErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const addHrRow = () => setNewHrs((p) => [...p, newHrEntry()]);

  const removeHrRow = (idx: number) => {
    setNewHrs((p) => p.filter((_, i) => i !== idx));
    setHrErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (k.startsWith(`hr${idx}_`)) delete next[k]; });
      return next;
    });
  };

  const validateHrs = () => {
    const e: Record<string, string> = {};
    newHrs.forEach((hr, idx) => {
      if (!hr.fullName.trim())          e[`hr${idx}_fullName`] = 'Full name is required.';
      if (!hr.email.trim())             e[`hr${idx}_email`]    = 'Email is required.';
      else if (!isValidEmail(hr.email)) e[`hr${idx}_email`]    = 'Please enter a valid email.';
      if (!isValidPhone(hr.phone))      e[`hr${idx}_phone`]    = 'Enter a valid phone number (7–20 digits).';
    });
    setHrErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveHrs = async () => {
    if (newHrs.length === 0) return;
    if (!validateHrs()) return;
    setIsSavingHrs(true);
    const results = await Promise.allSettled(
      newHrs.map((h) =>
        adminService.createHr({
          fullName:    h.fullName.trim(),
          email:       h.email.trim().toLowerCase(),
          companyId:   company!.id,
          ...(h.phone.trim()       && { phone: h.phone.trim() }),
          ...(h.designation.trim() && { designation: h.designation.trim() }),
        }),
      ),
    );
    setIsSavingHrs(false);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed    = results.filter((r) => r.status === 'rejected');

    if (succeeded.length > 0) {
      const emails = newHrs
        .filter((_, i) => results[i].status === 'fulfilled')
        .map((h) => h.email.trim().toLowerCase());
      setAddedHrEmails((p) => [...p, ...emails]);
      setExistingHrs((p) => [
        ...p,
        ...newHrs
          .filter((_, i) => results[i].status === 'fulfilled')
          .map((h, i) => ({
            id:        `temp-${Date.now()}-${i}`,
            email:     h.email.trim().toLowerCase(),
            fullName:  h.fullName.trim(),
            role:      'HR' as const,
            isActive:  true,
            createdAt: new Date().toISOString(),
          })),
      ]);
      // Remove successfully added rows
      const failedIndexes = new Set(
        results
          .map((r, i) => r.status === 'rejected' ? i : -1)
          .filter((i) => i !== -1),
      );
      setNewHrs((p) => p.filter((_, i) => failedIndexes.has(i)));
      showToast(
        `${succeeded.length} HR admin${succeeded.length > 1 ? 's' : ''} added successfully.`,
        'success',
      );
      onSave(); // refresh company list so hrCount updates
    }
    if (failed.length > 0) {
      showToast(`${failed.length} HR admin${failed.length > 1 ? 's' : ''} failed to create.`, 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ModalForm
      isOpen={isOpen}
      title={company ? 'Edit Company' : 'Create Company'}
      subtitle={
        company
          ? `Manage details and HR admins for ${company.name}.`
          : 'Add a new organisation to the platform.'
      }
      onClose={onClose}
      size="lg"
    >
      {/* ── Tabs (edit mode only) ─────────────────────────────────────── */}
      {isEditMode && (
        <div className="flex gap-1 mb-5 p-1 bg-[var(--color-bg-secondary)] rounded-xl">
          {([
            { id: 'details', label: 'Company Details', icon: Building2 },
            { id: 'hr',      label: `HR Admins${existingHrs.length > 0 ? ` (${existingHrs.length})` : ''}`, icon: Users },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Company Details tab ───────────────────────────────────────── */}
      {(!isEditMode || activeTab === 'details') && (
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Company Name" required error={formErrors.name}>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Acme Corp"
                error={!!formErrors.name}
              />
            </FormField>

            <FormField label="Domain" hint="e.g. acme.com">
              <Input
                value={form.domain}
                onChange={(e) => set('domain', e.target.value)}
                placeholder="acme.com"
              />
            </FormField>

            <FormField label="Email" error={formErrors.email as string}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="hr@acme.com"
                error={!!formErrors.email}
                maxLength={100}
              />
            </FormField>

            <FormField label="Phone" error={formErrors.phone as string}>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value.replace(/[^\d\s+\-()]/g, ''))}
                placeholder="+91 98765 43210"
                error={!!formErrors.phone}
                maxLength={20}
              />
            </FormField>

            <FormField label="Industry">
              <Select value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
            </FormField>

            <FormField label="Employee Limit" required error={formErrors.employeeLimit as string}>
              <Input
                type="number"
                min={1}
                value={form.employeeLimit}
                onChange={(e) => set('employeeLimit', parseInt(e.target.value) || 1)}
                error={!!formErrors.employeeLimit}
              />
            </FormField>

            <FormField label="Website" error={formErrors.website as string}>
              <Input
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://acme.com"
                error={!!formErrors.website}
                maxLength={200}
              />
            </FormField>

            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => set('status', e.target.value as 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="123 Business Park, Mumbai, MH 400001"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <SecondaryButton type="button" onClick={onClose} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" isLoading={isSavingCompany} className="flex-1">
              {company ? 'Update Company' : 'Create Company'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* ── HR Admins tab (edit mode only) ───────────────────────────── */}
      {isEditMode && activeTab === 'hr' && (
        <div className="space-y-5">

          {/* Existing HRs list */}
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-secondary)]" />
              Current HR Admins
            </h4>

            {loadingHrs ? (
              <div className="flex items-center justify-center py-8 text-[var(--color-text-tertiary)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading HR admins…</span>
              </div>
            ) : existingHrs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-[var(--color-border-primary)] text-[var(--color-text-tertiary)] text-sm">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <p className="font-medium">No HR admins yet</p>
                <p className="text-xs mt-0.5">Add the first HR admin below.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingHrs.map((hr) => (
                  <div
                    key={hr.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)] font-bold text-sm flex-shrink-0">
                      {(hr.fullName || hr.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {hr.fullName}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {hr.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {addedHrEmails.includes(hr.email) && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-dark)]">
                          <CheckCircle2 className="w-3 h-3" /> Just added
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hr.isActive
                            ? 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)]'
                            : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                        }`}
                      >
                        {hr.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-primary)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[var(--color-bg-card)] text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Add New HR Admins
              </span>
            </div>
          </div>

          {/* New HR rows */}
          {newHrs.length === 0 ? (
            <button
              type="button"
              onClick={addHrRow}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add New HR Admin
            </button>
          ) : (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text-secondary)]">
                <Mail className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                Login credentials will be emailed to each new HR admin automatically.
              </div>

              {newHrs.map((hr, idx) => (
                <NewHrRow
                  key={idx}
                  index={idx}
                  hr={hr}
                  errors={hrErrors}
                  onField={(k, v) => setHrField(idx, k, v)}
                  onRemove={() => removeHrRow(idx)}
                />
              ))}

              <button
                type="button"
                onClick={addHrRow}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Another
              </button>
            </div>
          )}

          {/* Save HRs button */}
          {newHrs.length > 0 && (
            <div className="flex gap-3 pt-1">
              <SecondaryButton
                type="button"
                onClick={() => { setNewHrs([]); setHrErrors({}); }}
                className="flex-1"
                disabled={isSavingHrs}
              >
                Clear
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSaveHrs}
                isLoading={isSavingHrs}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {isSavingHrs ? 'Adding…' : `Add ${newHrs.length} HR Admin${newHrs.length > 1 ? 's' : ''}`}
              </PrimaryButton>
            </div>
          )}

          {/* Close button when no pending HRs */}
          {newHrs.length === 0 && (
            <div className="pt-1">
              <SecondaryButton type="button" onClick={onClose} className="w-full">
                Close
              </SecondaryButton>
            </div>
          )}
        </div>
      )}
    </ModalForm>
  );
};

// ── NewHrRow sub-component ────────────────────────────────────────────────────

interface NewHrRowProps {
  index: number;
  hr: HrEntry;
  errors: Record<string, string>;
  onField: (key: keyof HrEntry, value: string) => void;
  onRemove: () => void;
}

const NewHrRow: React.FC<NewHrRowProps> = ({ index, hr, errors, onField, onRemove }) => (
  <div className="relative rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/50 p-4">
    {/* Row header */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold">
          {index + 1}
        </div>
        <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
          New HR Admin
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
        aria-label="Remove this HR admin"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>

    {/* Fields */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Full Name" required error={errors[`hr${index}_fullName`]}>
        <Input
          value={hr.fullName}
          onChange={(e) => onField('fullName', e.target.value)}
          placeholder="Priya Mehta"
          error={!!errors[`hr${index}_fullName`]}
        />
      </FormField>
      <FormField label="Email" required error={errors[`hr${index}_email`]}>
        <Input
          type="email"
          value={hr.email}
          onChange={(e) => onField('email', e.target.value)}
          placeholder="hr@acme.com"
          error={!!errors[`hr${index}_email`]}
        />
      </FormField>
      <FormField label="Phone" error={errors[`hr${index}_phone`]}>
        <Input
          type="tel"
          value={hr.phone}
          onChange={(e) => onField('phone', e.target.value.replace(/[^\d\s+\-()]/g, ''))}
          placeholder="+91 98765 43210"
          error={!!errors[`hr${index}_phone`]}
          maxLength={20}
        />
      </FormField>
      <FormField label="Designation">
        <Input
          value={hr.designation}
          onChange={(e) => onField('designation', e.target.value)}
          placeholder="HR Manager"
        />
      </FormField>
    </div>

    {/* Inline error summary for this row */}
    {(errors[`hr${index}_fullName`] || errors[`hr${index}_email`] || errors[`hr${index}_phone`]) && (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-error)]">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        Please fix the errors above.
      </div>
    )}
  </div>
);
