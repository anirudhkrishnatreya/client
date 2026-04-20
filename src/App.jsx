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
