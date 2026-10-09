import { usePlatform } from '../data/store';
import { Card, CardHead, Icon, PageHead, Pill, Ring, Spark, Stat } from '../ui/kit';
import { dueLabel, fmtDate, greeting } from '../ui/format';

export default function ParentOverview() {
  const { data } = usePlatform();
  const c = data.child, open = data.tasks.filter(t => t.status !== 'done').sort((a, b) => a.due.localeCompare(b.due));
  const last = data.assessments.past[0];
  const mins = data.weekMinutes.reduce((n, d) => n + d.value, 0);
  return (
    <>
      <PageHead eyebrow={`${c.firstName}’s week`} title={`${greeting()}, ${data.me.name.split(' ')[0]}`}>A clear picture of how {c.firstName} is doing, without having to ask.</PageHead>
      <div className="pf-grid g-main" style={{ marginBottom: 18 }}>
        <Card ai><span className="tag"><Icon name="sparkles" size={14} />This week in short</span><h3 style={{ fontSize: 24, margin: '8px 0 10px' }}>{data.digest.headline}</h3>
          <ul className="pf-list">{data.digest.points.map(p => <li key={p.text} style={{ borderColor: '#F3E3B8' }}><Pill tone={p.tone}>{p.tone === 'leaf' ? 'Good' : p.tone === 'gold' ? 'Note' : 'Soon'}</Pill><span>{p.text}</span></li>)}</ul></Card>
        <Card><div className="pf-row" style={{ gap: 18 }}><Ring value={data.goal.progress} size={104} sub="to goal" /><div><div className="pf-eyebrow">Goal</div><b style={{ fontSize: 18 }}>{data.goal.title}</b><div className="pf-small pf-muted">Class {c.klass} · {c.school}</div></div></div></Card>
      </div>
      <div className="pf-grid g4" style={{ marginBottom: 18 }}>
        <Stat label="Study this week" value={`${Math.floor(mins / 60)}h ${mins % 60}m`} icon="clock" delta="+25 min vs last week" />
        <Stat label="Study streak" value={`${c.streak} days`} icon="flame" />
        <Stat label="Open tasks" value={open.length} icon="tasks" hint="not finished yet" />
        <Stat label="Latest score" value={`${last.score}%`} icon="award" hint={last.title} />
      </div>
      <div className="pf-grid g2">
        <Card><CardHead title="Coming up" action="All tasks" to="../tasks" icon="tasks" /><ul className="pf-list">{open.slice(0, 4).map(t => <li key={t.id}><span className="pf-grow"><b>{t.title}</b><br /><span className="pf-small pf-muted">{t.subject}</span></span><Pill tone={dueLabel(t.due).tone}>{dueLabel(t.due).text}</Pill></li>)}</ul></Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Score trend" icon="trend" /><Spark data={data.scoreTrend} width={360} height={70} label="Score trend" /></Card>
          <Card><CardHead title="Next mentor session" action="Mentor" to="../mentor" icon="calendar" /><b>{fmtDate(data.mentor.next.date)}, {data.mentor.next.time}</b><div className="pf-small pf-muted">{data.mentor.name} · {data.mentor.next.topic}</div></Card>
        </div>
      </div>
    </>
  );
}
