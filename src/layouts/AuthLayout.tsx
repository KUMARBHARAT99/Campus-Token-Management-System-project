import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

// Shared split-layout shell for Login, SignUp, ForgotPassword.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 text-white lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <ShieldCheck size={20} />
            </span>
            <span className="text-lg font-bold">Smart Campus Tokens</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Digital, secure campus access management.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Request temporary entry tokens for parents, visitors, vendors and events —
            verified, tracked and paperless.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['9 Entry Types', 'Role-Based', 'QR-Ready'].map((t) => (
              <div key={t} className="rounded-lg bg-white/10 px-3 py-3 text-center text-sm font-medium">
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-brand-200">Prototype demonstration system.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700 lg:hidden">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <h1 className="text-2xl font-bold text-ink-800">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
