import { ArrowLeft, Building2, ShieldCheck, UserRound, UsersRound, HardHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roles = [
  { key: 'student', title: 'Student', text: 'For students and campus members.', icon: UserRound, action: 'auth' },
  { key: 'staff', title: 'College Staff', text: 'For faculty and college staff.', icon: Building2, action: 'auth' },
  { key: 'other', title: 'Visitor / Outsider', text: 'For visitors, vendors and external users.', icon: UsersRound, action: 'auth' },
  { key: 'security', title: 'Security Guard', text: 'Authorized security account only.', icon: HardHat, action: 'login' },
  { key: 'admin', title: 'Admin', text: 'Authorized administrator account only.', icon: ShieldCheck, action: 'login' },
] as const;

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const choose = (role: string, action: string) => {
    localStorage.setItem('smart_campus_selected_role', role);
    navigate(action === 'login' ? `/login?role=${role}` : `/login?role=${role}`);
  };
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6"><div className="mx-auto max-w-xl"><button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Back</button><div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white"><ShieldCheck size={23}/></span><div><p className="font-bold">Smart Campus</p><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Token Management</p></div></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7"><p className="text-xs font-bold uppercase tracking-widest text-purple-600">Step 1 of 2</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Who are you?</h1><p className="mt-2 text-sm leading-6 text-slate-500">Choose your role first. We’ll show the appropriate login or account flow next.</p><div className="mt-6 space-y-3">{roles.map(({ key,title,text,icon:Icon,action }) => <button key={key} onClick={() => choose(key,action)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-purple-300 hover:bg-purple-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon size={21}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs text-slate-500">{text}</span></span><span className="text-lg text-slate-300">›</span></button>)}</div><p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Admin and Security are controlled accounts. They cannot be created through public registration.</p></div></div></main>;
}
