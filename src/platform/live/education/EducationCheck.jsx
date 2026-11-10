import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon } from '../../ui/kit';
import { educationApi, errMessage } from '../liveApi';

const WHO = { signup: 'your sign-up', chat: 'your guide', student: 'you', mentor: 'your mentor', school: 'your school', roster: 'your school' };
const SNOOZE = 'pf-edu-snooze';

/**
 * A short question when what we know about where the student is needs checking: not known, out of date after a new academic year,
 * two sources disagree, or the year is missing. One tap answers it. It hides when nothing needs checking, and for the rest of the
 * visit when they say "not now".
 */
export default function EducationCheck({ onChanged }) {
  const [d, setD] = useState(null);
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(SNOOZE) === '1'; } catch { return false; } });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const load = useCallback(() => educationApi.me().then(setD).catch(() => setD(null)), []);
  useEffect(() => { load(); }, [load]);
  if (!d || hidden || !d.context.needsConfirmation) return null;
  const e = d.context.education;
  const label = id => (d.options.stages.find(s => s.id === id) || {}).label || id;
  const run = async fn => { setBusy(true); setErr(''); try { await fn(); await load(); if (onChanged) await onChanged(); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const later = () => { try { sessionStorage.setItem(SNOOZE, '1'); } catch { /* the question just comes back next visit */ } setHidden(true); };
  const conflict = e.conflicts.find(c => c.field === 'stage');
  let question, actions;
  if (!e.stage) {
    question = 'Which class or year are you in?';
    actions = <Link className="pf-btn sm" to="/platform/student/about">Tell us</Link>;
  } else if (conflict) {
    const other = conflict.other;
    question = `Which is right: ${label(e.stage)} (from ${WHO[e.source]}) or ${label(other.stage)} (from ${WHO[other.source]})?`;
    actions = <>
      <button type="button" className="pf-btn sm" disabled={busy} onClick={() => run(() => educationApi.confirm())}>{label(e.stage)}</button>
      <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => run(() => educationApi.save({ stage: other.stage }))}>{label(other.stage)}</button>
      <Link className="pf-btn sm ghost" to="/platform/student/about">Neither</Link></>;
  } else if (e.needs.includes('year')) {
    question = `We have “${e.label}”. Which year are you in?`;
    actions = <Link className="pf-btn sm" to="/platform/student/about">Tell us</Link>;
  } else if (e.needs.includes('stale')) {
    question = `A new academic year has started. Are you still in ${e.label}?`;
    actions = <><button type="button" className="pf-btn sm" disabled={busy} onClick={() => run(() => educationApi.confirm())}>Yes, I am</button><Link className="pf-btn sm ghost" to="/platform/student/about">No, change it</Link></>;
  } else {
    question = `Is this right: ${e.label}?`;
    actions = <><button type="button" className="pf-btn sm" disabled={busy} onClick={() => run(() => educationApi.confirm())}>Yes, that is right</button><Link className="pf-btn sm ghost" to="/platform/student/about">Change it</Link></>;
  }
  return (
    <Card className="pf-edu-check" role="region" aria-label="Check your details">
      <div className="pf-row pf-wrap" style={{ gap: 10 }}>
        <Icon name="info" size={18} />
        <div className="pf-grow"><b>{question}</b><div className="pf-small pf-muted">Your plans, exams and career suggestions are based on this.</div></div>
        <div className="pf-row pf-wrap" style={{ gap: 6 }}>{actions}<button type="button" className="pf-linkbtn pf-small" onClick={later}>Not now</button></div>
      </div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}
    </Card>
  );
}
