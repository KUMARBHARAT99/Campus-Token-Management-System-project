import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, CheckCircle2, Clock, History as HistoryIcon, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { TokenCard } from '@/components/TokenCard';
import { EmptyState } from '@/components/EmptyState';
import { tokenService } from '@/services/tokenService';
import { ENTRY_TYPE_LABEL } from '@/config/constants';
import { downloadText, formatDate, formatDateTime, formatTime } from '@/utils';
import { DemoPaymentModal } from '@/components/DemoPaymentModal';
import { sendTokenEmail } from '@/services/emailService';
import { sendTokenSms } from '@/services/smsService';

export function TokenDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useToast();

  const [request, setRequest] = useState<import('@/types').TokenRequest | undefined>();
  const [history, setHistory] = useState<import('@/types').TokenHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [printed, setPrinted] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    void tokenService.getById(id).then(async r => {
      setRequest(r);
      if (r) setHistory(await tokenService.getHistoryByToken(r.token_id));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-sm text-ink-500">Loading token...</div>;

  if (!request) {
    return (
      <div>
        <Link to="/my-tokens" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700">
          <ArrowLeft size={16} /> Back to My Tokens
        </Link>
        <div className="card">
          <EmptyState
            icon={<XCircle size={22} />}
            title="Token not found"
            description="This token may have been removed or the link is invalid."
            action={<Link to="/my-tokens" className="btn-primary">Go to My Tokens</Link>}
          />
        </div>
      </div>
    );
  }

  const isOwner = user?.id === request.user_id;
  const isAdmin = user?.role === 'admin' || user?.role === 'security';
  const backLink = isOwner ? '/my-tokens' : isAdmin ? '/admin/requests' : '/dashboard';

  const handleDownload = () => {
    const content = `SMART CAMPUS TOKEN\n${'='.repeat(40)}\n\nToken ID: ${request.token_id}\nVisitor: ${request.visitor_name}\nMobile: ${request.visitor_mobile}\nEntry Type: ${ENTRY_TYPE_LABEL[request.entry_type]}\nPurpose: ${request.purpose}\nDate: ${formatDate(request.date)}\nEntry: ${formatTime(request.entry_time)}\nExit: ${formatTime(request.exit_time)}\nLocation: ${request.location}\n${request.vehicle_number ? `Vehicle: ${request.vehicle_number}\n` : ''}${request.student_name ? `Host: ${request.student_name} (${request.student_id_no})\n` : ''}Status: ${request.status.toUpperCase()}\n${request.admin_remark ? `Remark: ${request.admin_remark}\n` : ''}\nGenerated: ${new Date().toLocaleString()}`;
    downloadText(`${request.token_id}.txt`, content);
    notify('Token downloaded.');
  };

  const handlePrint = () => {
    setPrinted(true);
    setTimeout(() => {
      window.print();
      setPrinted(false);
    }, 100);
  };

  const statusInfo = {
    pending: { icon: <Clock size={20} />, color: 'text-amber-600 bg-amber-50', msg: request.payment_amount > 0 && !request.paid ? 'Complete the required payment first. After payment, present the QR to an authorized Admin or Security Guard to activate entry.' : 'Please present this QR code to an authorized Admin or Security Guard to activate your campus entry.' },
    approved: { icon: <CheckCircle2 size={20} />, color: 'text-emerald-600 bg-emerald-50', msg: 'Your token is valid. Show the QR code at the campus gate.' },
    rejected: { icon: <XCircle size={20} />, color: 'text-red-600 bg-red-50', msg: request.admin_remark || 'Your request was rejected. Contact administration for details.' },
    active: { icon: <CheckCircle2 size={20} />, color: 'text-brand-600 bg-brand-50', msg: 'This token is active. Authorized campus staff can record additional location scans during its validity period.' },
    expired: { icon: <Clock size={20} />, color: 'text-ink-500 bg-ink-100', msg: 'This token has expired.' },
    used: { icon: <CheckCircle2 size={20} />, color: 'text-ink-500 bg-ink-100', msg: 'This token has already been used.' },
    revoked: { icon: <XCircle size={20} />, color: 'text-red-600 bg-red-50', msg: 'This token has been revoked.' },
  }[request.status] ?? { icon: <Clock size={20} />, color: 'text-ink-500 bg-ink-100', msg: 'Token status unavailable.' };

  return (
    <div>
      <Link to={backLink} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Status banner */}
      <div className={`mb-5 flex items-start gap-3 rounded-lg border border-ink-200 p-4 ${statusInfo.color}`}>
        <span className="mt-0.5 shrink-0">{statusInfo.icon}</span>
        <div>
          <p className="text-sm font-semibold">Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</p>
          <p className="mt-0.5 text-sm">{statusInfo.msg}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Token card */}
        <div className={printed ? '' : ''}>
          <TokenCard request={request} />
        </div>

        {/* Sidebar: details + actions */}
        <div className="space-y-5">
          <div className="card-pad">
            <h3 className="mb-3 text-sm font-semibold text-ink-800">Request Details</h3>
            <dl className="space-y-2.5 text-sm">
              <Detail label="Purpose" value={request.purpose} />
              <Detail label="Visitor Mobile" value={request.visitor_mobile} />
              {request.student_name && (
                <>
                  <Detail label="Host / Student" value={request.student_name} />
                  <Detail label="Student ID" value={request.student_id_no || '—'} />
                  {request.student_department && <Detail label="Department" value={request.student_department} />}
                </>
              )}
              {request.vehicle_number && <Detail label="Vehicle Number" value={request.vehicle_number} />}
              {request.notes && <Detail label="Notes" value={request.notes} />}
              <Detail label="Submitted" value={formatDateTime(request.created_at)} />
              {request.paid && <Detail label="Fee Paid" value={`₹${request.payment_amount}`} />}
              <Detail label="Identity Photo" value={request.face_image_path ? 'Captured' : 'Not captured'} />
            </dl>
          </div>

          <div className="card-pad">
            <h3 className="mb-3 text-sm font-semibold text-ink-800">Actions</h3>
            <div className="space-y-2">
              <button onClick={handleDownload} className="btn-secondary w-full"><Download size={16} /> Download Details</button>
              <button onClick={handlePrint} className="btn-secondary w-full"><Printer size={16} /> Print Token</button>
              {isOwner && <button disabled={emailSending} onClick={async () => { setEmailSending(true); try { await sendTokenEmail(request.id); notify('Designed token PDF sent to your email.'); } catch (error) { notify(error instanceof Error ? error.message : 'Unable to send token email.', 'error'); } finally { setEmailSending(false); } }} className="btn-secondary w-full">{emailSending ? 'Sending email…' : 'Send Token to Email'}</button>}
              {isOwner && <button disabled={smsSending || smsSent} onClick={async () => { if (smsSending || smsSent) return; setSmsSending(true); try { await sendTokenSms(request.id); setSmsSent(true); notify('Token SMS sent successfully.'); } catch (error) { notify(error instanceof Error ? error.message : 'Unable to send token SMS.', 'error'); } finally { setSmsSending(false); } }} className="btn-secondary w-full">{smsSending ? 'Sending SMS…' : smsSent ? 'SMS Sent' : 'Send Token via SMS'}</button>}
              {isOwner && !request.face_image_path && <Link to={`/tokens/${request.id}/face-capture`} className="btn-secondary w-full"><CheckCircle2 size={16} /> Add Face Capture</Link>}
              {isOwner && request.payment_amount > 0 && !request.paid && <button onClick={() => setPaymentOpen(true)} className="btn-primary w-full"><CheckCircle2 size={16} /> Pay ₹{request.payment_amount} — Demo</button>}
              {(request.status === 'pending' || request.status === 'rejected') && isOwner && <Link to="/my-tokens" className="btn-danger w-full">Manage in My Tokens</Link>}
            </div>
          </div>

          {/* Timeline */}
          <div className="card-pad">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
              <HistoryIcon size={16} /> Activity Timeline
            </h3>
            <ol className="relative space-y-3 border-l border-ink-200 pl-4">
              {history.length === 0 ? (
                <li className="text-sm text-ink-500">No activity recorded.</li>
              ) : (
                history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
                    <p className="text-sm font-medium text-ink-700">{h.action}</p>
                    <p className="text-xs text-ink-400">{formatDateTime(h.timestamp)} · {h.action_by}</p>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      </div>
      <DemoPaymentModal open={paymentOpen} requestId={request.id} fee={request.payment_amount} onClose={() => setPaymentOpen(false)} onSuccess={() => { setPaymentOpen(false); void tokenService.getById(request.id).then(setRequest); }} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-700">{value}</dd>
    </div>
  );
}
