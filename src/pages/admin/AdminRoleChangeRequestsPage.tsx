import { useEffect, useState } from 'react';
import { Check, ExternalLink, RefreshCw, ShieldAlert, UserRound, X } from 'lucide-react';
import { PageHeader } from '@/layouts/DashboardLayout';
import { useToast } from '@/components/Toast';
import { getAllRoleChangeRequests, reviewRoleChangeRequest } from '@/services/roleChangeService';
import { ROLE_LABEL } from '@/config/constants';
import { getSupabase } from '@/services/supabaseClient';
import type { RoleChangeRequest, User } from '@/types';

export function AdminRoleChangeRequestsPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<RoleChangeRequest[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [requests, profiles] = await Promise.all([
        getAllRoleChangeRequests(),
        getSupabase().from('profiles').select('*'),
      ]);
      setItems(requests);
      const map: Record<string, User> = {};
      (profiles.data || []).forEach((p: Record<string, unknown>) => { map[String(p.id)] = p as unknown as User; });
      setUsers(map);
    } catch (e) { notify(e instanceof Error ? e.message : 'Unable to load role requests.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const channel = getSupabase().channel('role-change-admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_change_requests' }, () => { void load(); })
      .subscribe();
    return () => { void getSupabase().removeChannel(channel); };
  }, []);

  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    const note = window.prompt(decision === 'approved' ? 'Optional admin note:' : 'Reason for rejection (optional):') ?? '';
    setBusy(id);
    try { await reviewRoleChangeRequest(id, decision, note); notify(decision === 'approved' ? 'Role change approved.' : 'Role change rejected.'); await load(); }
    catch (e) { notify(e instanceof Error ? e.message : 'Unable to review request.', 'error'); }
    finally { setBusy(''); }
  };

  return <div>
    <PageHeader title="Role Change Requests" subtitle="Review user requests to change their campus role. Updates are recorded with an audit timestamp." action={<button onClick={() => void load()} className="btn-secondary"><RefreshCw size={16}/> Refresh</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="kpi"><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Pending</p><p className="mt-2 text-3xl font-extrabold text-ink-800">{items.filter(x=>x.status==='pending').length}</p></div>
      <div className="kpi"><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Approved</p><p className="mt-2 text-3xl font-extrabold text-emerald-600">{items.filter(x=>x.status==='approved').length}</p></div>
      <div className="kpi"><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Rejected</p><p className="mt-2 text-3xl font-extrabold text-red-600">{items.filter(x=>x.status==='rejected').length}</p></div>
    </div>
    <div className="card overflow-hidden">
      {loading ? <div className="p-10 text-center text-sm text-ink-500">Loading role requests…</div> : items.length===0 ? <div className="p-10 text-center"><UserRound className="mx-auto text-ink-300"/><p className="mt-3 font-semibold text-ink-700">No role change requests</p><p className="mt-1 text-sm text-ink-500">New requests will appear here automatically.</p></div> : <div className="divide-y divide-ink-200">
        {items.map((r) => { const u=users[r.user_id]; return <article key={r.id} className="p-5 transition hover:bg-ink-50/60">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink-800">{u?.full_name || 'Campus user'}</p><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${r.status==='pending'?'border-amber-200 bg-amber-50 text-amber-700':r.status==='approved'?'border-emerald-200 bg-emerald-50 text-emerald-700':'border-red-200 bg-red-50 text-red-700'}`}>{r.status}</span></div>
              <p className="mt-1 text-sm text-ink-500">{u?.email || 'Email unavailable'} · {u?.mobile || 'No mobile'}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Current role</p><p className="mt-1 text-sm font-semibold text-ink-700">{ROLE_LABEL[r.current_role]}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Requested role</p><p className="mt-1 text-sm font-semibold text-brand-700">{ROLE_LABEL[r.requested_role]}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Verification</p><p className="mt-1 text-sm font-semibold text-ink-700">{r.verification_method === 'college_email' ? 'College email' : r.verification_method === 'id_card' ? 'ID card' : 'Standard'}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Request date</p><p className="mt-1 text-sm font-semibold text-ink-700">{new Date(r.created_at).toLocaleString()}</p></div>
              </div>
              {r.verification_email && <p className="mt-3 text-xs text-ink-500">Verification email: <strong>{r.verification_email}</strong></p>}
              {r.reason && <p className="mt-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600"><strong>Reason:</strong> {r.reason}</p>}
              {r.id_card_image && <a href={r.id_card_image} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"><ExternalLink size={14}/> View submitted ID card</a>}
            </div>
            {r.status==='pending' && <div className="flex shrink-0 gap-2"><button disabled={busy===r.id} onClick={()=>void decide(r.id,'approved')} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700"><Check size={16}/> Approve</button><button disabled={busy===r.id} onClick={()=>void decide(r.id,'rejected')} className="btn-danger"><X size={16}/> Reject</button></div>}
          </div>
          {r.requested_role==='student' || r.requested_role==='staff' ? <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-800"><ShieldAlert size={15} className="mt-0.5 shrink-0"/> College roles require a valid <strong>@silveroakuni.ac.in</strong> email or verified ID-card evidence.</div> : null}
        </article>; })}
      </div>}
    </div>
  </div>;
}
