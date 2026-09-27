import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/Toast';
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/components/ProtectedRoute';

import { DashboardLayout } from '@/layouts/DashboardLayout';

import { LandingPage } from '@/pages/LandingPage';
import { RoleSelectionPage } from '@/pages/RoleSelectionPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { TokenDetailsPage } from '@/pages/TokenDetailsPage';
import { EmailOtpPage } from '@/pages/EmailOtpPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { PhoneOnboardingPage } from '@/pages/PhoneOnboardingPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { FaceCapturePage } from '@/pages/FaceCapturePage';
import { PublicTokenVerificationPage } from '@/pages/PublicTokenVerificationPage';
import { TemporaryGuestTokenPage } from '@/pages/TemporaryGuestTokenPage';
import { SupportPage } from '@/pages/SupportPage';

import { UserDashboard } from '@/pages/user/UserDashboard';
import { RequestTokenPage } from '@/pages/user/RequestTokenPage';
import { MyTokensPage } from '@/pages/user/MyTokensPage';
import { HistoryPage } from '@/pages/user/HistoryPage';
import { ProfilePage } from '@/pages/user/ProfilePage';
import { PaymentHistoryPage } from '@/pages/user/PaymentHistoryPage';
import { GuestRequestPage } from '@/pages/user/GuestRequestPage';
import { FeedbackPage } from '@/pages/user/FeedbackPage';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminRequestsPage } from '@/pages/admin/AdminRequestsPage';
import { AdminRequestDetailPage } from '@/pages/admin/AdminRequestDetailPage';
import { AdminActiveTokensPage } from '@/pages/admin/AdminActiveTokensPage';
import { AdminVerificationPage } from '@/pages/admin/AdminVerificationPage';
import { AdminEntryLogsPage } from '@/pages/admin/AdminEntryLogsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminFeedbackPage } from '@/pages/admin/AdminFeedbackPage';
import { AdminRoleChangeRequestsPage } from '@/pages/admin/AdminRoleChangeRequestsPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/select-role" element={<PublicOnlyRoute><RoleSelectionPage /></PublicOnlyRoute>} />
          <Route path="/verify/:tokenId" element={<PublicTokenVerificationPage />} />
          <Route path="/temporary-guest-token" element={<TemporaryGuestTokenPage />} />
          <Route path="/temporary-guest-token/:tokenId" element={<TemporaryGuestTokenPage />} />
          <Route path="/support" element={<SupportPage />} />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignUpPage />
              </PublicOnlyRoute>
            }
          />

          <Route path="/verify-email-otp" element={<EmailOtpPage />} />
          <Route path="/pending-approval" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />
          <Route path="/phone-onboarding" element={<PhoneOnboardingPage />} />
          <Route path="/complete-profile" element={<PhoneOnboardingPage />} />

          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />

          <Route path="/tokens/:id" element={<ProtectedRoute roles={['student','staff','other','admin','security']}><TokenDetailsPage /></ProtectedRoute>} />
          <Route path="/scan-token" element={<ProtectedRoute roles={['staff','admin','security']}><AdminVerificationPage /></ProtectedRoute>} />

          <Route
            element={
              <ProtectedRoute roles={['student', 'staff', 'other']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/request-token" element={<RequestTokenPage />} />
            <Route path="/guest-request" element={<GuestRequestPage />} />
            <Route path="/my-tokens" element={<MyTokensPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/payments" element={<ProtectedRoute roles={['student', 'staff']}><PaymentHistoryPage /></ProtectedRoute>} />
            <Route path="/tokens/:id/face-capture" element={<FaceCapturePage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute roles={['admin', 'security']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AdminRequestsPage />} />
            <Route
              path="/admin/requests/:id"
              element={<AdminRequestDetailPage />}
            />
            <Route
              path="/admin/active-tokens"
              element={<AdminActiveTokensPage />}
            />
            <Route
              path="/admin/verification"
              element={<AdminVerificationPage />}
            />
            <Route
              path="/admin/entry-logs"
              element={<AdminEntryLogsPage />}
            />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/role-requests" element={<ProtectedRoute roles={['admin']}><AdminRoleChangeRequestsPage /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><AdminNotificationsPage /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><AdminPaymentsPage /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute roles={['admin']}><AdminFeedbackPage /></ProtectedRoute>} />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}