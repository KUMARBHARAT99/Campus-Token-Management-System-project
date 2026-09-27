import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Download, RotateCcw, ShieldCheck, Ticket, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSupabase } from '@/services/supabaseClient';
import { CAMPUS_LOCATIONS, ENTRY_TYPE_LABEL } from '@/config/constants';
import { downloadText, formatDate, formatTime, isValidMobile, todayISO } from '@/utils';
import { useToast } from '@/components/Toast';

const GUEST_TYPES = [
  ['visitor', 'Visitor'],
  ['parent_guardian', 'Parent / Guardian'],
  ['external_faculty', 'External Faculty / Company'],
  ['maintenance', 'Maintenance / Service'],
  ['delivery', 'Delivery / Vendor'],
  ['event', 'Event / Seminar'],
  ['vehicle_parking', 'Temporary Vehicle / Parking'],
  ['other_authorized', 'Other Authorized Access'],
] as const;

type GuestToken = {
  id: string; token_id: string; user_id: string | null; role: 'other'; entry_type: string; request_type: string;
  visitor_name: string; visitor_mobile: string; organization: string | null; purpose: string; date: string;
  entry_time: string; exit_time: string; location: string; vehicle_number: string | null; student_name: string | null;
  face_image_path: string | null; face_image_url?: string | null; status: string; token_kind: string; created_at: string;
};

export function TemporaryGuestTokenPage() {
  const { tokenId } = useParams<{ tokenId?: string }>();
  if (tokenId) return <TemporaryGuestTokenDetails tokenId={tokenId} />;
  return <TemporaryGuestTokenForm />;
}

function TemporaryGuestTokenForm() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [form, setForm] = useState({ name: '', mobile: '', type: 'visitor', purpose: '', customPurpose: '', host: '', organization: '', date: todayISO(), entry: '09:00', exit: '17:00', location: CAMPUS_LOCATIONS[0], customLocation: '', vehicle: '' });
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [loading, setLoading] = useState(false);

  const stopCamera = useCallback(() => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; }, []);
  const startCamera = useCallback(async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError('Camera access is not supported by this browser.'); return; }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCameraError('Camera permission was denied or the camera is unavailable. Please allow camera access and try again.'); }
  }, [stopCamera]);

  useEffect(() => { void startCamera(); return stopCamera; }, [startCamera, stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) { setCameraError('Camera is not ready yet. Please wait a moment.'); return; }
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 720;
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, Math.max(0, (video.videoWidth - size) / 2), Math.max(0, (video.videoHeight - size) / 2), size, size, 0, 0, size, size);
    setCaptured(canvas.toDataURL('image/jpeg', 0.82));
    stopCamera();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return notify('Please enter the guest name.', 'error');
    if (!isValidMobile(form.mobile)) return notify('Enter a valid 10-digit Indian mobile number.', 'error');
    const effectivePurpose = form.purpose === 'Other' ? form.customPurpose.trim() : form.purpose.trim();
    const effectiveLocation = form.location === 'Other' ? form.customLocation.trim() : form.location.trim();
    if (!effectivePurpose || !form.host.trim()) return notify('Please select/enter the purpose and person to visit.', 'error');
    if (!effectiveLocation) return notify('Select or enter the campus location.', 'error');
    if (!form.date || form.date < todayISO()) return notify('Visit date cannot be in the past.', 'error');
    if (form.entry >= form.exit) return notify('Valid until time must be after entry time.', 'error');
    if (!captured) return notify('Face capture is required before generating the token.', 'error');
    setLoading(true);
    try {
      const { data, error } = await getSupabase().functions.invoke('create-temporary-guest-token', {
        body: {
          visitor_name: form.name.trim(), visitor_mobile: form.mobile, guest_type: form.type, purpose: effectivePurpose,
          host: form.host.trim(), organization: form.organization.trim() || null, date: form.date, entry_time: form.entry,
          exit_time: form.exit, location: effectiveLocation, vehicle_number: form.vehicle.trim() || null, face_image_base64: captured,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.token_id) throw new Error(data?.error || 'Temporary token could not be created.');
      notify('Temporary guest token created successfully.');
      navigate(`/temporary-guest-token/${encodeURIComponent(data.token_id)}`, { replace: true });
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to create temporary guest token.', 'error');
      void startCamera();
    } finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600"><ArrowLeft size={16}/> Back to home</Link>
      <div className="mb-6 rounded-3xl bg-purple-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600"><Ticket size={24}/></span><div><p className="text-xs font-bold uppercase tracking-widest text-purple-300">No login required</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Temporary Guest Token</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Fill a few details, capture your face and generate a time-limited campus entry token.</p></div></div>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <section className="card-pad"><h2 className="text-base font-bold text-ink-800">Guest details</h2><p className="mt-1 text-xs text-ink-500">Select common options to keep the form quick.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Guest Name *"><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/></Field>
          <Field label="Mobile *"><input className="input" inputMode="numeric" maxLength={10} value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="10-digit mobile"/></Field>
          <Field label="Guest Type *"><select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{GUEST_TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Person to Visit *"><input className="input" value={form.host} onChange={e=>setForm({...form,host:e.target.value})} placeholder="Host / faculty / staff"/></Field>
          <Field label="Purpose *"><select className="input" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}><option value="">Select purpose</option><option>Meeting</option><option>Academic Visit</option><option>Parent Visit</option><option>Delivery / Service</option><option>Event / Seminar</option><option>Official Work</option><option>Other</option></select>{form.purpose==='Other'&&<input className="input mt-2" value={form.customPurpose} onChange={e=>setForm({...form,customPurpose:e.target.value})} placeholder="Enter purpose"/>}</Field>
          <Field label="Organization (optional)"><input className="input" value={form.organization} onChange={e=>setForm({...form,organization:e.target.value})} placeholder="Company / organization"/></Field>
          <Field label="Visit Date *"><input type="date" min={todayISO()} className="input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field>
          <Field label="Campus Location *"><select className="input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>{CAMPUS_LOCATIONS.slice(0,5).map(x=><option key={x}>{x}</option>)}<option>Other</option></select>{form.location==='Other'&&<input className="input mt-2" value={form.customLocation} onChange={e=>setForm({...form,customLocation:e.target.value})} placeholder="Enter campus location"/>}</Field>
          <Field label="Entry Time *"><input type="time" className="input" value={form.entry} onChange={e=>setForm({...form,entry:e.target.value})}/></Field>
          <Field label="Valid Until *"><input type="time" className="input" value={form.exit} onChange={e=>setForm({...form,exit:e.target.value})}/></Field>
          <Field label="Vehicle Number (optional)"><input className="input" value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value.toUpperCase()})} placeholder="e.g. GJ01AB1234"/></Field>
        </div></section>
        <section className="card-pad"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-ink-800">Required face capture</h2><p className="mt-1 text-xs leading-5 text-ink-500">Your token is generated only after a successful face capture. The image is stored for entry/audit purposes only.</p></div><ShieldCheck className="shrink-0 text-purple-600" size={21}/></div><div className="mt-4 overflow-hidden rounded-2xl bg-slate-950"><div className="relative aspect-square sm:aspect-[4/3]">{captured?<img src={captured} alt="Captured guest face" className="h-full w-full object-cover"/>:<video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover"/>}{!captured&&<div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-56 w-44 rounded-[45%] border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.28)]"/></div>}</div></div>{cameraError&&<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{cameraError}</div>}<div className="mt-4 grid gap-3 sm:grid-cols-3"><button type="button" onClick={capture} disabled={Boolean(captured)} className="btn-primary"><Camera size={17}/> Capture Face</button><button type="button" onClick={()=>{setCaptured(null);void startCamera();}} className="btn-secondary"><RotateCcw size={17}/> Retake</button><div className="flex items-center justify-center rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700">{captured?<><CheckCircle2 size={15}/> Capture ready</>:<>Camera required</>}</div></div></section>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to="/" className="btn-secondary">Cancel</Link><button disabled={loading || !captured} className="btn-primary">{loading?'Generating…':'Generate Temporary Token'}</button></div>
        <p className="text-center text-xs leading-5 text-slate-400">No login • No email • No SMS • Token expires automatically after its validity time.</p>
      </form>
    </div>
  </main>;
}

function TemporaryGuestTokenDetails({ tokenId }: { tokenId: string }) {
  const { notify } = useToast();
  const [token, setToken] = useState<GuestToken | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    void getSupabase().functions.invoke('verify-token', { body: { token_id: tokenId.trim().toUpperCase() } }).then(({data,error})=>{
      if(error) throw error; if(!data?.request) throw new Error('Token not found.'); if(mounted) setToken(data.request as GuestToken);
    }).catch(error=>{ if(mounted) notify(error instanceof Error?error.message:'Unable to load token.','error'); }).finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  }, [tokenId, notify]);
  if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="card p-8 text-center">Loading temporary token…</div></main>;
  if(!token)return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="card max-w-md p-8 text-center"><XCircle className="mx-auto text-red-500" size={38}/><h1 className="mt-3 text-xl font-bold">Token not found</h1><Link to="/temporary-guest-token" className="btn-primary mt-5">Create New Token</Link></div></main>;
  const download=()=>{downloadText(`${token.token_id}.txt`,`SMART CAMPUS - TEMPORARY GUEST TOKEN\n${'='.repeat(42)}\nToken ID: ${token.token_id}\nGuest: ${token.visitor_name}\nMobile: ${token.visitor_mobile}\nType: ${token.entry_type}\nPurpose: ${token.purpose}\nHost: ${token.student_name || '—'}\nDate: ${formatDate(token.date)}\nValid: ${formatTime(token.entry_time)} - ${formatTime(token.exit_time)}\nLocation: ${token.location}\nStatus: ${token.status.toUpperCase()}\n\nPlease present this QR code to an authorized Admin or Security Guard to activate your campus entry.`);notify('Token details downloaded.');};
  const active = token.status==='active';
  const expired = token.status==='expired';
  return <main className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-2xl"><Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600"><ArrowLeft size={16}/> Smart Campus Home</Link><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"><div className="bg-purple-950 p-6 text-white sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-purple-300">Temporary Guest Token</p><h1 className="mt-2 text-2xl font-extrabold break-all">{token.token_id}</h1></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${active?'bg-emerald-500 text-white':expired?'bg-slate-500 text-white':'bg-amber-400 text-slate-950'}`}>{token.status.toUpperCase()}</span></div></div><div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-7"><div className="grid gap-3 sm:grid-cols-2"><Info label="Guest" value={token.visitor_name}/><Info label="Mobile" value={token.visitor_mobile}/><Info label="Type" value={ENTRY_TYPE_LABEL[token.entry_type as keyof typeof ENTRY_TYPE_LABEL] || token.entry_type}/><Info label="Purpose" value={token.purpose}/><Info label="Host" value={token.student_name||'—'}/><Info label="Date" value={formatDate(token.date)}/><Info label="Valid From" value={formatTime(token.entry_time)}/><Info label="Valid Until" value={formatTime(token.exit_time)}/><Info label="Location" value={token.location}/></div><div className="flex flex-col items-center gap-3"><img src={`https://quickchart.io/qr?text=${encodeURIComponent(`${window.location.origin}/verify/${encodeURIComponent(token.token_id)}`)}&size=190&margin=2&ecLevel=H`} alt="Temporary guest token QR" className="h-48 w-48 rounded-xl border bg-white p-2"/>{token.face_image_url&&<img src={token.face_image_url} alt="Guest face" className="h-28 w-24 rounded-xl object-cover"/>}</div></div><div className="mx-5 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-900 sm:mx-7"><strong>{active?'Entry is activated.':'Entry activation required.'}</strong><p className="mt-1 text-xs leading-5">{expired?'This token has expired.':active?'Authorized campus staff can continue to record additional scans at approved locations.':'Please present this QR code to an authorized Admin or Security Guard to activate your campus entry.'}</p></div><div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:p-7"><button onClick={download} className="btn-secondary w-full"><Download size={16}/> Download Token</button><button onClick={()=>window.print()} className="btn-secondary w-full">Print Token</button></div></div></div></main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="label">{label}</label>{children}</div>}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800 break-words">{value}</p></div>}
