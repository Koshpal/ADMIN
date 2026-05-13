import React from 'react';
import { X } from 'lucide-react';

interface ModalFormProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const ModalForm: React.FC<ModalFormProps> = ({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-overlay)]" onClick={onClose} />
      <div
        className={`relative w-full ${sizes[size]} bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl animate-fade-in flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border-primary)] flex-shrink-0">
          <div>
            <h2 className="text-h4 text-[var(--color-text-primary)]">{title}</h2>
            {subtitle && <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex-shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// Reusable form field wrapper
export const FormField: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-label text-[var(--color-text-primary)]">
      {label} {required && <span className="text-[var(--color-error)]">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    {error && <p className="text-[11px] text-[var(--color-error)]">{error}</p>}
  </div>
);

// Reusable input
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }> = ({
  error,
  className = '',
  ...props
}) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2
      bg-[var(--color-input-bg)] text-[var(--color-input-text)] placeholder-[var(--color-input-placeholder)]
      ${error
        ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
        : 'border-[var(--color-input-border)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
      } ${className}`}
  />
);

// Reusable select
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <select
    {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2
      bg-[var(--color-input-bg)] text-[var(--color-input-text)]
      border-[var(--color-input-border)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
      ${className}`}
  >
    {children}
  </select>
);

// Reusable textarea
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...props
}) => (
  <textarea
    {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 resize-none
      bg-[var(--color-input-bg)] text-[var(--color-input-text)] placeholder-[var(--color-input-placeholder)]
      border-[var(--color-input-border)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
      ${className}`}
  />
);

// Primary button
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }> = ({
  children,
  isLoading,
  className = '',
  disabled,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    className={`px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
  >
    {isLoading ? 'Loading...' : children}
  </button>
);

// Secondary button
export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={`px-5 py-2.5 rounded-xl text-sm font-semibold border bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors ${className}`}
  >
    {children}
  </button>
);
