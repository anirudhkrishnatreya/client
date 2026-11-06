import { useEffect, useState } from 'react';
import { Card, CardHead, Heat, Icon, Pill, Spark } from '../../ui/kit';
import { coachApi, errMessage } from '../liveApi';

// The student's own dashboard: the streak, minutes per day (planned vs done, with focus), 8 weeks of consistency, the goal's
// trajectory with a forecast, the mastery map, the assessment and energy trends, and the coach's read. Every number comes from
// what they did.
const STATUS = { ahead: ['Ahead of plan', 'leaf'], 'on-track': ['On track', 'sky'], behind: ['Behind plan', 'gold'], unknown: ['', 'grey'] };
const MASTERY = { mastered: ['Mastered', 'leaf'], weak: ['Needs work', 'coral'], covered: ['Covered', 'sky'], next: ['Coming up', 'grey'] };
const fmt = d => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

export function Tile({ icon, value, label, sub }) {
  return <div className="pf-tile"><span className="pf-tile-ic"><Icon name={icon} size={18} /></span><div><b>{value}</b><span>{label}</span>{sub && <small>{sub}</small>}</div></div>;
}

/** Planned (light) and done (solid, with focus on top) minutes for each of the last 14 days. */
export function Minutes({ days }) {
  const top = Math.max(30, ...days.map(d => Math.max(d.planned, d.done + d.focus)));
  return (
    <div className="pf-mins" role="img" aria-label={days.map(d => `${d.label}: ${d.done} of ${d.planned} planned minutes done, ${d.focus} focus minutes`).join('; ')}>
      {days.map(d => (
        <div key={d.date} className="pf-mins-col">
          <div className="pf-mins-bar">
            <i className="plan" style={{ height: `${(d.planned / top) * 100}%` }} />
            <i className="done" style={{ height: `${(d.done / top) * 100}%` }} />
            <i className="focus" style={{ height: `${(d.focus / top) * 100}%`, bottom: `${(d.done / top) * 100}%` }} />
          </div>
          <span>{d.label.split(' ')[1]}</span>
        </div>))}
    </div>
  );
}

export function Trajectory({ t }) {
  if (!t) return <p className="pf-small pf-muted" style={{ margin: 0 }}>Start a goal and a weekly plan to see your path here.</p>;
  const [label, tone] = STATUS[t.status] || STATUS.unknown;
  return (
    <>
      <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 10 }}><b style={{ fontSize: 17 }}>{t.goal}</b>{label && <Pill tone={tone}>{label}</Pill>}</div>
      <div className="pf-traj" aria-label={`Level ${t.level} of ${t.levels}`}>
        {t.phases.map((p, i) => <div key={i} className={`pf-traj-seg ${p.state}`} style={{ flex: p.weeks }} title={`${p.title}: ${p.weeks} week${p.weeks > 1 ? 's' : ''}`}><span>{p.title}</span></div>)}
      </div>
      <div className="pf-traj-facts">
        <div><b>{t.weeksDone}</b> of {t.weeksTotal} weeks</div>
        <div><b>{t.pace}%</b> of recent steps done</div>
        <div>At this pace: <b>{fmt(t.forecast)}</b>{t.target && <> · target {fmt(t.target)}</>}</div>
      </div>
    </>
  );
}

export default function Progress() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { coachApi.progress().then(setD).catch(e => setErr(errMessage(e))); }, []);
  if (!d) return <p role={err ? 'alert' : 'status'} className="pf-small pf-muted">{err || 'Working out your numbers…'}</p>;
  return <ProgressView d={d} />;
}

/** The dashboard itself, for any data in the same shape (the student's own, or the mentor's observatory). */
export function ProgressView({ d, readLabel = 'Your coach’s read' }) {
  return (
    <div className="pf-grid" style={{ gap: 18 }}>
      <div className="pf-tiles">
        <Tile icon="flame" value={`${d.streak.current} day${d.streak.current === 1 ? '' : 's'}`} label="Streak" sub={`Best: ${d.streak.best}`} />
        <Tile icon="clock" value={`${d.week.minutes} min`} label="Studied this week" sub={`${d.week.steps} step${d.week.steps === 1 ? '' : 's'} done`} />
        <Tile icon="target" value={`${d.week.focus} min`} label="Focus time" sub="this week" />
        <Tile icon="calendar" value={`${d.week.daysActive}/7`} label="Days active" sub="this week" />
      </div>
      {d.read.length > 0 && <Card ai><span className="tag"><Icon name="sparkles" size={14} />{readLabel}</span>
        <ul className="pf-read">{d.read.map(r => <li key={r.text}><Icon name={r.icon} size={16} />{r.text}</li>)}</ul></Card>}
      <div className="pf-grid g-main">
        <Card><CardHead title="Your path to the goal" icon="trend" /><Trajectory t={d.trajectory} /></Card>
        <Card><CardHead title={d.masteryTitle || 'This level’s topics'} icon="layers" />
          {d.mastery.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Your topics appear here once you have a plan.</p>
            : <div className="pf-chip-row">{d.mastery.map(m => <span key={m.title} className={`pf-mastery ${m.state}`} title={MASTERY[m.state][0]}>{m.title}</span>)}</div>}
          <p className="pf-small pf-faint" style={{ margin: '10px 0 0' }}>{Object.entries(MASTERY).map(([k, [l]]) => <span key={k} className={`pf-mastery-key ${k}`}>{l}</span>)}</p></Card>
      </div>
      <Card><CardHead title="Minutes, last 14 days" icon="chart" /><Minutes days={d.minutes} />
        <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}><span className="pf-key plan" /> planned <span className="pf-key done" /> done <span className="pf-key focus" /> focus</p></Card>
      <div className="pf-grid g3">
        <Card><CardHead title="8 weeks of showing up" icon="calendar" /><Heat values={d.heat.map(h => h.minutes)} /></Card>
        <Card><CardHead title="Weekly quiz" icon="clipboard" />{d.quiz.length >= 2 ? <><Spark data={d.quiz.map(q => q.value)} label="Quiz scores by week" /><p className="pf-small pf-muted" style={{ margin: 0 }}>{d.quiz.map(q => `${q.label} ${q.value}%`).join(' · ')}</p></> : <p className="pf-small pf-muted" style={{ margin: 0 }}>{d.quiz.length ? `${d.quiz[0].label}: ${d.quiz[0].value}%. The trend appears after two weeks.` : 'Take your first week’s assessment to start the trend.'}</p>}</Card>
        <Card><CardHead title="Energy" icon="bolt" />{d.energy.length >= 2 ? <><Spark data={d.energy.map(e => e.energy)} color="#F2A93B" label="Morning energy" /><p className="pf-small pf-muted" style={{ margin: 0 }}>From your morning check-ins (1 to 5).</p></> : <p className="pf-small pf-muted" style={{ margin: 0 }}>Check in in the mornings and your energy trend shows here.</p>}</Card>
      </div>
    </div>
  );
}
