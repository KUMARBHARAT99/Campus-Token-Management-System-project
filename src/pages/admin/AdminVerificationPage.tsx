import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Search,
  ShieldCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { PageHeader } from '@/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { tokenService } from '@/services/tokenService';
import {
  ENTRY_TYPE_LABEL,
  VERIFICATION_LOCATIONS,
} from '@/config/constants';
import { formatDate, formatTime } from '@/utils';
import type { TokenRequest } from '@/types';
import { FaceImage } from '@/components/FaceImage';

export function AdminVerificationPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [query, setQuery] = useState(params.get('token') ?? '');
  const [result, setResult] = useState<TokenRequest | null | undefined>(
    undefined
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [location, setLocation] = useState('Main Gate');
  const [otherLocation, setOtherLocation] = useState('');
  const [scanning, setScanning] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const [lastExit, setLastExit] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef =
    useRef<ZXingControlsLike | null>(null);
  const scanStartedRef = useRef(false);

  const handleBack = () => {
    navigate(-1);
  };

  const stopScanner = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    scanStartedRef.current = false;

    const video = videoRef.current;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setScanning(false);
  };

  const resetVerification = () => {
    stopScanner();
    setResult(null);
    setQuery('');
    setError('');
    setLastExit(null);
    setOtherLocation('');
    setLocation('Main Gate');
  };

  const lookup = async (value: string) => {
    const clean = value.trim().toUpperCase();

    if (!clean) return;

    setError('');
    setLoading(true);

    try {
      const found = await tokenService.getByTokenId(clean);

      setResult(found ?? null);

      if (!found) {
        setError(`No token found with ID "${clean}".`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to check this token. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setError('');

    if (scanStartedRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Camera access is unavailable here. Please use HTTPS/localhost or enter the Token ID manually.'
      );
      return;
    }

    const ZXing = window.ZXingBrowser;

    if (!ZXing) {
      setError(
        'The QR scanner library could not be loaded. Check your internet connection and use manual Token ID entry if needed.'
      );
      return;
    }

    try {
      setScanning(true);
      scanStartedRef.current = true;

      await new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => resolve())
      );

      const video = videoRef.current;

      if (!video) {
        stopScanner();
        setError(
          'Unable to open the camera preview. Please try again or use manual Token ID entry.'
        );
        return;
      }

      const reader = new ZXing.BrowserQRCodeReader();

      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: {
              ideal: 'environment',
            },
          },
          audio: false,
        },
        video,
        (scanResult, scanError) => {
          if (scanResult) {
            const raw = scanResult.getText().trim();

            if (!raw) return;

            stopScanner();

            const match = raw.match(
              /\/verify\/([^/?#]+)/i
            );

            void lookup(
              decodeURIComponent(match?.[1] ?? raw)
            );

            return;
          }

          void scanError;
        }
      );

      if (!scanStartedRef.current) {
        controls.stop();
        return;
      }

      scannerControlsRef.current = controls;
    } catch (err) {
      const message =
        err instanceof DOMException &&
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access and try again, or enter the Token ID manually.'
          : err instanceof DOMException &&
              err.name === 'NotFoundError'
            ? 'No camera was found on this device. Please use manual Token ID entry.'
            : err instanceof DOMException &&
                err.name === 'NotReadableError'
              ? 'The camera is already being used by another app. Close it and try again.'
              : err instanceof Error
                ? err.message
                : 'Unable to start the camera. Please try again.';

      setError(message);
      stopScanner();
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    await lookup(query);
  };

  const handleAllow = async () => {
    if (!user || !result) return;

    const selectedLocation =
      location === 'Other'
        ? otherLocation.trim()
        : location;

    if (!selectedLocation) {
      notify(
        'Select or enter the scan location first.',
        'error'
      );
      return;
    }

    setActionLoading(true);

    try {
      const response = await tokenService.allowEntry(
        result.token_id,
        user,
        selectedLocation
      );

      setLastExit(null);
      setResult(response.request);

      notify(
        response.request.status === 'active'
          ? response.log.gate_name === selectedLocation
            ? `Scan recorded at ${selectedLocation}.`
            : 'Entry verified successfully.'
          : 'Entry verified successfully.'
      );
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : 'Entry verification failed.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const canAct =
    !!result &&
    ['pending', 'approved', 'active'].includes(
      result.status
    ) &&
    !(
      result.payment_amount > 0 &&
      !result.paid
    );

  const firstActivation =
    result?.status === 'pending' ||
    result?.status === 'approved';

  const canMarkExit =
    !!result &&
    result.status === 'active' &&
    (user?.role === 'security' ||
      user?.role === 'admin');

  const pageTitle =
    user?.role === 'staff'
      ? 'Scan Token'
      : user?.role === 'security'
        ? 'Security Entry / Exit'
        : 'Token Verification';

  const pageSubtitle =
    user?.role === 'staff'
      ? 'Scan a visitor token QR or enter the Token ID to record authorized campus entry.'
      : user?.role === 'security'
        ? 'Scan a token to mark entry, then scan the active token again to mark exit.'
        : 'Scan a token QR or enter its Token ID to verify campus access.';

  const handleExit = async () => {
    if (!user || !result) return;

    const selectedLocation =
      location === 'Other'
        ? otherLocation.trim()
        : location;

    if (!selectedLocation) {
      notify(
        'Select or enter the exit location first.',
        'error'
      );
      return;
    }

    setExitLoading(true);

    try {
      const response = await tokenService.markExit(
        result.token_id,
        user,
        selectedLocation
      );

      setResult(response.request);
      setLastExit(
        response.log.exit_time ??
          new Date().toISOString()
      );

      notify(
        `Exit marked at ${selectedLocation}.`
      );
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : 'Unable to mark exit.',
        'error'
      );
    } finally {
      setExitLoading(false);
    }
  };

  return (
    <div>
      {/* --------------------------------------------------------------- */}
      {/* TOP LEFT BACK BUTTON                                            */}
      {/* --------------------------------------------------------------- */}

      <div className="mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50"
        >
          <ArrowLeft size={17} />
          Back
        </button>
      </div>

      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
      />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* ============================================================= */}
        {/* LEFT SIDE — SCANNER                                           */}
        {/* ============================================================= */}

        <div className="space-y-4">
          <div className="card-pad">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Gate scanner
                  </p>

                  <p className="mt-1 font-bold">
                    QR verification
                  </p>
                </div>

                <Camera size={22} />
              </div>

              <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-black">
                {scanning ? (
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-xs text-slate-400">
                    Camera is off
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {!scanning ? (
                  <button
                    type="button"
                    onClick={() =>
                      void startScanner()
                    }
                    className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950"
                  >
                    Start Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    Stop Camera
                  </button>
                )}
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                Allow camera access when Chrome/Edge asks
                for permission.
              </p>
            </div>
          </div>

          {/* MANUAL TOKEN SEARCH */}
          <div className="card-pad">
            <form
              onSubmit={handleSearch}
              className="space-y-3"
            >
              <label className="label">
                Manual Token ID
              </label>

              <div className="flex gap-2">
                <input
                  className="input font-mono uppercase"
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                  placeholder="SCT-2026-XXXXXXXX"
                />

                <button
                  className="btn-primary shrink-0"
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner size={18} />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>
            </form>

            {error && (
              <Alert
                variant="error"
                className="mt-3"
              >
                {error}
              </Alert>
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT SIDE — TOKEN DETAILS                                    */}
        {/* ============================================================= */}

        <div className="card-pad">
          {!result && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-slate-400">
              <ShieldCheck size={42} />

              <p className="mt-3 font-semibold">
                Ready for verification
              </p>

              <p className="mt-1 text-sm">
                Scan the QR shown on the visitor's phone
                or enter the Token ID.
              </p>
            </div>
          )}

          {result && (
            <div>
              {/* TOKEN STATUS */}
              <div
                className={`rounded-xl border p-4 ${
                  canAct
                    ? 'border-emerald-200 bg-emerald-50'
                    : result.status === 'used'
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {canAct ? (
                    <CheckCircle2 className="text-emerald-600" />
                  ) : (
                    <XCircle className="text-red-600" />
                  )}

                  <div>
                    <p className="font-bold">
                      {canAct
                        ? 'TOKEN VALID — READY FOR ENTRY'
                        : result.status === 'used'
                          ? 'TOKEN ALREADY USED'
                          : `TOKEN ${result.status.toUpperCase()}`}
                    </p>

                    <p className="text-xs text-slate-500">
                      {canAct
                        ? 'Confirm the displayed details before marking entry.'
                        : 'This token cannot be activated or scanned in its current state.'}
                    </p>
                  </div>

                  <StatusBadge status={result.status} />
                </div>
              </div>

              {/* TOKEN INFORMATION */}
              <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                <div className="flex justify-center sm:justify-start">
                  <FaceImage
                    userId={result.user_id}
                    path={result.face_image_path}
                    alt={`${result.visitor_name} identity photo`}
                    className="h-32 w-28 rounded-2xl"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Info
                    label="Token ID"
                    value={result.token_id}
                    mono
                  />

                  <Info
                    label="Visitor"
                    value={result.visitor_name}
                  />

                  <Info
                    label="Mobile"
                    value={result.visitor_mobile}
                  />

                  <Info
                    label="Access Type"
                    value={
                      ENTRY_TYPE_LABEL[
                        result.entry_type
                      ] || result.entry_type
                    }
                  />

                  <Info
                    label="Purpose"
                    value={result.purpose}
                  />

                  <Info
                    label="Date"
                    value={formatDate(result.date)}
                  />

                  <Info
                    label="Entry Time"
                    value={formatTime(
                      result.entry_time
                    )}
                  />

                  <Info
                    label="Exit Time"
                    value={formatTime(
                      result.exit_time
                    )}
                  />

                  <Info
                    label="Location"
                    value={result.location}
                  />

                  <Info
                    label="Host / Student"
                    value={
                      result.student_name || '—'
                    }
                  />
                </div>
              </div>

              {/* ACTION AREA */}
              {canAct && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Scan location
                  </p>

                  <select
                    className="input mt-2"
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                  >
                    {VERIFICATION_LOCATIONS.map(
                      (item) => (
                        <option key={item}>
                          {item}
                        </option>
                      )
                    )}
                  </select>

                  {location === 'Other' && (
                    <input
                      className="input mt-2"
                      value={otherLocation}
                      onChange={(e) =>
                        setOtherLocation(
                          e.target.value
                        )
                      }
                      placeholder="Enter campus location"
                    />
                  )}

                  <div className="mt-3 grid gap-2">
                    {canAct && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleAllow()
                        }
                        disabled={
                          actionLoading ||
                          exitLoading
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <ShieldCheck size={19} />

                        {actionLoading
                          ? 'Recording scan…'
                          : firstActivation
                            ? 'MARK ENTRY'
                            : 'RECORD LOCATION SCAN'}
                      </button>
                    )}

                    {canMarkExit && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleExit()
                        }
                        disabled={
                          actionLoading ||
                          exitLoading
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7b1017] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <ShieldCheck size={19} />

                        {exitLoading
                          ? 'Marking exit…'
                          : 'MARK EXIT / EXIT USER'}
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    {firstActivation
                      ? 'This scan activates the token and records entry location + timestamp.'
                      : canMarkExit
                        ? 'Security can record the user exit with location + timestamp.'
                        : 'This scan is added to the token journey.'}
                  </p>

                  {lastExit && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                      Exit recorded:{' '}
                      {new Date(
                        lastExit
                      ).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}

              {!canAct &&
                result.status === 'pending' &&
                result.payment_amount > 0 &&
                !result.paid && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Payment is required before this
                    token can be activated.
                  </div>
                )}

              {/* EXISTING NEW VERIFICATION */}
              <button
                type="button"
                onClick={resetVerification}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-600 hover:bg-ink-50"
              >
                <RotateCcw size={16} />
                New Verification
              </button>

              {/* ======================================================= */}
              {/* BOTTOM CENTER BACK BUTTON                               */}
              {/* ======================================================= */}

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-8 py-3 text-sm font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50"
                >
                  <ArrowLeft size={17} />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INFO CARD                                                                  */
/* -------------------------------------------------------------------------- */

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold text-slate-800 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}