import { Card, CardHead, Pill, Progress as Bar } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { WithChild } from './shared';

const BAND = { strong: ['leaf', 'Strong'], 'getting-there': ['gold', 'Getting there'], 'not-yet': ['coral', 'Not yet'] };
const PACE = { 'speed-up': 'a bit faster', 'slow-down': 'a bit slower', continue: 'at the same pace', start: 'gently' };

/** The child's weekly plan, as a parent sees it: the goal, the level, this week's progress and the latest result (as a band). */
function WeeklyPlan({ loop, name }) {
  const w = loop.week;
  return (
    <Card><CardHead title="Weekly plan" icon="target" />
      <p style={{ margin: '0 0 4px' }}><b>{loop.goal.title}</b></p>
      <p className="pf-small pf-muted" style={{ margin: '0 0 10px' }}>{loop.level.finished ? `${name} reached the end point of the plan.` : `Level ${loop.level.number} of ${loop.level.total}: ${loop.level.title}`}{loop.levelsPassed ? ` · ${loop.levelsPassed} level${loop.levelsPassed > 1 ? 's' : ''} passed` : ''}</p>
      {w && <><div className="pf-row pf-between pf-small"><span>Week {w.number}: steps done</span><b className="pf-num">{w.done}/{w.steps}</b></div><Bar value={w.steps ? (w.done / w.steps) * 100 : 0} label={`Week ${w.number} steps done`} /></>}
      {loop.lastResult && loop.lastResult.work && BAND[loop.lastResult.work] && <p className="pf-small" style={{ margin: '10px 0 0' }}>Latest {loop.lastResult.levelUp ? 'level-up assessment' : 'assessment'}: <Pill tone={BAND[loop.lastResult.work][0]}>{BAND[loop.lastResult.work][1]}</Pill></p>}
      {loop.adaptations.length > 0 && <p className="pf-small pf-muted" style={{ margin: '10px 0 0' }}>The plan now moves {PACE[loop.adaptations[loop.adaptations.length - 1].pace] || 'at their pace'}: {loop.adaptations[loop.adaptations.length - 1].summary}</p>}
      {loop.portfolioItems > 0 && <p className="pf-small" style={{ margin: '10px 0 0' }}>{loop.portfolioItems} piece{loop.portfolioItems > 1 ? 's' : ''} of work in {name}’s portfolio.</p>}
    </Card>
  );
}

export default function LiveParentProgress() {
  return (
    <WithChild eyebrow="Progress" title={c => `How ${c.firstName} is getting on`} intro="Tasks finished, the career assessment and mentor sessions.">
      {d => { const c = d.child; const subjects = [...new Set(d.tasks.map(t => t.subject))].map(s => { const all = d.tasks.filter(t => t.subject === s); return { s, done: all.filter(t => t.status === 'done').length, n: all.length }; }); return (
        <div className="pf-grid g2">
          <Card><CardHead title="Tasks by subject" icon="tasks" />
            {subjects.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No tasks have been set yet.</p> :
              <div className="pf-grid">{subjects.map(x => <div key={x.s}><div className="pf-row pf-between pf-small"><span>{x.s}</span><b className="pf-num">{x.done}/{x.n}</b></div><Bar value={(x.done / x.n) * 100} label={`${x.s} done`} /></div>)}</div>}</Card>
          <Card><CardHead title="Career assessment" icon="clipboard" />
            <Pill tone={c.assessment.state === 'submitted' ? 'leaf' : c.assessment.state === 'in_progress' ? 'gold' : 'grey'}>{{ submitted: 'Done', in_progress: 'In progress', not_started: 'Not started' }[c.assessment.state]}</Pill>
            <p className="pf-small pf-muted" style={{ marginTop: 10 }}>{c.assessment.completedAt ? `Finished on ${fmtDate(String(c.assessment.completedAt).slice(0, 10))}.` : 'It takes a few sittings and can be paused.'}</p></Card>
          <Card><CardHead title="Mentor sessions" icon="calendar" /><p style={{ margin: 0 }}><b>{d.sessions.history.length}</b> held{d.sessions.next ? `, next on ${fmtDate(d.sessions.next.date)}` : ''}.</p></Card>
                    {d.loop ? <WeeklyPlan loop={d.loop} name={c.firstName} /> : <Card ai><span className="tag">Coming soon</span><p style={{ margin: '8px 0 0', fontSize: 14 }}>Study time, weekly scores and trends will appear here as {c.firstName} starts using the weekly plan and check-ins.</p></Card>}
        </div>); }}
    </WithChild>
  );
}
