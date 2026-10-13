import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Empty, PageHead, Pill, Progress, Stat } from '../../ui/kit';
import { fmtDate, greeting } from '../../ui/format';
import { gradeLabel } from '../liveApi';

const A = { submitted: ['leaf', 'Assessment done'], in_progress: ['gold', 'Assessment started'], not_started: ['grey', 'Assessment not started'] };
export default function LiveMentorOverview() {
  const { data } = usePlatform();
  const S = data.students, active = S.filter(s => !s.limited), by = id => S.find(s => String(s.id) === String(id));
  const open = active.reduce((n, s) => n + s.tasks.open, 0), overdue = active.reduce((n, s) => n + s.tasks.overdue, 0);
  const attention = data.alerts.filter(a => a.level === 'high').length;
  if (S.length === 0) return <><PageHead eyebrow="Mentor overview" title={`${greeting()}, ${data.me.firstName}`}>You have no students yet.</PageHead><Card><Empty icon="users" title="No students assigned">An administrator assigns students to you. They will appear here as soon as they are.</Empty></Card></>;
  return (
    <>
      <PageHead eyebrow="Mentor overview" title={`${greeting()}, ${data.me.firstName}`}>You mentor {S.length} student{S.length === 1 ? '' : 's'}. Here is who needs you most this week.</PageHead>
      <div className="pf-grid g4" style={{ marginBottom: 18 }}>
        <Stat label="Students" value={S.length} icon="users" hint="assigned to you" />
        <Stat label="Need attention" value={attention} icon="alert" up={false} hint="at risk this week" />
        <Stat label="Open tasks" value={open} icon="tasks" hint={`${overdue} overdue`} />
        <Stat label="Sessions coming up" value={data.sessions.length} icon="calendar" hint="scheduled" />
      </div>
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Needs your attention" icon="alert" />
            {data.alerts.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing urgent. Everyone is on track.</p> :
              <ul className="pf-list">{data.alerts.map(a => <li key={a.id}><Pill tone={a.level === 'high' ? 'coral' : a.level === 'medium' ? 'gold' : 'leaf'}>{a.level === 'good' ? 'Good news' : a.level}</Pill><span className="pf-grow">{a.text}</span>{!by(a.studentId).limited && <Link className="pf-btn sm ghost" to={`../students?open=${a.studentId}`}>Open</Link>}</li>)}</ul>}</Card>
          <Card><CardHead title="Your students" action="See all" to="../students" icon="users" />
            <div className="pf-grid g2">{S.map(s => (
              <Link key={s.id} to={s.limited ? '../students' : `../students?open=${s.id}`} className="pf-card" style={{ boxShadow: 'none', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="pf-row"><Avatar name={s.name} /><div className="pf-grow"><b>{s.name}</b><div className="pf-small pf-muted">{gradeLabel(s.grade)}{s.goal ? ` · ${s.goal}` : ''}</div></div></div>
                {s.limited ? <div style={{ marginTop: 10 }}><Pill tone="gold">Waiting for parent</Pill></div> : <>
                  <div className="pf-row pf-between pf-small" style={{ margin: '10px 0 4px' }}><span className="pf-muted">Tasks done</span><b className="pf-num">{s.tasks.done}/{s.tasks.total}</b></div><Progress value={s.tasks.total ? (s.tasks.done / s.tasks.total) * 100 : 0} label={`${s.name} tasks done`} />
                  <div className="pf-row pf-wrap" style={{ marginTop: 10, gap: 6 }}><Pill tone={A[s.assessment.state][0]}>{A[s.assessment.state][1]}</Pill>{s.tasks.overdue > 0 && <Pill tone="coral">{s.tasks.overdue} overdue</Pill>}</div></>}
              </Link>))}</div></Card>
        </div>
        <Card><CardHead title="Coming up" action="Sessions" to="../sessions" icon="calendar" />
          {data.sessions.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No sessions scheduled. Book one from the Sessions page.</p> :
            <ul className="pf-list">{data.sessions.slice(0, 6).map(x => <li key={x.id}><Avatar name={by(x.studentId).name} size={32} /><span className="pf-grow"><b>{by(x.studentId).name}</b><br /><span className="pf-small pf-muted">{fmtDate(x.date)}{x.time ? `, ${x.time}` : ''}</span></span></li>)}</ul>}</Card>
      </div>
    </>
  );
}
