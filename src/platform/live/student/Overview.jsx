import { Link, useNavigate } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Icon, PageHead, Pill, Stat } from '../../ui/kit';
import { dueLabel, fmtDate, greeting } from '../../ui/format';
import { LOOP_ENABLED } from '../loop/config';
import LoopToday from '../loop/LoopToday';

export default function LiveStudentOverview() {
  const { data } = usePlatform();
  const nav = useNavigate();
  const open = data.tasks.filter(t => t.status !== 'done');
  const overdue = open.filter(t => dueLabel(t.due).tone === 'coral').length;
  const a = data.assessment, next = data.sessions.next;
  const report = data.reports[0];
  return (
    <>
      <Card className="pf-hero" style={{ marginBottom: 18 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pf-eyebrow">{greeting()}, {data.me.firstName}</div>
          <h2 style={{ margin: '6px 0 8px' }}>{data.goal.title ? `Working towards: ${data.goal.title}` : 'What do you want to become?'}</h2>
          <p>{data.goal.title ? 'Your mentor and your tasks are here to help you get there, one week at a time.' : 'Set a goal, even a rough one. You can change it any time, and your mentor will help you shape it.'}</p>
          <div className="pf-row pf-wrap" style={{ marginTop: 14 }}>
            <button type="button" className="pf-btn gold" onClick={() => nav(a.state === 'submitted' ? 'reports' : '/v4')}><Icon name="play" size={16} />{a.state === 'submitted' ? 'Open my career report' : a.state === 'in_progress' ? 'Continue the career assessment' : 'Start the career assessment'}</button>
            <button type="button" className="pf-btn ghost" onClick={() => nav('goal')} style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}><Icon name="target" size={16} />{data.goal.title ? 'My goal' : 'Set my goal'}</button>
          </div>
        </div>
      </Card>
      {LOOP_ENABLED && <LoopToday />}
      <div className="pf-grid g4" style={{ marginBottom: 18 }}>
        <Stat label="Tasks still open" value={open.length} icon="tasks" hint={open[0] ? `Next: ${dueLabel(open[0].due).text.toLowerCase()}` : 'All caught up'} />
        <Stat label="Overdue" value={overdue} icon="alert" up={false} hint={overdue ? 'Worth doing first' : 'Nothing late'} />
        <Stat label="Career assessment" value={a.state === 'submitted' ? 'Done' : a.state === 'in_progress' ? 'Started' : 'Not started'} icon="clipboard" hint={a.hollandCode ? `Interest code ${a.hollandCode}` : 'About 53 to 90 minutes, in sittings'} />
        <Stat label="Next mentor session" value={next ? fmtDate(next.date) : 'Not set'} icon="calendar" hint={next ? (next.time || next.topic) : 'Your mentor will schedule it'} />
      </div>
      <div className="pf-grid g-main">
        <Card><CardHead title="Up next" action="All tasks" to="tasks" icon="tasks" />
          {open.length === 0 ? <div className="pf-muted pf-small">No open tasks. Your mentor will add some, or you can add your own.</div> :
            <ul className="pf-list">{open.slice(0, 5).map(t => { const d = dueLabel(t.due); return <li key={t.id}><span className="pf-grow"><b>{t.title}</b><br /><span className="pf-small pf-muted">{t.subject} · from {t.by}</span></span><Pill tone={d.tone}>{d.text}</Pill></li>; })}</ul>}</Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Your mentor" action="Open" to="mentor" icon="users" />
            {data.mentor ? <div className="pf-row"><Avatar name={data.mentor.name} /><div><b>{data.mentor.name}</b><div className="pf-small pf-muted">{next ? `Next: ${fmtDate(next.date)}${next.time ? `, ${next.time}` : ''}` : 'No session booked yet'}</div></div></div>
              : <p className="pf-small pf-muted" style={{ margin: 0 }}>A mentor has not been assigned to you yet. You will see them here as soon as they are.</p>}</Card>
          <Card><CardHead title="Latest report" action="All reports" to="reports" icon="file" />
            {report ? <><b>Career Discovery Report</b><div className="pf-small pf-muted">{fmtDate(String(report.completedAt).slice(0, 10))}{report.hollandCode ? ` · interest code ${report.hollandCode}` : ''}</div></>
              : <p className="pf-small pf-muted" style={{ margin: 0 }}>Your first report appears here once you finish the career assessment. <Link to="/v4">Start it now</Link>.</p>}</Card>
        </div>
      </div>
      {data.me.parent === 'invited' && <div className="pf-note" role="note" style={{ marginTop: 18 }}><b>Your parent has not set up their account yet.</b> We emailed {data.me.parentEmail}. They need to open the link and choose a password before they can follow your progress.</div>}
    </>
  );
}
