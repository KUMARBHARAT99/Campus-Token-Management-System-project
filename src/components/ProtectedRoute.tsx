import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';
import { FullPageSpinner } from '@/components/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (location.pathname === '/pending-approval') return <>{children}</>;
  if (user.accountStatus === 'pending' || user.accountStatus === 'pending_approval') {
    return <Navigate to="/pending-approval" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? '/dashboard' : '/admin'} replace />;
  }
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) {
    if ((user.accountStatus === 'pending' || user.accountStatus === 'pending_approval') && !user.requestedRole) {
      return <Navigate to="/complete-profile" replace />;
    }
    if (user.accountStatus === 'pending' || user.accountStatus === 'pending_approval') return <Navigate to="/pending-approval" replace />;
    return <Navigate to={user.role === 'admin' || user.role === 'security' ? '/admin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}
