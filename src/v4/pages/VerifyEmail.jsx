import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v2 as defaultApi, errorCode } from '../api';
import { useAuth } from '../../context/AuthContext';
import { homeRouteFor } from '../../utils/homeRoute';
import AuthLayout from '../../components/AuthLayout';

// Opened from the link in the confirmation email. This is the student's actual first sign-in: the server
// flips isVerified to true and starts the session here, since register() no longer does either.
export default function VerifyEmail({ api = defaultApi }) {
  const { token } = useParams();
  const nav = useNavigate();
  const { user, saveSession } = useAuth();
  const [state, setState] = useState('loading');     // loading | done | invalid | error

  useEffect(() => {
    api.verifyEmail(token).then(({ data }) => {
      saveSession(data.token, data.user);
      setState('done');
    }).catch(e => setState(errorCode(e) === 'LINK_INVALID_OR_EXPIRED' ? 'invalid' : 'error'));
  }, [api, token, saveSession]);

  if (state === 'loading') return <AuthLayout wide title="Confirming your email…"><p role="status">One moment…</p></AuthLayout>;
  if (state === 'invalid') return (
    <AuthLayout wide title="This link has expired or was already used">
      <p>If you have already confirmed your email, <Link to="/login">sign in</Link>. Otherwise sign in and we will offer to resend the link.</p>
    </AuthLayout>
  );
  if (state === 'error') return <AuthLayout wide title="Something went wrong"><p>Please check your connection and try the link again.</p></AuthLayout>;

  return (
    <AuthLayout wide title="Email confirmed">
      <div className="v4-alert ok" role="status">Your email is confirmed and you are signed in.</div>
      <p style={{ marginTop: 16 }}>
        <button type="button" className="v4-btn" onClick={() => nav(homeRouteFor(user))}>Continue</button>
      </p>
    </AuthLayout>
  );
}
