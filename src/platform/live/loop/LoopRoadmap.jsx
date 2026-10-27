import { Link } from 'react-router-dom';
import { Card, Empty, PageHead, Pill } from '../../ui/kit';
import { useLoop, messageFor, PACE, BAND, fmtDay, fmtShort, pct } from './loopApi';
import { PageSkeleton } from './Loader';
import Locked from '../../../pay/Locked';

/** Progress: where the student started, where they are heading, what has happened, and how the plan has adapted. The road in
 *  between is not shown: it changes after every week, so only the current week is ever shown in full. */
export default function LoopProgressPage() {
  const { loop, loading, closed, error, locked } = useLoop();
  const head = <PageHead eyebrow="My progress" title={loop && loop.goal ? loop.goal.title : 'Your progress'} actions={<Link className="pf-btn sm ghost" to="..">This week</Link>}>From where you started to where you are heading, at your own pace.</PageHead>;
  if (loading) return <PageSkeleton label="Loading your progress" cards={2} />;
  if (locked) return <>{head}<Locked {...locked} /></>;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Goals and plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;
  if (loop.mode === 'chat') return <>{head}<Card><Empty icon="target" title="No plan yet" /><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="../../goal">Go to My goal</Link></p></Card></>;
  const g = loop.goal;
  const pace = PACE[g.pace] || PACE['on-track'];
  return (
    <>
      {head}
      <div className="pf-grid g2" style={{ marginBottom: 14 }}>
        <Card><div className="pf-eyebrow">Started from</div><p style={{ margin: '6px 0 0' }}>{g.startPoint.summary}</p></Card>
        <Card><div className="pf-eyebrow">Heading to · by {fmtDay(g.targetDate)}</div><p style={{ margin: '6px 0 0' }}>{g.endPoint.summary}</p>{g.endPoint.outcomes.length > 0 && <ul className="pf-small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{g.endPoint.outcomes.map(o => <li key={o}>{o}</li>)}</ul>}</Card>
      </div>
      <Card style={{ marginBottom: 14 }}>
        <div className="pf-row pf-wrap" style={{ gap: 8 }}><Pill tone={pace[1]}>{pace[0]}</Pill><b>Week {g.weekNumber}</b><span className="pf-small pf-muted">· Level {g.phase.number} of {g.phase.total}: {g.phase.title}</span></div>
        <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>{g.phase.outcome}</p>
        {g.phase.levelUp && <p className="pf-small" style={{ margin: '8px 0 0' }}><b>{g.phase.levelUpDue ? 'Your level-up proof is due:' : 'To move up a level:'}</b> {g.phase.levelUp.proof}{g.phase.levelUp.criteria.length > 0 && <span className="pf-muted"> (checked for: {g.phase.levelUp.criteria.join('; ')})</span>}</p>}
        <p className="pf-small" style={{ margin: '8px 0 0' }}>{g.progress.topicsDone} of {g.progress.topicsTotal} topics studied · {g.progress.mastered} mastered</p>
      </Card>
      {g.adaptations.length > 0 && (
        <Card style={{ marginBottom: 14 }}><div className="pf-eyebrow">How your plan has adapted</div>
          <ul className="pf-list" style={{ marginTop: 8 }}>{[...g.adaptations].reverse().map(a => <li key={a.week}><span className="pf-grow"><b>After week {a.week}</b><br /><span className="pf-small">{a.summary}</span>{a.changes.length > 0 && <ul className="pf-small pf-muted" style={{ margin: '4px 0 0', paddingLeft: 18 }}>{a.changes.map(c => <li key={c}>{c}</li>)}</ul>}</span><Pill tone={a.pace === 'speed-up' ? 'leaf' : a.pace === 'slow-down' ? 'gold' : ''}>{a.pace === 'speed-up' ? 'Faster' : a.pace === 'slow-down' ? 'Slower' : 'Steady'}</Pill></li>)}</ul>
        </Card>
      )}
      {loop.history.length > 0 && (
        <Card style={{ marginBottom: 14 }}><div className="pf-eyebrow">Your weeks</div>
          <ul className="pf-list" style={{ marginTop: 8 }}>{loop.history.map(h => <li key={h.weekNumber}><span className="pf-grow"><b>Week {h.weekNumber}</b> <span className="pf-small pf-muted">from {fmtShort(h.weekStart)}</span><br /><span className="pf-small pf-muted">{h.focus}</span><br /><span className="pf-small">{h.completion === null ? '' : `${pct(h.completion)} finished`}{h.quiz === null ? '' : ` · quiz ${pct(h.quiz)}`}</span></span>{h.work && <Pill tone={BAND[h.work][1]}>{BAND[h.work][0]}</Pill>}</li>)}</ul>
        </Card>
      )}
      {g.longPath && <Card style={{ marginBottom: 14 }}><div className="pf-eyebrow">The longer road</div><p style={{ margin: '6px 0 0' }}>{g.longPath}</p></Card>}
      {g.notes && g.notes.length > 0 && <Card style={{ marginBottom: 14 }}><div className="pf-eyebrow">Good to know</div><ul className="pf-small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>{g.notes.map(n => <li key={n}>{n}</li>)}</ul></Card>}
      <p className="pf-small pf-faint">Your plan was drafted by AI from what you told your guide and real occupation data, and it adapts every week. A mentor can help you adjust it.</p>
    </>
  );
}
