import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, LockKeyhole, Smartphone, XCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { tokenService } from '@/services/tokenService';
import { EXTRA_TOKEN_FEE } from '@/config/constants';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { sendTokenEmail } from '@/services/emailService';

type Method = 'UPI' | 'CARD' | 'NETBANKING';
type Step = 'checkout' | 'processing' | 'success' | 'failed';

export function DemoPaymentModal({ open, requestId, fee = EXTRA_TOKEN_FEE, onClose, onSuccess }: { open: boolean; requestId?: string; fee?: number; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [method, setMethod] = useState<Method>('UPI');
  const [step, setStep] = useState<Step>('checkout');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (open) { setStep('checkout'); setMethod('UPI'); setTransactionId(''); }
  }, [open, requestId]);

  const pay = async () => {
    if (!user || !requestId || step !== 'checkout') return;
    setStep('processing');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      await tokenService.markPaid(user.id, requestId, method);
      void sendTokenEmail(requestId).catch(() => undefined);
      const payments = await tokenService.getPayments(user.id);
      const latest = payments.find((payment) => payment.token_request_id === requestId);
      setTransactionId(latest?.transaction_id || 'SC-DEMO-TEST');
      setStep('success');
      notify('Demo payment completed. Present the QR to an authorized Admin or Security Guard to activate entry.');
    } catch (error) {
      setStep('failed');
      notify(error instanceof Error ? error.message : 'Demo payment failed.', 'error');
    }
  };

  const finish = () => { onClose(); if (step === 'success') onSuccess(); };

  return (
    <Modal open={open} onClose={step === 'processing' ? () => undefined : onClose} title={step === 'success' ? 'Payment Successful' : step === 'failed' ? 'Payment Failed' : 'Secure Checkout'} size="sm" footer={step === 'checkout' ? <><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={() => void pay()} className="btn-primary"><LockKeyhole size={16}/> Pay ₹{fee.toFixed(2)}</button></> : step === 'processing' ? undefined : <button onClick={finish} className="btn-primary w-full">Continue</button>}>
      {step === 'checkout' && <div className="space-y-4">
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Extra campus token</p><p className="mt-1 text-sm font-semibold text-slate-800">One additional token</p></div><p className="text-2xl font-extrabold text-slate-950">₹{fee.toFixed(2)}</p></div></div>
        <div><p className="mb-2 text-sm font-semibold text-slate-700">Choose payment method</p><div className="grid gap-2 sm:grid-cols-3">{([['UPI','UPI',Smartphone],['CARD','Card',CreditCard],['NETBANKING','Net Banking',LockKeyhole]] as const).map(([value,label,Icon])=><button key={value} type="button" onClick={()=>setMethod(value)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-bold ${method===value?'border-purple-500 bg-purple-50 text-purple-700':'border-slate-200 bg-white text-slate-600'}`}><Icon size={16}/>{label}</button>)}</div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"><p className="font-bold text-slate-700">Demo / Test Mode</p><p className="mt-1">No real money will be charged. This simulates a successful gateway response and records a test transaction only.</p></div>
      </div>}
      {step === 'processing' && <div className="py-8 text-center"><Spinner className="mx-auto" size={32}/><p className="mt-4 font-semibold text-slate-800">Processing secure demo payment…</p><p className="mt-1 text-xs text-slate-500">Please do not close this window.</p></div>}
      {step === 'success' && <div className="py-4 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={34}/></div><h3 className="mt-4 text-xl font-bold text-slate-950">Payment successful</h3><p className="mt-2 text-sm text-slate-500">Payment is recorded. The token still needs an authorized campus scan to activate entry.</p><div className="mt-5 rounded-xl bg-slate-50 p-4 text-left"><div className="flex justify-between text-sm"><span className="text-slate-500">Amount</span><strong>₹{fee.toFixed(2)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Method</span><strong>{method}</strong></div><div className="mt-2 flex justify-between gap-3 text-xs"><span className="text-slate-500">Test transaction</span><span className="font-mono font-bold text-slate-700">{transactionId}</span></div></div><span className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">DEMO / TEST</span></div>}
      {step === 'failed' && <div className="py-5 text-center"><XCircle className="mx-auto text-red-500" size={38}/><h3 className="mt-4 text-lg font-bold">Payment could not be completed</h3><p className="mt-2 text-sm text-slate-500">No token was credited. Close this message and try the demo payment again.</p><button onClick={()=>setStep('checkout')} className="btn-secondary mt-5">Try Again</button></div>}
    </Modal>
  );
}
