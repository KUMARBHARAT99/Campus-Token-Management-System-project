import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAuth';
import { DEPARTMENTS, ENTRY_TYPES } from '@/config/constants';
import { isValidMobile } from '@/utils';
import type { UserRole } from '@/types';

export function PhoneOnboardingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, currentUser, completePhoneOnboarding, loading, error, clearError } = useApp();
  const [phone, setPhone] = useState(((location.state as { phone?: string } | null)?.phone || currentUser?.mobile || session?.user.phone || '').replace(/^\+91/, '').replace(/\D/g, ''));

  const [role, setRole] = useState<UserRole>(() => { const r = typeof window !== 'undefined' ? localStorage.getItem('smart_campus_selected_role') : null; return r === 'staff' || r === 'other' ? r : 'student'; });
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [studentId, setStudentId] = useState(currentUser?.student_id || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [semester, setSemester] = useState(currentUser?.semester ? String(currentUser.semester) : '');
  const [program, setProgram] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [organization, setOrganization] = useState('');
  const [accessType, setAccessType] = useState('');
  const [localError, setLocalError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!session) {
    return <div className="p-8 text-center text-sm text-slate-500">Your OTP session has expired. Please login again.</div>;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); clearError(); setLocalError('');
    if (!fullName.trim()) return setLocalError('Please enter your full name.');
    if (!isValidMobile(phone)) return setLocalError('Enter a valid 10-digit Indian mobile number.');
    if (role === 'student' && (!studentId.trim() || !department)) return setLocalError('Student ID and department are required.');
    if (role === 'staff' && (!employeeId.trim() || !department)) return setLocalError('Staff ID and department are required.');
    if (role === 'other' && !accessType) return setLocalError('Select the type of access you need.');
    setSaving(true);
    try {
      const actualRole: UserRole = role === 'admin' ? 'other' : role;
      const updated = await completePhoneOnboarding({
        fullName: fullName.trim(), role: actualRole, requestedRole: role, phone: `+91${phone.replace(/\D/g, '')}`,
        studentId: role === 'student' ? studentId.trim() : null,
        department: department || null,
        semester: semester ? Number(semester) : null,
        program: program.trim() || null,
        employeeId: role === 'staff' ? employeeId.trim() : null,
        designation: designation.trim() || null,
        organization: organization.trim() || null,
        accessType: role === 'other' ? accessType : null,
      });
      navigate(updated?.accountStatus === 'approved' ? '/dashboard' : '/pending-approval', { replace: true });
      if (typeof window !== 'undefined') window.localStorage.removeItem('smart_campus_selected_role');
    } catch { /* context contains the error */ }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate('/login')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600"><ArrowLeft size={16}/> Back to login</button>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white"><ShieldCheck size={22}/></span><div><p className="font-bold text-slate-950">Complete your campus profile</p><p className="text-xs text-slate-500">Verified account • Choose your campus role and complete your details</p></div></div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><strong>Account policy:</strong> Student and College Staff accounts need one-time admin approval. Visitor / Outsider accounts can start using the app without approval.</div>
          {(localError || error) && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{localError || error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Full name *</label><input className="input" value={fullName} onChange={e=>setFullName(e.target.value)} /></div><div><label className="label">Mobile number *</label><input className="input" inputMode="numeric" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" /></div></div>
            <div><label className="label">Account type *</label><div className="grid gap-3 sm:grid-cols-3">{(['student','staff','other'] as UserRole[]).map(item=><button type="button" key={item} onClick={()=>setRole(item)} className={`rounded-xl border p-3 text-left text-sm font-semibold ${role===item?'border-purple-500 bg-purple-50 text-purple-700':'border-slate-200'}`}>{item==='student'?'Student':item==='staff'?'College Staff':'Other / Outsider'}</button>)}</div></div>
            {role==='student' && <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Student / Enrollment ID *</label><input className="input" value={studentId} onChange={e=>setStudentId(e.target.value)} /></div><div><label className="label">Department *</label><select className="input" value={department} onChange={e=>setDepartment(e.target.value)}><option value="">Select department</option>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div><div><label className="label">Program / Course</label><input className="input" value={program} onChange={e=>setProgram(e.target.value)} /></div><div><label className="label">Semester / Year</label><input className="input" type="number" min={1} max={12} value={semester} onChange={e=>setSemester(e.target.value)} /></div></div>}
            {role==='staff' && <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Employee / Staff ID *</label><input className="input" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} /></div><div><label className="label">Department *</label><select className="input" value={department} onChange={e=>setDepartment(e.target.value)}><option value="">Select department</option>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div><div className="sm:col-span-2"><label className="label">Designation</label><input className="input" placeholder="e.g. Assistant Professor" value={designation} onChange={e=>setDesignation(e.target.value)} /></div></div>}
            {role==='other' && <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label">Access type</label><select className="input" value={accessType} onChange={e=>setAccessType(e.target.value)}><option value="">Select access type</option>{ENTRY_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div className="sm:col-span-2"><label className="label">Organization / Company</label><input className="input" value={organization} onChange={e=>setOrganization(e.target.value)} /></div></div>}
            <button disabled={saving || loading} className="btn-primary w-full py-3.5">{saving ? 'Saving profile…' : <><CheckCircle2 size={18}/> Submit for approval</>}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
