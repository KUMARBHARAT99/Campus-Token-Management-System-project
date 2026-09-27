import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ScanFace, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { PageHeader } from '@/layouts/DashboardLayout';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { DemoPaymentModal } from '@/components/DemoPaymentModal';
import { tokenService } from '@/services/tokenService';
import { sendTokenEmail } from '@/services/emailService';
import {
  CAMPUS_LOCATIONS,
  getEntryTypesForRole,
  FREE_TOKEN_LIMIT,
  EXTRA_TOKEN_FEE,
} from '@/config/constants';
import { isValidMobile, todayISO } from '@/utils';
import type { EntryType, RequestTokenData } from '@/types';

// Entry types that are typically student-related (show host fields).
const STUDENT_RELATED: EntryType[] = [
  'parent_guardian',
  'visitor',
  'event',
  'restricted_lab',
  'after_hours',
];

export function RequestTokenPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<RequestTokenData>({
    visitor_name: '',
    visitor_mobile: '',
    entry_type: 'parent_guardian',
    purpose: '',
    date: todayISO(),
    entry_time: '09:00',
    exit_time: '17:00',
    location: CAMPUS_LOCATIONS[0],
    vehicle_number: '',
    notes: '',
    student_name: user?.full_name,
    student_id_no: user?.student_id ?? undefined,
    student_department: user?.department ?? undefined,
    student_semester: user?.semester ?? undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [payment, setPayment] = useState<{ open: boolean; requestId?: string; fee: number }>({ open: false, fee: 0 });

  const [usage, setUsage] = useState({ used: 0, remaining: FREE_TOKEN_LIMIT });

  useEffect(() => {
    if (!user) return;
    void tokenService.getFreeUsage(user.id).then(setUsage).catch(() => setUsage({ used: 0, remaining: FREE_TOKEN_LIMIT }));
    const allowed = getEntryTypesForRole(user.role);
    if (allowed.length && !allowed.some((item) => item.value === form.entry_type)) {
      setForm((current) => ({ ...current, entry_type: allowed[0].value }));
    }
  }, [user, form.entry_type]);
  const showStudentFields = STUDENT_RELATED.includes(form.entry_type);
  const isCollegeUser = user?.role === 'student' || user?.role === 'staff';
  const availableEntryTypes = user ? getEntryTypesForRole(user.role) : [];

  const set = <K extends keyof RequestTokenData>(key: K, value: RequestTokenData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.visitor_name.trim()) e.visitor_name = 'Visitor name is required.';
    if (!isValidMobile(form.visitor_mobile)) e.visitor_mobile = 'Enter a valid 10-digit mobile number.';
    if (!form.purpose.trim()) e.purpose = 'Purpose of visit is required.';
    if (!form.date) e.date = 'Date is required.';
    if (!form.entry_time) e.entry_time = 'Entry time is required.';
    if (!form.exit_time) e.exit_time = 'Exit time is required.';
    if (form.entry_time && form.exit_time && form.entry_time >= form.exit_time) {
      e.exit_time = 'Exit time must be after entry time.';
    }
    if (showStudentFields && user?.role === 'student') {
      if (!form.student_name?.trim()) e.student_name = 'Student name is required.';
      if (!form.student_id_no?.trim()) e.student_id_no = 'Student ID is required.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) {
      notify('Please fix the highlighted fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await tokenService.createRequest(user.id, form);
      // Do not email an unpaid request. Free requests can be emailed immediately;
      // paid requests are emailed only after the demo payment succeeds.
      if (!result.paymentRequired) {
        void sendTokenEmail(result.request.id).catch(() => undefined);
      }
      if (result.paymentRequired) {
        setPayment({ open: true, requestId: result.request.id, fee: result.fee });
      } else {
        notify('Token request created. Complete the face capture to finish the request.');
        navigate(`/tokens/${result.request.id}/face-capture`);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to submit request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (!payment.requestId) return;
    setPayment({ open: false, fee: 0 });
    navigate(`/tokens/${payment.requestId}/face-capture`);
  };

  const errClass = (key: string) => (errors[key] ? 'input-error' : '');

  return (
    <div>
      <Link to="/dashboard" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
      <PageHeader
        title="Request a Token"
        subtitle="Submit a temporary campus entry request for verification."
      />

      {/* Free token notice */}
      {isCollegeUser && (
        <Alert variant={usage.remaining > 0 ? 'info' : 'warning'} className="mb-5">
          {usage.remaining > 0 ? (
            <>You have <strong>{usage.remaining}</strong> free special-entry request{usage.remaining === 1 ? '' : 's'} remaining (out of {FREE_TOKEN_LIMIT}).</>
          ) : (
            <>You have used your {FREE_TOKEN_LIMIT} free requests. Additional requests require a fee of <strong>₹{EXTRA_TOKEN_FEE}</strong>.</>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry type */}
        <section className="card-pad">
          <h2 className="mb-4 text-base font-semibold text-ink-800">Entry Type</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableEntryTypes.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition ${
                  form.entry_type === t.value
                    ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                    : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <input
                  type="radio"
                  name="entry_type"
                  value={t.value}
                  checked={form.entry_type === t.value}
                  onChange={() => set('entry_type', t.value)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                {t.label}
              </label>
            ))}
          </div>
        </section>

        {/* Request details */}
        <section className="card-pad">
          <h2 className="mb-4 text-base font-semibold text-ink-800">Request Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="visitor_name">Visitor / Person Name *</label>
              <input
                id="visitor_name"
                className={`input ${errClass('visitor_name')}`}
                placeholder="e.g. Mohan Sharma"
                value={form.visitor_name}
                onChange={(e) => set('visitor_name', e.target.value)}
              />
              {errors.visitor_name && <p className="mt-1 text-xs text-red-600">{errors.visitor_name}</p>}
            </div>

            <div>
              <label className="label" htmlFor="visitor_mobile">Mobile Number *</label>
              <input
                id="visitor_mobile"
                className={`input ${errClass('visitor_mobile')}`}
                placeholder="10-digit mobile"
                maxLength={10}
                value={form.visitor_mobile}
                onChange={(e) => set('visitor_mobile', e.target.value.replace(/\D/g, ''))}
              />
              {errors.visitor_mobile && <p className="mt-1 text-xs text-red-600">{errors.visitor_mobile}</p>}
            </div>

            <div>
              <label className="label" htmlFor="location">Department / Location *</label>
              <select
                id="location"
                className="input"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              >
                {CAMPUS_LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="purpose">Purpose of Visit *</label>
              <textarea
                id="purpose"
                rows={2}
                className={`input ${errClass('purpose')}`}
                placeholder="Brief reason for the visit"
                value={form.purpose}
                onChange={(e) => set('purpose', e.target.value)}
              />
              {errors.purpose && <p className="mt-1 text-xs text-red-600">{errors.purpose}</p>}
            </div>

            <div>
              <label className="label" htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                min={todayISO()}
                className={`input ${errClass('date')}`}
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="entry_time">Expected Entry *</label>
                <input
                  id="entry_time"
                  type="time"
                  className={`input ${errClass('entry_time')}`}
                  value={form.entry_time}
                  onChange={(e) => set('entry_time', e.target.value)}
                />
                {errors.entry_time && <p className="mt-1 text-xs text-red-600">{errors.entry_time}</p>}
              </div>
              <div>
                <label className="label" htmlFor="exit_time">Expected Exit *</label>
                <input
                  id="exit_time"
                  type="time"
                  className={`input ${errClass('exit_time')}`}
                  value={form.exit_time}
                  onChange={(e) => set('exit_time', e.target.value)}
                />
                {errors.exit_time && <p className="mt-1 text-xs text-red-600">{errors.exit_time}</p>}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="vehicle_number">Vehicle Number (optional)</label>
              <input
                id="vehicle_number"
                className="input"
                placeholder="e.g. KA01AB1234"
                value={form.vehicle_number ?? ''}
                onChange={(e) => set('vehicle_number', e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">Additional Notes (optional)</label>
              <textarea
                id="notes"
                rows={2}
                className="input"
                placeholder="Any extra information for the verifying officer"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Student host fields */}
        {showStudentFields && user?.role === 'student' && (
          <section className="card-pad">
            <h2 className="mb-1 text-base font-semibold text-ink-800">Student / Host Details</h2>
            <p className="mb-4 text-xs text-ink-500">Prefilled from your profile — edit if needed.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label" htmlFor="student_name">Student Name *</label>
                <input
                  id="student_name"
                  className={`input ${errClass('student_name')}`}
                  value={form.student_name ?? ''}
                  onChange={(e) => set('student_name', e.target.value)}
                />
                {errors.student_name && <p className="mt-1 text-xs text-red-600">{errors.student_name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="student_id_no">Student ID *</label>
                <input
                  id="student_id_no"
                  className={`input ${errClass('student_id_no')}`}
                  value={form.student_id_no ?? ''}
                  onChange={(e) => set('student_id_no', e.target.value)}
                />
                {errors.student_id_no && <p className="mt-1 text-xs text-red-600">{errors.student_id_no}</p>}
              </div>
              <div>
                <label className="label" htmlFor="student_department">Department</label>
                <input
                  id="student_department"
                  className="input"
                  value={form.student_department ?? ''}
                  onChange={(e) => set('student_department', e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="student_semester">Semester</label>
                <input
                  id="student_semester"
                  type="number"
                  min={1}
                  max={12}
                  className="input"
                  value={form.student_semester ?? ''}
                  onChange={(e) => set('student_semester', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm"><ScanFace size={20}/></span><div><p className="text-sm font-bold text-ink-800">Face capture is part of the request</p><p className="mt-1 text-xs leading-5 text-ink-500">After submission, the camera step lets you capture and securely attach a face photo to this token.</p></div></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700"><ShieldCheck size={15}/> Capture only</div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Link to="/dashboard" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? <Spinner size={18} className="text-white" /> : <ClipboardList size={18} />}{submitting ? 'Submitting…' : 'Create Token Request'}</button>
        </div>
      </form>

      <DemoPaymentModal
        open={payment.open}
        requestId={payment.requestId}
        fee={payment.fee}
        onClose={() => setPayment({ open: false, fee: 0 })}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
