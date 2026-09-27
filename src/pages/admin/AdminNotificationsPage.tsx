import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/layouts/DashboardLayout';
import { getSupabase } from '@/services/supabaseClient';
import { formatDateTime } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
  entity_id: string | null;
  user_id: string;
}

export function AdminNotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await getSupabase()
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error) setItems((data ?? []) as NotificationRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`admin-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { void load(); },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  const markRead = async (id: string) => {
    if (markingId) return;
    setMarkingId(id);
    try {
      const { error } = await getSupabase()
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id ?? '');
      if (!error) {
        setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
      }
    } finally {
      setMarkingId(null);
    }
  };

  return <div>
    <PageHeader
      title={unreadCount ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      subtitle="Live visitor and system activity alerts for administrators."
    />
    <div className="card overflow-hidden">
      {loading ? <p className="p-8 text-center text-sm text-ink-500">Loading…</p>
        : items.length === 0 ? <div className="p-10 text-center"><Bell className="mx-auto text-ink-300" size={32}/><p className="mt-3 font-semibold">No notifications</p><p className="mt-1 text-sm text-ink-500">New Visitor/Outsider token activity will appear here automatically.</p></div>
        : <div className="divide-y divide-ink-200">
          {items.map((n) => <div key={n.id} className={`p-5 ${n.read_at ? '' : 'bg-purple-50/50'}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><Bell size={17}/></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-ink-800">{n.title}</p><span className="text-xs text-ink-400">{formatDateTime(n.created_at)}</span></div>
                <p className="mt-1 text-sm text-ink-600">{n.message}</p>
                {n.entity_id && <button onClick={() => navigate(n.type === 'account_approval' ? '/admin/users' : `/admin/requests/${n.entity_id}`)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"><ExternalLink size={13}/> {n.type === 'account_approval' ? 'Review account' : 'Open token'}</button>}
                {!n.read_at && <button disabled={markingId === n.id} onClick={() => void markRead(n.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 disabled:opacity-50"><CheckCheck size={14}/> {markingId === n.id ? 'Marking…' : 'Mark read'}</button>}
              </div>
            </div>
          </div>)}
        </div>}
    </div>
  </div>;
}
