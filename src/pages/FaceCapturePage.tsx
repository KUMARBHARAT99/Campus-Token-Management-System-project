import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Image as ImageIcon, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { tokenService } from '@/services/tokenService';
import { Spinner } from '@/components/Spinner';

export function FaceCapturePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [request, setRequest] = useState<import('@/types').TokenRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    void tokenService.getById(id).then((value) => {
      setRequest(value);
      if (value?.face_image_path) setSaved(true);
    }).catch((error) => notify(error instanceof Error ? error.message : 'Unable to load token.', 'error')).finally(() => setLoading(false));
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [id, notify]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError('Camera permission was denied or the camera is unavailable. You can continue without a face capture and add it later from this token.');
    }
  }, []);

  useEffect(() => { void startCamera(); return () => streamRef.current?.getTracks().forEach((track) => track.stop()); }, [startCamera]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) { setCameraError('Camera is not ready yet. Please wait a moment.'); return; }
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 720;
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return;
    const sx = Math.max(0, (video.videoWidth - size) / 2);
    const sy = Math.max(0, (video.videoHeight - size) / 2);
    context.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    setCaptured(canvas.toDataURL('image/jpeg', 0.86));
  };

  const save = async () => {
    if (!user || !request || !captured) return;
    setSaving(true);
    try {
      const response = await fetch(captured);
      const blob = await response.blob();
      const path = `${user.id}/${request.id}/${crypto.randomUUID()}.jpg`;
      const { supabase } = await import('@/config/supabase');
      const { error } = await supabase.storage.from('token-faces').upload(path, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '3600' });
      if (error) throw new Error(error.message);
      try {
        const updated = await tokenService.attachFaceImage(user.id, request.id, path);
        setRequest(updated); setSaved(true); setCaptured(null);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        notify('Face image saved. Opening your token details…');
        navigate(`/tokens/${request.id}`, { replace: true });
      } catch (attachError) {
        // Avoid leaving an orphaned private storage object when the database
        // attachment fails after the upload succeeds.
        await supabase.storage.from('token-faces').remove([path]).catch(() => undefined);
        throw attachError;
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save face image.', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center"><Spinner /></div>;
  if (!request) return <div className="card p-8 text-center"><XCircle className="mx-auto text-red-500"/><p className="mt-3 font-semibold">Token request not found.</p><Link to="/my-tokens" className="btn-primary mt-4">Back to My Tokens</Link></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(`/tokens/${request.id}`)} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-brand-600"><ArrowLeft size={16}/> Back to token</button>
      <div className="card-pad">
        <div className="flex items-start justify-between gap-4">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700"><ShieldCheck size={14}/> Face capture</div><h1 className="mt-3 text-2xl font-bold text-ink-800">Capture face photo</h1><p className="mt-1 text-sm text-ink-500">Token <span className="font-mono font-semibold">{request.token_id}</span> • capture only, no face recognition.</p></div>
          {saved && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> Saved</span>}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-purple-950">
          <div className="relative aspect-square sm:aspect-[4/3]">
            {captured ? <img src={captured} alt="Captured face preview" className="h-full w-full object-cover"/> : <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover"/>}
            {!captured && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-56 w-44 rounded-[45%] border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.28)]"/></div>}
            <div className="absolute left-3 right-3 top-3 flex items-center justify-between"><span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">Center your face</span><span className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white">Camera</span></div>
          </div>
        </div>

        {cameraError && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">{cameraError}</div>}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={capture} disabled={Boolean(captured)} className="btn-primary"><Camera size={17}/> Capture Photo</button>
          <button type="button" onClick={() => { setCaptured(null); void startCamera(); }} className="btn-secondary"><RotateCcw size={17}/> Retake</button>
          <button type="button" onClick={() => void save()} disabled={!captured || saving} className="btn-secondary">{saving ? <Spinner size={17}/> : <ImageIcon size={17}/>} {saving ? 'Saving…' : 'Confirm & Save'}</button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          <strong className="text-slate-700">Privacy note:</strong> this version stores a face image for request/audit purposes only. It does not identify, match, or compare faces. Recognition can be enabled later when a student database is available.
        </div>
        <button type="button" onClick={() => navigate(`/tokens/${request.id}`)} className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-purple-600">Continue without capture for now</button>
      </div>
    </div>
  );
}
