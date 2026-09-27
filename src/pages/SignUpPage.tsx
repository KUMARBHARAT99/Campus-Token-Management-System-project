import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  User,
  Users,
  UserRoundCog,
  X,
  ScanLine,
  AlertTriangle,
} from 'lucide-react';


import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAuth';
import { DEPARTMENTS, ENTRY_TYPES } from '@/config/constants';
import type { UserRole } from '@/types';
import { isValidMobile, isValidEmail } from '@/utils';


/* =========================================================
   ROLES
========================================================= */

const ROLES: {
  value: UserRole;
  title: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    value: 'student',
    title: 'Student',
    description: 'Enrolled student / learner',
    icon: User,
  },
  {
    value: 'staff',
    title: 'College Staff',
    description: 'Faculty or authorized employee',
    icon: Users,
  },
  {
    value: 'admin',
    title: 'Admin Request',
    description: 'Request restricted administrator access',
    icon: UserRoundCog,
  },
  {
    value: 'other',
    title: 'Other / Outsider',
    description: 'Visitor, parent, vendor or external user',
    icon: Users,
  },
];


/* =========================================================
   ROLE FROM URL
========================================================= */

function getInitialRole(search: string): UserRole {
  const value =
    new URLSearchParams(search).get('role') ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('smart_campus_selected_role')
      : null);

  return value === 'staff' || value === 'other'
    ? value
    : 'student';
}


/* =========================================================
   PHONE
========================================================= */

function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '');

  const local =
    digits.startsWith('91') && digits.length === 12
      ? digits.slice(2)
      : digits;

  return local.length === 10
    ? `+91${local}`
    : value.trim();
}


/* =========================================================
   MAIN SIGNUP
========================================================= */

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    signUpWithEmail,
    loading,
    error,
    clearError,
  } = useApp();


  /* =======================================================
     FORM STATE
  ======================================================= */

  const [role, setRole] = useState<UserRole>(
    getInitialRole(location.search),
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [program, setProgram] = useState('');

  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');

  const [organization, setOrganization] = useState('');
  const [accessType, setAccessType] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [localError, setLocalError] =
    useState('');

  const actualRole: UserRole =
    role === 'admin' || role === 'security'
      ? 'other'
      : role;

  const cleanDepartment =
    department === 'Other'
      ? customDepartment.trim()
      : department;


  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    clearError();
    setLocalError('');

    const cleanName =
      fullName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanMobile =
      normalizeIndianPhone(mobile);


    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

    if (cleanName.length < 2) {
      setLocalError(
        'Please enter your full name.',
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setLocalError(
        'Please enter a valid email address.',
      );
      return;
    }


    if (
      !isValidMobile(cleanMobile)
    ) {
      setLocalError(
        'Enter a valid 10-digit Indian mobile number.',
      );
      return;
    }


    /* -------------------------------------------------------
       STUDENT
    ------------------------------------------------------- */

    if (
      role === 'student' &&
      (
        !studentId.trim() ||
        !cleanDepartment
      )
    ) {
      setLocalError(
        'Student ID and department are required.',
      );
      return;
    }


    /* -------------------------------------------------------
       STAFF
    ------------------------------------------------------- */

    if (
      role === 'staff' &&
      (
        !employeeId.trim() ||
        !cleanDepartment ||
        !designation.trim()
      )
    ) {
      setLocalError(
        'Staff ID, department and designation are required.',
      );
      return;
    }


    /* -------------------------------------------------------
       OTHER
    ------------------------------------------------------- */

    if (
      role === 'other' &&
      !accessType
    ) {
      setLocalError(
        'Select the type of access you need.',
      );
      return;
    }


    /* -------------------------------------------------------
       PASSWORD
    ------------------------------------------------------- */

    if (password.length < 8) {
      setLocalError(
        'Password must contain at least 8 characters.',
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      setLocalError(
        'Password and confirm password do not match.',
      );
      return;
    }


    setSubmitting(true);


    try {
      await signUpWithEmail(
        cleanEmail,
        password,
        {
          fullName: cleanName,

          role: actualRole,

          requestedRole: role,

          phone: cleanMobile,

          studentId:
            role === 'student'
              ? studentId.trim()
              : null,

          department:
            cleanDepartment || null,

          semester:
            semester
              ? Number(semester)
              : null,

          program:
            program.trim() || null,

          employeeId:
            role === 'staff'
              ? employeeId.trim()
              : null,

          designation:
            designation.trim() || null,

          organization:
            organization.trim() || null,

          accessType:
            role === 'other'
              ? accessType
              : null,

          college:
            organization.trim() || null,

        },
      );

      navigate('/pending-approval', {
        replace: true,
      });
    } catch {
      /* Auth context stores the error */
    } finally {
      setSubmitting(false);
    }
  };


  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <>

      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">

        <div className="mx-auto max-w-5xl">

          <button
            type="button"
            onClick={() =>
              navigate('/select-role')
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>


          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[.72fr_1.28fr]">

            {/* =================================================
                LEFT PANEL
            ================================================= */}

            <aside className="hidden bg-purple-950 p-8 text-white lg:block">

              <div className="flex items-center gap-3">

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600">
                  <ShieldCheck size={23} />
                </span>

                <div>
                  <p className="font-bold">
                    Smart Campus
                  </p>

                  <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-slate-400">
                    Token Management
                  </p>
                </div>

              </div>


              <div className="mt-16">

                <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-400">
                  Secure registration
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight">
                  Request your campus access account.
                </h1>

                <p className="mt-5 text-sm leading-7 text-slate-400">
                  Create your account with your email and password.
                  New accounts are sent for administrator approval.
                </p>                 <div className="mt-8 space-y-3 text-sm text-slate-300">
                   <p>✓ Simple email &amp; password signup</p>
                   <p>✓ Admin approval for every new account</p>
                   <p>✓ One approval request reminder</p>
                 </div>

              </div>

            </aside>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="p-5 sm:p-8">

              <div className="mb-6 flex items-center gap-3 lg:hidden">

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <ShieldCheck size={21} />
                </span>

                <div>
                  <p className="font-bold">
                    Smart Campus
                  </p>

                  <p className="text-[9px] uppercase tracking-[.18em] text-slate-400">
                    Token Management
                  </p>
                </div>

              </div>


              <p className="text-xs font-bold uppercase tracking-[.18em] text-purple-600">
                New account
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete the details below. You will verify your
                email with a 6-digit OTP next.
              </p>


              {(localError || error) && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="flex gap-2">
                    <AlertTriangle
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {localError || error}
                    </span>
                  </div>
                </div>
              )}


              <form
                onSubmit={submit}
                className="mt-7 space-y-5"
              >

                {/* =================================================
                    ACCOUNT TYPE
                ================================================= */}

                <div>

                  <label className="label">
                    Account type *
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">

                    {ROLES
                      .filter(
                        (item) =>
                          item.value !== 'admin' &&
                          item.value !== 'security',
                      )
                      .map((item) => {

                        const Icon =
                          item.icon;

                        const active =
                          role === item.value;

                        return (
                          <button
                            type="button"
                            key={item.value}
                            onClick={() => {
                              setRole(
                                item.value,
                              );

                              setLocalError(
                                '',
                              );                            }}
                            className={`rounded-2xl border p-4 text-left transition ${
                              active
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/10'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >

                            <div className="flex items-center justify-between">

                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  active
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <Icon size={18} />
                              </span>

                              {active && (
                                <CheckCircle2
                                  size={18}
                                  className="text-purple-600"
                                />
                              )}

                            </div>

                            <p className="mt-3 text-sm font-bold text-slate-900">
                              {item.title}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-500">
                              {item.description}
                            </p>

                          </button>
                        );
                      })}

                  </div>

                </div>


                {/* =================================================
                    BASIC DETAILS
                ================================================= */}

                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="sm:col-span-2">

                    <label className="label">
                      Full name *
                    </label>

                    <input
                      className="input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />

                  </div>


                  <div>

                    <label className="label">
                      Email *
                    </label>

                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(
                          e.target.value,
                        );
                        setLocalError('');
                      }}
                      placeholder="you@example.com"
                    />

                  </div>


                  <div>

                    <label className="label">
                      Mobile *
                    </label>

                    <input
                      className="input"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) =>
                        setMobile(
                          e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 10),
                        )
                      }
                      placeholder="10-digit mobile"
                    />

                  </div>

                </div>


                {/* =================================================
                    STUDENT DETAILS
                ================================================= */}

                {role === 'student' && (

                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">

                    <div>

                      <label className="label">
                        Student / Enrollment ID *
                      </label>

                      <input
                        className="input"
                        value={studentId}
                        onChange={(e) =>
                          setStudentId(
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 2301031000005"
                      />

                    </div>


                    <div>

                      <label className="label">
                        Department *
                      </label>

                      <select
                        className="input"
                        value={department}
                        onChange={(e) =>
                          setDepartment(
                            e.target.value,
                          )
                        }
                      >
                        <option value="">
                          Select department
                        </option>

                        {DEPARTMENTS.map(
                          (d) => (
                            <option
                              key={d}
                            >
                              {d}
                            </option>
                          ),
                        )}

                      </select>


                      {department ===
                        'Other' && (

                        <input
                          className="input mt-2"
                          value={
                            customDepartment
                          }
                          onChange={(e) =>
                            setCustomDepartment(
                              e.target.value,
                            )
                          }
                          placeholder="Enter your department"
                        />

                      )}

                    </div>


                    <div>

                      <label className="label">
                        Program / Course
                      </label>

                      <input
                        className="input"
                        value={program}
                        onChange={(e) =>
                          setProgram(
                            e.target.value,
                          )
                        }
                        placeholder="B.Tech IT"
                      />

                    </div>


                    <div>

                      <label className="label">
                        Semester / Year
                      </label>

                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={12}
                        value={semester}
                        onChange={(e) =>
                          setSemester(
                            e.target.value,
                          )
                        }
                        placeholder="6"
                      />

                    </div>

                  </div>
                )}


                {/* =================================================
                    STAFF DETAILS
                ================================================= */}

                {role === 'staff' && (

                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">

                    <div>

                      <label className="label">
                        Employee / Staff ID *
                      </label>

                      <input
                        className="input"
                        value={employeeId}
                        onChange={(e) =>
                          setEmployeeId(
                            e.target.value,
                          )
                        }
                        placeholder="Employee ID"
                      />

                    </div>


                    <div>

                      <label className="label">
                        Department *
                      </label>

                      <select
                        className="input"
                        value={department}
                        onChange={(e) =>
                          setDepartment(
                            e.target.value,
                          )
                        }
                      >

                        <option value="">
                          Select department
                        </option>

                        {DEPARTMENTS.map(
                          (d) => (
                            <option
                              key={d}
                            >
                              {d}
                            </option>
                          ),
                        )}

                      </select>


                      {department ===
                        'Other' && (

                        <input
                          className="input mt-2"
                          value={
                            customDepartment
                          }
                          onChange={(e) =>
                            setCustomDepartment(
                              e.target.value,
                            )
                          }
                          placeholder="Enter your department"
                        />

                      )}

                    </div>


                    <div className="sm:col-span-2">

                      <label className="label">
                        Designation *
                      </label>

                      <input
                        className="input"
                        value={designation}
                        onChange={(e) =>
                          setDesignation(
                            e.target.value,
                          )
                        }
                        placeholder="Assistant Professor / Staff"
                      />

                    </div>

                  </div>
                )}


                {/* =================================================
                    OTHER
                ================================================= */}

                {role === 'other' && (

                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">

                    <div className="sm:col-span-2">

                      <label className="label">
                        Access type *
                      </label>

                      <select
                        className="input"
                        value={accessType}
                        onChange={(e) =>
                          setAccessType(
                            e.target.value,
                          )
                        }
                      >

                        <option value="">
                          Select why you need access
                        </option>

                        {ENTRY_TYPES.map(
                          (t) => (
                            <option
                              key={t.value}
                              value={t.value}
                            >
                              {t.label}
                            </option>
                          ),
                        )}

                      </select>

                    </div>


                    <div className="sm:col-span-2">

                      <label className="label">
                        Organization / Company
                      </label>

                      <input
                        className="input"
                        value={organization}
                        onChange={(e) =>
                          setOrganization(
                            e.target.value,
                          )
                        }
                        placeholder="Optional"
                      />

                    </div>

                  </div>
                )}


                {/* =================================================
                    PASSWORD
                ================================================= */}

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>

                    <label className="label">
                      Password *
                    </label>

                    <div className="relative">

                      <input
                        className="input pr-10"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={(e) =>
                          setPassword(
                            e.target.value,
                          )
                        }
                        placeholder="At least 8 characters"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (v) => !v,
                          )
                        }
                        className="absolute right-3 top-2.5 text-slate-400"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>


                  <div>

                    <label className="label">
                      Confirm password *
                    </label>

                    <div className="relative">

                      <input
                        className="input pr-10"
                        type={
                          showConfirm
                            ? 'text'
                            : 'password'
                        }
                        value={
                          confirmPassword
                        }
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value,
                          )
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirm(
                            (v) => !v,
                          )
                        }
                        className="absolute right-3 top-2.5 text-slate-400"
                      >
                        {showConfirm ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    SUBMIT
                ================================================= */}

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {submitting ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowRight
                      size={18}
                    />
                  )}

                  {submitting
                    ? 'Creating account…'
                    : 'Create account & request approval'}

                </button>

              </form>


              <p className="mt-5 text-center text-sm text-slate-500">

                Already have an account?{' '}

                <button
                  type="button"
                  onClick={() =>
                    navigate('/login')
                  }
                  className="font-bold text-purple-600 hover:underline"
                >
                  Login
                </button>

              </p>

            </main>

          </div>

        </div>

      </div>
    </>
  );
}


export { SignUpPage as Signup };