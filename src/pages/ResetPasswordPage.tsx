import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { supabase } from '@/config/supabase';
import { useToast } from '@/components/Toast';

export function ResetPasswordPage(){
 const navigate=useNavigate(); const {notify}=useToast(); const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false); const [ready,setReady]=useState(false);
 useEffect(()=>{void supabase.auth.getSession().then(({data})=>setReady(Boolean(data.session)));},[]);
 const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(password.length<8)return setError('Password must contain at least 8 characters.');if(password!==confirm)return setError('Passwords do not match.');setLoading(true);try{const {error:updateError}=await supabase.auth.updateUser({password});if(updateError)throw updateError;await supabase.auth.signOut();setPassword('');setConfirm('');notify('Password updated successfully.');navigate('/login',{replace:true});}catch(error){setError(error instanceof Error?error.message:'Unable to update password.');}finally{setLoading(false);}};
 return <AuthLayout title="Set a new password" subtitle="Choose a new password for your Smart Campus account." footer={<Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline"><ArrowLeft size={16}/> Back to login</Link>}>{!ready?<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Open this page from the password-reset email. The secure recovery session is required.</div>:<form onSubmit={submit} className="space-y-4">{error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div><label className="label">New password</label><div className="relative"><LockKeyhole size={18} className="absolute left-3 top-3 text-ink-400"/><input className="input pl-10" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div></div><div><label className="label">Confirm password</label><input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div><button disabled={loading} className="btn-primary w-full py-3">{loading?'Updating…':<><CheckCircle2 size={17}/> Update Password</>}</button></form>}</AuthLayout>;
}
