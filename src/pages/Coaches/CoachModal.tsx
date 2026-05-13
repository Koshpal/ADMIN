import React, { useState, useEffect } from 'react';
import { ModalForm, FormField, Input, Textarea, PrimaryButton, SecondaryButton } from '../../components/ui/ModalForm';
import { adminService } from '../../services/admin.service';
import { Coach, CreateCoachPayload } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

interface CoachModalProps {
  isOpen: boolean;
  coach: Coach | null;
  onClose: () => void;
  onSave: () => void;
}

const SPECIALIZATIONS = [
  'Financial Planning', 'Debt Management', 'Investment', 'Retirement Planning',
  'Tax Planning', 'Insurance', 'Budget Management', 'Career Finance', 'Other',
];

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Los_Angeles', 'Australia/Sydney',
];

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati'];

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  experience: 0,
  password: '',
  timezone: 'Asia/Kolkata',
  location: '',
};

export const CoachModal: React.FC<CoachModalProps> = ({ isOpen, coach, onClose, onSave }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);

  useEffect(() => {
    if (coach) {
      const nameParts = (coach.fullName || '').split(' ');
      setForm({
        ...emptyForm,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: coach.email,
        phone: coach.phone || '',
        bio: coach.bio || '',
        timezone: coach.timezone || 'Asia/Kolkata',
        location: coach.location || '',
      });
      setSelectedSpecs(coach.expertise || []);
      setSelectedLangs([]);
    } else {
      setForm(emptyForm);
      setSelectedSpecs([]);
      setSelectedLangs([]);
    }
    setErrors({});
  }, [coach, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name required.';
    if (!form.lastName.trim()) e.lastName = 'Last name required.';
    if (!form.email.trim()) e.email = 'Email required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload: CreateCoachPayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        experience: form.experience || undefined,
        password: form.password || undefined,
        timezone: form.timezone,
        location: form.location || undefined,
        specialization: selectedSpecs,
        languages: selectedLangs,
      };
      if (coach) {
        await adminService.updateCoach(coach.id, payload);
      } else {
        await adminService.createCoach(payload);
      }
      onSave();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save coach.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpec = (s: string) =>
    setSelectedSpecs((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleLang = (l: string) =>
    setSelectedLangs((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <ModalForm
      isOpen={isOpen}
      title={coach ? 'Edit Coach' : 'Create Coach'}
      subtitle={coach ? 'Update coach profile.' : 'Add a new coach to the platform.'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="First Name" required error={errors.firstName}>
            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Rahul" error={!!errors.firstName} />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName}>
            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Sharma" error={!!errors.lastName} />
          </FormField>
          <FormField label="Email" required error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="coach@example.com" error={!!errors.email} disabled={!!coach} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
          </FormField>
          <FormField label="Timezone">
            <select
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            >
              {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Location">
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Mumbai, India" />
          </FormField>
        </div>

        {!coach && (
          <FormField label="Password" hint="Leave blank to auto-generate a secure password.">
            <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Auto-generated if blank" />
          </FormField>
        )}

        <FormField label="Bio">
          <Textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief description of the coach's background and approach..." rows={3} />
        </FormField>

        <FormField label="Specializations">
          <div className="flex flex-wrap gap-2 mt-1">
            {SPECIALIZATIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedSpecs.includes(s)
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Languages">
          <div className="flex flex-wrap gap-2 mt-1">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleLang(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedLangs.includes(l)
                    ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-secondary)]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </FormField>

        {!coach && (
          <div className="p-3 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text-secondary)]">
            📧 Login credentials will be automatically sent to the coach's email address after creation.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" isLoading={isLoading} className="flex-1">
            {coach ? 'Update Coach' : 'Create Coach'}
          </PrimaryButton>
        </div>
      </form>
    </ModalForm>
  );
};
