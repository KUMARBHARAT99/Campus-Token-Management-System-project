import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, ShieldAlert, Users as UsersIcon, X } from 'lucide-react';
import { PageHeader } from '@/layouts/DashboardLayout';
import { EmptyState } from '@/components/EmptyState';
import { userService } from '@/services/userService';
import { ROLE_LABEL } from '@/config/constants';
import { formatDateTime } from '@/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import type { User } from '@/types';

export function AdminUsersPage() {
  const { user: admin } = useAuth();
  const { notify } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    setLoading(true);
    try { setUsers(await userService.getAllUsers()); }
    catch (error) { notify(error instanceof Error ? error.message : 'Unable to load users.', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try { setUsers(await userService.getAllUsers()); }
      catch (error) { notify(error instanceof Error ? error.message : 'Unable to load users.', 'error'); }
      finally { setLoading(false); }
    })();
  }, [notify]);

  const filtered = useMemo(() => users.filter((item) => filter === 'all' || item.account_status === filter || (filter === 'pending' && item.account_status === 'pending_approval')), [users, filter]);

  const approve = async (id: string) => {
    if (!admin || admin.role !== 'admin') return notify('Only an administrator can approve accounts.', 'error');
    setActionId(id);
    try { await userService.approveUser(id); notify('Account approved.'); await load(); }
    catch (error) { notify(error instanceof Error ? error.message : 'Approval failed.', 'error'); }
    finally { setActionId(''); }
  };
  const reject = async (id: string) => {
    if (!admin || admin.role !== 'admin') return notify('Only an administrator can reject accounts.', 'error');
    const reason = window.prompt('Optional rejection reason:') ?? '';
    setActionId(id);
    try { await userService.rejectUser(id, reason); notify('Account rejected.'); await load(); }
    catch (error) { notify(error instanceof Error ? error.message : 'Rejection failed.', 'error'); }
    finally { setActionId(''); }
  };

  return <div>
    <PageHeader title="User Approval" subtitle="Only first-time Student and Faculty/Staff accounts require Admin approval." />
    <div className="mb-5 flex flex-wrap gap-2">{(['pending','approved','rejected','all'] as const).map(value=><button key={value} onClick={()=>setFilter(value)} className={`rounded-lg border px-3.5 py-2 text-sm font-semibold ${filter===value?'border-brand-600 bg-brand-600 text-white':'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'}`}>{value==='pending'?'Pending':value==='approved'?'Approved':value==='rejected'?'Rejected':'All'} {value==='pending' && `(${users.filter(u=>u.account_status==='pending'||u.account_status==='pending_approval').length})`}</button>)}</div>
    <div className="card overflow-hidden">
      {loading ? <div className="p-10 text-center text-sm text-ink-500">Loading users…</div> : filtered.length===0 ? <EmptyState icon={<UsersIcon size={22}/>} title="No users in this view" description="New registration requests will appear here."/> : <div className="divide-y divide-ink-200">
        {filtered.map((u)=><div key={u.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink-800">{u.full_name}</p><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${u.account_status==='approved'||u.account_status==='active'?'border-emerald-200 bg-emerald-50 text-emerald-700':u.account_status==='rejected'?'border-red-200 bg-red-50 text-red-700':'border-amber-200 bg-amber-50 text-amber-700'}`}>{u.account_status==='pending_approval'?'PENDING APPROVAL':(u.account_status||'pending').toUpperCase()}</span></div><p className="mt-1 text-sm text-ink-500">{u.email} · {u.mobile || 'No mobile'}</p><div className="mt-3 grid gap-2 text-xs text-ink-500 sm:grid-cols-2 lg:grid-cols-4"><span>Role: <strong className="text-ink-700">{ROLE_LABEL[u.role]}</strong></span><span>Requested: <strong className="text-ink-700">{u.requested_role ? ROLE_LABEL[u.requested_role] : '—'}</strong></span><span>ID: <strong className="text-ink-700">{u.student_id || u.staff_id || '—'}</strong></span><span>Joined: <strong className="text-ink-700">{formatDateTime(u.created_at)}</strong></span></div>{u.department && <p className="mt-2 text-xs text-ink-500">Department: {u.department}{u.designation ? ` · ${u.designation}` : ''}{u.organization ? ` · ${u.organization}` : ''}</p>}</div>
        {admin?.role==='admin' && (u.account_status==='pending'||u.account_status==='pending_approval') && (u.role==='student'||u.role==='staff') && u.id!==admin.id && <div className="flex shrink-0 gap-2"><button disabled={actionId===u.id} onClick={()=>void approve(u.id)} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700"><Check size={16}/> Approve</button><button disabled={actionId===u.id} onClick={()=>void reject(u.id)} className="btn-danger"><X size={16}/> Reject</button></div>}
        {u.requested_role==='admin' && <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><ShieldAlert size={15}/> Admin access was requested, but this account is NOT granted admin privileges.</div>}
        </div></div>)}</div>}
    </div>
    <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 text-xs leading-5 text-purple-800"><Clock3 size={14} className="mr-1 inline"/> Approval changes are protected by Supabase database functions. Frontend role selection cannot create an administrator.</div>
  </div>;
}
