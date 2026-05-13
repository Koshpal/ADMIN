import React, { useState } from 'react';
import { Building2, UserCheck, Users, CheckCircle2, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FormField, Input, Select, PrimaryButton, SecondaryButton } from '../../components/ui/ModalForm';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 1, label: 'Company', icon: Building2, desc: 'Set up the organisation' },
  { id: 2, label: 'HR Admin', icon: Users, desc: 'Create HR account' },
  { id: 3, label: 'Coach', icon: UserCheck, desc: 'Assign a coach (optional)' },
  { id: 4, label: 'Review', icon: CheckCircle2, desc: 'Confirm & launch' },
];

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Other'];

const defaultCompany = { name: '', domain: '', employeeLimit: 50, industry: '', email: '', phone: '', address: '', status: 'ACTIVE' as const };
const defaultHr = { fullName: '', email: '', phone: '', designation: '' };
const defaultCoach = { firstName: '', lastName: '', email: '', phone: '', bio: '', timezone: 'Asia/Kolkata' };

export const Onboarding: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [includeCoach, setIncludeCoach] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  const [company, setCompany] = useState(defaultCompany);
  const [hr, setHr] = useState(defaultHr);
  const [coach, setCoach] = useState(defaultCoach);

  const setC = (k: string, v: any) => setCompany((p) => ({ ...p, [k]: v }));
  const setH = (k: string, v: any) => setHr((p) => ({ ...p, [k]: v }));
  const setK = (k: string, v: any) => setCoach((p) => ({ ...p, [k]: v }));

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!company.name.trim()) e.companyName = 'Company name required.';
      if (company.employeeLimit < 1) e.employeeLimit = 'Employee limit must be at least 1.';
    }
    if (s === 2) {
      if (!hr.fullName.trim()) e.hrName = 'Full name required.';
      if (!hr.email.trim()) e.hrEmail = 'Email required.';
      else if (!/\S+@\S+\.\S+/.test(hr.email)) e.hrEmail = 'Invalid email.';
    }
    if (s === 3 && includeCoach) {
      if (!coach.firstName.trim()) e.coachFirstName = 'First name required.';
      if (!coach.lastName.trim()) e.coachLastName = 'Last name required.';
      if (!coach.email.trim()) e.coachEmail = 'Email required.';
      else if (!/\S+@\S+\.\S+/.test(coach.email)) e.coachEmail = 'Invalid email.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        company: { ...company, employeeLimit: Number(company.employeeLimit), website: '', status: 'ACTIVE' },
        hr: { ...hr },
      };
      if (includeCoach) {
        payload.coach = { ...coach, specialization: [], languages: [] };
      }
      const res = await adminService.onboardCompany(payload);
      setResult(res);
      showToast('Onboarding completed! Credentials sent via email.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Onboarding failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
            <span className="text-[var(--color-text-secondary)]">HR Email</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{result.hr?.email}</span>
          </div>
          {result.coach && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Coach Email</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{result.coach?.email}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => { setResult(null); setStep(1); setCompany(defaultCompany); setHr(defaultHr); setCoach(defaultCoach); }}>
            Onboard Another
          </SecondaryButton>
          <PrimaryButton onClick={() => navigate('/companies')}>
            View Companies
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Wizard"
        subtitle="Set up a new company, HR, and coach in one streamlined flow."
        breadcrumb="Admin"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                  : isDone
                  ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30 text-[var(--color-success-dark)]'
                  : 'bg-[var(--color-bg-card)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <div>
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] opacity-70 hidden sm:block">{s.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px min-w-[20px] ${step > s.id ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-primary)]'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-6">
        {/* Step 1: Company */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-4">Company Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Company Name" required error={errors.companyName}>
                <Input value={company.name} onChange={(e) => setC('name', e.target.value)} placeholder="Acme Corp" error={!!errors.companyName} />
              </FormField>
              <FormField label="Domain" hint="e.g. acme.com">
                <Input value={company.domain} onChange={(e) => setC('domain', e.target.value)} placeholder="acme.com" />
              </FormField>
              <FormField label="Industry">
                <Select value={company.industry} onChange={(e) => setC('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </Select>
              </FormField>
              <FormField label="Employee Limit" required error={errors.employeeLimit}>
                <Input type="number" min={1} value={company.employeeLimit} onChange={(e) => setC('employeeLimit', parseInt(e.target.value) || 1)} error={!!errors.employeeLimit} />
              </FormField>
              <FormField label="Company Email">
                <Input type="email" value={company.email} onChange={(e) => setC('email', e.target.value)} placeholder="info@acme.com" />
              </FormField>
              <FormField label="Phone">
                <Input value={company.phone} onChange={(e) => setC('phone', e.target.value)} placeholder="+91 98765 43210" />
              </FormField>
            </div>
            <FormField label="Address">
              <Input value={company.address} onChange={(e) => setC('address', e.target.value)} placeholder="123 Business Park, Mumbai" />
            </FormField>
          </div>
        )}

        {/* Step 2: HR */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-4">HR Administrator</h3>
            <div className="p-3 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text-secondary)]">
              📧 Login credentials will be automatically emailed to the HR after onboarding.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required error={errors.hrName}>
                <Input value={hr.fullName} onChange={(e) => setH('fullName', e.target.value)} placeholder="Priya Mehta" error={!!errors.hrName} />
              </FormField>
              <FormField label="Email" required error={errors.hrEmail}>
                <Input type="email" value={hr.email} onChange={(e) => setH('email', e.target.value)} placeholder="hr@acme.com" error={!!errors.hrEmail} />
              </FormField>
              <FormField label="Phone">
                <Input value={hr.phone} onChange={(e) => setH('phone', e.target.value)} placeholder="+91 98765 43210" />
              </FormField>
              <FormField label="Designation">
                <Input value={hr.designation} onChange={(e) => setH('designation', e.target.value)} placeholder="HR Manager" />
              </FormField>
            </div>
          </div>
        )}

        {/* Step 3: Coach */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h4 text-[var(--color-text-primary)]">Assign Coach</h3>
              <button
                onClick={() => setIncludeCoach(!includeCoach)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  includeCoach
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]'
                }`}
              >
                {includeCoach ? '✓ Included' : '+ Include Coach'}
              </button>
            </div>
            {!includeCoach ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border-primary)] rounded-xl">
                <UserCheck className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-semibold">Coach is optional</p>
                <p className="text-sm mt-1">Click "Include Coach" to assign one now, or add later from the Coaches page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First Name" required error={errors.coachFirstName}>
                  <Input value={coach.firstName} onChange={(e) => setK('firstName', e.target.value)} placeholder="Rahul" error={!!errors.coachFirstName} />
                </FormField>
                <FormField label="Last Name" required error={errors.coachLastName}>
                  <Input value={coach.lastName} onChange={(e) => setK('lastName', e.target.value)} placeholder="Sharma" error={!!errors.coachLastName} />
                </FormField>
                <FormField label="Email" required error={errors.coachEmail}>
                  <Input type="email" value={coach.email} onChange={(e) => setK('email', e.target.value)} placeholder="coach@example.com" error={!!errors.coachEmail} />
                </FormField>
                <FormField label="Phone">
                  <Input value={coach.phone} onChange={(e) => setK('phone', e.target.value)} placeholder="+91 98765 43210" />
                </FormField>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-4">Review & Launch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                  <p className="text-label text-[var(--color-primary)]">Company</p>
                </div>
                {[
                  ['Name', company.name],
                  ['Domain', company.domain || '—'],
                  ['Industry', company.industry || '—'],
                  ['Employee Limit', company.employeeLimit],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">{k}</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{v}</span>
                  </div>
                ))}
              </div>
              {/* HR */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[var(--color-secondary)]" />
                  <p className="text-label text-[var(--color-secondary)]">HR Admin</p>
                </div>
                {[
                  ['Name', hr.fullName],
                  ['Email', hr.email],
                  ['Phone', hr.phone || '—'],
                  ['Designation', hr.designation || '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">{k}</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{v}</span>
                  </div>
                ))}
              </div>
              {/* Coach */}
              {includeCoach && (
                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-[var(--color-success)]" />
                    <p className="text-label text-[var(--color-success-dark)]">Coach</p>
                  </div>
                  {[
                    ['Name', `${coach.firstName} ${coach.lastName}`],
                    ['Email', coach.email],
                    ['Phone', coach.phone || '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">{k}</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">{v}</span>
                    </div>
                  ))}
                </div>
              )}
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
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all ${step === s.id ? 'bg-[var(--color-primary)] w-6' : step > s.id ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-secondary)]'}`}
            />
          ))}
        </div>
        {step < 4 ? (
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
