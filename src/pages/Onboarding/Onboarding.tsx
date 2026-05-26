import React, { useState } from 'react';
import { Building2, Users, CheckCircle2, ArrowRight, ArrowLeft, Rocket, Plus, Trash2, UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FormField, Input, Select, PrimaryButton, SecondaryButton } from '../../components/ui/ModalForm';
import { adminService } from '../../services/admin.service';
import type { OnboardingPayload, CompanyStatus } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 1, label: 'Company',  icon: Building2,   desc: 'Set up the organisation' },
  { id: 2, label: 'HR Admin', icon: Users,        desc: 'Create HR account(s)' },
  { id: 3, label: 'Review',   icon: CheckCircle2, desc: 'Confirm & launch' },
];

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Other'];

const defaultCompany = {
  name: '', domain: '', employeeLimit: 50, industry: '',
  email: '', phone: '', address: '', status: 'ACTIVE' as const,
};

const newHrEntry = () => ({ fullName: '', email: '', phone: '', designation: '' });

export const Onboarding: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep]         = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [result, setResult]     = useState<any>(null);

  const [company, setCompany]   = useState(defaultCompany);
  // Primary HR is hrs[0]; additional HRs are hrs[1…]
  const [hrs, setHrs]           = useState([newHrEntry()]);

  const setC = (k: string, v: any) => setCompany((p) => ({ ...p, [k]: v }));

  // ── HR list helpers ──────────────────────────────────────────────────────

  const setHrField = (idx: number, k: string, v: string) => {
    setHrs((prev) => prev.map((h, i) => i === idx ? { ...h, [k]: v } : h));
    // clear the specific field error when user edits
    const key = `hr${idx}_${k}`;
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const addHr = () => setHrs((prev) => [...prev, newHrEntry()]);

  const removeHr = (idx: number) => {
    setHrs((prev) => prev.filter((_, i) => i !== idx));
    // Remove errors for that row
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (k.startsWith(`hr${idx}_`)) delete next[k]; });
      return next;
    });
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = (phone: string) => !phone.trim() || /^[+\d\s\-()]{7,20}$/.test(phone.trim());

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};

    if (s === 1) {
      if (!company.name.trim())          e.companyName  = 'Company name is required.';
      if (company.employeeLimit < 1)     e.employeeLimit = 'Must be at least 1.';
      if (company.employeeLimit > 100000) e.employeeLimit = 'Cannot exceed 100,000.';
      if (company.email && !isValidEmail(company.email)) e.companyEmail = 'Please enter a valid email.';
      if (!isValidPhone(company.phone))  e.companyPhone = 'Enter a valid phone number (7–20 digits).';
    }

    if (s === 2) {
      hrs.forEach((hr, idx) => {
        if (!hr.fullName.trim())          e[`hr${idx}_fullName`]   = 'Full name is required.';
        if (!hr.email.trim())             e[`hr${idx}_email`]      = 'Email is required.';
        else if (!isValidEmail(hr.email)) e[`hr${idx}_email`]      = 'Please enter a valid email.';
        if (!isValidPhone(hr.phone))      e[`hr${idx}_phone`]      = 'Enter a valid phone number (7–20 digits).';
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 3)); };
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Launch ───────────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      // 1️⃣  Onboard company + primary HR
      const primaryHr = hrs[0];
      const payload: OnboardingPayload = {
        company: {
          ...company,
          employeeLimit: Number(company.employeeLimit),
          website: '',
          status: company.status as CompanyStatus,
        },
        hr: { ...primaryHr },
      };
      const res = await adminService.onboardCompany(payload);

      // 2️⃣  Create additional HRs concurrently (if any), attaching to the new companyId
      const additionalHrs = hrs.slice(1);
      if (additionalHrs.length > 0 && res?.company?.id) {
        const companyId: string = res.company.id;
        await Promise.allSettled(
          additionalHrs.map((h) =>
            adminService.createHr({
              fullName:    h.fullName,
              email:       h.email,
              companyId,
              ...(h.phone       && { phone: h.phone }),
              ...(h.designation && { designation: h.designation }),
            }),
          ),
        );
      }

      setResult({ ...res, additionalHrsCount: additionalHrs.length });
      showToast(
        additionalHrs.length > 0
          ? `Onboarding complete! ${1 + additionalHrs.length} HR accounts created.`
          : 'Onboarding completed! Credentials sent via email.',
        'success',
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Onboarding failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[var(--color-success)]" />
        </div>
        <div className="text-center">
          <h2 className="text-h2 text-[var(--color-text-primary)] mb-2">Onboarding Complete!</h2>
          <p className="text-body-md text-[var(--color-text-secondary)] max-w-sm">
            All accounts have been created and login credentials sent via email.
          </p>
        </div>
        <div className="w-full max-w-md bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Company</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{result.company?.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Primary HR</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{result.hr?.email}</span>
          </div>
          {result.additionalHrsCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Additional HRs</span>
              <span className="font-semibold text-[var(--color-success-dark)]">
                +{result.additionalHrsCount} created
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <SecondaryButton
            onClick={() => {
              setResult(null);
              setStep(1);
              setCompany(defaultCompany);
              setHrs([newHrEntry()]);
            }}
          >
            Onboard Another
          </SecondaryButton>
          <PrimaryButton onClick={() => navigate('/companies')}>
            View Companies
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Wizard"
        subtitle="Set up a new company and its HR administrators in one streamlined flow."
        breadcrumb="Admin"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone   = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                    : isDone
                    ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30 text-[var(--color-success-dark)]'
                    : 'bg-[var(--color-bg-card)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <div>
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] opacity-70 hidden sm:block">{s.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px min-w-[20px] ${
                    step > s.id ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-primary)]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content card */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-6">

        {/* ── Step 1: Company ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-4">Company Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Company Name" required error={errors.companyName}>
                <Input
                  value={company.name}
                  onChange={(e) => setC('name', e.target.value)}
                  placeholder="Acme Corp"
                  error={!!errors.companyName}
                />
              </FormField>
              <FormField label="Domain" hint="e.g. acme.com">
                <Input
                  value={company.domain}
                  onChange={(e) => setC('domain', e.target.value)}
                  placeholder="acme.com"
                />
              </FormField>
              <FormField label="Industry">
                <Select value={company.industry} onChange={(e) => setC('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </Select>
              </FormField>
              <FormField label="Employee Limit" required error={errors.employeeLimit}>
                <Input
                  type="number"
                  min={1}
                  value={company.employeeLimit}
                  onChange={(e) => setC('employeeLimit', parseInt(e.target.value) || 1)}
                  error={!!errors.employeeLimit}
                />
              </FormField>
              <FormField label="Company Email" error={errors.companyEmail}>
                <Input
                  type="email"
                  value={company.email}
                  onChange={(e) => setC('email', e.target.value)}
                  placeholder="info@acme.com"
                  error={!!errors.companyEmail}
                  maxLength={100}
                />
              </FormField>
              <FormField label="Phone" error={errors.companyPhone}>
                <Input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setC('phone', e.target.value.replace(/[^\d\s+\-()]/g, ''))}
                  placeholder="+91 98765 43210"
                  error={!!errors.companyPhone}
                  maxLength={20}
                />
              </FormField>
            </div>
            <FormField label="Address">
              <Input
                value={company.address}
                onChange={(e) => setC('address', e.target.value)}
                placeholder="123 Business Park, Mumbai"
              />
            </FormField>
          </div>
        )}

        {/* ── Step 2: HR Admin(s) ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-h4 text-[var(--color-text-primary)]">HR Administrator(s)</h3>
              <button
                type="button"
                onClick={addHr}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another HR Admin
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text-secondary)]">
              📧 Login credentials will be automatically emailed to all HR admins after onboarding.
            </div>

            <div className="space-y-4">
              {hrs.map((hr, idx) => (
                <HrAdminCard
                  key={idx}
                  index={idx}
                  hr={hr}
                  errors={errors}
                  isPrimary={idx === 0}
                  onField={(k, v) => setHrField(idx, k, v)}
                  onRemove={hrs.length > 1 ? () => removeHr(idx) : undefined}
                />
              ))}
            </div>

            {/* Add HR CTA at bottom when there are already multiple */}
            {hrs.length > 1 && (
              <button
                type="button"
                onClick={addHr}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Another HR Admin
              </button>
            )}
          </div>
        )}

        {/* ── Step 3: Review ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-4">Review & Launch</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company card */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                  <p className="text-label text-[var(--color-primary)]">Company</p>
                </div>
                {([
                  ['Name',           company.name],
                  ['Domain',         company.domain     || '—'],
                  ['Industry',       company.industry   || '—'],
                  ['Employee Limit', company.employeeLimit],
                  ['Email',          company.email      || '—'],
                ] as [string, string | number][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">{k}</span>
                    <span className="font-semibold text-[var(--color-text-primary)] text-right break-all max-w-[55%]">{v}</span>
                  </div>
                ))}
              </div>

              {/* HR Admin(s) card */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-[var(--color-secondary)]" />
                  <p className="text-label text-[var(--color-secondary)]">
                    HR Admin{hrs.length > 1 ? `s (${hrs.length})` : ''}
                  </p>
                </div>
                {hrs.map((hr, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-3 border-t border-[var(--color-border-primary)]' : ''}>
                    {hrs.length > 1 && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
                        {idx === 0 ? 'Primary' : `Additional #${idx}`}
                      </p>
                    )}
                    {([
                      ['Name',        hr.fullName],
                      ['Email',       hr.email],
                      ['Phone',       hr.phone       || '—'],
                      ['Designation', hr.designation || '—'],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">{k}</span>
                        <span className="font-semibold text-[var(--color-text-primary)] text-right break-all max-w-[55%]">{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text-secondary)]">
              📧 All created accounts will receive their login credentials via email automatically.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <SecondaryButton onClick={handleBack} disabled={step === 1} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </SecondaryButton>

        {/* Dot progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                step === s.id
                  ? 'bg-[var(--color-primary)] w-6'
                  : step > s.id
                  ? 'bg-[var(--color-success)] w-2'
                  : 'bg-[var(--color-border-secondary)] w-2'
              }`}
            />
          ))}
        </div>

        {step < 3 ? (
          <PrimaryButton onClick={handleNext} className="flex items-center gap-2">
            Next <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleLaunch} isLoading={isLoading} className="flex items-center gap-2">
            <Rocket className="w-4 h-4" /> Launch Onboarding
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

// ── HrAdminCard ──────────────────────────────────────────────────────────────

interface HrAdminCardProps {
  index: number;
  hr: { fullName: string; email: string; phone: string; designation: string };
  errors: Record<string, string>;
  isPrimary: boolean;
  onField: (key: string, value: string) => void;
  onRemove?: () => void;
}

const HrAdminCard: React.FC<HrAdminCardProps> = ({ index, hr, errors, isPrimary, onField, onRemove }) => (
  <div className="relative rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/40 p-5">
    {/* Card header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          isPrimary
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]'
        }`}>
          {index + 1}
        </div>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">
          {isPrimary ? 'Primary HR Admin' : `Additional HR Admin #${index + 1}`}
        </span>
        {isPrimary && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase tracking-wider">
            Required
          </span>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
          aria-label="Remove this HR admin"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Fields */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  </div>
);
