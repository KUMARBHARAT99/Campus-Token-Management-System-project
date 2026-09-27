import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User as UserIcon,
  Users,
  ScanLine,
  CheckSquare,
  Ticket,
  CreditCard,
  MessageSquare,
  UserCog,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABEL } from '@/config/constants';
import { cn } from '@/utils';
import type { Role } from '@/types';
import { getSupabase } from '@/services/supabaseClient';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const STUDENT_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/request-token', label: 'Request Token', icon: <ClipboardList size={18} /> },
  { to: '/my-tokens', label: 'My Tokens', icon: <Ticket size={18} /> },
  { to: '/history', label: 'History', icon: <History size={18} /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon size={18} /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { to: '/feedback', label: 'Feedback & Support', icon: <MessageSquare size={18} /> },
];

const STAFF_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/request-token', label: 'Request Token', icon: <ClipboardList size={18} /> },
  { to: '/my-tokens', label: 'My Tokens', icon: <Ticket size={18} /> },
  { to: '/scan-token', label: 'Scan Token', icon: <ScanLine size={18} /> },
  { to: '/history', label: 'History', icon: <History size={18} /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon size={18} /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { to: '/feedback', label: 'Feedback & Support', icon: <MessageSquare size={18} /> },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/requests', label: 'Requests', icon: <ClipboardList size={18} /> },
  { to: '/admin/active-tokens', label: 'Active Tokens', icon: <CheckSquare size={18} /> },
  { to: '/admin/verification', label: 'Verification', icon: <ScanLine size={18} /> },
  { to: '/admin/entry-logs', label: 'Entry Logs', icon: <History size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { to: '/admin/role-requests', label: 'Role Requests', icon: <UserCog size={18} /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { to: '/admin/feedback', label: 'Feedback', icon: <MessageSquare size={18} /> },
];

const SECURITY_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/verification', label: 'Verification', icon: <ScanLine size={18} /> },
  { to: '/admin/entry-logs', label: 'Entry Logs', icon: <History size={18} /> },
];

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: STUDENT_NAV,
  staff: STAFF_NAV,
  other: STUDENT_NAV,
  admin: ADMIN_NAV,
  security: SECURITY_NAV,
};

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setUnreadNotifications(0);
      return;
    }

    const supabase = getSupabase();
    const refreshUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      setUnreadNotifications(count ?? 0);
    };

    void refreshUnread();
    const channel = supabase
      .channel(`admin-notification-badge-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { void refreshUnread(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const nav = user.role === 'other' ? STUDENT_NAV.filter((item) => item.to !== '/payments') : NAV_BY_ROLE[user.role];
  const isAdminArea = user.role === 'admin' || user.role === 'security';

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-ink-200 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <ShieldCheck size={18} />
        </span>
        <span className="text-sm font-bold tracking-tight text-ink-800">
          Campus <span className="text-brand-600">Tokens</span>
        </span>
      </Link>

      <div className="px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Menu</p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/admin'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-800',
                )
              }
            >
              <span className="relative shrink-0">
                {item.icon}
                {item.to === '/admin/notifications' && unreadNotifications > 0 && (
                  <span className="absolute -right-2 -top-2 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
                )}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.to === '/admin/notifications' && unreadNotifications > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{unreadNotifications}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-ink-200 p-3">
        <div className="rounded-lg bg-ink-50 px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-ink-700">{user.full_name}</p>
          <p className="text-xs text-ink-500">{ROLE_LABEL[user.role]}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.06),transparent_32%),radial-gradient(circle_at_top_left,rgba(14,165,233,0.06),transparent_28%)] bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-200 bg-white lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-fade-in bg-white">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-ink-400 hover:bg-ink-100"
            >
              <X size={18} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-ink-600 hover:bg-ink-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link to={isAdminArea ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck size={16} />
          </span>
          <span className="text-sm font-bold text-ink-800">Campus Tokens</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* App-style bottom navigation on phones. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {(isAdminArea ? (user.role === 'admin' ? ADMIN_NAV.slice(0, 4) : SECURITY_NAV.slice(0, 4)) : (user.role === 'staff' ? STAFF_NAV.filter((item) => ['/dashboard','/request-token','/my-tokens','/scan-token'].includes(item.to)) : nav.filter((item) => ['/dashboard','/request-token','/my-tokens','/profile'].includes(item.to)))).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard' || item.to === '/admin'} className={({isActive}) => cn('flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500')}>
              {item.icon}<span>{item.label.replace('College ', '').replace('Request ', '')}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

// Page header used inside dashboard pages.
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-ink-800 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
