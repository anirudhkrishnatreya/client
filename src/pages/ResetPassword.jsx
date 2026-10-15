import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { checkResetToken, resetPassword as apiResetPassword } from '../api';
import { useAuth } from '../context/AuthContext';
import { homeRouteFor } from '../utils/homeRoute';
import AuthLayout from '../components/AuthLayout';

export default function ResetPassword({ check = checkResetToken, reset = apiResetPassword }) {
  const { token } = useParams();
  const nav = useNavigate();
  const { saveSession } = useAuth();
  const [state, setState] = useState('loading');     // loading | ready | done | invalid | error
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    check(token).then(() => setState('ready')).catch(e => setState(e.response?.data?.code === 'LINK_INVALID_OR_EXPIRED' ? 'invalid' : 'error'));
  }, [check, token]);

  const submit = async e => {
    e.preventDefault(); setProblem('');
    if (pw !== pw2) return setProblem('The two passwords do not match.');
    setBusy(true);
    try {
      const { data } = await reset(token, pw);
      saveSession(data.token, data.user);
      setState('done');
      setTimeout(() => nav(homeRouteFor(data.user)), 1200);
    } catch (err) {
      const d = err.response?.data;
      if (d?.code === 'LINK_INVALID_OR_EXPIRED') setState('invalid');
      else if (d?.details) setProblem(`Choose a stronger password: ${[].concat(d.details).join(', ').toLowerCase()}.`);
      else setProblem('We could not reset your password. Please check your connection and try again.');
    } finally { setBusy(false); }
  };

  if (state === 'loading') return <AuthLayout title="Checking your link…"><p role="status">One moment…</p></AuthLayout>;
  if (state === 'invalid') return (
    <AuthLayout title="This link has expired or was already used">
      <p className="au-muted">Reset links are valid for 1 hour and work only once. <Link to="/forgot-password">Request a new one</Link>.</p>
    </AuthLayout>
  );
  if (state === 'error') return <AuthLayout title="Something went wrong"><p className="au-muted">Please check your connection and try the link again.</p></AuthLayout>;
  if (state === 'done') return (
    <AuthLayout title="Password updated">
      <div className="au-alert-ok" role="status">Your password has been changed and you are signed in. Taking you to your dashboard&hellip;</div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Choose a new password" subtitle="At least 8 characters, with an upper-case letter, a lower-case letter and a number.">
      <form onSubmit={submit} noValidate>
        <div className="au-field">
          <label htmlFor="rp-pw">New password</label>
          <input id="rp-pw" className="au-input" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <div className="au-field">
          <label htmlFor="rp-pw2">Repeat the password</label>
          <input id="rp-pw2" className="au-input" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} />
        </div>
        {problem && <div className="au-error" role="alert">{problem}</div>}
        <button type="submit" className="au-btn" disabled={busy || !pw || !pw2} style={{ marginTop: 8 }}>{busy ? 'Saving…' : 'Reset password'}</button>
      </form>
    </AuthLayout>
  );
}
