import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Ticket, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { PageHeader } from '@/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { tokenService } from '@/services/tokenService';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import { formatDate, formatTime, downloadText } from '@/utils';
import type { TokenRequest, TokenStatus } from '@/types';

const FILTERS: { value: 'all' | TokenStatus; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' }, { value: 'expired', label: 'Expired' }, { value: 'revoked', label: 'Cancelled' },
];

export function MyTokensPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [tokens, setTokens] = useState<TokenRequest[]>([]);
  const [filter, setFilter] = useState<'all' | TokenStatus>('all');
  const [cancelTarget, setCancelTarget] = useState<TokenRequest | null>(null);

  const load = useCallback(() => user ? tokenService.getByUser(user.id).then(setTokens).catch(e => notify(e instanceof Error ? e.message : 'Failed to load tokens.', 'error')) : Promise.resolve(), [user, notify]);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => filter === 'all' ? tokens : tokens.filter(t => t.status === filter), [tokens, filter]);
  const download = (t: TokenRequest) => { downloadText(`${t.token_id}.txt`, `SMART CAMPUS TOKEN\nToken ID: ${t.token_id}\nVisitor: ${t.visitor_name}\nMobile: ${t.visitor_mobile}\nEntry Type: ${ENTRY_TYPE_LABEL[t.entry_type]}\nPurpose: ${t.purpose}\nDate: ${formatDate(t.date)}\nEntry: ${formatTime(t.entry_time)}\nValid Until: ${formatTime(t.exit_time)}\nLocation: ${t.location}\nStatus: ${t.status.toUpperCase()}`); notify('Token details downloaded.'); };
  const cancel = async () => { if (!user || !cancelTarget) return; try { await tokenService.cancel(cancelTarget.id, user); await load(); notify('Token cancelled.'); setCancelTarget(null); } catch (e) { notify(e instanceof Error ? e.message : 'Cancel failed.', 'error'); } };

  return <div>
    <Link to="/dashboard" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600"><ArrowLeft size={16}/> Back to dashboard</Link>
    <PageHeader title="My Tokens" subtitle="All your campus access token requests." />
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{FILTERS.map(f => <button key={f.value} onClick={() => setFilter(f.value)} className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium ${filter === f.value ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600'}`}>{f.label}</button>)}</div>
    <div className="card overflow-hidden">
      {filtered.length === 0 ? <EmptyState icon={<Ticket size={22}/>} title="No tokens found" description={filter === 'all' ? 'You have not requested any tokens yet.' : `No ${filter} tokens.`} action={<Link to="/request-token" className="btn-primary">Request a Token</Link>}/> : <>
        <table className="hidden w-full text-sm md:table"><thead><tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider"><th className="px-5 py-3">Token ID</th><th className="px-5 py-3">Visitor</th><th className="px-5 py-3">Entry Type</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-ink-200">{filtered.map(t=><tr key={t.id} className="hover:bg-ink-50"><td className="px-5 py-3 font-mono text-xs">{t.token_id}</td><td className="px-5 py-3 font-medium">{t.visitor_name}</td><td className="px-5 py-3">{ENTRY_TYPE_LABEL[t.entry_type]}</td><td className="px-5 py-3">{formatDate(t.date)}</td><td className="px-5 py-3"><StatusBadge status={t.status}/></td><td className="px-5 py-3"><div className="flex justify-end gap-2"><Link aria-label="View token" to={`/tokens/${t.id}`} className="rounded-lg border border-ink-200 p-2 text-brand-600 hover:bg-brand-50"><Eye size={16}/></Link><button aria-label="Download token" onClick={()=>download(t)} className="rounded-lg border border-ink-200 p-2"><Download size={16}/></button>{['pending','active','approved'].includes(t.status)&&<button aria-label="Cancel token" onClick={()=>setCancelTarget(t)} className="rounded-lg border border-red-100 p-2 text-red-500"><X size={16}/></button>}</div></td></tr>)}</tbody></table>
        <div className="divide-y divide-ink-200 md:hidden">{filtered.map(t=><Link key={t.id} to={`/tokens/${t.id}`} className="block p-4 transition active:bg-brand-50/50 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Ticket size={18}/></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="break-all font-mono text-xs font-bold text-ink-800">{t.token_id}</p><StatusBadge status={t.status}/></div><div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-500"><span>Visitor: <strong className="text-ink-700">{t.visitor_name}</strong></span><span>Type: <strong className="text-ink-700">{ENTRY_TYPE_LABEL[t.entry_type]}</strong></span><span>Date: <strong className="text-ink-700">{formatDate(t.date)}</strong></span><span>Until: <strong className="text-ink-700">{formatTime(t.exit_time)}</strong></span></div><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-brand-600">View Token →</span><span className="text-[10px] text-ink-400">Tap anywhere to open</span></div></div></div></Link>)}</div>
      </>}
    </div>
    <Modal open={!!cancelTarget} onClose={()=>setCancelTarget(null)} title="Cancel Request" size="sm" footer={<><button onClick={()=>setCancelTarget(null)} className="btn-secondary">Keep</button><button onClick={cancel} className="btn-danger">Yes, cancel</button></>}><p className="text-sm">Cancel request for <strong>{cancelTarget?.visitor_name}</strong> ({cancelTarget?.token_id})?</p></Modal>
  </div>;
}
