import { useState } from 'react';
import { ImagePlus, MessageSquare, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/layouts/DashboardLayout';
import { useToast } from '@/components/Toast';
import { submitFeedback, type FeedbackType, FEEDBACK_TYPE_LABEL } from '@/services/feedbackService';

const TYPES: FeedbackType[] = ['problem', 'token_issue', 'payment_issue', 'suggestion', 'other'];

export function FeedbackPage() {
  const { notify } = useToast();
  const [type, setType] = useState<FeedbackType>('problem');
  const [description, setDescription] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      notify('Please describe the issue before submitting feedback.', 'error');
      return;
    }
    setSending(true);
    try {
      await submitFeedback({ type, description, tokenId, image });
      setDescription('');
      setTokenId('');
      setImage(null);
      notify('Feedback submitted successfully.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to submit feedback.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Feedback & Support" subtitle="Having a problem or suggestion? Tell the campus administrator." />
      <div className="mx-auto max-w-2xl">
        <div className="card-pad">
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-brand-900">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm"><MessageSquare size={19} /></span>
            <div><p className="text-sm font-bold">Quick feedback</p><p className="mt-1 text-xs leading-5 text-brand-800">Please describe the issue or suggestion. A screenshot is optional. Token ID is optional.</p></div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="feedback-type">Feedback Type</label>
              <select id="feedback-type" className="input" value={type} onChange={(e) => setType(e.target.value as FeedbackType)}>
                {TYPES.map((item) => <option key={item} value={item}>{FEEDBACK_TYPE_LABEL[item]}</option>)}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="feedback-description">What happened? *</label>
              <textarea id="feedback-description" className="input min-h-32 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us briefly what happened or what you would like improved…" />
            </div>

            <div>
              <label className="label" htmlFor="feedback-token">Token ID <span className="font-normal text-ink-400">(optional)</span></label>
              <input id="feedback-token" className="input font-mono uppercase" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="SCT-2026-XXXXXXXX" />
            </div>

            <div>
              <label className="label">Screenshot <span className="font-normal text-ink-400">(optional, max 5 MB)</span></label>
              {!image ? (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-sm font-semibold text-ink-600 transition hover:border-brand-300 hover:bg-brand-50/40">
                  <ImagePlus size={18} /> Upload JPG, PNG or WEBP
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
                  <div className="flex min-w-0 items-center gap-2"><ImagePlus size={17} className="shrink-0 text-brand-600" /><span className="truncate text-sm font-medium text-ink-700">{image.name}</span><span className="shrink-0 text-xs text-ink-400">{(image.size / 1024 / 1024).toFixed(1)} MB</span></div>
                  <button type="button" onClick={() => setImage(null)} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-red-600" aria-label="Remove screenshot"><X size={17} /></button>
                </div>
              )}
            </div>

            <button type="button" onClick={() => void handleSubmit()} disabled={sending} className="btn-primary w-full sm:w-auto">
              {sending ? <span className="animate-pulse">Submitting…</span> : <><Send size={17} /> Submit Feedback</>}
            </button>
          </div>
        </div>

        <Link to="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}
