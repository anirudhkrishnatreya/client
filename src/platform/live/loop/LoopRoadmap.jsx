import { Link } from 'react-router-dom';
import { Card, Empty, PageHead, Pill } from '../../ui/kit';
import { useLoop, messageFor, TOPIC, PACE, fmtDay } from './loopApi';

/** The whole plan: where the student started, where they are heading, and every phase with each topic's status. */
export default function LoopJourneyPage() {
  const { loop, loading, closed, error } = useLoop();
  const head = <PageHead eyebrow="My journey" title={loop && loop.goal ? loop.goal.title : 'Your journey'} actions={<Link className="pf-btn sm ghost" to="..">This week</Link>}>From where you started to where you are heading, at your own pace.</PageHead>;
  if (loading) return <>{head}<p role="status">Loading…</p></>;
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
      <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 14 }}><Pill tone={pace[1]}>{pace[0]}</Pill><span className="pf-small pf-muted">Week {g.weekNumber} · {g.progress.topicsDone} of {g.progress.topicsTotal} topics studied · {g.progress.mastered} mastered</span></div>
      <ol className="pf-journey">
        {g.phases.map((ph, i) => (
          <li key={ph.id} className={`pf-journey-step ${ph.status}`}>
            <Card>
              <div className="pf-row pf-wrap" style={{ gap: 8 }}><span className="pf-small pf-muted">Phase {i + 1}</span><h3 className="pf-grow" style={{ margin: 0 }}>{ph.title}</h3><span className="pf-small pf-muted">about {ph.weeks} week{ph.weeks === 1 ? '' : 's'}</span>{ph.status === 'current' && <Pill tone="gold">You are here</Pill>}{ph.status === 'done' && <Pill tone="leaf" icon="check">Done</Pill>}</div>
              <p className="pf-small pf-muted" style={{ margin: '6px 0 10px' }}>{ph.outcome}</p>
              <ul className="pf-list">{ph.topics.map(t => <li key={t.id}><span className="pf-grow">{t.title}</span><Pill tone={TOPIC[t.status][1]}>{TOPIC[t.status][0]}</Pill></li>)}</ul>
            </Card>
          </li>
        ))}
      </ol>
      {g.longPath && <Card style={{ marginTop: 14 }}><div className="pf-eyebrow">The longer road</div><p style={{ margin: '6px 0 0' }}>{g.longPath}</p></Card>}
      {g.notes && g.notes.length > 0 && <Card style={{ marginTop: 14 }}><div className="pf-eyebrow">Good to know</div><ul className="pf-small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>{g.notes.map(n => <li key={n}>{n}</li>)}</ul></Card>}
      <p className="pf-small pf-faint" style={{ marginTop: 12 }}>Your plan was drafted by AI from what you told your guide and real occupation data. A mentor can help you adjust it.</p>
    </>
  );
}
