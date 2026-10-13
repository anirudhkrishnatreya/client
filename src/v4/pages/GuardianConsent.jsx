import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v2 as defaultApi, errorCode } from '../api';
import { useAuth } from '../../context/AuthContext';
import { PLATFORM_ENABLED } from '../../platform/config';
import AuthLayout from '../../components/AuthLayout';

// Opened from the link in the parent's email. The link is single-use. Here the parent confirms (for under-18s), and chooses
// the password for their own iMenteo parent account. After that they sign in with their email and password.
export default function GuardianConsent({ api = defaultApi }) {
  const { token } = useParams();
  const nav = useNavigate();
  const { saveSession } = useAuth();
  const [info, setInfo] = useState(null);
  const [state, setState] = useState('loading');           // loading | ready | done | declined | invalid | error
  const [agree, setAgree] = useState(false);
  const [share, setShare] = useState(false);
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [problem, setProblem] = useState('');
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.guardianLookup(token).then(({ data }) => { setInfo(data); setState('ready'); })
      .catch(e => setState(errorCode(e) === 'LINK_INVALID_OR_EXPIRED' ? 'invalid' : 'error'));
  }, [api, token]);

  const submit = async e => {
    e.preventDefault(); setProblem('');
    if (!info.hasAccount && pw !== pw2) return setProblem('The two passwords do not match.');
    setBusy(true);
    try {
      const { data } = await api.guardianConfirm(token, { agree: info.consentRequired ? true : undefined, shareWithSchool: share, password: pw });
      if (data.user) saveSession(data.token, data.user);
      setState('done');
    } catch (err) {
      const code = errorCode(err), d = err.response && err.response.data;
      if (code === 'LINK_INVALID_OR_EXPIRED') setState('invalid');
      else if (code === 'VALIDATION_FAILED' && d.details && d.details.password) setProblem(`Choose a stronger password: ${[].concat(d.details.password).join(', ').toLowerCase()}.`);
      else if (code === 'PASSWORD_WRONG') setProblem('That is not the password of your existing parent account.');
      else if (code === 'EMAIL_IN_USE') setProblem('This email address already belongs to a different kind of iMenteo account. Please ask your child to use another email for you.');
      else setProblem('We could not complete this. Please check your connection and try again.');
    } finally { setBusy(false); }
  };
  const decline = async () => { setBusy(true); try { await api.guardianDecline(token); setState('declined'); } catch { setState('error'); } finally { setBusy(false); } };

  if (state === 'loading') return <AuthLayout wide><p role="status">Loading…</p></AuthLayout>;
  if (state === 'invalid') return <AuthLayout wide title="This link has expired or was already used"><p>If you already set up your account, <Link to="/login">sign in</Link> with this email address. Otherwise ask your child to send a new link from their iMenteo page.</p></AuthLayout>;
  if (state === 'error') return <AuthLayout wide title="Something went wrong"><p>Please check your connection and try the link again.</p></AuthLayout>;
  if (state === 'declined') return <AuthLayout wide title="Understood"><div className="v4-alert info" role="status">We have recorded that you do not agree. {info.student.firstName} will not be able to take the assessment and their information will be removed.</div></AuthLayout>;
  if (state === 'done') return (
    <AuthLayout wide title="You are all set">
      <div className="v4-alert ok" role="status">{info.consentRequired ? `Thank you. ${info.student.firstName} can now start. ` : ''}Your parent account is ready. From now on, sign in with <strong>{info.hasAccount ? 'your existing password' : 'the email and password you just chose'}</strong>.</div>
      <p style={{ marginTop: 16 }}>{PLATFORM_ENABLED ? <button type="button" className="v4-btn" onClick={() => nav('/platform/parent')}>Go to my dashboard</button> : <Link className="v4-btn" to="/login">Sign in</Link>}</p>
    </AuthLayout>
  );

  const first = info.student.firstName;
  const canSubmit = !busy && !info.emailInUse && pw.length > 0 && (!info.consentRequired || agree) && (info.hasAccount || pw2.length > 0);
  return (
    <AuthLayout wide title={info.consentRequired ? `Please confirm for ${first}` : `${first} has added you as their parent`}>
      <form className="v4-card" onSubmit={submit} noValidate>
        <p style={{ marginBottom: 12 }}>Hello {info.guardianName}. {info.consentRequired
          ? `${first} would like to use iMenteo. Because they are under 18, we need your agreement first. You will also create a parent account to follow their progress.`
          : `With a parent account you can follow ${first}'s progress, the tasks their mentor sets, their scores and their career reports.`}</p>
        {info.emailInUse && <div className="v4-alert error" role="alert" style={{ marginBottom: 12 }}>This email address already belongs to a different kind of iMenteo account, so it cannot be used as a parent account. Please ask {first} to enter another email for you.</div>}
        {info.consentRequired && <>
          <h2 className="v4-h2">What we collect</h2>
          <ul style={{ margin: '0 0 12px 18px', fontSize: 14 }}>{info.collects.map(c => <li key={c}>{c}</li>)}</ul>
          <h2 className="v4-h2">What it is for</h2>
          <p style={{ fontSize: 14, marginBottom: 12 }}>Only to give {first} a career guidance report and weekly mentoring. We do not sell it or use it for advertising. You can withdraw and ask for it to be deleted at any time.</p>
          <label className="v4-check" style={{ marginBottom: 12 }}><input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} /><span><strong>Optional:</strong> let {first}'s school counsellor see their individual report. If you leave this unticked, the school only sees whether they have finished, and anonymous summaries of the whole class.</span></label>
          <label className="v4-check" style={{ marginBottom: 16 }}><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /><span>I am {first}'s parent or guardian, and I agree to the above.</span></label>
        </>}
        <h2 className="v4-h2">{info.hasAccount ? 'Your parent account' : 'Choose a password'}</h2>
        <p className="v4-muted" style={{ marginBottom: 8 }}>{info.hasAccount ? 'You already have a parent account with this email. Enter its password to add this child.' : 'You will sign in with your email address and this password. At least 8 characters, with an upper-case letter, a lower-case letter and a number.'}</p>
        <div className="v4-field"><label htmlFor="gpw">{info.hasAccount ? 'Your password' : 'New password'}</label><input id="gpw" type="password" autoComplete={info.hasAccount ? 'current-password' : 'new-password'} value={pw} onChange={e => setPw(e.target.value)} /></div>
        {!info.hasAccount && <div className="v4-field"><label htmlFor="gpw2">Repeat the password</label><input id="gpw2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></div>}
        {problem && <div className="v4-err" role="alert" style={{ marginBottom: 12 }}>{problem}</div>}
        <div className="v4-row">
          <button className="v4-btn" type="submit" disabled={!canSubmit}>{info.consentRequired ? 'Confirm and create my account' : 'Create my account'}</button>
          {info.consentRequired && (!confirmDecline
            ? <button type="button" className="v4-btn secondary" disabled={busy} onClick={() => setConfirmDecline(true)}>I do not agree</button>
            : <button type="button" className="v4-btn danger" disabled={busy} onClick={decline}>Yes, I do not agree</button>)}
        </div>
      </form>
    </AuthLayout>
  );
}
