import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authLogin } from '../api';
import { v2 } from '../v4/api';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { V4_ENABLED } from '../v4/config';
import { PLATFORM_ENABLED } from '../platform/config';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const nav = useNavigate();
  const { saveSession } = useAuth();
  const { dispatch } = useAssessment();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState('idle');     // idle | sending | sent

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(''); setNeedsVerification(false); setResendState('idle');
    if (!identifier.trim() || !password) return setError('Username/email and password are required');

    setLoading(true);
    try {
      const { data } = await authLogin({ identifier, password });
      saveSession(data.token, data.user);
      dispatch({ type: 'SET_USER', id: data.user.id, name: data.user.fullName });

      if (PLATFORM_ENABLED && ['student', 'mentor', 'parent'].includes(data.user.role || 'student')) { nav(`/platform/${data.user.role || 'student'}`); return; }
      if (V4_ENABLED && data.user.role === 'counsellor') { nav('/v4/school'); return; }
      if (V4_ENABLED && data.user.track) { nav('/v4'); return; }       // v4 students have their own dashboard
      if (data.user.assessmentCompleted) { nav('/dashboard'); return; }
      if (!data.user.onboardingCompleted) { nav('/register'); return; }
      if (data.resumeState?.hasProgress) { nav('/assessment'); return; }
      nav('/assessment');
    } catch (e) {
      if (e.response?.data?.code === 'NOT_VERIFIED') {
        setError('Please confirm your email address before signing in. Check your inbox for the link we sent when you registered.');
        setNeedsVerification(true);
      } else {
        setError(e.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResendState('sending');
    try { await v2.resendVerification(identifier.trim()); setResendState('sent'); }
    catch { setResendState('sent'); }      // the endpoint never reveals whether the address exists
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue with your mentor, your tasks and your progress."
      footer={<>New to iMenteo? <Link to={V4_ENABLED ? '/v4/register' : '/register'}>Create an account</Link></>}
    >
      {error && <div className="au-error" role="alert">{error}</div>}
      {needsVerification && (
        resendState === 'sent'
          ? <p className="au-muted" role="status">If that address has an account, we have sent a new link.</p>
          : <button type="button" className="au-link" onClick={resend} disabled={resendState === 'sending'}>{resendState === 'sending' ? 'Sending…' : 'Resend the confirmation email'}</button>
      )}
      <form onSubmit={handleLogin} noValidate>
        <div className="au-field">
          <label htmlFor="login-id">Email or username</label>
          <input id="login-id" className="au-input" type="text" autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="au-field">
          <label htmlFor="login-pw">Password</label>
          <div className="au-pw">
            <input id="login-pw" className="au-input" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />
            <button type="button" onClick={() => setShowPw(v => !v)} aria-pressed={showPw} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? 'HIDE' : 'SHOW'}</button>
          </div>
        </div>
        <button type="submit" className="au-btn" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}
