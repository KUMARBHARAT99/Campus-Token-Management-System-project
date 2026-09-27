import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Receipt, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '@/layouts/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { tokenService } from '@/services/tokenService';
import { formatDateTime } from '@/utils';
import type { Payment } from '@/types';

export function PaymentHistoryPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void tokenService.getPayments(user.id).then(setPayments).catch((error) => notify(error instanceof Error ? error.message : 'Unable to load payment history.', 'error')).finally(() => setLoading(false));
  }, [user, notify]);

  if (user && user.role !== 'student' && user.role !== 'staff') return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <Link to="/dashboard" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600"><ArrowLeft size={16}/> Back to dashboard</Link>
      <PageHeader title="Payment History" subtitle="Demo/test payments made for additional campus tokens." />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800"><ShieldCheck size={18} className="mt-0.5 shrink-0"/><p><strong>Demo / Test Mode:</strong> these records do not represent real money transfers. Real Razorpay payments can be connected later without changing the history structure.</p></div>
      <div className="card overflow-hidden">
        {loading ? <div className="p-10 text-center text-sm text-ink-500">Loading payments…</div> : payments.length === 0 ? <div className="p-10 text-center"><Receipt className="mx-auto text-ink-300" size={30}/><p className="mt-3 font-semibold text-ink-700">No payments yet</p><p className="mt-1 text-sm text-ink-500">Your additional-token payments will appear here.</p></div> : <div className="divide-y divide-ink-200">{payments.map((payment)=><div key={payment.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><CreditCard size={18}/></span><div><p className="font-semibold text-ink-800">₹{payment.amount.toFixed(2)} · Extra Token</p><p className="mt-1 text-xs text-ink-500">{formatDateTime(payment.created_at)} · {payment.payment_mode || 'Demo'}</p><p className="mt-1 font-mono text-[11px] text-ink-400">{payment.transaction_id || 'No transaction ID'}</p></div></div><div className="flex items-center gap-2 self-start sm:self-center"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{payment.payment_status.toUpperCase()}</span>{payment.is_demo && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">DEMO</span>}</div></div>)}</div>}
      </div>
    </div>
  );
}
