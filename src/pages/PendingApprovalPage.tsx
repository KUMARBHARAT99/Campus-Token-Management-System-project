import { useState } from 'react';
import { sendApprovalRequest } from '@/services/approvalService';
import { Clock3, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';

export function PendingApprovalPage() {
  const { user, refreshUser, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  if (!user) return null;

  const checkStatus = async () => {
    setChecking(true);
    try {
      const updated = await refreshUser();
      if (!updated) {
        await signOut();
        navigate('/login', { replace: true });
        return;
      }
      if (updated.accountStatus === 'approved' || updated.accountStatus === 'active') {
        notify('Your account has been approved. Welcome to Smart Campus!');
        navigate(updated.role === 'admin' || updated.role === 'security' ? '/admin' : '/dashboard', { replace: true });
      } else {
        notify('Your account is still waiting for administrator approval.', 'info');
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to check account status.', 'error');
    } finally {
      setChecking(false);
    }
  };

  const sendRequest = async () => {
    if (!user || user.role === 'other' || requestSent || sendingRequest) return;
    setSendingRequest(true);
    try {
      const result = await sendApprovalRequest(user.id);
      setRequestSent(true);
      notify(result.message, result.alreadySent ? 'info' : 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to send approval request.', 'error');
    } finally { setSendingRequest(false); }
  };

  const logout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock3 size={32} />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
            <ShieldCheck size={13} /> Account review in progress
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">Waiting for approval</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your account has been verified and is now waiting for an administrator to approve campus access.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered account</p>
            <p className="mt-1 font-semibold text-slate-800">{user.full_name}</p>
            <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
          </div>
          {!user.requestedRole && <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4 text-left text-sm text-purple-800"><strong>Complete your profile:</strong> this account was created through Google/mobile authentication. Add your campus role/details before administrator review. <button onClick={()=>navigate('/complete-profile')} className="mt-2 font-bold text-purple-700 underline">Complete profile →</button></div>}
          {user.role === 'student' || user.role === 'staff' ? (
            <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-left">
              <p className="text-sm font-bold text-purple-900">Need to remind the administrator?</p>
              <p className="mt-1 text-xs leading-5 text-purple-700">Send one approval reminder to the Smart Campus administrator.</p>
              <button onClick={() => void sendRequest()} disabled={requestSent || sendingRequest} className="btn-primary mt-3 w-full">
                {sendingRequest ? 'Sending request…' : requestSent ? 'Approval Request Sent' : 'Send Approval Request to Admin'}
              </button>
            </div>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={() => void checkStatus()} disabled={checking} className="btn-primary">
              <RefreshCw size={17} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking…' : 'Check Status'}
            </button>
            <button onClick={() => void logout()} className="btn-secondary">
              <LogOut size={17} /> Logout
            </button>
          </div>
          <p className="mt-5 text-xs text-slate-400">You can return here anytime to check whether the administrator has approved your account.</p>
        </div>
      </div>
    </div>
  );
}
