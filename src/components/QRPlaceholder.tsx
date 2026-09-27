import { cn } from '@/utils';

/**
 * Real QR renderer for the campus token verification URL.
 * QuickChart only renders the QR image; it does not receive campus data other
 * than the verification URL encoded in the QR. The authoritative token data
 * remains in Supabase and is read by the verification page/function.
 */
export function getPublicVerificationUrl(tokenId: string): string {
  const base = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim().replace(/\/$/, '') || window.location.origin;
  return `${base}/verify/${encodeURIComponent(tokenId.trim().toUpperCase())}`;
}

export function QRPlaceholder({
  value,
  size = 180,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const verificationUrl = value.startsWith('http') ? value : getPublicVerificationUrl(value);
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(verificationUrl)}&size=${Math.max(120, Math.round(size))}&margin=2&ecLevel=H`;

  return (
    <div className={cn('inline-flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm', className)}>
      <img
        src={qrUrl}
        width={size}
        height={size}
        alt="Smart Campus token QR code"
        className="rounded-md"
        loading="eager"
        referrerPolicy="no-referrer"
      />
      <p className="max-w-[220px] break-all text-center font-mono text-[10px] font-semibold text-slate-500">
        {value.replace(/^https?:\/\/[^/]+\/verify\//, '')}
      </p>
    </div>
  );
}
