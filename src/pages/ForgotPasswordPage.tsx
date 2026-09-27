import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { isValidEmail } from '@/utils';
import { supabase } from '@/config/supabase';
import { useToast } from '@/components/Toast';

export function ForgotPasswordPage() {
  const { notify } = useToast();
  const [email,setEmail]=useState('');
  const [sent,setSent]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(!isValidEmail(email)){setError('Please enter a valid email address.');return;}setLoading(true);try{const {error:resetError}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${window.location.origin}/reset-password`});if(resetError)throw resetError;setSent(true);notify('Password reset email sent.');}catch(error){setError(error instanceof Error?error.message:'Unable to send reset email.');}finally{setLoading(false);}};
  return <AuthLayout title="Forgot password" subtitle="Enter your email to receive a secure password reset link." footer={<Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline"><ArrowLeft size={16}/> Back to login</Link>}>
    {sent?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center"><CheckCircle2 className="mx-auto text-emerald-600"/><p className="mt-3 text-sm font-bold text-emerald-800">Reset email sent</p><p className="mt-2 text-sm text-emerald-700">If an account exists for <strong>{email}</strong>, Supabase has sent a password reset email.</p><Link to="/login" className="btn-primary mt-5">Return to login</Link></div>:<form onSubmit={submit} className="space-y-4">{error&&<Alert variant="error">{error}</Alert>}<div><label className="label" htmlFor="email">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-3 text-ink-400"/><input id="email" type="email" className="input pl-10" placeholder="you@campus.edu" value={email} onChange={e=>setEmail(e.target.value)}/></div></div><button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading?<Spinner size={18} className="text-white"/>:<Mail size={18}/>} {loading?'Sending…':'Send Reset Link'}</button><Alert variant="info">Use the email account registered with Smart Campus. Password reset uses Supabase Auth.</Alert></form>}
  </AuthLayout>;
}
