import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter email and password.', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid credentials or insufficient permissions.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-secondary)]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 40}px`,
                height: `${(i + 1) * 40}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Koshpal Admin</h1>
          <p className="text-white/80 text-lg max-w-xs">
            Super Admin Dashboard — Full visibility and control over the entire Koshpal platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Companies', icon: '🏢' },
              { label: 'Coaches', icon: '👤' },
              { label: 'Analytics', icon: '📊' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-h3 text-[var(--color-text-primary)]">Koshpal</span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                Super Admin
              </span>
            </div>
          </div>

          <h2 className="text-h2 text-[var(--color-text-primary)] mb-1">Welcome back</h2>
          <p className="text-body-md text-[var(--color-text-secondary)] mb-8">
            Sign in to your admin account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-label text-[var(--color-text-primary)]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@koshpal.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2
                  bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)]
                  placeholder-[var(--color-input-placeholder)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-label text-[var(--color-text-primary)]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2
                    bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)]
                    placeholder-[var(--color-input-placeholder)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Admin Portal'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-8">
            Admin access only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};
