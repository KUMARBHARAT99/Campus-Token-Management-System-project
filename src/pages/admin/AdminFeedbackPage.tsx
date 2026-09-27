import { useEffect, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/layouts/DashboardLayout';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { getFeedback, getFeedbackImageUrl, FEEDBACK_TYPE_LABEL, type FeedbackRow } from '@/services/feedbackService';
import { formatDateTime } from '@/utils';

export function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    void getFeedback().then(setItems).finally(() => setLoading(false));
  }, []);

  const loadImage = async (item: FeedbackRow) => {
    if (!item.image_path || imageUrls[item.id]) return;
    try {
      const url = await getFeedbackImageUrl(item.image_path);
      setImageUrls((current) => ({ ...current, [item.id]: url }));
    } catch {
      // Keep the feedback usable even if a signed image URL cannot be created.
    }
  };

  return (
    <div>
      <PageHeader title="Feedback" subtitle="Simple reports and suggestions submitted by campus users." />
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner /> </div> : items.length === 0 ? (
          <EmptyState icon={<MessageSquare size={22} />} title="No feedback yet" description="User feedback and problem reports will appear here." />
        ) : (
          <div className="divide-y divide-ink-200">
            {items.map((item) => (
              <div key={item.id} className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><MessageSquare size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><p className="font-semibold text-ink-800">{FEEDBACK_TYPE_LABEL[item.feedback_type]}</p><p className="mt-0.5 text-xs text-ink-400">{formatDateTime(item.created_at)}</p></div>
                      {item.token_id && <span className="rounded-full bg-ink-100 px-2.5 py-1 font-mono text-[10px] font-bold text-ink-600">{item.token_id}</span>}
                    </div>
                    {(item.user_name || item.user_email || item.submitter_name || item.submitter_email) && <p className="mt-2 text-xs text-ink-400">Submitted by <span className="font-semibold text-ink-600">{item.user_name || item.submitter_name || 'Public visitor'}</span>{item.user_email ? ` · ${item.user_email}` : item.submitter_email ? ` · ${item.submitter_email}` : ''}{item.user_role ? ` · ${item.user_role}` : ''}</p>}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">{item.description || 'No description provided.'}</p>
                    {item.image_path && (
                      <div className="mt-3">
                        {!imageUrls[item.id] ? <button onClick={() => void loadImage(item)} className="btn-secondary"><ImageIcon size={16} /> View screenshot</button> : <a href={imageUrls[item.id]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"><ImageIcon size={16} /> Open screenshot</a>}
                      </div>
                    )}
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={13} /> Submitted successfully</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
