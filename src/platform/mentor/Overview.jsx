import { Link } from 'react-router-dom';
import { usePlatform } from '../data/store';
import { Avatar, Bars, Card, CardHead, Icon, PageHead, Pill, Progress, Stat } from '../ui/kit';
import { greeting } from '../ui/format';

const TONE = { on: ['leaf', 'On track'], watch: ['gold', 'Watch'], risk: ['coral', 'Needs help'] };
export default function MentorOverview() {
  const { data } = usePlatform();
  const S = data.students, by = id => S.find(s => s.id === id);
  const risk = S.filter(s => s.status === 'risk').length;
  const avg = Math.round(S.reduce((n, s) => n + s.score, 0) / S.length);
  const done = S.reduce((n, s) => n + s.tasksDone, 0), total = S.reduce((n, s) => n + s.tasksTotal, 0);
  return (
    <>
      <PageHead eyebrow="Mentor overview" title={`${greeting()}, ${data.me.name.split(' ')[1] ? data.me.name.split(' ').slice(0, 2).join(' ') : data.me.name}`}>You mentor {S.length} students. Here is who needs you most this week.</PageHead>
      <div className="pf-grid g4" style={{ marginBottom: 18 }}>
        <Stat label="Students" value={S.length} icon="users" hint="assigned to you" />
        <Stat label="Need attention" value={risk} icon="alert" hint="at risk this week" up={false} />
        <Stat label="Average score" value={`${avg}%`} icon="chart" delta="+3 vs last week" />
        <Stat label="Tasks done" value={`${done}/${total}`} icon="tasks" hint={`${Math.round((done / total) * 100)}% complete`} />
      </div>
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Needs your attention" icon="alert" />
            <ul className="pf-list">{data.alerts.map(a => <li key={a.id}><Pill tone={a.level === 'high' ? 'coral' : a.level === 'medium' ? 'gold' : 'leaf'}>{a.level === 'good' ? 'Good news' : a.level}</Pill><span className="pf-grow">{a.text}</span><Link className="pf-btn sm ghost" to={`../students?open=${a.studentId}`}>Open</Link></li>)}</ul></Card>
          <Card><CardHead title="Your students" action="See all" to="../students" icon="users" />
            <div className="pf-grid g2">{S.slice(0, 6).map(s => (
              <Link key={s.id} to={`../students?open=${s.id}`} className="pf-card" style={{ boxShadow: 'none', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="pf-row"><Avatar name={s.name} /><div className="pf-grow"><b>{s.name}</b><div className="pf-small pf-muted">Class {s.klass} · {s.goal}</div></div><Pill tone={TONE[s.status][0]}>{TONE[s.status][1]}</Pill></div>
                <div className="pf-row pf-between pf-small" style={{ margin: '10px 0 4px' }}><span className="pf-muted">Goal progress</span><b className="pf-num">{s.progress}%</b></div><Progress value={s.progress} label={`${s.name} goal progress`} /></Link>))}</div></Card>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="This week’s sessions" action="Prepare" to="../sessions" icon="calendar" />
            <ul className="pf-list">{data.sessions.map(x => <li key={x.id}><Avatar name={by(x.studentId).name} size={32} /><span className="pf-grow"><b>{by(x.studentId).name}</b><br /><span className="pf-small pf-muted">{x.when}</span></span>{x.prepped ? <Pill tone="leaf">Ready</Pill> : <Pill tone="gold">To prepare</Pill>}</li>)}</ul></Card>
          <Card><CardHead title="Sessions per day" icon="chart" /><Bars data={data.weekly} height={130} /></Card>
        </div>
      </div>
    </>
  );
}
