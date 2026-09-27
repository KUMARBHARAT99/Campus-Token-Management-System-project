import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getSupabase } from '@/services/supabaseClient';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import type { TokenRequest } from '@/types';
import { formatDate, formatTime } from '@/utils';

export function PublicTokenVerificationPage() {
  const { tokenId = '' } = useParams<{ tokenId: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<TokenRequest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const supabase = getSupabase();
        const { data, error: rpcError } = await supabase.functions.invoke('verify-token', {
          body: { token_id: tokenId.trim().toUpperCase() },
        });
        if (rpcError) throw rpcError;
        if (!data?.request) throw new Error('Token not found.');
        if (mounted) setRequest(data.request as TokenRequest);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to verify token.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (tokenId) void run(); else setLoading(false);
    return () => { mounted = false; };
  }, [tokenId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-50 p-5">
        <div className="card w-full max-w-md p-8 text-center">
          <Clock3 className="mx-auto h-8 w-8 animate-pulse text-brand-600" />
          <p className="mt-3 text-sm font-semibold text-ink-800">Checking token…</p>
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-50 p-5">
        <div className="card w-full max-w-md p-7 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-xl font-bold text-ink-900">Token not verified</h1>
          <p className="mt-2 text-sm text-ink-500">{error || 'This token does not exist.'}</p>
        </div>
      </main>
    );
  }

  const valid = request.status === 'active' || request.status === 'approved';
  const inactive = request.status === 'pending';
  const used = request.status === 'used';
  const expired = request.status === 'expired';

  return (
    <main className="min-h-screen bg-ink-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-cardHover">
        <div className={`p-6 text-white ${valid ? 'bg-emerald-600' : inactive ? 'bg-amber-500' : used ? 'bg-ink-700' : 'bg-red-600'}`}>
          <div className="flex items-center gap-3">
            {valid ? <ShieldCheck size={30} /> : inactive ? <ShieldAlert size={30} /> : used ? <CheckCircle2 size={30} /> : <ShieldAlert size={30} />}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Smart Campus</p>
              <h1 className="text-2xl font-extrabold">
                {valid ? 'TOKEN ACTIVE' : inactive ? 'TOKEN NOT ACTIVE' : used ? 'TOKEN ALREADY USED' : expired ? 'TOKEN EXPIRED' : `TOKEN ${request.status.toUpperCase()}`}
              </h1>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
          <Info label="Token ID" value={request.token_id} mono />
          <Info label="Visitor" value={request.visitor_name} />
          <Info label="Access Type" value={ENTRY_TYPE_LABEL[request.entry_type] || request.entry_type} />
          <Info label="Purpose" value={request.purpose} />
          <Info label="Date" value={formatDate(request.date)} />
          <Info label="Entry" value={formatTime(request.entry_time)} />
          <Info label="Exit / Valid Until" value={formatTime(request.exit_time)} />
          <Info label="Location" value={request.location} />
          {inactive && <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Please present this QR code to an authorized Admin or Security Guard to activate your campus entry.</div>}
        </div>

        <div className="border-t border-ink-200 bg-ink-50 px-5 py-4 text-center text-xs text-ink-500 sm:px-7">
          Public verification shows only the information needed to confirm this token. Final entry approval is performed by authorized campus security.
        </div>
      </div>
    </main>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-ink-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
