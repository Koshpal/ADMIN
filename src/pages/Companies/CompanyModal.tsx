import React, { useState, useEffect } from 'react';
import { ModalForm, FormField, Input, Select, PrimaryButton, SecondaryButton } from '../../components/ui/ModalForm';
import { adminService } from '../../services/admin.service';
import { Company, CreateCompanyPayload } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

interface CompanyModalProps {
  isOpen: boolean;
  company: Company | null;
  onClose: () => void;
  onSave: () => void;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media', 'Consulting', 'Other',
];

const emptyForm: CreateCompanyPayload = {
  name: '',
  domain: '',
  employeeLimit: 50,
  status: 'ACTIVE',
  email: '',
  phone: '',
  address: '',
  industry: '',
  website: '',
};

export const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, company, onClose, onSave }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateCompanyPayload>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCompanyPayload, string>>>({});

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        domain: company.domain || '',
        employeeLimit: company.employeeLimit,
        status: company.status,
        email: '',
        phone: '',
        address: '',
        industry: '',
        website: '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [company, isOpen]);

  const validate = () => {
    const e: Partial<Record<keyof CreateCompanyPayload, string>> = {};
    if (!form.name.trim()) e.name = 'Company name is required.';
    if (form.employeeLimit < 1) e.employeeLimit = 'Must be at least 1.';
    if (form.employeeLimit > 100000) e.employeeLimit = 'Employee limit cannot exceed 100,000.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Please enter a valid email address.';
    }
    if (form.phone && !/^[+\d\s\-()]{7,20}$/.test(form.phone.trim())) {
      e.phone = 'Enter a valid phone number (7–20 digits).';
    }
    if (form.website && !/^https?:\/\/.+\..+/.test(form.website.trim())) {
      e.website = 'Website must start with http:// or https://';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const set = <K extends keyof CreateCompanyPayload>(k: K, v: CreateCompanyPayload[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <ModalForm
      isOpen={isOpen}
      title={company ? 'Edit Company' : 'Create Company'}
      subtitle={company ? 'Update company information.' : 'Add a new organisation to the platform.'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Company Name" required error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Acme Corp"
              error={!!errors.name}
            />
          </FormField>

          <FormField label="Domain" hint="e.g. acme.com">
            <Input
              value={form.domain}
              onChange={(e) => set('domain', e.target.value)}
              placeholder="acme.com"
            />
          </FormField>

          <FormField label="Email" error={errors.email as string}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="hr@acme.com"
              error={!!errors.email}
              maxLength={100}
            />
          </FormField>

          <FormField label="Phone" error={errors.phone as string}>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => {
                // Allow digits, spaces, +, -, (, ) only
                const val = e.target.value.replace(/[^\d\s+\-()]/g, '');
                set('phone', val);
              }}
              placeholder="+91 98765 43210"
              error={!!errors.phone}
              maxLength={20}
            />
          </FormField>

          <FormField label="Industry">
            <Select value={form.industry} onChange={(e) => set('industry', e.target.value)}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </FormField>

          <FormField label="Employee Limit" required error={errors.employeeLimit as string}>
            <Input
              type="number"
              min={1}
              value={form.employeeLimit}
              onChange={(e) => set('employeeLimit', parseInt(e.target.value) || 1)}
              error={!!errors.employeeLimit}
            />
          </FormField>

          <FormField label="Website" error={errors.website as string}>
            <Input
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://acme.com"
              error={!!errors.website}
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
          <PrimaryButton type="submit" isLoading={isLoading} className="flex-1">
            {company ? 'Update Company' : 'Create Company'}
          </PrimaryButton>
        </div>
      </form>
    </ModalForm>
  );
};
