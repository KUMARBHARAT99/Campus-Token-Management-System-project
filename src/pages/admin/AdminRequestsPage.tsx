import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { tokenService } from '@/services/tokenService';
import { ENTRY_TYPES, ENTRY_TYPE_LABEL } from '@/config/constants';
import { formatDate, formatTime } from '@/utils';
import type { EntryType, TokenStatus } from '@/types';

export function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | TokenStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | EntryType>('all');

  const [tokens, setTokens] = useState<import('@/types').TokenRequest[]>([]);
  useEffect(() => { void tokenService.getAll().then(setTokens); }, []);
  const filtered = useMemo(
    () =>
      tokens.filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (typeFilter !== 'all' && t.entry_type !== typeFilter) return false;
        return true;
      }),
    [tokens, statusFilter, typeFilter],
  );

  const statusFilters: { value: 'all' | TokenStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
  ];

  return (
    <div>
      <PageHeader title="Token Monitoring" subtitle="Monitor generated tokens and gate-ready activity. Admin approval is not required for individual tokens." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                statusFilter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="input sm:ml-auto sm:w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | EntryType)}
        >
          <option value="all">All Entry Types</option>
          {ENTRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No requests found"
            description="No requests match the current filters."
          />
        ) : (
          <>
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3">Token ID</th>
                  <th className="px-5 py-3">Visitor</th>
                  <th className="px-5 py-3">Entry Type</th>
                  <th className="px-5 py-3">Date / Time</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-50">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-ink-700">{t.token_id}</td>
                    <td className="px-5 py-3 font-medium text-ink-800">{t.visitor_name}</td>
                    <td className="px-5 py-3 text-ink-600">{ENTRY_TYPE_LABEL[t.entry_type]}</td>
                    <td className="px-5 py-3 text-ink-600">{formatDate(t.date)} {formatTime(t.entry_time)}</td>
                    <td className="px-5 py-3 text-ink-600">{t.location}</td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/admin/requests/${t.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divide-y divide-ink-200 sm:hidden">
              {filtered.map((t) => (
                <Link key={t.id} to={`/admin/requests/${t.id}`} className="block p-4 hover:bg-ink-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-800">{t.visitor_name}</p>
                      <p className="truncate text-xs text-ink-500">{t.token_id} · {ENTRY_TYPE_LABEL[t.entry_type]}</p>
                      <p className="text-xs text-ink-500">{formatDate(t.date)} · {t.location}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
