import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as apiForgotPassword } from '../api';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPassword({ api = apiForgotPassword }) {
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!identifier.trim()) return setError('Enter your email or username');
    setError(''); setBusy(true);
    try { await api(identifier.trim()); setSent(true); }
    catch { setSent(true); }      // the endpoint never reveals whether the account exists
    finally { setBusy(false); }
  };

  if (sent) return (
    <AuthLayout title="Check your email" subtitle="If that account exists, we've sent a link to reset the password.">
      <p className="au-muted">The link is valid for 1 hour. If you don't see the email, check your spam folder.</p>
      <p style={{ marginTop: 20 }}><Link to="/login" className="au-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>Back to sign in</Link></p>
    </AuthLayout>
  );

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email or username on your account and we'll send you a reset link."
      footer={<>Remembered it after all? <Link to="/login">Sign in</Link></>}
    >
      {error && <div className="au-error" role="alert">{error}</div>}
      <form onSubmit={submit} noValidate>
        <div className="au-field">
          <label htmlFor="fp-id">Email or username</label>
          <input id="fp-id" className="au-input" type="text" autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@example.com" />
        </div>
        <button type="submit" className="au-btn" disabled={busy} style={{ marginTop: 8 }}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </AuthLayout>
  );
}
