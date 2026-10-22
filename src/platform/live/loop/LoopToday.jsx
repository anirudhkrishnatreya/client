import { Link } from 'react-router-dom';
import { Card, CardHead, Pill } from '../../ui/kit';
import { Skeleton } from './Loader';
import { useLoop, TYPE_LABEL, TYPE_TONE, fmtMinutes } from './loopApi';

/** The overview's card: today's steps from the plan, or an invitation to start the goal chat. */
export default function LoopToday() {
  const { loop, loading, closed, error } = useLoop();
  if (loading) return <Card style={{ marginBottom: 18 }}><span role="status" aria-label="Loading your plan"><Skeleton w="30%" h={18} style={{ marginBottom: 14 }} /><Skeleton h={12} style={{ marginBottom: 9 }} /><Skeleton w="60%" h={12} /></span></Card>;
  if (closed || error) return null;
  if (loop.mode === 'chat') return <Card style={{ marginBottom: 18 }}><CardHead title="Your plan" icon="sparkles" /><p className="pf-small" style={{ margin: '0 0 10px' }}>{loop.currentGoal ? 'You started planning a new goal. Finish the chat with your guide to see the new plan.' : 'Tell your guide what you want to become, any career at all. A few questions, and you get a plan, one week at a time.'}</p><Link className="pf-btn sm" to="goal">{loop.intake && loop.intake.messages.length > 1 ? 'Continue the chat' : 'Start the chat'}</Link></Card>;
  const w = loop.week;
  const today = w.items.filter(i => i.day === w.todayIndex);
  const show = today.length ? today : w.items.filter(i => i.status === 'todo').slice(0, 1);
  return (
    <Card style={{ marginBottom: 18 }}><CardHead title={today.length ? 'Today' : 'Next up'} action="This week" to="plan" icon="calendar" />
      {show.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing left this week. Well done{loop.assessment.stage === 'ready' ? ': take your assessment' : loop.next.canPlan ? ': plan your next week' : ''}.</p> :
        <ul className="pf-list">{show.map(i => <li key={i.id}><Pill tone={TYPE_TONE[i.type]}>{TYPE_LABEL[i.type]}</Pill><span className="pf-grow"><b>{i.title}</b><br /><span className="pf-small pf-muted">{i.topic} · {fmtMinutes(i.minutes)}</span></span>{i.status === 'done' ? <Pill tone="leaf" icon="check">Done</Pill> : null}</li>)}</ul>}
      <p className="pf-small pf-muted" style={{ margin: '10px 0 0' }}>Week {w.weekNumber} towards {loop.goal.title} · Level {loop.goal.phase.number} of {loop.goal.phase.total}.</p>
    </Card>
  );
}
