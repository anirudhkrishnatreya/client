import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { observeApi, schoolApi, errMessage } from '../liveApi';
import { V4_ENABLED } from '../../../v4/config';

/** The school dashboard: the whole school at a glance, classes, mentors, open wellbeing alerts, study plans and AI use. */
export function useDashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => schoolApi.dashboard().then(r => setD(r.dashboard)).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { load(); }, [load]);
  return { d, err, load };
}

export default function SchoolHome() {
  const { d, err } = useDashboard();
  const [esc, setEsc] = useState([]);
  useEffect(() => { observeApi.escalations().then(r => setEsc(r.escalations)).catch(() => {}); }, []);
  if (!d) return <><PageHead eyebrow="School" title="Your school" /><p role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p></>;
  const t = d.totals;
  return (
    <>
      <PageHead eyebrow="School" title={d.school.name} actions={d.school.admin ? <><Link className="pf-btn" to="students?import=1"><Icon name="plus" size={15} />Import students</Link><Link className="pf-btn ghost" to="curriculum?import=1"><Icon name="book" size={15} />Import a study plan</Link></> : null}>
        Every student, class and mentor at a glance. Open any student to see their full observatory.
      </PageHead>
      <div className="pf-tiles" style={{ marginBottom: 16 }}>
        <div className="pf-tile"><span className="pf-tile-ic"><Icon name="users" size={18} /></span><div><b>{t.students}</b><span>students</span><small>{t.consented} with consent · {t.withMentor} with a mentor</small></div></div>
        <div className="pf-tile"><span className="pf-tile-ic"><Icon name="trend" size={18} /></span><div><b>{t.active7}</b><span>active this week</span><small>{t.students ? Math.round((t.active7 / t.students) * 100) : 0}% of the school</small></div></div>
        <div className="pf-tile"><span className="pf-tile-ic" style={{ background: 'var(--coral-t)', color: '#A5412D' }}><Icon name="alert" size={18} /></span><div><b>{t.red}</b><span>need attention</span><small>{t.amber} to watch</small></div></div>
        <div className="pf-tile"><span className="pf-tile-ic"><Icon name="heart" size={18} /></span><div><b>{t.escalations}</b><span>wellbeing alerts open</span><small>{t.mentors} mentor{t.mentors === 1 ? '' : 's'}</small></div></div>
      </div>
      <div className="pf-grid g-main">
        <Card flush><div className="pf-card-h" style={{ padding: '16px 18px 0' }}><Icon name="layers" size={18} /><h3>Classes</h3><Link className="act" to="classes">Manage</Link></div>
          {d.cohorts.length === 0 ? <Empty icon="layers" title="No classes yet">Create classes, or import students and let the import create them.</Empty> :
            <div className="pf-scroll"><table className="pf-table"><thead><tr><th>Class</th><th>Students</th><th>Active this week</th><th>Need attention</th><th>Steps (7 days)</th><th>Study plan</th></tr></thead><tbody>
              {d.cohorts.map(c => <tr key={c.id}><td><Link to={`students?cohortId=${c.id}`}><b>{c.name}</b></Link><br /><span className="pf-small pf-muted">code {c.code}</span></td><td>{c.students}</td><td>{c.active7}</td><td>{c.red ? <Pill tone="coral">{c.red}</Pill> : '0'}</td><td>{c.steps7}</td><td className="pf-small">{c.curriculum || <span className="pf-muted">their own goals</span>}</td></tr>)}
            </tbody></table></div>}</Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          {esc.length > 0 && <Card className="pf-o-warn"><CardHead title="Wellbeing alerts" icon="heart" /><ul className="pf-list">{esc.map(e => <li key={e.id}><span className="pf-grow pf-small"><b>{e.name}</b><br />{e.source === 'coach-safety' ? 'A support message to the AI coach' : 'Low energy for several days'} · {e.level === 'school' ? 'with the school' : 'with the mentor'}</span><Link className="pf-btn sm ghost" to={`observe/${e.studentId}`}>Open</Link></li>)}</ul></Card>}
          <Card><CardHead title="Mentors" action="Manage" to="mentors" icon="users" />
            {d.mentors.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No mentors yet.</p> : <ul className="pf-list">{d.mentors.map(m => <li key={m.id}><span className="pf-grow">{m.name}</span><Pill tone="grey">{m.students} students</Pill></li>)}</ul>}</Card>
          <Card><CardHead title="Study plans" action="Open" to="curriculum" icon="book" />
            {d.curricula.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Import your scheme of work and every student’s week follows what is taught in class.</p> : <ul className="pf-list">{d.curricula.map(c => <li key={c.id}><span className="pf-grow">{c.name}</span><Pill tone={c.status === 'active' ? 'leaf' : 'grey'}>{c.status === 'active' ? `${c.classes} class${c.classes === 1 ? '' : 'es'}` : 'Draft'}</Pill></li>)}</ul>}</Card>
          {V4_ENABLED && <Card><CardHead title="Assessment reports" icon="clipboard" /><p className="pf-small" style={{ margin: '0 0 8px' }}>Each class’s career assessment results and every student’s full report.</p><Link className="pf-btn sm ghost" to="/v4/school">Open assessment reports</Link></Card>}
          <Card><CardHead title="AI use today" icon="sparkles" /><p className="pf-small" style={{ margin: 0 }}>${d.ai.todayUsd.toFixed(4)} across {d.ai.calls} AI calls{d.ai.dailyUsd !== null ? ` of a $${d.ai.dailyUsd} daily budget` : ''}.</p></Card>
        </div>
      </div>
    </>
  );
}
