import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill, Progress } from '../../ui/kit';
import { loopApi, useLoop, messageFor, PACE, BAND, fmtMinutes, fmtShort, pct } from './loopApi';
import { PageSkeleton } from './Loader';
import Locked from '../../../pay/Locked';
import { AiMeter, AiOutNote, aiOut } from './AiMeter';
import { NextWeek } from './NextWeek';
import { DayCard, AssessmentBanner, daysOf, doneOf } from './DayBits';

/** The week at a glance: how far along, the assessment that opens next week, and one card per day. Each day opens its own page. */
export default function LoopPlanPage() {
  const { loop, loading, closed, error, locked, act } = useLoop();
  const [replan, setReplan] = useState('');
  const head = <PageHead eyebrow="Weekly plan" title="Your week, planned for you" actions={<div className="pf-row pf-wrap" style={{ gap: 10, justifyContent: 'flex-end' }}>{loop && <AiMeter ai={loop.ai} />}<Link className="pf-btn sm ghost" to="roadmap">My progress</Link></div>}>Open a day to see its steps in full. Finish the week with the assessment: your next week is built from it.</PageHead>;
  if (loading) return <PageSkeleton label="Loading your week" />;
  if (locked) return <>{head}<Locked {...locked} /></>;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Weekly plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;
  if (loop.mode === 'chat') return <>{head}<Card><Empty icon="target" title={loop.currentGoal ? 'You are planning a new goal' : 'Tell your guide what you want to become'}>{loop.currentGoal ? 'Finish the chat on My goal, or keep your current goal.' : 'A short chat, then your plan appears here.'}</Empty><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="../goal">Go to My goal</Link></p></Card></>;

  const w = loop.week, g = loop.goal;
  const days = daysOf(w);
  const pctDone = w.plannedMinutes ? Math.round((w.doneMinutes / w.plannedMinutes) * 100) : 0;
  const pace = PACE[g.pace] || PACE['on-track'];
  const note = w.summary || (g.adaptations.length ? g.adaptations[g.adaptations.length - 1].summary : '');
  const changes = g.adaptations.length && g.adaptations[g.adaptations.length - 1].week === w.weekNumber - 1 ? g.adaptations[g.adaptations.length - 1].changes : [];
  return (
    <>
      {head}
      {w.weekNumber > 1 && note && <Card ai style={{ marginBottom: 12 }}><span className="tag"><Icon name="sparkles" size={14} />What changed for this week</span><p style={{ margin: '8px 0 0' }}>{note}</p>{changes.length > 0 && <ul className="pf-small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{changes.map(c => <li key={c}>{c}</li>)}</ul>}</Card>}
      <AiOutNote ai={loop.ai} />
      {w.notices.map(n => <div key={n.key} className="pf-note" role="note" style={{ marginBottom: 10 }}>{n.text}</div>)}
      <div className="pf-grid g-main">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card>
            <div className="pf-row pf-wrap pf-weekhead" style={{ gap: 10 }}>
              <div className="pf-grow"><b>Week {w.weekNumber} · {g.title}</b><div className="pf-small pf-muted">{fmtShort(w.weekStart)} to {fmtShort(w.weekEnd)} · {w.focus || g.phase.title}{w.mode === 'exam' ? ' · exam week' : w.mode === 'reset' ? ' · lighter week' : ''}</div></div>
              <button type="button" className="pf-btn sm ghost" disabled={replan === 'busy' || aiOut(loop.ai)} onClick={async () => { setReplan('busy'); try { await act(() => loopApi.replan()); setReplan('done'); } catch (e) { setReplan(messageFor(e)); } }}>{replan === 'busy' ? 'Re-planning…' : 'Re-plan the rest of this week'}</button>
            </div>
            <div className="pf-row pf-wrap" style={{ gap: 18, margin: '12px 0 8px' }}>
              <span className="pf-small"><b>{doneOf(w.items)}</b> of {w.items.length} steps done</span>
              <span className="pf-small"><b>{fmtMinutes(w.doneMinutes)}</b> of {fmtMinutes(w.plannedMinutes)}</span>
            </div>
            <Progress value={pctDone} label="This week" />
            {replan && replan !== 'busy' && <p className="pf-small" role="status" style={{ marginTop: 6 }}>{replan === 'done' ? 'Planned again around your current week.' : replan}</p>}
          </Card>
          <AssessmentBanner a={loop.assessment} next={loop.next} week={w} />
          {loop.next.canPlan && <NextWeek next={loop.next} act={act} off={aiOut(loop.ai)} />}
          {w.items.length === 0
            ? <Card><Empty icon="calendar" title="Nothing planned this week">{w.notices.length ? 'See the note above.' : 'Add some free time to your week on My goal.'}</Empty></Card>
            : <div className="pf-daygrid">{days.map(d => <DayCard key={d.date} day={d} todayIndex={w.todayIndex} />)}</div>}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card><CardHead title="Where you are" icon="trend" action="Details" to="roadmap" />
            <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 8 }}><Pill tone={pace[1]}>{pace[0]}</Pill><span className="pf-small pf-muted">Level {g.phase.number} of {g.phase.total}: {g.phase.title}</span></div>
            {g.phase.levelUp && <p className="pf-small" style={{ margin: '0 0 8px' }}><b>{g.phase.levelUpDue ? 'Level-up proof due this week:' : 'To move up a level:'}</b> {g.phase.levelUp.proof}</p>}
            <p className="pf-small" style={{ margin: '0 0 8px' }}>{g.progress.topicsDone} of {g.progress.topicsTotal} topics studied, {g.progress.mastered} mastered</p>
            <Progress value={g.progress.topicsTotal ? (g.progress.topicsDone / g.progress.topicsTotal) * 100 : 0} label="Topics studied" />
          </Card>
          {loop.history.length > 0 && <Card><CardHead title="Past weeks" icon="chart" /><ul className="pf-list">{loop.history.map(h => <li key={h.weekNumber}><span className="pf-grow"><b>Week {h.weekNumber}</b><br /><span className="pf-small pf-muted">{h.completion === null ? '' : `${pct(h.completion)} finished`}{h.quiz === null ? '' : ` · quiz ${pct(h.quiz)}`}</span></span>{h.work && BAND[h.work] && <Pill tone={BAND[h.work][1]}>Work: {BAND[h.work][0]}</Pill>}</li>)}</ul></Card>}
          {w.source === 'fallback' && <div className="pf-note" role="note"><Icon name="info" size={15} /> This week was planned simply from your topics, because the guide could not be reached. Next week is planned in full.</div>}
          {!w.videos && !w.items.some(i => i.type === 'learn' && i.video) && <div className="pf-note" role="note"><Icon name="info" size={15} /> Use “Find a free video” on each step to find something good to watch.</div>}
        </div>
      </div>
    </>
  );
}
