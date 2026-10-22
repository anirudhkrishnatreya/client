import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../platform/theme/platform.css';
import logo from '../assets/imenteo_logo.png';
import { Icon } from '../platform/ui/kit';
import { adminApi } from './adminApi';

/** The admin sign-in: clear errors, how many tries are left, and the lock after five wrong passwords. */
export default function AdminSignIn() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(sp.get('ended') ? 'Your admin session ended. Please sign in again.' : '');
  const submit = async e => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { data } = await adminApi.login(email.trim(), password);
      localStorage.setItem('im_admin_token', data.token);
      localStorage.setItem('im_admin', JSON.stringify(data.admin));
      nav('/admin', { replace: true });
    } catch (x) {
      const d = (x.response && x.response.data) || {};
      if (d.code === 'ADMIN_LOCKED') setErr('Too many wrong passwords. This account is locked for 15 minutes.');
      else if (x.response && x.response.status === 429) setErr('Too many attempts from here. Please wait a few minutes.');
      else if (x.response && x.response.status === 401) setErr(`Wrong email or password.${d.attemptsLeft !== undefined ? ` ${d.attemptsLeft} ${d.attemptsLeft === 1 ? 'try' : 'tries'} left before a 15-minute lock.` : ''}`);
      else setErr('Could not reach the server. Please check your connection.');
    } finally { setBusy(false); }
  };
  return (
    <div className="pf">
      <main className="pf-adminlogin">
        <form className="pf-card pf-adminlogin-card" onSubmit={submit} noValidate>
          <img src={logo} alt="iMenteo" style={{ height: 28, marginBottom: 18 }} />
          <div className="pf-row" style={{ gap: 8, marginBottom: 4 }}><Icon name="shield" size={18} /><h1 style={{ fontSize: 22 }}>Admin console</h1></div>
          <p className="pf-small pf-muted" style={{ marginBottom: 18 }}>For the iMenteo team. Every action here is recorded.</p>
          <div className="pf-field"><label className="pf-label" htmlFor="adm-email">Email</label>
            <input id="adm-email" className="pf-input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></div>
          <div className="pf-field" style={{ marginTop: 12 }}><label className="pf-label" htmlFor="adm-pw">Password</label>
            <div className="pf-row" style={{ gap: 6 }}>
              <input id="adm-pw" className="pf-input pf-grow" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="pf-btn sm ghost" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name="eye" size={15} /></button>
            </div></div>
          {err && <div className="pf-note" role="alert" style={{ marginTop: 14, borderColor: 'var(--coral)' }}>{err}</div>}
          <button type="submit" className="pf-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} disabled={busy || !email.trim() || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="pf-small pf-faint" style={{ margin: '14px 0 0', textAlign: 'center' }}>Sessions last 12 hours. Five wrong passwords lock the account for 15 minutes.</p>
        </form>
      </main>
    </div>
  );
}
