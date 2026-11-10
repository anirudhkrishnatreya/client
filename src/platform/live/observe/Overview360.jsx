import { useState } from 'react';
import { Card, CardHead, Icon, Pill, Spark } from '../../ui/kit';
import { ProgressView } from '../coach/Progress';
import { observeApi, errMessage } from '../liveApi';
import { KIND_ICON, ago } from './parts';
import EducationCard from '../education/EducationCard';

// The 360 overview: right now, warnings and what changed, targets, strengths and growth areas, habits, wellbeing, the full
// progress dashboard, mastery across every level (with its evidence), assessments question by question, what they ask the
// coach, career context, the evidence locker, sessions and notes.
const MASTERY = { mastered: ['Mastered', 'leaf'], weak: ['Needs work', 'coral'], covered: ['Covered', 'sky'], next: ['Coming up', 'grey'] };
const TARGET = { quiz: 'Weekly quiz', activeDays: 'Active days a week', minutes: 'Study minutes a week', steps: 'Steps done a week', logs: 'Days logged a week' };

function Mastery({ levels }) {
  const [pick, setPick] = useState(null);
  return (
    <>
      {levels.map((l, li) => (
        <div key={li} className="pf-o-level">
          <div className="pf-row" style={{ gap: 8 }}><b>{l.title}</b><Pill tone={l.state === 'done' ? 'leaf' : l.state === 'current' ? 'sky' : 'grey'}>{l.state === 'done' ? 'Done' : l.state === 'current' ? 'Now' : 'Ahead'}</Pill></div>
          <div className="pf-chip-row" style={{ marginTop: 6 }}>{l.topics.map(t => <button key={t.id} type="button" className={`pf-mastery ${t.state}`} aria-pressed={pick === t.id} onClick={() => setPick(pick === t.id ? null : t.id)} title={MASTERY[t.state][0]}>{t.title}{(t.missed.length || t.hard.length) ? ' •' : ''}</button>)}</div>
          {l.topics.filter(t => t.id === pick).map(t => (
            <div key={t.id} className="pf-o-evidence">
              <b>{t.title}</b>: {MASTERY[t.state][0]}
              {t.missed.length > 0 && <><div className="pf-small pf-muted">Quiz questions they got wrong:</div><ul className="pf-small">{t.missed.map(q => <li key={q}>{q}</li>)}</ul></>}
              {t.hard.length > 0 && <><div className="pf-small pf-muted">They wrote this was hard:</div><ul className="pf-small">{t.hard.map(h => <li key={h.date}>{h.date}: “{h.text}”</li>)}</ul></>}
              {!t.missed.length && !t.hard.length && <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>No evidence of trouble with this topic.</p>}
            </div>))}
        </div>))}
    </>
  );
}

function Assessments({ list }) {
  if (!list.length) return <p className="pf-small pf-muted" style={{ margin: 0 }}>No weekly quiz taken yet.</p>;
  return list.map(a => (
    <details key={a.id} className="pf-o-quiz">
      <summary><b>{a.week ? `Week ${a.week}` : 'Quiz'}: {a.score}%</b> <span className="pf-small pf-muted">· {a.questions.filter(q => q.right).length} of {a.questions.length} right{a.work ? ` · written work ${a.work.band}` : ''}</span></summary>
      <ol className="pf-small">{a.questions.map((q, i) => <li key={i} className={q.right ? 'right' : 'wrong'}>{q.q}<br /><span className="pf-muted">{q.right ? '✓ ' : `✗ chose “${q.options[q.chose] ?? 'nothing'}”, `}answer “{q.options[q.answer]}”{q.from ? ` · from ${q.from.title}` : ''}</span></li>)}</ol>
      {a.work && <p className="pf-small" style={{ margin: 0 }}><b>Feedback on the work:</b> {a.work.feedback}{a.work.nextStep ? ` Next: ${a.work.nextStep}` : ''}</p>}
    </details>));
}

export default function Overview360({ p, onChanged }) {
  const s = p.signals;
  const [err, setErr] = useState('');
  const ack = async (id, resolve) => { setErr(''); try { await observeApi.acknowledge(id, { resolve }); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <div className="pf-grid" style={{ gap: 18 }}>
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Right now" icon="eye" />
            {p.now.focus ? <p style={{ margin: 0 }}><Pill tone="coral">Focusing</Pill> on <b>{p.now.focus.title}</b>, {p.now.focus.minutesIn} of {p.now.focus.plannedMin} min in.</p>
              : p.now.last ? <p style={{ margin: 0 }}><Icon name={KIND_ICON[p.now.last.kind] || 'info'} size={14} /> {p.now.last.title} <span className="pf-small pf-muted">· {ago(p.now.last.at)}</span>{p.now.last.detail ? <><br /><span className="pf-small pf-muted">{p.now.last.detail}</span></> : null}</p>
                : <p className="pf-small pf-muted" style={{ margin: 0 }}>No activity in the last week.</p>}
          </Card>
          {(s.warnings.length > 0 || s.wellbeing.escalations.length > 0) && <Card className="pf-o-warn"><CardHead title="Needs attention" icon="alert" />
            {s.wellbeing.escalations.map(e => <div key={e.id} className="pf-o-esc"><b>{e.source === 'coach-safety' ? 'A support message to the AI coach' : 'Low energy for several mornings'}</b> <span className="pf-small pf-muted">· {ago(e.at)} · {e.level === 'school' ? 'sent to the school' : 'with you'} · {e.status}</span>
              {p.as !== 'self' && e.status === 'open' && <div className="pf-row" style={{ gap: 6, marginTop: 6 }}><button type="button" className="pf-btn sm" onClick={() => ack(e.id, false)}>I’m on it</button><button type="button" className="pf-btn sm ghost" onClick={() => ack(e.id, true)}>Resolved</button></div>}</div>)}
            <ul className="pf-list">{s.warnings.map(w => <li key={w.text} className="pf-small"><Icon name="alert" size={14} />{w.text}</li>)}</ul>
            {err && <p className="pf-small" role="alert">{err}</p>}
          </Card>}
          {s.why.length > 0 && <Card><CardHead title="What changed this week" icon="trend" />
            <ul className="pf-o-why">{s.why.map(w => <li key={w.label}><span>{w.label}</span><b className={w.good ? 'up' : 'down'}>{w.delta > 0 ? '▲' : '▼'} {w.before}{w.unit} → {w.now}{w.unit}</b></li>)}</ul></Card>}
          <div className="pf-grid g2">
            <Card><CardHead title="Strengths" icon="award" />{s.strengths.length ? <ul className="pf-small pf-o-list">{s.strengths.map(x => <li key={x}>{x}</li>)}</ul> : <p className="pf-small pf-muted" style={{ margin: 0 }}>Not enough activity yet.</p>}</Card>
            <Card><CardHead title="Growth areas" icon="target" />{s.growth.length ? <ul className="pf-small pf-o-list">{s.growth.map(x => <li key={x}>{x}</li>)}</ul> : <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing stands out.</p>}</Card>
          </div>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <EducationCard h={p.header} as={p.as} onChanged={onChanged} />
          <Card><CardHead title="Risk radar" icon="shield" /><div className={`pf-o-radar ${s.risk.level}`}><b>{s.risk.score}</b><span>/100</span></div><ul className="pf-small pf-o-list">{s.risk.reasons.map(r => <li key={r}>{r}</li>)}</ul></Card>
          <Card><CardHead title="Targets" icon="flag" />{s.targets.length ? <ul className="pf-list">{s.targets.map(t => <li key={t.id}><span className="pf-grow pf-small">{TARGET[t.kind]}: at least {t.value}{t.unit}</span><Pill tone={t.met ? 'leaf' : 'gold'}>{t.current === null ? '–' : `${t.current}${t.unit}`}</Pill></li>)}</ul> : <p className="pf-small pf-muted" style={{ margin: 0 }}>{p.as === 'mentor' ? 'Set targets on the Planning tab; they track themselves.' : 'No targets set.'}</p>}</Card>
          <Card><CardHead title="Habits" icon="clock" /><ul className="pf-small pf-o-list">
            {s.habits.bestTime && <li>Most work in the <b>{s.habits.bestTime.slot}</b></li>}
            {(s.habits.weekday !== null || s.habits.weekend !== null) && <li>Steps done: <b>{s.habits.weekday === null ? 'none planned' : `${s.habits.weekday}%`}</b> on weekdays, <b>{s.habits.weekend === null ? 'none planned' : `${s.habits.weekend}%`}</b> at weekends</li>}
            <li>Consistency: <b>{s.habits.consistency}%</b> of days in 4 weeks</li>
            <li>Late-night study: <b>{s.habits.lateNight}</b> times lately</li>
            <li>Tasks: <b>{s.habits.tasks.open}</b> open, <b>{s.habits.tasks.overdue}</b> overdue, <b>{s.habits.tasks.late}</b> of {s.habits.tasks.finished} finished late</li>
            {s.habits.skips.length > 0 && <li>Skips most: <b>{s.habits.skips[0].word}</b> steps ({s.habits.skips[0].n})</li>}
          </ul></Card>
          <Card><CardHead title="Wellbeing" icon="heart" />{s.wellbeing.energy.length >= 2 ? <Spark data={s.wellbeing.energy.map(e => e.energy)} color="#F2A93B" label="Morning energy" /> : null}
            <p className="pf-small" style={{ margin: '6px 0 0' }}>{s.wellbeing.energyNow === null ? 'No morning check-ins this week' : `Energy ${s.wellbeing.energyNow}/5 this week`}{s.wellbeing.energyBefore !== null ? ` (was ${s.wellbeing.energyBefore})` : ''}{s.wellbeing.overload ? ` · plan uses ${s.wellbeing.overload}% of their time` : ''}.</p></Card>
        </div>
      </div>
      <ProgressView d={{ ...p.progress, read: [] }} />
      <div className="pf-grid g-main">
        <Card><CardHead title="Mastery across the whole path" icon="layers" /><Mastery levels={p.mastery} /></Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="What they ask the AI coach" icon="sparkles" />
            <p className="pf-small" style={{ margin: 0 }}>{p.coach.asks} question{p.coach.asks === 1 ? '' : 's'} in {p.coach.chats} chat{p.coach.chats === 1 ? '' : 's'} (30 days){p.coach.flagged ? ` · ${p.coach.flagged} support` : ''}.</p>
            {p.coach.about.length > 0 && <p className="pf-small" style={{ margin: '6px 0 0' }}>Mostly about: {p.coach.about.map(a => a.title).join(', ')}</p>}
            {p.coach.words.length > 0 && <div className="pf-chip-row" style={{ marginTop: 6 }}>{p.coach.words.map(w => <span key={w.word} className="pf-chip">{w.word} ×{w.n}</span>)}</div>}</Card>
          <Card><CardHead title="Career context" icon="star" />
            <p className="pf-small" style={{ margin: 0 }}>{p.career.assessment ? `Career assessment done${p.career.assessment.code ? `, interest code ${p.career.assessment.code}` : ''}.` : 'No career assessment yet.'}</p>
            {p.career.shortlist.length > 0 && <p className="pf-small" style={{ margin: '6px 0 0' }}>Shortlist: {p.career.shortlist.map(c => c.title).join(', ')}</p>}
            {p.career.situation && p.career.situation.summary && <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>{p.career.situation.summary}</p>}</Card>
        </div>
      </div>
      <div className="pf-grid g2">
        <Card><CardHead title="Weekly assessments" icon="clipboard" /><Assessments list={p.assessments} /></Card>
        <Card><CardHead title="Evidence locker" icon="file" />
          {p.evidence.work.length + p.evidence.portfolio.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Submitted work and portfolio pieces appear here.</p> :
            <ul className="pf-list">{[...p.evidence.portfolio.map(x => ({ ...x, k: 'p' })), ...p.evidence.work.map(x => ({ ...x, k: 'w' }))].slice(0, 10).map(x => <li key={`${x.k}${x.id}`}><span className="pf-grow pf-small"><b>{x.k === 'p' ? x.title : x.task || 'Weekly work'}</b>{x.band ? ` · ${x.band}` : ''}<br /><span className="pf-muted">{x.feedback ? String(x.feedback).slice(0, 140) : ''}</span></span><span className="pf-small pf-faint">{new Date(x.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></li>)}</ul>}</Card>
      </div>
      {p.notes.length > 0 && <Card><CardHead title={p.as === 'self' ? 'Shared with you by your mentor' : 'Notes'} icon="file" /><ul className="pf-list">{p.notes.map(n => <li key={n.id}><span className="pf-grow"><b>{n.kind === 'handover' ? `🤝 ${n.title}` : n.title || (n.kind === 'summary' ? 'Weekly summary' : 'Note')}</b><br /><span className="pf-small" style={{ whiteSpace: 'pre-wrap' }}>{n.text}</span></span><span className="pf-small pf-faint">{new Date(n.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></li>)}</ul></Card>}
    </div>
  );
}
