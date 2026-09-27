import { useEffect, useMemo, useState } from 'react';
import { History as HistoryIcon, LogIn, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/layouts/DashboardLayout';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { tokenService } from '@/services/tokenService';
import { formatDateTime, formatDate } from '@/utils';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import type { EntryLog, TokenRequest } from '@/types';

export function AdminEntryLogsPage() {
  const [logs, setLogs] = useState<EntryLog[]>([]);
  const [tokens, setTokens] = useState<TokenRequest[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tokenService.getEntryLogs(), tokenService.getAll()])
      .then(([entryLogs, allTokens]) => {
        setLogs(entryLogs);
        setTokens(allTokens);
      })
      .finally(() => setLoading(false));
  }, []);

  const tokenMap = useMemo(() => new Map(tokens.map((token) => [token.token_id, token])), [tokens]);
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return logs;
    return logs.filter((log) => {
      const token = tokenMap.get(log.token_id ?? '');
      return [
        log.token_id,
        log.verified_by,
        log.status,
        log.reason,
        log.gate_name,
        token?.visitor_name,
      ].some((value) => String(value ?? '').toLowerCase().includes(clean));
    });
  }, [logs, tokenMap, query]);

  return (
    <div>
      <PageHeader
        title="Entry Logs"
        subtitle="Actual gate verification attempts recorded by the system."
        action={<Link to="/admin/verification" className="btn-primary"><LogIn size={17} /> Verify Token</Link>}
      />

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
        <input className="input pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search token, visitor or gate" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon size={22} />}
            title={logs.length === 0 ? 'No entry logs yet' : 'No matching entries'}
            description={logs.length === 0 ? 'Entry verifications will appear here once security starts verifying tokens.' : 'Try a different token, visitor or gate search.'}
            action={logs.length === 0 ? <Link to="/admin/verification" className="btn-primary">Verify a Token</Link> : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    <th className="px-5 py-3">Token</th>
                    <th className="px-5 py-3">Visitor</th>
                    <th className="px-5 py-3">Entry Type</th>
                    <th className="px-5 py-3">Gate / Time</th>
                    <th className="px-5 py-3">Result</th>
                    <th className="px-5 py-3">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {filtered.map((log) => {
                    const token = tokenMap.get(log.token_id ?? '');
                    return (
                      <tr key={log.id} className="hover:bg-ink-50">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-ink-700">{log.token_id || '—'}</td>
                        <td className="px-5 py-3 font-medium text-ink-800">{token?.visitor_name || '—'}</td>
                        <td className="px-5 py-3 text-ink-600">{token ? ENTRY_TYPE_LABEL[token.entry_type] : '—'}</td>
                        <td className="px-5 py-3 text-ink-600"><p>Entry: {log.gate_name || 'Main Gate'}</p><p className="text-xs text-ink-400">{formatDateTime(log.entry_time)}</p>{log.exit_time && <><p className="mt-1">Exit: {log.exit_gate_name || log.gate_name || 'Main Gate'}</p><p className="text-xs text-ink-400">{formatDateTime(log.exit_time)}</p></>}</td>
                        <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${log.status === 'allowed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{log.status === 'allowed' ? 'Allowed' : 'Denied'}</span>{log.reason && <p className="mt-1 max-w-40 text-xs text-ink-400">{log.reason}</p>}</td>
                        <td className="px-5 py-3 text-ink-600">{log.verified_by || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-ink-200 sm:hidden">
              {filtered.map((log) => {
                const token = tokenMap.get(log.token_id ?? '');
                return (
                  <div key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-ink-700">{log.token_id || '—'}</p>
                        <p className="mt-1 truncate font-semibold text-ink-800">{token?.visitor_name || 'Unknown visitor'}</p>
                        <p className="mt-1 text-xs text-ink-500">{token ? ENTRY_TYPE_LABEL[token.entry_type] : 'Entry verification'} · Entry: {log.gate_name || 'Main Gate'}</p>{log.exit_time && <p className="mt-1 text-xs font-semibold text-emerald-700">Exit: {log.exit_gate_name || log.gate_name || 'Main Gate'} · {formatDateTime(log.exit_time)}</p>}
                        <p className="mt-1 text-xs text-ink-400">{formatDate(log.entry_time.slice(0, 10))} · {formatDateTime(log.entry_time)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${log.status === 'allowed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{log.status === 'allowed' ? 'Allowed' : 'Denied'}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">Verified by: <span className="font-semibold text-ink-700">{log.verified_by || '—'}</span></p>
                    {log.reason && <p className="mt-1 text-xs text-red-600">Reason: {log.reason}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
