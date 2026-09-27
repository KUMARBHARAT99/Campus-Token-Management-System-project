import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { PageHeader } from '@/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { tokenService } from '@/services/tokenService';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import { formatDate, formatTime } from '@/utils';
import type { TokenRequest } from '@/types';

export function AdminActiveTokensPage() {
  const [tokens, setTokens] = useState<TokenRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tokenService.getAll().then((all) => {
      setTokens(all.filter((t) => t.status === 'approved' || t.status === 'active'));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Active Tokens" subtitle="Approved and currently-active campus access tokens." />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : tokens.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={22} />}
            title="No active tokens"
            description="There are no approved or active tokens at the moment."
          />
        ) : (
          <div className="divide-y divide-ink-200">
            {tokens.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-800">{t.visitor_name}</p>
                  <p className="truncate text-xs text-ink-500">
                    {t.token_id} · {ENTRY_TYPE_LABEL[t.entry_type]} · {t.location}
                  </p>
                  <p className="text-xs text-ink-400">
                    Valid: {formatDate(t.date)} · {formatTime(t.entry_time)} – {formatTime(t.exit_time)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  <Link
                    to={`/tokens/${t.id}`}
                    className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                  >
                    View Token
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
