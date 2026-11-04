import { useEffect, useState } from 'react';
import { Icon, Pill } from '../../ui/kit';
import { coachApi, errMessage, studentApi } from '../liveApi';

// The coach's check-ins: a minute each. Morning (energy, time, what's in the way), evening (what got done, what you learned and
// found hard), weekly review (the week in numbers, then how next week should feel), and session prep.
const ENERGY = [[1, '😴', 'Drained'], [2, '😕', 'Low'], [3, '🙂', 'Okay'], [4, '😃', 'Good'], [5, '⚡', 'Charged']];
const TIME = [0, 15, 30, 45, 60, 90, 120];
const WISH = [['faster', 'A little faster', 'More new ground'], ['same', 'Keep this pace', 'It felt right'], ['lighter', 'Lighter', 'Fewer, shorter steps'], ['practice', 'More practice', 'Make it stick']];

function Choice({ value, options, onChange, label }) {
  return <div className="pf-row pf-wrap" style={{ gap: 6 }} role="radiogroup" aria-label={label}>{options.map(([v, a, b]) => <button key={v} type="button" role="radio" aria-checked={value === v} className={`pf-choice${value === v ? ' on' : ''}`} onClick={() => onChange(v)}>{a}{b && <small>{b}</small>}</button>)}</div>;
}
const Result = ({ children }) => <div className="pf-ritual-done" role="status">{children}</div>;

function Morning({ view, onDone }) {
  const [energy, setEnergy] = useState(null);
  const [minutes, setMinutes] = useState(view.usual !== null && view.usual !== undefined ? Math.min(120, view.usual) : 60);
  const [blockers, setBlockers] = useState('');
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');
  const send = async () => { setErr(''); try { setOut(await coachApi.checkIn('morning', { energy, minutes, blockers: blockers.trim() })); } catch (x) { setErr(errMessage(x)); } };
  const apply = async () => { setErr(''); try { const r = await coachApi.applyCheckIn(out.checkIn.id); setOut(o => ({ ...o, applied: r.change })); onDone(); } catch (x) { setErr(errMessage(x)); } };
  if (out) return (
    <Result><p style={{ margin: 0 }}>{out.message}</p>
      {out.checkIn.proposal && !out.applied && <><ul className="pf-small">{out.checkIn.proposal.lines.map(l => <li key={l}>{l}</li>)}</ul><div className="pf-row" style={{ gap: 6 }}><button type="button" className="pf-btn sm" onClick={apply}>Move them</button><button type="button" className="pf-btn sm ghost" onClick={onDone}>Keep today as it is</button></div></>}
      {out.applied && <p className="pf-small" style={{ margin: '6px 0 0' }}><Icon name="check" size={13} /> Moved. You can undo it in the coach feed below.</p>}
      {!out.checkIn.proposal && <button type="button" className="pf-btn sm ghost" style={{ marginTop: 8 }} onClick={onDone}>Let’s go</button>}
      {err && <p className="pf-small" role="alert">{err}</p>}
    </Result>);
  return (
    <div className="pf-ritual-form">
      <p className="pf-ritual-q">How’s your energy this morning?</p>
      <Choice label="Energy" value={energy} onChange={setEnergy} options={ENERGY.map(([v, e, l]) => [v, `${e} ${l}`])} />
      <p className="pf-ritual-q">How much time do you have for study today?</p>
      <Choice label="Time today" value={minutes} onChange={setMinutes} options={TIME.map(m => [m, m === 0 ? 'None today' : m >= 120 ? '2 h +' : `${m} min`])} />
      {view.planned > 0 && <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>Today’s plan is about {view.planned} minutes.</p>}
      <label className="pf-ritual-q" htmlFor="blk">Anything in the way today? (optional)</label>
      <input id="blk" className="pf-input" maxLength={300} value={blockers} onChange={e => setBlockers(e.target.value)} placeholder="e.g. School test, cricket practice till 6" />
      <button type="button" className="pf-btn" disabled={!energy} onClick={send} style={{ marginTop: 10 }}>Check in</button>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </div>
  );
}

function Evening({ view, onDone }) {
  const [done, setDone] = useState(() => view.steps.filter(s => s.status === 'done').map(s => s.id));
  const [learned, setLearned] = useState(view.log ? view.log.learned : '');
  const [hard, setHard] = useState(view.log ? view.log.hard : '');
  const [confidence, setConfidence] = useState(view.log ? view.log.confidence : null);
  const [moveRest, setMoveRest] = useState(true);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');
  const left = view.steps.filter(s => s.status === 'todo' && !done.includes(s.id));
  const send = async () => {
    setErr('');
    try { setOut(await coachApi.checkIn('evening', { done: done.filter(id => view.steps.find(s => s.id === id && s.status === 'todo')), learned: learned.trim(), hard: hard.trim(), confidence, moveRest: moveRest && left.length > 0 })); onDone(true); }
    catch (x) { setErr(errMessage(x)); }
  };
  if (out) return (
    <Result><p style={{ margin: 0 }}>{out.streak && out.streak.current >= 2 && <span className="pf-flame" aria-hidden="true">🔥</span>}{out.message}</p>
      {out.change && <ul className="pf-small">{out.change.lines.map(l => <li key={l}>{l}</li>)}</ul>}
      {out.tomorrow.length > 0 && <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>Tomorrow: {out.tomorrow.map(t => t.title).join(' · ')}</p>}
      <button type="button" className="pf-btn sm ghost" style={{ marginTop: 8 }} onClick={() => onDone()}>Good night</button>
    </Result>);
  return (
    <div className="pf-ritual-form">
      {view.steps.length > 0 && <><p className="pf-ritual-q">What did you get done today?</p>
        <div className="pf-ritual-steps">{view.steps.map(s => (
          <label key={s.id} className={`pf-tick${done.includes(s.id) ? ' on' : ''}`}><input type="checkbox" disabled={s.status !== 'todo'} checked={done.includes(s.id)} onChange={e => setDone(d => (e.target.checked ? [...d, s.id] : d.filter(x => x !== s.id)))} />{s.title}<span className="pf-small pf-muted"> · {s.minutes} min{s.late ? ' · from earlier' : ''}</span></label>))}</div></>}
      <label className="pf-ritual-q" htmlFor="ev-l">What did you learn?</label>
      <textarea id="ev-l" className="pf-input" rows={2} maxLength={1500} value={learned} onChange={e => setLearned(e.target.value)} placeholder="In your own words, one or two sentences" />
      <label className="pf-ritual-q" htmlFor="ev-h">What was hard? (optional)</label>
      <input id="ev-h" className="pf-input" maxLength={600} value={hard} onChange={e => setHard(e.target.value)} placeholder="Your coach and mentor will help with it" />
      <p className="pf-ritual-q">How sure do you feel about today’s topic?</p>
      <Choice label="How sure" value={confidence} onChange={setConfidence} options={[1, 2, 3, 4, 5].map(n => [n, `${n}`])} />
      {left.length > 0 && view.canMoveOn && <label className="pf-small pf-row" style={{ gap: 6, marginTop: 10 }}><input type="checkbox" checked={moveRest} onChange={e => setMoveRest(e.target.checked)} />Move the {left.length} I didn’t get to into the rest of the week</label>}
      <button type="button" className="pf-btn" style={{ marginTop: 10 }} disabled={learned.trim().length > 0 && learned.trim().length < 10} onClick={send}>Finish the day</button>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </div>
  );
}

function Weekly({ view, onDone }) {
  const [wish, setWish] = useState(null);
  const [out, setOut] = useState('');
  const [err, setErr] = useState('');
  const st = view.stats;
  const send = async () => { setErr(''); try { setOut((await coachApi.checkIn('weekly', { wish })).message); onDone(true); } catch (x) { setErr(errMessage(x)); } };
  if (out) return <Result><p style={{ margin: 0 }}>{out}</p><button type="button" className="pf-btn sm ghost" style={{ marginTop: 8 }} onClick={() => onDone()}>Close</button></Result>;
  return (
    <div className="pf-ritual-form">
      {st && <div className="pf-wk-stats">
        <div><b>{st.steps.done}/{st.steps.of}</b><span>steps</span></div><div><b>{st.minutes}</b><span>minutes</span></div><div><b>{st.focus}</b><span>focus min</span></div>
        <div><b>{st.daysLogged}</b><span>days logged</span></div><div><b>{st.quiz === null ? '–' : `${st.quiz}%`}</b><span>quiz</span></div>
      </div>}
      {st && st.bestDay && <p className="pf-small" style={{ margin: '8px 0 0' }}>Best day: <b>{st.bestDay.label}</b> ({st.bestDay.minutes} min).</p>}
      <ul className="pf-small" style={{ margin: '8px 0' }}>{view.suggestions.map(x => <li key={x.text}>{x.text}</li>)}</ul>
      <p className="pf-ritual-q">How should next week feel?</p>
      <Choice label="Next week" value={wish} onChange={setWish} options={WISH} />
      <button type="button" className="pf-btn" disabled={!wish} style={{ marginTop: 10 }} onClick={send}>Set next week</button>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </div>
  );
}

function Prep({ view }) {
  const [added, setAdded] = useState([]);
  const p = view.prep;
  if (!p) return <p className="pf-small pf-muted" style={{ margin: 0 }}>No session in the next day.</p>;
  const add = async text => { try { await studentApi.addAgenda(p.session.id, text); setAdded(a => [...a, text]); } catch { /* shown by the button staying */ } };
  return (
    <div className="pf-ritual-form">
      <p style={{ margin: 0 }}>Your session is <b>{p.session.when}</b>{p.session.topic ? ` · ${p.session.topic}` : ''}.</p>
      {p.session.agenda.length > 0 && <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>Already on the agenda: {p.session.agenda.map(a => a.text).join(' · ')}</p>}
      {p.bring.length ? <ul className="pf-list" style={{ marginTop: 8 }}>{p.bring.map(b => <li key={b.text}><span className="pf-grow pf-small">{b.text}</span>{added.includes(b.text) ? <Pill tone="leaf">Added</Pill> : <button type="button" className="pf-btn sm ghost" onClick={() => add(b.text)}>Add to agenda</button>}</li>)}</ul>
        : <p className="pf-small" style={{ margin: '6px 0 0' }}>Bring one thing you are proud of and one question. You can add it on your Mentor page.</p>}
    </div>
  );
}

const TITLE = { morning: ['Morning check-in', 'sun'], evening: ['Evening debrief', 'moon'], weekly: ['Your week in review', 'chart'], prep: ['Prepare for your session', 'users'] };

/** The check-in card. `view` comes from Coach HQ (the one that is due) or is loaded when a nudge asked for a kind. */
export default function Ritual({ kind, view: given, onDone }) {
  const [view, setView] = useState(given || null);
  const [err, setErr] = useState('');
  useEffect(() => { if (!given || given.kind !== kind) coachApi.ritual(kind).then(setView).catch(x => setErr(errMessage(x))); else setView(given); }, [kind, given]);
  const [t, icon] = TITLE[kind] || TITLE.morning;
  return (
    <section className="pf-card pf-ritual" aria-label={t}>
      <div className="pf-row" style={{ gap: 8, marginBottom: 10 }}><span className="pf-ritual-ic"><Icon name={icon} size={16} /></span><h3 style={{ margin: 0, fontSize: 18 }}>{t}</h3></div>
      {!view ? <p className="pf-small pf-muted" role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p>
        : kind === 'morning' ? <Morning view={view} onDone={onDone} /> : kind === 'evening' ? <Evening view={view} onDone={onDone} /> : kind === 'weekly' ? <Weekly view={view} onDone={onDone} /> : <Prep view={view} />}
    </section>
  );
}
