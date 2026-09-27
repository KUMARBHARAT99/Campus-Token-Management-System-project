import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-brand-500 ${className ?? ''}`} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <Spinner size={32} />
    </div>
  );
}
