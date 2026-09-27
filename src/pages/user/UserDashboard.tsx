import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, History as HistoryIcon, MessageSquare, ShieldCheck, Ticket, User as UserIcon, Clock, Plus, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/services/supabaseClient';
import { tokenService } from '@/services/tokenService';
import { StatusBadge } from '@/components/StatusBadge';
import { ENTRY_TYPE_LABEL, EXTRA_TOKEN_FEE, FREE_TOKEN_LIMIT } from '@/config/constants';
import { formatDate } from '@/utils';
import type { TokenRequest } from '@/types';

export function UserDashboard() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<TokenRequest[]>([]);
  const [usage, setUsage] = useState({ used: 0, remaining: FREE_TOKEN_LIMIT });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const refresh = async () => {
      try {
        const [items, quota] = await Promise.all([tokenService.getByUser(user.id), tokenService.getFreeUsage(user.id)]);
        if (alive) { setTokens(items); setUsage(quota); }
      } finally { if (alive) setLoading(false); }
    };
    void refresh();
    const sb = getSupabase();
    const channel = sb.channel(`user-dashboard-live-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'token_requests', filter: `user_id=eq.${user.id}` }, () => { void refresh(); }).subscribe();
    return () => { alive = false; void sb.removeChannel(channel); };
  }, [user]);
  if (!user) return null;
  const active = tokens.filter(t => t.status === 'active' || t.status === 'approved').length;
  const pending = tokens.filter(t => t.status === 'pending').length;
  const expired = tokens.filter(t => t.status === 'expired').length;
  const latest = tokens.slice(0, 6);
  const stats = [
    ['Active', active, Ticket, 'bg-violet-50 text-violet-600'],
    ['Pending', pending, Clock, 'bg-amber-50 text-amber-600'],
    ['Expired', expired, HistoryIcon, 'bg-slate-100 text-slate-600'],
    ['Free left', usage.remaining, ShieldCheck, 'bg-sky-50 text-sky-600'],
  ] as const;
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-violet-700 to-sky-600 p-6 text-white shadow-xl shadow-brand-700/15 sm:p-7">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">Campus access workspace</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Welcome, {user.full_name.split(' ')[0]} 👋</h1><p className="mt-1 text-sm text-white/75">Manage tokens, visitors and secure campus access from one place.</p></div>
        <Link to="/request-token" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-lg transition hover:-translate-y-0.5"><Plus size={17}/> Create Token</Link>
      </div>
    </section>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map(([label,value,Icon,tone]) => <div key={label} className="kpi"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19}/></div><p className="mt-4 text-3xl font-extrabold text-slate-950">{loading ? '—' : value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="card overflow-hidden"><div className="flex items-center justify-between border-b px-5 py-4 sm:px-6"><div><h2 className="text-base font-extrabold text-slate-950">Recent Tokens</h2><p className="mt-0.5 text-xs text-slate-500">Live view of your latest access requests.</p></div><Link to="/my-tokens" className="text-sm font-bold text-brand-600 hover:text-brand-700">View all <ArrowRight className="inline" size={14}/></Link></div>{latest.length === 0 ? <div className="px-6 py-14 text-center"><Ticket className="mx-auto text-slate-300" size={34}/><p className="mt-3 font-bold text-slate-700">No tokens yet</p><Link to="/request-token" className="btn-primary mt-4">Generate your first token</Link></div> : <div className="divide-y">{latest.map(t => <Link key={t.id} to={`/tokens/${t.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Ticket size={17}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{t.visitor_name}</p><p className="truncate text-xs text-slate-500">{t.token_id} · {ENTRY_TYPE_LABEL[t.entry_type]} · {formatDate(t.date)}</p></div><StatusBadge status={t.status}/><ArrowRight size={16} className="shrink-0 text-slate-300"/></Link>)}</div>}</section>
      <aside className="space-y-4"><div className="card-pad"><div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-slate-900">Free token quota</h2><ShieldCheck className="text-brand-600" size={19}/></div><p className="mt-3 text-4xl font-extrabold text-slate-950">{usage.remaining}<span className="ml-1 text-sm font-semibold text-slate-400">left</span></p><p className="mt-2 text-xs leading-5 text-slate-500">Two eligible requests are free each semester. Extra requests use the ₹{EXTRA_TOKEN_FEE} payment flow.</p>{usage.remaining === 0 && <Link to="/request-token" className="btn-secondary mt-4 w-full">Request Extra Token · ₹{EXTRA_TOKEN_FEE}</Link>}</div><Link to="/profile" className="card block p-5 hover:shadow-lg"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><UserRoundCheck size={20}/></span><div><p className="text-sm font-extrabold text-slate-900">Complete your profile</p><p className="mt-1 text-xs text-slate-500">Keep your campus profile up to date.</p></div></div></Link><Link to="/feedback" className="card block p-5 hover:shadow-lg"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><MessageSquare size={19}/></span><div><p className="text-sm font-extrabold text-slate-900">Feedback & Support</p><p className="mt-1 text-xs text-slate-500">Report a problem or suggestion.</p></div></div></Link></aside>
    </div>
    <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-extrabold text-slate-950">Quick Actions</h2><p className="text-xs text-slate-500">Common campus access tasks.</p></div></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{[["/request-token","Generate Token",ClipboardList],["/my-tokens","View Tokens",Ticket],["/history","View History",HistoryIcon],["/profile","My Profile",UserIcon],["/feedback","Get Support",MessageSquare]].map(([to,label,Icon]) => <Link key={String(to)} to={String(to)} className="card p-4 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={19}/></span><p className="mt-3 text-sm font-bold text-slate-800">{String(label)}</p><span className="mt-1 text-xs font-semibold text-brand-600">Open →</span></Link>)}</div></section>
  </div>;
}
