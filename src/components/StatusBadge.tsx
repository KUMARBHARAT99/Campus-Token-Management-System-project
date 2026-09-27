import type { TokenStatus } from '@/types';
import { TOKEN_STATUS_META } from '@/config/constants';
import { cn } from '@/utils';

export function StatusBadge({ status }: { status: TokenStatus }) {
  const meta = TOKEN_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        meta.badge,
      )}
    >
      {meta.label}
    </span>
  );
}
