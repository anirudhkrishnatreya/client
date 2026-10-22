import { Link } from 'react-router-dom';
import { Card, CardHead, Pill } from '../../ui/kit';
import { useLoop, TYPE_LABEL, TYPE_TONE, fmtMinutes } from './loopApi';

/** The overview's "Today" card: what the plan has for today (or the next thing to do), with a link to the week. */
export default function LoopToday() {
  const { loop, loading, closed, error } = useLoop();
  if (loading || closed || error) return null;
  if (!loop.goal) return <Card style={{ marginBottom: 18 }}><CardHead title="Your weekly plan" icon="calendar" /><p className="pf-small" style={{ margin: '0 0 10px' }}>Pick a career and tell us about your week. iMenteo turns it into small steps that fit your free time.</p><Link className="pf-btn sm" to="goal">Set my goal</Link></Card>;
  const w = loop.week;
  const today = w.items.filter(i => i.day === w.todayIndex);
  const show = today.length ? today : w.items.filter(i => i.status === 'todo').slice(0, 1);
  return (
    <Card style={{ marginBottom: 18 }}><CardHead title={today.length ? 'Today' : 'Next up'} action="This week" to="plan" icon="calendar" />
      {show.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing left this week. Well done.</p> :
        <ul className="pf-list">{show.map(i => <li key={i.id}><Pill tone={TYPE_TONE[i.type]}>{TYPE_LABEL[i.type]}</Pill><span className="pf-grow"><b>{i.title}</b><br /><span className="pf-small pf-muted">{i.skill.title} · {fmtMinutes(i.minutes)}</span></span>{i.status === 'done' ? <Pill tone="leaf" icon="check">Done</Pill> : null}</li>)}</ul>}
      <p className="pf-small pf-muted" style={{ margin: '10px 0 0' }}>{loop.progress.done} of {loop.progress.total} steps done towards {loop.roadmap.title}.</p>
    </Card>
  );
}
