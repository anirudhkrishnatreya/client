import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Icon, PageHead, Tabs } from '../../ui/kit';
import { observeApi, errMessage } from '../liveApi';
import { useLiveEvent } from '../events';
import { Head360 } from './parts';
import Overview360 from './Overview360';
import Timeline from './Timeline';
import Analyst from './Analyst';
import Planning from './Planning';
import Together from './Together';

/**
 * The observatory for one student: everything about them, the AI analyst, the planning studio and working together.
 * The mentor sees all of it; school staff see it without message words and cannot change the plan; the student sees their own
 * ("What my mentor sees") through MyMentorView.
 */
export function ObservatoryBody({ p, reload, tab, setTab }) {
  const tabs = [
    { id: 'overview', label: '360°', icon: 'eye' }, { id: 'timeline', label: 'Timeline', icon: 'clock' },
    ...(p.as !== 'self' ? [{ id: 'analyst', label: 'AI analyst', icon: 'sparkles' }] : []),
    { id: 'plan', label: p.as === 'mentor' ? 'Planning studio' : 'This week', icon: 'calendar' },
    ...(p.as === 'mentor' ? [{ id: 'together', label: 'Together', icon: 'users' }] : [])
  ];
  return (
    <>
      <Tabs label="Observatory" value={tab} onChange={setTab} tabs={tabs} />
      <div style={{ marginTop: 16 }}>
        {tab === 'overview' && <Overview360 p={p} onChanged={reload} />}
        {tab === 'timeline' && <Timeline studentId={p.header.id} initial={p.timeline} />}
        {tab === 'analyst' && p.as !== 'self' && <Analyst p={p} onChanged={reload} />}
        {tab === 'plan' && <Planning p={p} onChanged={reload} />}
        {tab === 'together' && p.as === 'mentor' && <Together p={p} />}
      </div>
    </>
  );
}

export default function Observatory({ base = '..' }) {
  const { studentId } = useParams();
  const [sp, setSp] = useSearchParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const tab = sp.get('tab') || 'overview';
  const setTab = id => setSp(id === 'overview' ? {} : { tab: id }, { replace: true });
  const reload = useCallback(() => observeApi.profile(studentId).then(r => setP(r.profile)).catch(e => setErr(errMessage(e, e && e.response && e.response.data && e.response.data.code === 'CONSENT_PENDING' ? 'This student’s parent has not confirmed yet, so their work is not visible.' : 'We could not open this student.'))), [studentId]);
  useEffect(() => { setP(null); reload(); }, [reload]);
  useLiveEvent(['task.changed', 'session.changed', 'message.new', 'coach.changed'], d => { if (!d || !d.studentId || String(d.studentId) === String(studentId)) reload(); });
  if (!p) return <><PageHead eyebrow="Observatory" title="Student observatory" /><p role={err ? 'alert' : 'status'}>{err || 'Gathering everything about this student…'}</p></>;
  return (
    <>
      <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 10 }}><Link to={base} className="pf-small"><Icon name="chevronLeft" size={13} /> Back</Link><span className="pf-small pf-faint">Observatory{p.as === 'school' ? ' · school view (message words stay between student and mentor)' : ''}</span></div>
      <Head360 h={p.header} actions={p.as === 'mentor' ? <><Link className="pf-btn sm ghost" to={`../messages?student=${p.header.id}`}><Icon name="message" size={14} />Message</Link><Link className="pf-btn sm ghost" to={`../sessions?student=${p.header.id}`}><Icon name="calendar" size={14} />Book</Link></> : null} />
      <ObservatoryBody p={p} reload={reload} tab={tab} setTab={setTab} />
    </>
  );
}
