import { usePlatform } from '../../data/store';
import { Card, CardHead, Icon, Pill, Stat } from '../../ui/kit';
import { dueLabel, fmtDate, greeting } from '../../ui/format';
import { WithChild } from './shared';

const A = { submitted: 'Done', in_progress: 'Started', not_started: 'Not started' };
export default function LiveParentOverview() {
  const { data } = usePlatform();
  return (
    <WithChild eyebrow={data.child ? `${data.child.firstName}’s week` : 'Overview'} title={`${greeting()}, ${data.me.firstName}`} intro={c => `A clear picture of how ${c.firstName} is doing, without having to ask.`}>
      {d => { const c = d.child, open = d.tasks.filter(t => t.status !== 'done'), next = d.sessions.next; return (<>
        <div className="pf-grid g4" style={{ marginBottom: 18 }}>
          <Stat label="Tasks done" value={`${c.tasks.done}/${c.tasks.total}`} icon="tasks" hint={c.tasks.total ? `${Math.round((c.tasks.done / c.tasks.total) * 100)}% complete` : 'None set yet'} />
          <Stat label="Overdue" value={c.tasks.overdue} icon="alert" up={false} hint={c.tasks.overdue ? 'Worth a gentle word' : 'Nothing late'} />
          <Stat label="Career assessment" value={A[c.assessment.state]} icon="clipboard" hint={c.assessment.hollandCode ? `Interest code ${c.assessment.hollandCode}` : ' '} />
          <Stat label="Last signed in" value={c.lastLoginAt ? fmtDate(String(c.lastLoginAt).slice(0, 10)) : 'Not yet'} icon="clock" hint={`${c.firstName}’s account`} />
        </div>
        <div className="pf-grid g2">
          <Card><CardHead title="Coming up" action="All tasks" to="tasks" icon="tasks" />
            {open.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing open right now.</p> :
              <ul className="pf-list">{open.slice(0, 5).map(t => { const l = dueLabel(t.due); return <li key={t.id}><span className="pf-grow"><b>{t.title}</b><br /><span className="pf-small pf-muted">{t.subject} · from {t.by}</span></span><Pill tone={l.tone}>{l.text}</Pill></li>; })}</ul>}</Card>
          <div className="pf-grid" style={{ alignContent: 'start' }}>
            <Card ai><span className="tag"><Icon name="calendar" size={14} />Next mentor session</span>
              {next ? <><h4 style={{ fontSize: 20, margin: '8px 0 2px' }}>{fmtDate(next.date)}{next.time ? `, ${next.time}` : ''}</h4><p className="pf-small" style={{ margin: 0 }}>{d.mentor ? d.mentor.name : ''}{next.topic ? ` · ${next.topic}` : ''}</p></> :
                <p className="pf-small" style={{ margin: '8px 0 0' }}>{d.mentor ? `${d.mentor.name} has not booked the next session yet.` : 'A mentor has not been assigned yet.'}</p>}</Card>
            <Card><CardHead title="Reports" action="Open" to="reports" icon="file" />
              <p className="pf-small" style={{ margin: 0 }}>{d.reports.length ? `${d.reports.length} career report${d.reports.length === 1 ? '' : 's'} available.` : `${c.firstName} has not finished the career assessment yet.`}</p></Card>
          </div>
        </div></>); }}
    </WithChild>
  );
}
