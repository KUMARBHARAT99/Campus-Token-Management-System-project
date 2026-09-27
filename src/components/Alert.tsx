import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/utils';

type Variant = 'info' | 'success' | 'warning' | 'error';

const styles: Record<Variant, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: 'bg-brand-50 border-brand-200 text-brand-800',
    icon: <Info size={18} className="text-brand-500" />,
  },
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <CheckCircle2 size={18} className="text-emerald-500" />,
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <AlertCircle size={18} className="text-amber-500" />,
  },
  error: {
    wrap: 'bg-red-50 border-red-200 text-red-800',
    icon: <XCircle size={18} className="text-red-500" />,
  },
};

export function Alert({
  variant = 'info',
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const s = styles[variant];
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm', s.wrap, className)}>
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
