import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Check, ChevronRight, Edit3, GraduationCap, Image as ImageIcon,
  KeyRound, LogOut, Mail, Save, Shield, User as UserIcon,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { PageHeader } from '@/layouts/DashboardLayout';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { ROLE_LABEL, DEPARTMENTS } from '@/config/constants';
import { isValidMobile, isValidEmail } from '@/utils';
import { userService } from '@/services/userService';
import { getMyRoleChangeRequests, submitRoleChangeRequest } from '@/services/roleChangeService';
import type { RoleChangeRequest, UserRole } from '@/types';

const COLLEGE_DOMAIN = '@silveroakuni.ac.in';

// Put these files inside /public. Users can select any banner/logo from the profile appearance section.
const PROFILE_BANNERS = [
  '/profilebanner1.jpeg',
  '/profilebanner2.jpeg',
  '/profilebanner3.jpeg',
  '/profilebanner4.jpeg',
  '/profilebanner5.jpeg',
];

const CAMPUS_LOGOS = [
  '/logobanner1.png',
  '/logobanner2.png',
  '/logobanner3.png',
  '/logobanner4.png',
  '/logobanner5.png',
];

const FALLBACK_BANNER =
  'linear-gradient(120deg, #0f2747 0%, #135da8 55%, #20a7d8 100%)';

async function readImage(file: File, maxMB = 2) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WEBP image.');
  }
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`Image must be ${maxMB} MB or smaller.`);
  }
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Image could not be read.'));
    r.readAsDataURL(file);
  });
}

function completion(u: ReturnType<typeof useAuth>['user']) {
  if (!u) return 0;
  const fields = [
    u.full_name,
    u.mobile,
    u.gender,
    u.dateOfBirth,
    u.city,
    u.bio,
    u.studentId,
    u.department,
    u.program,
    u.batch,
    u.college,
    u.employeeId,
    u.designation,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function storageKey(userId: string, key: string) {
  return `smart-campus-profile-${userId}-${key}`;
}

export function ProfilePage() {
  const { user, updateUser, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState<'personal' | 'campus' | 'appearance' | null>(null);
  const [banner, setBanner] = useState(PROFILE_BANNERS[0]);
  const [logo, setLogo] = useState(CAMPUS_LOGOS[0]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [roleModal, setRoleModal] = useState(false);
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([]);
  const [role, setRole] = useState<UserRole>('other');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [idCard, setIdCard] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [roleError, setRoleError] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [brokenBanner, setBrokenBanner] = useState(false);
  const [brokenLogo, setBrokenLogo] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    mobile: user?.mobile ?? '',
    gender: user?.gender ?? '',
    date_of_birth: user?.dateOfBirth ?? '',
    city: user?.city ?? '',
    bio: user?.bio ?? '',
    department: user?.department ?? '',
    semester: user?.semester?.toString() ?? '',
    program: user?.program ?? '',
    batch: user?.batch ?? '',
    college: user?.college ?? '',
    employeeId: user?.employeeId ?? '',
    designation: user?.designation ?? '',
    show_photo_on_token: user?.showPhotoOnToken ?? true,
    show_name_on_token: user?.showNameOnToken ?? true,
    show_public_details: user?.showPublicDetails ?? false,
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.full_name ?? '',
      mobile: user.mobile ?? '',
      gender: user.gender ?? '',
      date_of_birth: user.dateOfBirth ?? '',
      city: user.city ?? '',
      bio: user.bio ?? '',
      department: user.department ?? '',
      semester: user.semester?.toString() ?? '',
      program: user.program ?? '',
      batch: user.batch ?? '',
      college: user.college ?? '',
      employeeId: user.employeeId ?? '',
      designation: user.designation ?? '',
      show_photo_on_token: user.showPhotoOnToken ?? true,
      show_name_on_token: user.showNameOnToken ?? true,
      show_public_details: user.showPublicDetails ?? false,
    });

    const savedBanner = localStorage.getItem(storageKey(user.id, 'banner'));
    const savedLogo = localStorage.getItem(storageKey(user.id, 'logo'));
    if (savedBanner && PROFILE_BANNERS.includes(savedBanner)) setBanner(savedBanner);
    if (savedLogo) { setLogo(savedLogo); setBrokenLogo(false); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void getMyRoleChangeRequests(user.id).then(setRoleRequests).catch(() => {});
  }, [user, roleModal]);

  if (!user) return null;

  const percent = completion(user);
  const collegeRole = role === 'student' || role === 'staff';
  const normalizedRole = String(user.role || 'other').toLowerCase();
  const isStudent = normalizedRole === 'student';
  const isStaff = ['staff', 'faculty', 'college_staff'].includes(normalizedRole);
  const isSecurity = normalizedRole === 'security';
  const isAdmin = normalizedRole === 'admin';
  const isCampusWorkRole = isStaff || isSecurity || isAdmin;
  const roleDetailTitle = isStudent ? 'Academic Information' : isCampusWorkRole ? 'Campus / Work Information' : 'Affiliation & Access Information';
  const roleDetailDescription = isStudent ? 'Your academic identity and enrollment details.' : isCampusWorkRole ? 'Your institutional role and work details.' : 'Your campus affiliation and access identity.';

  const saveAppearance = () => {
    localStorage.setItem(storageKey(user.id, 'banner'), banner);
    localStorage.setItem(storageKey(user.id, 'logo'), logo);
    setBrokenBanner(false);
    setBrokenLogo(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.full_name.trim().length < 2) return setFormError('Enter your full name.');
    if (!isValidMobile(form.mobile)) return setFormError('Enter a valid 10-digit mobile number.');
    if (form.bio.length > 280) return setFormError('Bio should be 280 characters or fewer.');

    setSaving(true);
    try {
      await updateUser({
        full_name: form.full_name.trim(),
        mobile: form.mobile.trim(),
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        city: form.city.trim() || null,
        bio: form.bio.trim() || null,
        department: form.department || null,
        semester: form.semester ? Number(form.semester) : null,
        program: form.program.trim() || null,
        batch: form.batch.trim() || null,
        college: form.college.trim() || null,
        employee_id: form.employeeId.trim() || null,
        staff_id: form.employeeId.trim() || null,
        designation: form.designation.trim() || null,
        show_photo_on_token: form.show_photo_on_token,
        show_name_on_token: form.show_name_on_token,
        show_public_details: form.show_public_details,
      });
      saveAppearance();
      setEditing(false);
      setSection(null);
      notify('Profile updated successfully.');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };


  const chooseLogo = async (file?: File) => {
    if (!file) return;
    try {
      setLogo(await readImage(file, 2));
      setBrokenLogo(false);
      notify('Logo selected. Click Save Changes to keep it.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Unable to use this logo.', 'error');
    }
  };

  const requestRole = async (e: FormEvent) => {
    e.preventDefault();
    setRoleError('');
    if (role === user.role) return setRoleError('Choose a different role.');

    if (collegeRole) {
      const email = verificationEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return setRoleError('Enter a valid verification email.');
      if (!email.endsWith(COLLEGE_DOMAIN) && !idCard) {
        return setRoleError(`For ${ROLE_LABEL[role]} role, use your ${COLLEGE_DOMAIN} email or submit a college ID card image.`);
      }
    }

    setRoleSaving(true);
    try {
      await submitRoleChangeRequest({
        requestedRole: role,
        verificationEmail: verificationEmail.trim().toLowerCase(),
        verificationMethod: collegeRole && verificationEmail.toLowerCase().endsWith(COLLEGE_DOMAIN)
          ? 'college_email'
          : collegeRole
            ? 'id_card'
            : 'standard',
        idCardImage: idCard,
        reason,
      });
      notify('Role change request sent to Admin.');
      setRoleModal(false);
      setReason('');
      setIdCard(null);
      setRoleRequests(await getMyRoleChangeRequests(user.id));
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : 'Unable to submit request.');
    } finally {
      setRoleSaving(false);
    }
  };

  const logout = () => {
    void signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <PageHeader
          title="My Profile"
          subtitle="Your professional Smart Campus identity. Personal details remain private unless you choose to share them."
        />

        {/* PROFILE HERO */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-48 overflow-hidden sm:h-56">
            {!brokenBanner ? (
              <img
                src={banner}
                alt="Campus profile banner"
                className="h-full w-full object-cover"
                onError={() => setBrokenBanner(true)}
              />
            ) : (
              <div className="h-full w-full" style={{ background: FALLBACK_BANNER }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/30 to-blue-900/45" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                <Shield size={14} /> Smart Campus Identity
              </div>
              <p className="mt-1 text-sm text-white/90">Learn · Build · Grow · Access securely</p>
            </div>
          </div>

          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-end gap-5">
                <div className="relative shrink-0">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-32 sm:w-32">
                    {!brokenLogo ? (
                      <img
                        src={logo || CAMPUS_LOGOS[0]}
                        alt="Campus logo"
                        className="h-full w-full object-contain bg-slate-50 p-4"
                        onError={() => setBrokenLogo(true)}
                      />
                    ) : (
                      <img
                        src={CAMPUS_LOGOS[0]}
                        alt="Campus logo"
                        className="h-full w-full object-contain bg-slate-50 p-4"
                      />
                    )}
                  </div>

                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-2xl font-extrabold text-slate-950 sm:text-3xl">{user.full_name}</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      <Shield size={13} /> {ROLE_LABEL[user.role]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {user.program || (isStudent ? 'B.Tech' : 'Campus Member')}
                    {user.department ? ` · ${user.department}` : ''}
                    {user.semester ? ` · Semester ${user.semester}` : ''}
                  </p>
                  {user.college && (
                    <p className="mt-1 text-sm text-slate-500">{user.college}{user.city ? ` · ${user.city}` : ''}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:pb-1">
                <button
                  onClick={() => { setEditing(true); setSection('personal'); }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button
                  onClick={() => setRoleModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
                >
                  <Users size={16} /> Request Role Change
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* COMPLETION */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <path d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <path d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831" fill="none" stroke="#1677e8" strokeWidth="3" strokeDasharray={`${percent},100`} strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-900">{percent}%</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-extrabold text-slate-900">Profile Completion</p>
              <p className="mt-1 text-sm text-slate-500">
                {percent < 100 ? 'Complete your profile with optional details when you are ready.' : 'Your profile is fully completed.'}
              </p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <button
              onClick={() => { setEditing(true); setSection('personal'); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Complete Profile <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* INFORMATION GRID — role-aware, no duplicate fields */}
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <div className="grid gap-5 md:grid-cols-2">
              <InfoCard
                icon={<UserIcon size={18} />}
                title="Personal Information"
                description="Basic identity details"
                onEdit={() => { setEditing(true); setSection('personal'); }}
              >
                <InfoLine label="Full Name" value={user.full_name} />
                <InfoLine label="Gender" value={user.gender || 'Not added'} />
                <InfoLine label="Date of Birth" value={user.dateOfBirth || 'Not added'} />
                <InfoLine label="City" value={user.city || 'Not added'} />
                <InfoLine label="About" value={user.bio || 'Add a short professional introduction.'} multiline />
              </InfoCard>

              <InfoCard
                icon={<Mail size={18} />}
                title="Contact & Account"
                description="Reachability and account identity"
                onEdit={() => { setEditing(true); setSection('personal'); }}
              >
                <InfoLine label="Email" value={user.email} />
                <InfoLine label="Mobile" value={user.mobile || 'Not added'} />
                <InfoLine label="Account Role" value={ROLE_LABEL[user.role]} />
                <InfoLine label="Account ID" value={user.id} compact />
              </InfoCard>
            </div>

            <InfoCard
              icon={isStudent ? <GraduationCap size={18} /> : <Shield size={18} />}
              title={roleDetailTitle}
              description={roleDetailDescription}
              onEdit={() => { setEditing(true); setSection('campus'); }}
            >
              {isStudent ? (
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  <InfoLine label="Enrollment No." value={user.studentId || 'Not available'} />
                  <InfoLine label="Department" value={user.department || 'Not added'} />
                  <InfoLine label="Program" value={user.program || 'Not added'} />
                  <InfoLine label="Semester" value={user.semester ? String(user.semester) : 'Not added'} />
                  <InfoLine label="Batch" value={user.batch || 'Not added'} />
                  <InfoLine label="College" value={user.college || 'Not added'} />
                </div>
              ) : isCampusWorkRole ? (
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  <InfoLine label="Employee ID" value={user.employeeId || 'Not added'} />
                  <InfoLine label="Department" value={user.department || 'Not added'} />
                  <InfoLine label="Designation" value={user.designation || 'Not added'} />
                  <InfoLine label="College" value={user.college || 'Not added'} />
                </div>
              ) : (
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  <InfoLine label="Affiliation" value={user.college || 'Not added'} />
                  <InfoLine label="Access Role" value={ROLE_LABEL[user.role]} />
                  <InfoLine label="Location" value={user.city || 'Not added'} />
                  <InfoLine label="Profile Status" value="Active campus profile" />
                </div>
              )}
            </InfoCard>
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-purple-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><ImageIcon size={19} /></span>
                  <div><h3 className="font-extrabold text-slate-900">Profile Edit Pic</h3><p className="text-xs text-slate-500">Customize your banner and profile logo</p></div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img src={logo || CAMPUS_LOGOS[0]} alt="Campus logo" className="h-full w-full object-contain bg-slate-50 p-2" onError={() => setBrokenLogo(true)} />
                  </div>
                  <div className="min-w-0"><p className="text-sm font-bold text-slate-800">Personalized identity</p><p className="text-xs text-slate-500">Your choices are saved per account.</p></div>
                </div>
                <button onClick={() => { setEditing(true); setSection('appearance'); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
                  <Edit3 size={16} /> Edit Appearance
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Shield size={19} /></span>
                  <div><h3 className="font-extrabold text-slate-900">Campus Access</h3><p className="text-xs text-slate-500">Your current verified role</p></div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Role</span>
                  <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">{ROLE_LABEL[user.role]}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">Need a different campus role? Submit a request and provide the required verification.</p>
                <button onClick={() => setRoleModal(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
                  Request Role Change <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-extrabold text-slate-900">Role Request History</h3><p className="mt-1 text-xs text-slate-500">Your verification history</p></div>
                <button onClick={() => setRoleModal(true)} className="text-xs font-bold text-blue-600 hover:underline">New request</button>
              </div>
              {roleRequests.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No role change requests yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {roleRequests.slice(0, 4).map(r => (
                    <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-700">{ROLE_LABEL[r.current_role]} → <span className="text-blue-700">{ROLE_LABEL[r.requested_role]}</span></p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : r.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
                      <p className="mt-1 text-xs text-slate-500">Verification: {r.verification_method || 'standard'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex gap-3">
                <Shield className="mt-0.5 shrink-0 text-blue-600" size={19} />
                <div><h3 className="font-extrabold text-slate-900">Security & Privacy</h3><p className="mt-1 text-xs leading-5 text-slate-600">Personal information is used for campus verification and token services. Sensitive information stays private by default.</p></div>
              </div>
              <button onClick={() => setPwModal(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"><KeyRound size={16} /> Change Password</button>
            </section>
          </aside>
        </div>
      </div>

      {/* EDIT PROFILE */}
      <Modal
        open={editing}
        onClose={() => { setEditing(false); setSection(null); }}
        title="Edit your campus profile"
        size="lg"
        footer={
          <>
            <button onClick={() => { setEditing(false); setSection(null); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
            <button form="profile-edit" type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {saving ? <Spinner size={16} className="text-white" /> : <Save size={16} />} Save Changes
            </button>
          </>
        }
      >
        <form id="profile-edit" onSubmit={save} className="max-h-[72vh] space-y-6 overflow-y-auto pr-1">
          {formError && <Alert variant="error">{formError}</Alert>}

          {(section === 'personal' || !section) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <h4 className="text-base font-extrabold text-slate-900">Personal Information</h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full Name *"><input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></Field>
                <Field label="Mobile *"><input className="input" maxLength={10} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} /></Field>
                <Field label="Gender · Optional"><select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option></select></Field>
                <Field label="Date of Birth · Optional"><input type="date" className="input" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} /></Field>
                <div className="sm:col-span-2"><Field label="City / Location · Optional"><input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ahmedabad" /></Field></div>
                <div className="sm:col-span-2"><Field label="About Me · Optional"><textarea className="input min-h-24 resize-y" maxLength={280} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="A short professional introduction…" /><p className="mt-1 text-right text-[10px] text-slate-400">{form.bio.length}/280</p></Field></div>
              </div>
            </div>
          )}

          {(section === 'campus' || !section) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <h4 className="text-base font-extrabold text-slate-900">{roleDetailTitle}</h4>
              <p className="mt-1 text-xs text-slate-500">{roleDetailDescription}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {isStudent ? <>
                  <Field label="Enrollment / Student ID"><input className="input bg-slate-100" value={user.studentId ?? ''} readOnly /></Field>
                  <Field label="Department"><select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}><option value="">Select</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></Field>
                  <Field label="Program / Course"><input className="input" value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} placeholder="B.Tech IT" /></Field>
                  <Field label="Semester"><input type="number" min={1} max={12} className="input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} /></Field>
                  <Field label="Batch · Optional"><input className="input" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} placeholder="2023–2027" /></Field>
                  <Field label="College / University · Optional"><input className="input" value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} placeholder="Silver Oak University" /></Field>
                </> : isCampusWorkRole ? <>
                  <Field label="Employee ID"><input className="input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} /></Field>
                  <Field label="Department"><select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}><option value="">Select</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></Field>
                  <Field label="Designation"><input className="input" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Faculty / Staff / Security" /></Field>
                  <Field label="College · Optional"><input className="input" value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} placeholder="Silver Oak University" /></Field>
                </> : <>
                  <Field label="Affiliation / Organization · Optional"><input className="input" value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} placeholder="Company / Organization / Visitor affiliation" /></Field>
                  <Field label="Profile Location · Optional"><input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ahmedabad" /></Field>
                </>}
              </div>
            </div>
          )}

          {(section === 'appearance' || !section) && (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div>
                <div className="flex items-center justify-between gap-3"><h4 className="text-base font-extrabold text-slate-900">Profile Edit Pic</h4><span className="text-xs font-semibold text-slate-500">Choose your banner and profile logo</span></div>

                <p className="mt-4 text-sm font-bold text-slate-800">Profile Banner</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PROFILE_BANNERS.map((src, index) => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => { setBanner(src); setBrokenBanner(false); }}
                      className={`group relative h-24 overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5 ${banner === src ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent'}`}
                    >
                      <img src={src} alt={`Profile banner ${index + 1}`} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.opacity = '0'; }} />
                      <div className="absolute inset-0 bg-slate-950/10 transition group-hover:bg-slate-950/0" />
                      {banner === src && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"><Check size={14} /></span>}
                      <span className="absolute bottom-1.5 left-2 rounded bg-slate-950/60 px-1.5 py-0.5 text-[9px] font-bold text-white">Banner {index + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">Profile Logo</p>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {CAMPUS_LOGOS.map((src, index) => (
                    <button type="button" key={src} onClick={() => { setLogo(src); setBrokenLogo(false); }} className={`relative flex h-20 items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-2 transition hover:-translate-y-0.5 ${logo === src ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                      <img src={src} alt={`Campus logo ${index + 1}`} className="h-full w-full object-contain" onError={e => { e.currentTarget.style.opacity = '0'; }} />
                      {logo === src && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"><Check size={12} /></span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-bold text-slate-800">Use your own logo</p><p className="mt-1 text-xs text-slate-500">Choose any JPG, PNG or WEBP from your gallery · up to 2 MB.</p></div>
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
                    <Camera size={15} /> Upload
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => void chooseLogo(e.target.files?.[0])} />
                  </label>
                </div>
                {logo && <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><img src={logo} alt="Selected logo preview" className="h-12 w-12 rounded-lg object-contain bg-white p-1" /><span className="text-xs font-semibold text-slate-600">Selected logo preview</span></div>}
              </div>

            </div>
          )}
        </form>
      </Modal>

      {/* ROLE CHANGE */}
      <Modal
        open={roleModal}
        onClose={() => setRoleModal(false)}
        title="Request a role change"
        size="md"
        footer={
          <>
            <button onClick={() => setRoleModal(false)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
            <button form="role-change-form" type="submit" disabled={roleSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {roleSaving ? <Spinner size={16} className="text-white" /> : <ChevronRight size={17} />} Send Request
            </button>
          </>
        }
      >
        <form id="role-change-form" onSubmit={requestRole} className="space-y-4">
          {roleError && <Alert variant="error">{roleError}</Alert>}
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-bold">Current role: {ROLE_LABEL[user.role]}</p>
            <p className="mt-1 text-xs text-blue-700">Your role changes only after an administrator reviews and approves the request.</p>
          </div>
          <Field label="Requested role *">
            <select className="input" value={role} onChange={e => { setRole(e.target.value as UserRole); }}>
              <option value="student">Student</option>
              <option value="staff">College Staff / Faculty</option>
              <option value="other">Other / Outsider</option>
            </select>
          </Field>
          {(role === 'student' || role === 'staff') && (
            <div className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div><p className="text-sm font-bold text-sky-900">College identity verification</p><p className="mt-1 text-xs leading-5 text-sky-800">Use your official <strong>{COLLEGE_DOMAIN}</strong> email. If unavailable, provide a clear college ID card.</p></div>
              <input type="email" className="input" value={verificationEmail} onChange={e => setVerificationEmail(e.target.value)} placeholder="your-id@silveroakuni.ac.in" />
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-white p-3 text-sm font-semibold text-sky-800"><Camera size={16} />{idCard ? 'ID card selected' : 'Capture / upload ID card'}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={async e => { try { setIdCard(e.target.files?.[0] ? await readImage(e.target.files[0], 5) : null); } catch (err) { setRoleError(err instanceof Error ? err.message : 'Unable to read ID card.'); } }} /></label>
            </div>
          )}
          <Field label="Reason · Optional"><textarea className="input min-h-24" maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell the administrator why you need this role…" /></Field>
        </form>
      </Modal>

      {/* PASSWORD */}
      <Modal
        open={pwModal}
        onClose={() => setPwModal(false)}
        title="Change Password"
        size="sm"
        footer={
          <>
            <button onClick={() => setPwModal(false)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
            <button form="pw-form" type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"><KeyRound size={16} /> Update Password</button>
          </>
        }
      >
        <form id="pw-form" onSubmit={async e => { e.preventDefault(); if (pw.next.length < 8) return notify('New password must be at least 8 characters.', 'error'); if (pw.next !== pw.confirm) return notify('Passwords do not match.', 'error'); try { await userService.changePassword(user.id, pw.current, pw.next); setPwModal(false); setPw({ current: '', next: '', confirm: '' }); notify('Password changed successfully.'); } catch (err) { notify(err instanceof Error ? err.message : 'Unable to change password.', 'error'); } }} className="space-y-3">
          <Field label="Current Password"><input type="password" className="input" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} /></Field>
          <Field label="New Password"><input type="password" className="input" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} /></Field>
          <Field label="Confirm New Password"><input type="password" className="input" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} /></Field>
        </form>
      </Modal>
    </div>
  );
}

function InfoCard({ icon, title, description, onEdit, children }: { icon: ReactNode; title: string; description?: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</span><div className="min-w-0"><h3 className="truncate font-extrabold text-slate-900">{title}</h3>{description && <p className="mt-0.5 truncate text-[11px] text-slate-500">{description}</p>}</div></div>
        <button onClick={onEdit} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-800">Edit <ChevronRight size={15} /></button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function InfoLine({ label, value, multiline = false, compact = false }: { label: string; value: string; multiline?: boolean; compact?: boolean }) {
  return <div className={`grid ${compact ? 'grid-cols-[90px_1fr]' : 'grid-cols-[120px_1fr]'} gap-3 text-sm`}><span className="text-slate-500">{label}</span><span className={`${multiline ? 'leading-6 break-words' : 'truncate'} font-semibold text-slate-800`} title={value}>{value}</span></div>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"><span className="text-sm font-semibold text-slate-700">{label}</span><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} /></button></label>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label>{children}</div>;
}
