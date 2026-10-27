import { Link, useParams } from 'react-router-dom';
import { Card, Empty, Icon, PageHead, Pill, Progress } from '../../ui/kit';
import { useLoop, messageFor, TYPE_LABEL, fmtMinutes, fmtShort, weekdayOf } from './loopApi';
import { PageSkeleton } from './Loader';
import Locked from '../../../pay/Locked';
import { AiMeter, AiOutNote, aiOut } from './AiMeter';
import { Item } from './Steps';
import { daysOf, minutesOf, doneOf } from './DayBits';

/** A short, plain summary of the day: what is learned, then what is done with it. */
function summaryOf(items, when) {
  const learn = items.filter(i => i.type === 'learn'), doing = items.filter(i => i.type !== 'learn');
  const topics = [...new Set(learn.map(i => i.topic || i.title))];
  const parts = [];
  if (topics.length) parts.push(`you learn ${topics.join(' and ')}${learn.some(i => i.video) ? ' from the chosen videos' : ''}`);
  if (doing.length) parts.push(`then ${doing.map(i => TYPE_LABEL[i.type].toLowerCase()).filter((v, k, a) => a.indexOf(v) === k).join(' and ')} with ${doing.length === 1 ? 'one step' : `${doing.length} steps`}`);
  return parts.length ? `${when} ${parts.join(', ')}.` : '';
}

/** One day in full: every step with its video, help, practice and practice questions, and the way to the next day. */
export default function LoopDayPage() {
  const { date } = useParams();
  const { loop, loading, error, locked, act } = useLoop();
  if (loading) return <PageSkeleton label="Loading your day" cards={2} />;
  if (locked) return <Locked {...locked} />;
  if (error) return <p role="alert">{messageFor(error)}</p>;
  if (!loop || loop.mode !== 'plan') return <Card><Empty icon="calendar" title="No plan yet">Start one from <Link relative="path" to="../../../goal">My goal</Link>.</Empty></Card>;
  const w = loop.week;
  const days = daysOf(w);
  const day = days.find(d => d.date === date);
  if (!day || !day.items.length) return <><p className="pf-small"><Link relative="path" to="../..">← This week</Link></p><Card><Empty icon="calendar" title="Nothing planned for this day">It may be from another week, or a free day.</Empty></Card></>;
  const planned = days.filter(d => d.items.length);
  const at = planned.findIndex(d => d.date === date);
  const prev = planned[at - 1], next = planned[at + 1];
  const done = doneOf(day.items), all = done === day.items.length;
  const today = day.index === w.todayIndex;
  return (
    <>
      <p className="pf-small" style={{ marginBottom: 8 }}><Link relative="path" to="../..">← Week {w.weekNumber}</Link></p>
      <PageHead eyebrow={`Day ${day.index + 1} of 7 · week ${w.weekNumber}`} title={`${weekdayOf(date)}, ${fmtShort(date)}`} actions={<div className="pf-row pf-wrap" style={{ gap: 10, justifyContent: 'flex-end' }}><AiMeter ai={loop.ai} />{today && <Pill tone="sky">Today</Pill>}</div>}>
        {summaryOf(day.items, today ? 'Today' : `On ${weekdayOf(date)}`)}
      </PageHead>
      <AiOutNote ai={loop.ai} />
      <Card style={{ marginBottom: 14 }}>
        <div className="pf-row pf-wrap" style={{ gap: 18 }}>
          <span className="pf-small"><b>{day.items.length}</b> step{day.items.length > 1 ? 's' : ''}</span>
          <span className="pf-small">About <b>{fmtMinutes(minutesOf(day.items))}</b></span>
          <span className="pf-small"><b>{done}</b> of {day.items.length} done</span>
          <span className="pf-grow" />
          <div className="pf-row" style={{ gap: 6 }}>
            {prev ? <Link relative="path" className="pf-btn sm ghost" to={`../${prev.date}`} aria-label={`Previous day: ${weekdayOf(prev.date)}`}><Icon name="chevronLeft" size={14} />{weekdayOf(prev.date)}</Link> : null}
            {next ? <Link relative="path" className="pf-btn sm ghost" to={`../${next.date}`} aria-label={`Next day: ${weekdayOf(next.date)}`}>{weekdayOf(next.date)}<Icon name="chevronRight" size={14} /></Link> : null}
          </div>
        </div>
        <div style={{ marginTop: 10 }}><Progress value={(done / day.items.length) * 100} label="This day" /></div>
      </Card>
      <ol className="pf-steplist">
        {day.items.map((i, k) => (
          <li key={i.id}>
            <div className="pf-stepno" aria-hidden="true">{i.status === 'done' ? <Icon name="check" size={15} /> : k + 1}</div>
            <div className="pf-grow"><div className="pf-small pf-muted" style={{ marginBottom: 4 }}>Step {k + 1} of {day.items.length}</div><Item item={i} act={act} off={aiOut(loop.ai)} /></div>
          </li>
        ))}
      </ol>
      {all && (
        <Card ai style={{ marginTop: 14 }}>
          <span className="tag"><Icon name="check" size={14} />Day complete</span>
          <p style={{ margin: '8px 0 10px' }}>Well done. {next ? `Next up: ${weekdayOf(next.date)}.` : loop.assessment.stage === 'ready' ? 'That was the last day: your assessment is ready, and it opens your next week.' : 'That was the last planned day of this week.'}</p>
          <div className="pf-row pf-wrap" style={{ gap: 8 }}>
            {next && <Link relative="path" className="pf-btn sm" to={`../${next.date}`}>Go to {weekdayOf(next.date)}</Link>}
            {['ready', 'quiz', 'work'].includes(loop.assessment.stage) && <Link relative="path" className="pf-btn sm" to="../../assessment">Take the assessment</Link>}
            <Link relative="path" className="pf-btn sm ghost" to="../..">Back to the week</Link>
          </div>
        </Card>
      )}
    </>
  );
}
