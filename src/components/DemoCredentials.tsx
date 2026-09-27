import { Info } from 'lucide-react';

// Demo credentials shown on the login page for easy access in mock mode.
export const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@campus.edu', password: 'demo1234' },
  { role: 'Admin', email: 'admin@campus.edu', password: 'demo1234' },
  { role: 'Security', email: 'security@campus.edu', password: 'demo1234' },
];

export function DemoCredentialsNotice() {
  return (
    <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
        <Info size={16} /> Demo accounts (click to autofill)
      </div>
      <div className="space-y-1.5">
        {DEMO_ACCOUNTS.map((a) => (
          <div key={a.email} className="flex items-center justify-between text-xs text-brand-700">
            <span className="font-medium">{a.role}</span>
            <span className="font-mono">{a.email}</span>
          </div>
        ))}
        <p className="pt-1 text-xs text-brand-600">Password for all: <span className="font-mono">demo1234</span></p>
      </div>
    </div>
  );
}
