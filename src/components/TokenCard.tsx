import { Calendar, Clock3, MapPin, UserRound, UsersRound, ShieldCheck, Building2 } from 'lucide-react';
import type { TokenRequest } from '@/types';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import { QRPlaceholder } from '@/components/QRPlaceholder';
import { formatDate, formatTime } from '@/utils';
import { FaceImage } from '@/components/FaceImage';

/**
 * Branded one-page campus entry pass. This is intentionally the same
 * information set used by the emailed PDF: the PDF contains only this pass,
 * never the right-side request/activity panels from TokenDetailsPage.
 */
export function TokenCard({ request }: { request: TokenRequest }) {
  const active = request.status === 'active';
  const statusLabel = active ? 'Active' : request.status.charAt(0).toUpperCase() + request.status.slice(1);

  return (
    <div
      data-token-card
      className="relative mx-auto w-full max-w-[780px] overflow-hidden rounded-[26px] border border-[#ead4d4] bg-white shadow-[0_18px_55px_rgba(70,18,22,.14)]"
    >
      {/* Branded header */}
      <div className="relative overflow-hidden border-b border-[#e7d2d2] px-5 pb-4 pt-4 sm:px-7">
        <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden opacity-20">
          <img src="/token-campus.jpg" alt="" className="h-full w-full object-cover object-center" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <img src="/silver-oak-logo.png" alt="Silver Oak University" className="h-[62px] w-[250px] object-contain object-left sm:h-[76px] sm:w-[330px]" />
          <div className="pt-1 text-right">
            <p className="text-xl font-black tracking-tight text-[#7b1017] sm:text-2xl">SMART CAMPUS</p>
            <p className="text-[10px] font-semibold tracking-wide text-slate-700 sm:text-xs">TOKEN MANAGEMENT SYSTEM</p>
            <p className="mt-1 hidden text-[9px] text-slate-500 sm:block">Secure Campus • Smart Access • Safer Tomorrow</p>
          </div>
        </div>
      </div>

      {/* Pass banner */}
      <div className="relative mx-0 overflow-hidden bg-gradient-to-r from-[#650b11] via-[#851218] to-[#6f0b12] px-5 py-4 text-white sm:px-7">
        <div className="absolute -bottom-8 -left-8 h-20 w-[70%] -skew-x-12 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-black tracking-tight sm:text-3xl">CAMPUS ENTRY PASS</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[.2em] text-white/90 sm:text-xs">VALID FOR INSTITUTIONAL ENTRY ONLY</p>
          </div>
          <div className={`shrink-0 rounded-2xl px-4 py-2 text-center ${active ? 'bg-emerald-100 text-emerald-900' : 'bg-white/90 text-[#650b11]'}`}>
            <p className="text-sm font-extrabold sm:text-base">{statusLabel}</p>
            <p className="text-[10px] font-medium">{active ? 'Entry Allowed' : 'Token Status'}</p>
          </div>
        </div>
      </div>

      {/* Main pass */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[150px_1fr_175px] md:items-start">
          {/* Photo */}
          <div className="mx-auto w-[150px] overflow-hidden rounded-2xl border border-[#b46a6a] bg-white p-2 md:mx-0">
            <FaceImage
              userId={request.user_id}
              path={request.face_image_path}
              alt={`${request.visitor_name} identity photo`}
              className="h-[168px] w-full rounded-xl"
            />
            <div className="mt-2 rounded-xl bg-[#7b1017] px-2 py-2 text-center text-xs font-black tracking-wider text-white">
              VISITOR
            </div>
          </div>

          {/* Identity/details */}
          <div className="min-w-0">
            <div className="rounded-2xl bg-gradient-to-r from-[#fff0f0] to-[#fdf7f7] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a1a20]">Token ID</p>
              <p className="mt-0.5 break-all font-mono text-xl font-black tracking-tight text-[#741017] sm:text-2xl">{request.token_id}</p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field icon={<UserRound size={17} />} label="Name" value={request.visitor_name} />
              <Field label="Entry Type" value={ENTRY_TYPE_LABEL[request.entry_type] || request.entry_type} />
              <Field icon={<UsersRound size={17} />} label="Host / Student" value={request.student_name || '—'} />
              <Field icon={<MapPin size={17} />} label="Location" value={request.location || 'Main Gate'} />
            </div>
          </div>

          {/* QR */}
          <div className="mx-auto flex w-full max-w-[175px] flex-col items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <QRPlaceholder value={request.token_id} size={145} className="w-full border-0 p-0 shadow-none" />
            <p className="mt-1 text-center text-[10px] font-semibold text-slate-500">Scan at entry point</p>
          </div>
        </div>

        {/* Validity row */}
        <div className="mt-5 grid overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-3">
          <Validity icon={<Calendar size={20} />} label="Valid Date" value={formatDate(request.date)} />
          <Validity icon={<Clock3 size={20} />} label="Valid From" value={formatTime(request.entry_time)} />
          <Validity icon={<Clock3 size={20} />} label="Valid Until" value={formatTime(request.exit_time)} />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff0f0] px-4 py-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#7b1017]" size={25} />
          <div>
            <p className="text-xs font-extrabold text-[#741017]">Campus entry pass</p>
            <p className="mt-0.5 text-[11px] leading-5 text-slate-700">Show this token and QR code at the authorized campus entry point.</p>
            <p className="text-[10px] text-slate-500">Generated by Smart Campus Token Management System, Silver Oak University.</p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-b border-[#ead4d4] pb-3">
          <div className="h-9 flex-1 bg-[linear-gradient(90deg,rgba(123,16,23,.15),transparent)]" />
          <div className="text-right">
            <p className="font-serif text-lg italic text-slate-800">Authorized Signatory</p>
            <p className="text-[10px] font-semibold text-slate-500">Silver Oak University</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col justify-between gap-1 bg-[#650b11] px-5 py-3 text-[10px] font-semibold text-white sm:flex-row sm:px-7">
        <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> Silver Oak University, Ahmedabad, Gujarat</span>
        <span>Smart Campus Token Management System</span>
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{icon}{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-slate-800 sm:text-[15px]">{value || '—'}</p>
    </div>
  );
}

function Validity({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className="text-[#7b1017]">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
