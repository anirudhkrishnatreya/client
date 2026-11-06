import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Card, CardHead, Drawer, Empty, Icon, PageHead, Pill, Spark } from '../../ui/kit';
import { observeApi, errMessage } from '../liveApi';
import { useLiveEvent } from '../events';
import { RiskBadge } from './parts';

// The mentor's command centre: who needs you today, every student as a card (risk with reasons, trend, streak, this week),
// open wellbeing alerts, how the group compares and the topics many find hard, your impact, and actions for several students.
function GroupActions({ students, onDone, onClose }) {
  const [mode, setMode] = useState('nudge');
  const [text, setText] = useState('');
  const [key, setKey] = useState('catch-up');
  const [t, setT] = useState({ date: '', time: '17:00', topic: '' });
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');
  const ids = students.map(s => s.id);
  const go = async e => {
    e.preventDefault(); setErr(''); setOut(null);
    try {
      if (mode === 'nudge') { const r = await observeApi.nudgeMany({ studentIds: ids, text: text.trim() }); setOut(`Sent to ${r.sent}.`); }
      else if (mode === 'plan') { const r = await observeApi.group({ studentIds: ids, intervention: key }); setOut(r.results.map(x => `${x.name}: ${x.ok ? `${x.lines.length} change${x.lines.length === 1 ? '' : 's'}` : x.problem}`).join(' · ')); }
      else { const r = await observeApi.groupSession({ studentIds: ids, date: t.date, time: t.time, durationMin: 45, topic: t.topic }); setOut(`Booked for ${r.booked.length}${r.problems.length ? `; not for ${r.problems.map(x => x.name).join(', ')}` : ''}.`); }
      await onDone();
    } catch (x) { setErr(errMessage(x)); }
  };
  return (
    <form onSubmit={go}>
      <p className="pf-small pf-muted" style={{ marginTop: 0 }}>For {students.map(s => s.name.split(' ')[0]).join(', ')}.</p>
      <div className="pf-row" style={{ gap: 6 }} role="radiogroup" aria-label="Action">{[['nudge', 'Nudge'], ['plan', 'Apply a plan'], ['session', 'Group session']].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={mode === v} className={`pf-choice${mode === v ? ' on' : ''}`} onClick={() => setMode(v)}>{l}</button>)}</div>
      {mode === 'nudge' && <><label className="pf-label" htmlFor="gn" style={{ marginTop: 10 }}>Message ({'{name}'} becomes each first name)</label><textarea id="gn" className="pf-input" rows={3} value={text} onChange={e => setText(e.target.value)} maxLength={500} /></>}
      {mode === 'plan' && <><label className="pf-label" htmlFor="gp" style={{ marginTop: 10 }}>Plan</label><select id="gp" className="pf-input" value={key} onChange={e => setKey(e.target.value)}><option value="catch-up">Catch-up week</option><option value="practice-heavy">Practice-heavy</option><option value="confidence">Confidence builder</option><option value="restart">Gentle restart</option></select></>}
      {mode === 'session' && <div className="pf-grid g2" style={{ marginTop: 10 }}><div className="pf-field"><label className="pf-label" htmlFor="gd">Day</label><input id="gd" type="date" className="pf-input" value={t.date} onChange={e => setT({ ...t, date: e.target.value })} /></div><div className="pf-field"><label className="pf-label" htmlFor="gt">Time</label><input id="gt" type="time" className="pf-input" value={t.time} onChange={e => setT({ ...t, time: e.target.value })} /></div><div className="pf-field" style={{ gridColumn: '1 / -1' }}><label className="pf-label" htmlFor="gtp">Topic</label><input id="gtp" className="pf-input" value={t.topic} onChange={e => setT({ ...t, topic: e.target.value })} placeholder="e.g. Vectors together" /></div></div>}
      <div className="pf-row" style={{ gap: 6, marginTop: 10 }}><button type="submit" className="pf-btn" disabled={(mode === 'nudge' && text.trim().length < 3) || (mode === 'session' && (!t.date || !t.time))}>Do it</button><button type="button" className="pf-btn ghost" onClick={onClose}>Close</button></div>
      {out && <p className="pf-small" role="status">{out}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </form>
  );
}

export default function CommandCentre() {
  const [d, setD] = useState(null);
  const [esc, setEsc] = useState([]);
  const [pick, setPick] = useState([]);
  const [group, setGroup] = useState(false);
  const [err, setErr] = useState('');
  const load = useCallback(() => Promise.all([observeApi.caseload(), observeApi.escalations()]).then(([c, e]) => { setD(c); setEsc(e.escalations); }).catch(x => setErr(errMessage(x))), []);
  useEffect(() => { load(); }, [load]);
  useLiveEvent(['task.changed', 'message.new', 'session.changed', 'notification.new'], () => load());
  if (!d) return <><PageHead eyebrow="Command centre" title="Your students, at a glance" /><p role={err ? 'alert' : 'status'}>{err || 'Reading every student’s week…'}</p></>;
  const picked = d.cards.filter(c => pick.includes(c.id));
  const toggle = id => setPick(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  return (
    <>
      <PageHead eyebrow="Command centre" title="Your students, at a glance" actions={pick.length > 1 ? <button type="button" className="pf-btn" onClick={() => setGroup(true)}><Icon name="users" size={15} />Act for {pick.length}</button> : null}>Who needs you today, how each student is doing, and what to do next. Open anyone to see everything in their observatory.</PageHead>
      <div className="pf-tiles" style={{ marginBottom: 16 }}>
        <div className="pf-tile"><span className="pf-tile-ic"><Icon name="users" size={18} /></span><div><b>{d.cards.length}</b><span>students</span></div></div>
        <div className="pf-tile"><span className="pf-tile-ic" style={{ background: 'var(--coral-t)', color: '#A5412D' }}><Icon name="alert" size={18} /></span><div><b>{d.cohort.risk.red}</b><span>need you</span><small>{d.cohort.risk.amber} to watch</small></div></div>
        <div className="pf-tile"><span className="pf-tile-ic"><Icon name="clock" size={18} /></span><div><b>{d.cohort.averages.minutes7 ?? 0} min</b><span>average study, 7 days</span></div></div>
        <div className="pf-tile"><span className="pf-tile-ic"><Icon name="trend" size={18} /></span><div><b>{d.impact.improving}/{d.impact.measured}</b><span>studying more than last week</span><small>{d.impact.sessions30} sessions in 30 days{d.impact.replyHours !== null ? ` · you reply in ${d.impact.replyHours < 1 ? 'under an hour' : `about ${d.impact.replyHours} h`}` : ''}</small></div></div>
      </div>
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Who needs you today" icon="target" />
            {d.today.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nobody needs anything urgent. A good day for check-ins.</p> :
              <ol className="pf-o-today">{d.today.map((x, i) => <li key={i} className={x.kind}><Avatar name={x.name} size={30} /><span className="pf-grow"><b>{x.name}</b><br /><span className="pf-small">{x.reason}</span></span><Link className="pf-btn sm ghost" to={`../${x.go}`}>Go</Link></li>)}</ol>}
          </Card>
          <div className="pf-cards">{d.cards.map(c => (
            <div key={c.id} className={`pf-scard ${c.risk.level}${pick.includes(c.id) ? ' picked' : ''}`}>
              <div className="pf-row" style={{ gap: 8 }}>
                <input type="checkbox" aria-label={`Select ${c.name}`} checked={pick.includes(c.id)} onChange={() => toggle(c.id)} />
                <Avatar name={c.name} size={36} /><div className="pf-grow" style={{ minWidth: 0 }}><b className="pf-ellipsis">{c.name}</b><div className="pf-small pf-muted pf-ellipsis">{c.goal || 'No goal yet'}</div></div>
                <RiskBadge risk={c.risk} />
              </div>
              <Spark data={c.trend.length ? c.trend : [0]} height={40} label={`${c.name}: study minutes over 14 days`} />
              <div className="pf-scard-facts"><span><Icon name="flame" size={12} />{c.streak.current}</span><span><Icon name="calendar" size={12} />{c.week ? `${c.week.stepsDone}/${c.week.steps} steps` : 'no plan'}</span><span><Icon name="clock" size={12} />{c.lastActive ? (c.lastActive.daysAgo === 0 ? 'today' : `${c.lastActive.daysAgo}d ago`) : 'never'}</span>{c.unread > 0 && <span><Icon name="message" size={12} />{c.unread}</span>}{c.escalation && <Pill tone="coral">Alert</Pill>}</div>
              <p className="pf-small" style={{ margin: '6px 0 8px' }}>{c.risk.reasons[0]}</p>
              <div className="pf-row pf-wrap" style={{ gap: 6 }}><Link className="pf-btn sm" to={`../observe/${c.id}`}>Open observatory</Link>{c.next[0] && <span className="pf-small pf-muted">Next: {c.next[0].text}</span>}</div>
            </div>))}
            {d.cards.length === 0 && <Card><Empty icon="users" title="No students yet">When students are connected to you (and their parents have confirmed), they appear here.</Empty></Card>}
          </div>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          {esc.length > 0 && <Card className="pf-o-warn"><CardHead title="Wellbeing alerts" icon="heart" /><ul className="pf-list">{esc.map(e => <li key={e.id}><span className="pf-grow pf-small"><b>{e.name}</b><br />{e.source === 'coach-safety' ? 'A support message to the AI coach' : 'Low energy for several mornings'} · {e.status}{e.level === 'school' ? ' · with the school' : ''}</span><Link className="pf-btn sm ghost" to={`../observe/${e.studentId}`}>Open</Link></li>)}</ul></Card>}
          <Card><CardHead title="Hard for several students" icon="layers" />
            {d.cohort.commonWeak.length + d.cohort.commonHard.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing shared yet. When two or more students struggle with the same topic, it shows here.</p> : <>
              {d.cohort.commonWeak.map(w => <div key={w.title} className="pf-row pf-wrap" style={{ gap: 6, marginBottom: 6 }}><span className="pf-grow pf-small"><b>{w.title}</b> · weak for {w.students.length}</span><button type="button" className="pf-btn sm ghost" onClick={() => { setPick(w.students); setGroup(true); }}>Act for them</button></div>)}
              {d.cohort.commonHard.map(w => <div key={w.word} className="pf-small" style={{ marginBottom: 4 }}>“{w.word}” came up as hard for {w.students.length}</div>)}</>}
            <p className="pf-small pf-faint" style={{ margin: '8px 0 0' }}>A group session or the same practice for all of them saves you time.</p></Card>
          <Card><CardHead title="How they compare" icon="chart" /><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Student</th><th>Week</th><th>Min (7d)</th><th>Streak</th></tr></thead><tbody>
            {d.cohort.rows.map(r => <tr key={r.id}><td className="pf-small"><Link to={`../observe/${r.id}`}>{r.name}</Link></td><td className="pf-small">{r.completion === null ? '–' : `${r.completion}%`}</td><td className="pf-small">{r.minutes7}</td><td className="pf-small">{r.streak}</td></tr>)}
          </tbody></table></div><p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>Average: {d.cohort.averages.completion ?? '–'}% of the week, {d.cohort.averages.minutes7 ?? 0} min.</p></Card>
          {d.limited.length > 0 && <Card><p className="pf-small pf-muted" style={{ margin: 0 }}>Waiting for a parent to confirm: {d.limited.map(x => x.name).join(', ')}.</p></Card>}
        </div>
      </div>
      <Drawer open={group} title="Act for several students" onClose={() => setGroup(false)}>{group && <GroupActions students={picked} onDone={load} onClose={() => setGroup(false)} />}</Drawer>
    </>
  );
}
