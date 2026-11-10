import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHead } from '../../ui/kit';
import { loopApi, messageFor } from './loopApi';

/** Shown when the plan was made for an earlier stage of the student's studies, or names exams that no longer apply to them. */
export default function PlanReview({ review, act }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  if (!review || !review.needsRebuild) return null;
  const rebuild = async () => {
    setBusy(true); setErr('');
    try { await act(() => loopApi.rebuild()); nav('/platform/student/goal'); }
    catch (e) { setErr(messageFor(e)); setBusy(false); }
  };
  return (
    <Card className="pf-edu-check warn" role="region" aria-label="Your plan needs a look" style={{ marginBottom: 14 }}>
      <CardHead title="Your plan was made for an earlier stage" icon="alert" />
      <ul className="pf-small" style={{ margin: '0 0 8px', paddingLeft: 18 }}>{review.reasons.map(r => <li key={r}>{r}</li>)}</ul>
      <p className="pf-small" style={{ margin: '0 0 10px' }}>We can build it again for where you are now ({review.stage}), from what you told your guide. Your current plan stays until you accept the new one.</p>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}><button type="button" className="pf-btn" disabled={busy} onClick={rebuild}>{busy ? 'Building…' : 'Rebuild my plan'}</button><Link className="pf-btn ghost" to="/platform/student/about">Check my details first</Link></div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
    </Card>
  );
}
