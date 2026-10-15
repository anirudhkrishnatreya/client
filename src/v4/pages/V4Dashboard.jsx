import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v2 as defaultApi, errorCode } from '../api';
import { useAuth } from '../../context/AuthContext';
import Frame from './Frame';
import PrivacySummary from './PrivacySummary';
import FinishedBanner from './FinishedBanner';
import { GRADE_OPTIONS, ageFrom } from './V4Register';

const TRACK_OF = g => (['6', '7', '8', '9'].includes(g) ? 'junior' : ['10', '11', '12'].includes(g) ? 'senior' : 'college');
const fmtDate = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function V4Dashboard({ api = defaultApi, today = new Date() }) {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [consent, setConsent] = useState(null);
  const [reports, setReports] = useState([]);
  const [hasSession, setHasSession] = useState(false);
  const [state, setState] = useState('loading');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, r, s] = await Promise.allSettled([api.consent(), api.reports(), api.session()]);
      if (c.status === 'rejected') throw c.reason;
      setConsent(c.value.data.consent);
      setReports(r.status === 'fulfilled' ? r.value.data.reports : []);
      setHasSession(s.status === 'fulfilled');
      setState('ready');
    } catch (e) { setState('error'); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, ok) => {
    setMsg('');
    try { await fn(); if (ok) setMsg(ok); await load(); } catch (e) { setMsg(`That did not work (${errorCode(e) || 'network error'}). Please try again.`); }
  };

  if (state === 'loading') return <Frame><p role="status">Loading…</p></Frame>;
  if (state === 'error') return <Frame><div className="v4-alert error" role="alert">We could not load your page.</div><button className="v4-btn" onClick={load}>Try again</button></Frame>;

  const needsProfile = !consent.status || !(user && user.track);
  const locked = needsProfile || consent.status === 'pending' || consent.status === 'withdrawn';

  return (
    <Frame title={`Welcome, ${(user && user.fullName || '').split(' ')[0]}`}>
      <FinishedBanner />
      {msg && <div className="v4-alert info" role="status">{msg}</div>}

      {needsProfile && <CompleteProfile api={api} user={user} consent={consent} today={today} onDone={async () => { refreshUser && refreshUser({}); await load(); }} />}
      {consent.status === 'pending' && <PendingConsent api={api} consent={consent} run={run} />}
      {consent.status === 'withdrawn' && <div className="v4-alert info" role="status">You have withdrawn consent, so the assessment is switched off. Your information is queued for deletion.</div>}

      <section className="v4-card" aria-labelledby="test-h">
        <h2 id="test-h" className="v4-h2">Your career assessment</h2>
        <p className="v4-muted" style={{ marginBottom: 12 }}>Two parts, about an hour in all. You can stop and carry on later: your answers are saved.</p>
        <button className="v4-btn" disabled={locked} onClick={() => nav('/v4/test')}>{hasSession ? 'Continue your test' : 'Start your test'}</button>
        {locked && <p className="v4-muted" style={{ marginTop: 8 }}>{consent.status === 'pending' ? 'Available once your parent or guardian confirms.' : consent.status === 'withdrawn' ? 'Not available.' : 'Finish the details above first.'}</p>}
      </section>

      <ClassCard api={api} user={user} run={run} refreshUser={refreshUser} />

      <section className="v4-card" aria-labelledby="rep-h">
        <h2 id="rep-h" className="v4-h2">Your results</h2>
        {reports.length === 0 ? <p className="v4-muted">Nothing yet. Your results will appear here when you finish the test.</p> : (
          <ul style={{ listStyle: 'none' }}>
            {reports.map(r => (
              <li key={r.assessmentId} className="v4-row" style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                <div className="v4-grow">
                  <strong>{fmtDate(r.completedAt)}</strong>{r.hollandCode && <span className="v4-pill" style={{ marginLeft: 8 }}>{r.hollandCode}</span>}
                  {r.validity === 'invalid' && <div className="v4-muted">This attempt may not reflect you well. Retaking is recommended.</div>}
                  {r.provisional && <div className="v4-muted">Provisional scores</div>}
                </div>
                <Link className="v4-btn secondary" to={`/v4/results/${r.assessmentId}`}>View</Link>
                <PdfCell api={api} report={r} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Privacy api={api} consent={consent} run={run} />
    </Frame>
  );
}

export function PdfCell({ api, report }) {
  const [err, setErr] = useState('');
  const [status, setStatus] = useState(report.pdf && report.pdf.status);
  // while the PDF is being made, look again every few seconds so it turns into a Download button on its own
  useEffect(() => {
    if (status !== 'preparing') return undefined;
    const t = setInterval(() => { api.reports().then(({ data }) => { const r = data.reports.find(x => x.assessmentId === report.assessmentId); if (r && r.pdf && r.pdf.status !== 'preparing') setStatus(r.pdf.status); }).catch(() => {}); }, 6000);
    return () => clearInterval(t);
  }, [status, api, report.assessmentId]);
  if (status === 'ready') {
    const download = async () => {
      setErr('');
      try {
        const { data } = await api.pdf(report.assessmentId);
        const url = URL.createObjectURL(data);
        const a = document.createElement('a'); a.href = url; a.download = 'iMenteo-career-report.pdf'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { setErr('Download failed. Please try again.'); }
    };
    return <><button className="v4-btn" onClick={download}>Download PDF</button>{err && <span className="v4-err" role="alert">{err}</span>}</>;
  }
  if (status === 'preparing') return <span className="v4-muted" role="status">Preparing your PDF…</span>;
  if (status === 'failed') {
    const retry = async () => {
      setErr('');
      try { await api.requestPdf(report.assessmentId); setStatus('preparing'); } catch { setErr('We could not restart it. Please try again later.'); }
    };
    return <><span className="v4-muted" role="status">The PDF could not be made.</span> <button className="v4-btn secondary" onClick={retry}>Try again</button>{err && <span className="v4-err" role="alert">{err}</span>}</>;
  }
  const create = async () => {
    setErr('');
    try { await api.requestPdf(report.assessmentId); setStatus('preparing'); }
    catch (e) { setErr(errorCode(e) === 'PDF_DISABLED' ? 'The PDF is not available yet.' : 'We could not start it. Please try again later.'); }
  };
  return <><button className="v4-btn secondary" onClick={create}>Create my PDF</button>{err && <span className="v4-err" role="alert">{err}</span>}</>;
}

function PendingConsent({ api, consent, run }) {
  const [editing, setEditing] = useState(false);
  const [g, setG] = useState({ name: '', email: '', relationship: 'parent' });
  return (
    <section className="v4-card" aria-labelledby="pc-h" style={{ borderColor: '#FDE68A', background: 'var(--amber-lt)' }}>
      <h2 id="pc-h" className="v4-h2">Waiting for your parent or guardian</h2>
      <p style={{ marginBottom: 12 }}>We emailed a confirmation link to <strong>{consent.guardianEmail}</strong>. You can start as soon as they confirm. The link works for 7 days.</p>
      <div className="v4-row">
        <button className="v4-btn secondary" onClick={() => run(() => api.resendConsent(), 'We sent a new link.')}>Send the link again</button>
        <button className="v4-btn secondary" onClick={() => setEditing(e => !e)}>Wrong email?</button>
      </div>
      {editing && (
        <form style={{ marginTop: 14 }} onSubmit={e => { e.preventDefault(); run(async () => { await api.changeGuardian(g); setEditing(false); }, 'We sent the link to the new address.'); }}>
          <div className="v4-field"><label htmlFor="gn">Their name</label><input id="gn" type="text" value={g.name} onChange={e => setG({ ...g, name: e.target.value })} /></div>
          <div className="v4-field"><label htmlFor="ge">Their email</label><input id="ge" type="email" value={g.email} onChange={e => setG({ ...g, email: e.target.value })} /></div>
          <button className="v4-btn" type="submit">Save and send</button>
        </form>
      )}
    </section>
  );
}

function CompleteProfile({ api, user, consent, today, onDone }) {
  const [grade, setGrade] = useState('');
  const [dob, setDob] = useState('');
  const [agree, setAgree] = useState(false);
  const [guardian, setGuardian] = useState({ name: '', email: '', relationship: 'parent' });
  const [err, setErr] = useState('');
  const age = ageFrom(dob, today);
  const minor = age !== null && age < 18;
  const needGrade = !(user && user.track);
  const needConsent = !consent.status;
  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      if (needGrade) { if (!grade) return setErr('Choose your class or year.'); await api.setProfile({ track: TRACK_OF(grade), grade }); }
      if (needConsent) await api.completeProfile({ dateOfBirth: dob, acceptTerms: agree, ...(minor ? { guardian } : {}) });
      await onDone();
    } catch (e2) {
      const d = e2.response && e2.response.data;
      setErr(d && d.details ? Object.values(d.details).flat().join('. ') : 'We could not save that. Please check and try again.');
    }
  };
  return (
    <form className="v4-card" onSubmit={submit} aria-labelledby="cp-h">
      <h2 id="cp-h" className="v4-h2">A few details first</h2>
      {needGrade && <div className="v4-field"><label htmlFor="cpg">Your class or year</label><select id="cpg" value={grade} onChange={e => setGrade(e.target.value)}><option value="">Choose…</option>{GRADE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>}
      {needConsent && (
        <>
          <div className="v4-field"><label htmlFor="cpd">Date of birth</label><input id="cpd" type="date" value={dob} onChange={e => setDob(e.target.value)} /></div>
          {minor && (
            <>
              <div className="v4-field"><label htmlFor="cgn">Parent or guardian's name</label><input id="cgn" type="text" value={guardian.name} onChange={e => setGuardian({ ...guardian, name: e.target.value })} /></div>
              <div className="v4-field"><label htmlFor="cge">Parent or guardian's email</label><input id="cge" type="email" value={guardian.email} onChange={e => setGuardian({ ...guardian, email: e.target.value })} /></div>
            </>
          )}
          <PrivacySummary />
          <label className="v4-check" style={{ margin: '14px 0' }}><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /><span>I have read the summary and agree to the terms.</span></label>
        </>
      )}
      {err && <div className="v4-alert error" role="alert">{err}</div>}
      <button className="v4-btn" type="submit">Save</button>
    </form>
  );
}

function ClassCard({ api, user, run, refreshUser }) {
  const [code, setCode] = useState('');
  const inClass = Boolean(user && user.cohortId);
  return (
    <section className="v4-card" aria-labelledby="cl-h">
      <h2 id="cl-h" className="v4-h2">Your class</h2>
      {inClass ? (
        <div className="v4-row"><p className="v4-grow">You are in a class at your school.</p><button className="v4-btn secondary" onClick={() => run(async () => { await api.leaveClass(); refreshUser && refreshUser({ cohortId: null }); }, 'You left the class.')}>Leave class</button></div>
      ) : (
        <form className="v4-row" onSubmit={e => { e.preventDefault(); run(async () => { const { data } = await api.joinClass(code.trim()); refreshUser && refreshUser({ cohortId: (data && data.cohort && data.cohort.id) || 'joined' }); setCode(''); }, 'You joined the class.'); }}>
          <div className="v4-field v4-grow" style={{ marginBottom: 0 }}><label htmlFor="jc">Class code from your school (optional)</label><input id="jc" type="text" autoCapitalize="characters" value={code} onChange={e => setCode(e.target.value)} /></div>
          <button className="v4-btn secondary" type="submit" disabled={!code.trim()} style={{ alignSelf: 'flex-end' }}>Join</button>
        </form>
      )}
    </section>
  );
}

function Privacy({ api, consent, run }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <section className="v4-card" aria-labelledby="pr-h">
      <h2 id="pr-h" className="v4-h2">Your privacy</h2>
      {consent.required
        ? <p className="v4-muted">Whether your school can see your individual report was decided by your parent or guardian: <strong>{consent.shareWithSchool ? 'yes' : 'no'}</strong>.</p>
        : <label className="v4-check"><input type="checkbox" checked={consent.shareWithSchool} onChange={e => run(() => api.setSharing(e.target.checked))} /><span>Let my school's counsellor see my individual report.</span></label>}
      <div style={{ marginTop: 14 }}>
        {!confirm
          ? <button className="v4-btn secondary" onClick={() => setConfirm(true)}>Withdraw and ask for my information to be deleted</button>
          : <div><div className="v4-alert error" role="alert">This switches off your assessment and asks us to delete your information. Are you sure?</div><button className="v4-btn danger" onClick={() => run(() => api.withdraw())}>Yes, withdraw</button> <button className="v4-btn secondary" onClick={() => setConfirm(false)}>Cancel</button></div>}
      </div>
    </section>
  );
}
