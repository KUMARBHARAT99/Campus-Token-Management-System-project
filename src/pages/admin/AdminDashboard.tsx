import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Ticket,
  LogIn,
  ArrowRight,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/services/supabaseClient';
import { tokenService } from '@/services/tokenService';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import { formatDate, formatTime } from '@/utils';
import type { EntryLog, TokenRequest } from '@/types';

export function AdminDashboard() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<TokenRequest[]>([]);
  const [entryLogs, setEntryLogs] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const [t, logs] = await Promise.all([tokenService.getAll(), tokenService.getEntryLogs()]);
      if (!alive) return;
      setTokens(t); setEntryLogs(logs); setLoading(false);
    };
    void refresh();
    const sb = getSupabase();
    const channel = sb.channel('admin-live-control-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_requests' }, () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entry_logs' }, () => { void refresh(); })
      .subscribe();
    return () => { alive = false; void sb.removeChannel(channel); };
  }, []);

  if (!user) return null;

  const pending = tokens.filter((t) => t.status === 'pending').length;
  const approved = tokens.filter((t) => t.status === 'approved').length;
  const active = tokens.filter((t) => t.status === 'active').length;
  const todays = entryLogs.filter(
    (l) => new Date(l.entry_time).toDateString() === new Date().toDateString(),
  ).length;

  const summary = [
    { label: 'Pending Activation', value: pending, icon: <ClipboardList size={20} />, color: 'text-amber-600 bg-amber-50', to: '/admin/requests' },
    { label: 'Approved Tokens', value: approved, icon: <CheckCircle2 size={20} />, color: 'text-emerald-600 bg-emerald-50', to: '/admin/active-tokens' },
    { label: 'Active Tokens', value: active, icon: <Ticket size={20} />, color: 'text-brand-600 bg-brand-50', to: '/admin/active-tokens' },
    { label: "Today's Entries", value: todays, icon: <LogIn size={20} />, color: 'text-ink-600 bg-ink-100', to: '/admin/entry-logs' },
  ];

  const pendingList = tokens.filter((t) => t.status === 'pending').slice(0, 5);

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 p-6 text-white shadow-xl sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-300">Live security control center</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Good day, {user.full_name.split(' ')[0]} 👋</h1><p className="mt-1 max-w-2xl text-sm text-white/65">Monitor pending tokens, verify campus entry and review live security activity.</p></div><Link to="/admin/verification" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5"><ScanLine size={18}/> Verify Token</Link></div></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Link key={s.label} to={s.to} className="card p-4 transition hover:shadow-cardHover sm:p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
              {s.icon}
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-800">{loading ? '—' : s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-ink-800">Pending Token Activation</h2>
            <Link to="/admin/requests" className="text-xs font-medium text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          {!loading && pendingList.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No tokens are waiting for activation.</p>
          ) : loading ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">Loading...</p>
          ) : (
            <div className="divide-y divide-ink-200">
              {pendingList.map((t) => (
                <Link
                  key={t.id}
                  to={`/admin/requests/${t.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-ink-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">{t.visitor_name}</p>
                    <p className="truncate text-xs text-ink-500">
                      {t.token_id} · {ENTRY_TYPE_LABEL[t.entry_type]} · {formatDate(t.date)} {formatTime(t.entry_time)}
                    </p>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-ink-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card-pad">
          <h2 className="text-sm font-semibold text-ink-800">Quick Verify</h2>
          <p className="mt-1 text-xs text-ink-500">Check a token at the entry point.</p>
          <Link to="/admin/verification" className="btn-primary mt-4 w-full">
            <ScanLine size={18} /> Open Verification
          </Link>
          <div className="mt-5 border-t border-ink-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Recent Entries</p>
            {entryLogs.length === 0 ? (
              <p className="mt-2 text-xs text-ink-500">No entries logged yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {entryLogs.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-ink-600">{l.token_id}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${
                      l.status === 'allowed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
