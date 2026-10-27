import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill, Progress } from '../../ui/kit';
import { useLoop, messageFor, fmtShort } from './loopApi';
import { PageSkeleton } from './Loader';
import Locked from '../../../pay/Locked';
import { AiMeter, AiOutNote, aiOut } from './AiMeter';
import { Assessment } from './Assessment';
import { NextWeek } from './NextWeek';

/** The week's assessment on its own page: what it is, why it matters (it opens next week), then the quiz, the work and the feedback. */
export default function LoopAssessmentPage() {
  const { loop, loading, error, locked, act } = useLoop();
  if (loading) return <PageSkeleton label="Loading your assessment" cards={2} />;
  if (locked) return <Locked {...locked} />;
  if (error) return <p role="alert">{messageFor(error)}</p>;
  if (!loop || loop.mode !== 'plan') return <Card><Empty icon="clipboard" title="No plan yet">Start one from <Link relative="path" to="../../goal">My goal</Link>.</Empty></Card>;
  const a = loop.assessment, w = loop.week, levelUp = a.task && a.task.levelUp;
  return (
    <>
      <p className="pf-small" style={{ marginBottom: 8 }}><Link relative="path" to="..">← Week {w.weekNumber}</Link></p>
      <PageHead eyebrow={`Week ${w.weekNumber} · ${fmtShort(w.weekStart)} to ${fmtShort(w.weekEnd)}`} title={levelUp ? 'Your level-up assessment' : 'Your week assessment'} actions={<AiMeter ai={loop.ai} />}>
        {levelUp ? 'This one decides whether you move up a level. ' : ''}Your next week opens after it, and is planned from how it goes: faster if you are flying, steadier or with some revision if you need time.
      </PageHead>
      <AiOutNote ai={loop.ai} />
      <div className="pf-grid g-main">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {a.stage === 'locked' ? (
            <Card>
              <CardHead title="Not open yet" icon="lock" />
              <p style={{ marginTop: 0 }}>Finish {a.need} of this week’s steps first ({a.done} done so far). It also opens when the week ends on {fmtShort(w.weekEnd)}.</p>
              <Progress value={a.need ? Math.min(100, (a.done / a.need) * 100) : 0} label="Steps finished towards the assessment" />
              <p style={{ margin: '12px 0 0' }}><Link relative="path" className="pf-btn sm" to="..">Back to my days</Link></p>
            </Card>
          ) : <Assessment a={a} act={act} off={aiOut(loop.ai)} />}
          {a.stage === 'done' && loop.next.canPlan && <NextWeek next={loop.next} act={act} off={aiOut(loop.ai)} />}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card>
            <CardHead title="How it works" icon="info" />
            <ol className="pf-small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
              <li><b>Part 1, a quiz:</b> 5 questions on what you studied this week. Every answer is checked twice before you see it.</li>
              <li><b>Part 2, a piece of work:</b> {levelUp ? 'your level-up proof, ' : ''}written in your own words, with photos of your work if you like. It is judged against a short checklist{a.task && a.task.rubric ? ` (${a.task.rubric.join(', ')})` : ''}.</li>
              <li><b>Feedback:</b> how you did on each point and one next step. Then plan your next week.</li>
            </ol>
            <p className="pf-small pf-muted" style={{ margin: '10px 0 0' }}><Icon name="clock" size={13} /> About 15 minutes.</p>
          </Card>
          {loop.next.needsAssessment && <Card><div className="pf-row" style={{ gap: 8 }}><Pill tone="gold" icon="lock">Next week</Pill><span className="pf-small">opens after this assessment.</span></div></Card>}
        </div>
      </div>
    </>
  );
}
