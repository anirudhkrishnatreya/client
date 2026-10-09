import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from './context/AssessmentContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing       from './pages/Landing';
import Register      from './pages/Register';
import Login         from './pages/Login';
import Assessment    from './pages/Assessment';
import Results       from './pages/Results';
import UserDashboard from './pages/UserDashboard';
import AdminLogin    from './pages/AdminLogin';
import AdminDash     from './pages/AdminDash';
import AdminUser     from './pages/AdminUser';
import { V4_ENABLED }  from './v4/config';
import V4Register      from './v4/pages/V4Register';
import V4Dashboard     from './v4/pages/V4Dashboard';
import V4Assessment    from './v4/pages/V4Assessment';
import V4Results       from './v4/pages/V4Results';
import GuardianConsent from './v4/pages/GuardianConsent';
import SchoolHome      from './v4/pages/SchoolHome';
import SchoolClass     from './v4/pages/SchoolClass';
import SchoolStudent   from './v4/pages/SchoolStudent';
import AdminOrgs       from './v4/pages/AdminOrgs';

// ── User must be logged in
function RequireUser({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// ── Admin JWT guard
function RequireAdmin({ children }) {
  return localStorage.getItem('im_admin_token')
    ? children
    : <Navigate to="/admin/login" replace />;
}

// ── Redirect already-logged-in users away from auth pages
function GuestOnly({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
}

// ── Allow onboarding for logged-in users until profile setup is complete
function RegisterOnly({ children }) {
  const { user, isLoggedIn, loading } = useAuth();
  if (loading) return null;

  if (!isLoggedIn) return children;
  return user?.onboardingCompleted ? <Navigate to="/dashboard" replace /> : children;
}

// v4 sign-up: a signed-in student goes to their v4 page instead
function GuestOnlyV4({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? <Navigate to="/v4" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Landing />} />

      {/* Registration / onboarding */}
      <Route path="/register" element={<RegisterOnly><Register /></RegisterOnly>} />

      {/* Guest-only */}
      <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />

      {/* User-protected */}
      <Route path="/dashboard"      element={<RequireUser><UserDashboard /></RequireUser>} />
      <Route path="/assessment"     element={<RequireUser><Assessment /></RequireUser>} />
      <Route path="/results"        element={<RequireUser><Results /></RequireUser>} />
      <Route path="/results/:assessmentId" element={<RequireUser><Results /></RequireUser>} />

      {/* v4 assessment: only present when the build sets VITE_V4=on */}
      {V4_ENABLED && (
        <>
          <Route path="/v4/register"           element={<GuestOnlyV4><V4Register /></GuestOnlyV4>} />
          <Route path="/guardian-consent/:token" element={<GuardianConsent />} />
          <Route path="/v4"                    element={<RequireUser><V4Dashboard /></RequireUser>} />
          <Route path="/v4/test"               element={<RequireUser><V4Assessment /></RequireUser>} />
          <Route path="/v4/results/:id"        element={<RequireUser><V4Results /></RequireUser>} />
          <Route path="/v4/school"                          element={<RequireUser><SchoolHome /></RequireUser>} />
          <Route path="/v4/school/:cohortId"                element={<RequireUser><SchoolClass /></RequireUser>} />
          <Route path="/v4/school/:cohortId/student/:studentId" element={<RequireUser><SchoolStudent /></RequireUser>} />
          <Route path="/admin/orgs"                         element={<RequireAdmin><AdminOrgs /></RequireAdmin>} />
        </>
      )}

      {/* Admin */}
      <Route path="/admin/login"    element={<AdminLogin />} />
      <Route path="/admin"          element={<RequireAdmin><AdminDash /></RequireAdmin>} />
      <Route path="/admin/user/:id" element={<RequireAdmin><AdminUser /></RequireAdmin>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AssessmentProvider>
    </AuthProvider>
  );
}
