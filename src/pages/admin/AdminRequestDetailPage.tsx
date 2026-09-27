import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Download, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/layouts/DashboardLayout';
import { TokenCard } from '@/components/TokenCard';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { tokenService } from '@/services/tokenService';
import { userService } from '@/services/userService';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import { FaceImage } from '@/components/FaceImage';
import { formatDate, formatDateTime, formatTime, downloadText } from '@/utils';
import { useToast } from '@/components/Toast';

export function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [request, setRequest] = useState<import('@/types').TokenRequest>();
  const [requester, setRequester] = useState<import('@/types').User>();
  const [history, setHistory] = useState<import('@/types').TokenHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ purpose: '', location: '', date: '', exit_time: '', student_name: '', notes: '' });

  const load = useCallback(async () => {
    if (!id) return;
    const r = await tokenService.getById(id);
    setRequest(r);
    if (r) {
      const [users, h] = await Promise.all([userService.getAllUsers(), tokenService.getHistoryByToken(r.token_id)]);
      setRequester(r.user_id ? users.find((u) => u.id === r.user_id) : undefined);
      setHistory(h);
      setForm({ purpose: r.purpose, location: r.location, date: r.date, exit_time: r.exit_time, student_name: r.student_name || '', notes: r.notes || '' });
    }
  }, [id]);

  useEffect(() => { void load().finally(() => setLoading(false)); }, [load]);

  if (loading) return <div className="p-8 text-center text-sm text-ink-500">Loading token…</div>;
  if (!request) return <div><Link to="/admin/requests" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-500"><ArrowLeft size={16}/> Back</Link><div className="card"><EmptyState icon={<ClipboardList size={22}/>} title="Token not found"/></div></div>;

  const isAdmin = user?.role === 'admin';
  const canDelete = isAdmin;
  const save = async () => {
    if (!user || !isAdmin) return;
    if (!form.purpose.trim() || !form.location.trim()) { notify('Purpose and location are required.', 'error'); return; }
    if (form.exit_time <= request.entry_time) { notify('Valid until time must be after entry time.', 'error'); return; }
    setSaving(true);
    try { const updated = await tokenService.adminUpdateToken(request.id, form, user); setRequest(updated); setEditing(false); await load(); notify('Token details updated.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Unable to update token.', 'error'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!user || !isAdmin) return;
    if (!window.confirm(`Delete token ${request.token_id}? Tokens with scan history cannot be permanently deleted.`)) return;
    setDeleting(true);
    try { await tokenService.adminDeleteToken(request.id, user); notify('Token deleted.'); navigate('/admin/requests', { replace: true }); }
    catch (error) { notify(error instanceof Error ? error.message : 'Unable to delete token.', 'error'); }
    finally { setDeleting(false); }
  };
  const download = () => { downloadText(`${request.token_id}.txt`, `SMART CAMPUS TOKEN\nToken ID: ${request.token_id}\nVisitor: ${request.visitor_name}\nType: ${ENTRY_TYPE_LABEL[request.entry_type]}\nPurpose: ${request.purpose}\nDate: ${formatDate(request.date)}\nEntry: ${formatTime(request.entry_time)}\nValid Until: ${formatTime(request.exit_time)}\nLocation: ${request.location}\nStatus: ${request.status.toUpperCase()}`); notify('Token details downloaded.'); };

  return <div>
    <Link to="/admin/requests" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500"><ArrowLeft size={16}/> Back to Token Monitoring</Link>
    <PageHeader title={`Token: ${request.token_id}`} subtitle={`${request.visitor_name} · ${ENTRY_TYPE_LABEL[request.entry_type]}`} action={<StatusBadge status={request.status}/>} />
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5"><TokenCard request={request}/><div className="card-pad"><h3 className="mb-3 text-sm font-semibold">Requester & Visit Details</h3>{editing ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Purpose"><input className="input" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}/></Field><Field label="Location"><input className="input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></Field><Field label="Date"><input type="date" className="input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Valid Until"><input type="time" className="input" value={form.exit_time} onChange={e=>setForm({...form,exit_time:e.target.value})}/></Field><Field label="Host / Student"><input className="input" value={form.student_name} onChange={e=>setForm({...form,student_name:e.target.value})}/></Field><Field label="Notes"><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Field><div className="flex gap-2 sm:col-span-2"><button onClick={()=>void save()} disabled={saving} className="btn-primary">{saving?'Saving…':'Save Changes'}</button><button onClick={()=>setEditing(false)} className="btn-secondary">Cancel</button></div></div> : <dl className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Requested By" value={requester?.full_name ?? (request.token_kind === 'temporary_guest' ? 'Temporary Guest' : '—')}/><Detail label="Requester Email" value={requester?.email ?? '—'}/><Detail label="Purpose" value={request.purpose}/><Detail label="Visitor Mobile" value={request.visitor_mobile}/><Detail label="Date" value={formatDate(request.date)}/><Detail label="Entry / Exit" value={`${formatTime(request.entry_time)} – ${formatTime(request.exit_time)}`}/><Detail label="Location" value={request.location}/>{request.vehicle_number&&<Detail label="Vehicle" value={request.vehicle_number}/>}<Detail label="Submitted" value={formatDateTime(request.created_at)}/></dl>}</div><div className="card-pad"><h3 className="mb-3 text-sm font-semibold">Face Capture</h3><div className="flex items-center gap-4"><FaceImage userId={request.user_id} path={request.face_image_path}/><div><p className="text-sm font-semibold">{request.face_image_path?'Captured':'Not captured'}</p><p className="mt-1 text-xs leading-5 text-ink-500">Audit photo only. No face recognition or matching is performed.</p></div></div></div></div>
      <div className="space-y-5"><div className="card-pad"><h3 className="mb-2 text-sm font-semibold">Campus workflow</h3><p className="text-sm text-ink-600">Tokens do not require individual Admin approval. A valid token becomes active when an authorized Admin or Security Guard scans it and records the entry location.</p>{['pending','active','approved'].includes(request.status)&&<Link to={`/admin/verification?token=${request.token_id}`} className="btn-primary mt-4 w-full">Open Verification</Link>}{request.payment_amount>0&&!request.paid&&<div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Waiting for ₹{request.payment_amount} demo payment from the requester.</div>}</div><div className="card-pad"><h3 className="mb-3 text-sm font-semibold">Admin Controls</h3><div className="space-y-2"><button onClick={download} className="btn-secondary w-full"><Download size={16}/> Download Token</button>{isAdmin&&<button onClick={()=>setEditing(true)} className="btn-secondary w-full"><Edit3 size={16}/> Edit Token Details</button>}{canDelete&&<button onClick={()=>void remove()} disabled={deleting} className="btn-danger w-full"><Trash2 size={16}/>{deleting?'Deleting…':'Delete Token'}</button>}</div><p className="mt-3 text-[11px] leading-5 text-ink-400">Historical scan records cannot be edited. A token with scan history is protected from permanent deletion.</p></div><div className="card-pad"><h3 className="mb-3 text-sm font-semibold">Activity Timeline</h3><ol className="space-y-3 border-l border-ink-200 pl-4">{history.length===0?<li className="text-sm text-ink-500">No activity recorded.</li>:history.map(h=><li key={h.id}><p className="text-sm font-medium">{h.action}</p><p className="text-xs text-ink-400">{formatDateTime(h.timestamp)} · {h.action_by}</p></li>)}</ol></div></div>
    </div>
    {user?.role==='security'&&<p className="mt-5 text-xs text-ink-400">Security accounts are intended for verification and scan activity; administrative token management remains restricted.</p>}
  </div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="label">{label}</label>{children}</div>}
function Detail({label,value}:{label:string;value:string}){return <div><dt className="text-xs font-medium uppercase tracking-wider text-ink-400">{label}</dt><dd className="mt-0.5 font-medium text-ink-700">{value}</dd></div>}
