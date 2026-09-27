import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type OtpMode = 'signup' | 'login';

export function EmailOtpPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { sendEmailOtp, verifyEmailOtp, currentUser, loading, error, clearError } = useApp();

  const email = (params.get('email') ?? '').trim().toLowerCase();
  const mode: OtpMode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const fromState = (location.state as { email?: string; mode?: OtpMode } | null)?.email;
  const effectiveEmail = email || fromState?.trim().toLowerCase() || '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (currentUser) {
      if ((currentUser.accountStatus === 'pending' || currentUser.accountStatus === 'pending_approval') && (currentUser.role === 'student' || currentUser.role === 'staff')) navigate('/pending-approval', { replace: true });
      else if (currentUser.role === 'admin' || currentUser.role === 'security') navigate('/admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    if (!effectiveEmail) navigate('/login', { replace: true });
  }, [effectiveEmail, navigate]);

  const otp = useMemo(() => digits.join(''), [digits]);
  const busy = loading || sending || verifying;

  const setDigit = (index: number, value: string) => {
    clearError();
    setLocalError('');
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((prev) => prev.map((digit, i) => (i === index ? '' : digit)));
      return;
    }
    const chars = clean.slice(0, OTP_LENGTH).split('');
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => { if (index + offset < OTP_LENGTH) next[index + offset] = char; });
      return next;
    });
    const target = Math.min(index + chars.length, OTP_LENGTH - 1);
    window.setTimeout(() => inputs.current[target]?.focus(), 0);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const resend = async () => {
    if (busy || seconds > 0 || !effectiveEmail) return;
    setSending(true); setLocalError(''); clearError();
    try {
      await sendEmailOtp(effectiveEmail);
      setSeconds(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      notify('A new verification code has been sent.');
      inputs.current[0]?.focus();
    } catch { /* context contains the error */ }
    finally { setSending(false); }
  };

  const verify = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    setLocalError(''); clearError();
    if (!/^\d{6}$/.test(otp)) { setLocalError('Enter the 6-digit verification code.'); return; }
    setVerifying(true);
    try {
      await verifyEmailOtp(effectiveEmail, otp, mode === 'signup' ? 'signup' : 'email');
    } catch { /* context contains the error */ }
    finally { setVerifying(false); }
  };

  const visibleError = localError || error || '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <Link to="/login" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600">
            <ArrowLeft size={16} /> Back to login
          </Link>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Mail size={26} />
            </div>
            <div className="mt-5 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck size={13} /> Secure email verification
              </div>
              <h1 className="mt-4 text-2xl font-bold text-slate-950">Enter your verification code</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                We sent a 6-digit code to <span className="font-semibold text-slate-700">{effectiveEmail}</span>.
              </p>
            </div>

            {visibleError && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{visibleError}</div>}

            <form onSubmit={verify} className="mt-7">
              <div className="flex justify-center gap-2 sm:gap-3" aria-label="Email verification code">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => { inputs.current[index] = node; }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    className="h-12 w-11 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-950 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 sm:h-14 sm:w-12"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              <button type="submit" disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {verifying ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-xs">
              <span className="text-slate-500">Didn't receive the code?</span>
              <button type="button" onClick={() => void resend()} disabled={busy || seconds > 0} className="inline-flex items-center gap-1.5 font-bold text-purple-600 disabled:text-slate-400">
                <RefreshCw size={14} className={sending ? 'animate-spin' : ''} />
                {seconds > 0 ? `Resend in ${seconds}s` : 'Resend OTP'}
              </button>
            </div>

            <div className="mt-5 text-center">
              <Link to={`/login?email=${encodeURIComponent(effectiveEmail)}`} className="text-xs font-semibold text-slate-500 hover:text-purple-600">Use a different email</Link>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">Smart Campus Token Management System</p>
        </div>
      </div>
    </div>
  );
}
