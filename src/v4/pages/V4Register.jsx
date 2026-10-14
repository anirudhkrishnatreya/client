import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { v2 as defaultApi } from '../api';
import AuthLayout from '../../components/AuthLayout';
import PrivacySummary from './PrivacySummary';

export const GRADE_OPTIONS = [
  ...['6', '7', '8', '9', '10', '11', '12'].map(g => [g, `Class ${g}`]),
  ['ug1', 'College: year 1'], ['ug2', 'College: year 2'], ['ug3', 'College: year 3'], ['ug4', 'College: year 4'], ['pg', 'Postgraduate'], ['diploma', 'Diploma']
];

/** Whole years old on `today`, or null for an unreadable date. */
export function ageFrom(dob, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number);
  if (new Date(Date.UTC(y, m - 1, d)).getUTCMonth() !== m - 1) return null;
  let age = today.getUTCFullYear() - y;
  if (today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d)) age -= 1;
  return age;
}

const fieldError = (errors, key) => errors[key] && <div className="v4-err" role="alert">{[].concat(errors[key]).join('. ')}</div>;

export default function V4Register({ api = defaultApi, today = new Date() }) {
  const [f, setF] = useState({ fullName: '', email: '', password: '', dateOfBirth: '', grade: '', phone: '', classCode: '', guardianName: '', guardianEmail: '', guardianRelationship: 'parent', acceptTerms: false, shareWithSchool: false });
  const [errors, setErrors] = useState({});
  const [general, setGeneral] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');      // set once registration succeeds: shows the "check your email" screen
  const set = k => e => setF(s => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const age = useMemo(() => ageFrom(f.dateOfBirth, today), [f.dateOfBirth, today]);
  const minor = age !== null && age < 18;
  const [forceParent, setForceParent] = useState(false);
  const schoolGrade = ['6', '7', '8', '9', '10', '11', '12'].includes(f.grade);
  const showParent = minor || schoolGrade || forceParent;      // a parent's email is compulsory up to class 12, whatever the age

  const submit = async e => {
    e.preventDefault();
    setErrors({}); setGeneral('');
    const body = {
      fullName: f.fullName.trim(), email: f.email.trim(), password: f.password, dateOfBirth: f.dateOfBirth, acceptTerms: f.acceptTerms,
      ...(f.classCode.trim() ? { classCode: f.classCode.trim() } : { grade: f.grade }),
      ...(f.phone.trim() ? { phone: f.phone.trim() } : {}),
      ...(!minor && f.classCode.trim() && f.shareWithSchool ? { shareWithSchool: true } : {}),
      ...(showParent ? { guardian: { name: f.guardianName.trim(), email: f.guardianEmail.trim(), relationship: f.guardianRelationship } } : {})
    };
    setBusy(true);
    try {
      await api.register(body);
      setSentTo(body.email);
    } catch (err) {
      const d = err.response && err.response.data;
      if (d && d.code === 'VALIDATION_FAILED') { setErrors(d.details || {}); if (d.details && (d.details.guardianEmail || d.details.guardianName)) setForceParent(true); }
      else if (d && d.code === 'EMAIL_TAKEN') setErrors({ email: 'An account with this email already exists. Try signing in.' });
      else if (d && d.code === 'PHONE_TAKEN') setErrors({ phone: 'This phone number is already used.' });
      else if (d && d.code === 'V4_DISABLED') setGeneral('This is not available yet.');
      else setGeneral('We could not create your account. Please check your connection and try again.');
    } finally { setBusy(false); }
  };

  if (sentTo) return (
    <AuthLayout wide title="Check your email">
      <div className="v4-alert ok" role="status">We have sent a confirmation link to <strong>{sentTo}</strong>. Open it to finish creating your account and sign in.</div>
      <p className="v4-muted" style={{ marginTop: 16 }}>Didn't get it? Check your spam folder, or <Link to="/login">sign in</Link> to resend the link.</p>
    </AuthLayout>
  );

  return (
    <AuthLayout wide title="Create your account" subtitle="You can use any email address. It takes about two minutes.">
      <form className="v4-card" onSubmit={submit} noValidate>
        <div className="v4-field"><label htmlFor="fullName">Full name</label><input id="fullName" type="text" autoComplete="name" value={f.fullName} onChange={set('fullName')} />{fieldError(errors, 'fullName')}</div>
        <div className="v4-field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} />{fieldError(errors, 'email')}</div>
        <div className="v4-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} aria-describedby="pw-help" /><div id="pw-help" className="v4-muted">At least 8 characters, with an upper-case letter, a lower-case letter and a number.</div>{fieldError(errors, 'password')}</div>
        <div className="v4-field"><label htmlFor="dob">Date of birth</label><input id="dob" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} />{fieldError(errors, 'dateOfBirth')}</div>
        <div className="v4-field"><label htmlFor="classCode">Class code <span className="v4-muted">(optional: from your school)</span></label><input id="classCode" type="text" autoCapitalize="characters" autoComplete="off" value={f.classCode} onChange={set('classCode')} />{fieldError(errors, 'classCode')}</div>
        {!f.classCode.trim() && (
          <div className="v4-field"><label htmlFor="grade">Your class or year</label>
            <select id="grade" value={f.grade} onChange={set('grade')}><option value="">Choose…</option>{GRADE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{fieldError(errors, 'grade')}</div>
        )}
        <div className="v4-field"><label htmlFor="phone">Phone <span className="v4-muted">(optional)</span></label><input id="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />{fieldError(errors, 'phone')}</div>

        {showParent && (
          <fieldset className="v4-card" style={{ marginBottom: 14, background: 'var(--amber-lt)', borderColor: '#FDE68A' }}>
            <legend className="v4-h2" style={{ padding: '0 6px' }}>Your parent or guardian</legend>
            {minor
              ? <p style={{ fontSize: 14, marginBottom: 12 }}>Because you are under 18, a parent or guardian must say it is OK. We will email them a link to confirm and to create their own parent account. You can start the test as soon as they confirm.</p>
              : <p style={{ fontSize: 14, marginBottom: 12 }}>Up to class 12, we need a parent or guardian's email. We will invite them to create a parent account, so they can follow your progress and reports. You can start straight away.</p>}
            <div className="v4-field"><label htmlFor="gName">Their name</label><input id="gName" type="text" value={f.guardianName} onChange={set('guardianName')} />{fieldError(errors, 'guardianName')}</div>
            <div className="v4-field"><label htmlFor="gEmail">Their email <span className="v4-muted">(not your own)</span></label><input id="gEmail" type="email" value={f.guardianEmail} onChange={set('guardianEmail')} />{fieldError(errors, 'guardianEmail')}</div>
            <div className="v4-field"><label htmlFor="gRel">Who are they?</label>
              <select id="gRel" value={f.guardianRelationship} onChange={set('guardianRelationship')}>{['parent', 'mother', 'father', 'guardian', 'other'].map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}</select></div>
          </fieldset>
        )}

        {!minor && f.classCode.trim() && (
          <label className="v4-check" style={{ marginBottom: 14 }}><input type="checkbox" checked={f.shareWithSchool} onChange={set('shareWithSchool')} /><span>Let my school's counsellor see my individual report. (Optional. You can change this later.)</span></label>
        )}

        <PrivacySummary />
        <label className="v4-check" style={{ margin: '14px 0' }}><input type="checkbox" checked={f.acceptTerms} onChange={set('acceptTerms')} /><span>I have read the summary above and agree to the terms.</span></label>
        {fieldError(errors, 'acceptTerms')}
        {general && <div className="v4-alert error" role="alert">{general}</div>}
        <button className="v4-btn" style={{ width: '100%' }} type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="v4-muted" style={{ marginTop: 16, textAlign: 'center' }}>Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
