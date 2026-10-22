import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill, Progress } from '../../ui/kit';
import { loopApi, useLoop, messageFor, DAYS, TYPE_LABEL, TYPE_TONE, PACE, fmtMinutes } from './loopApi';

const SKIPS = [['already-know', 'I already know this'], ['covered-elsewhere', 'Covered in school or coaching'], ['not-relevant', 'Not relevant for me'], ['too-hard', 'Too hard for now'], ['other', 'Another reason']];

/** One unit: what, why, where to learn it, and the done/skip actions. */
function Item({ item, act }) {
  const [mode, setMode] = useState(null);
  const [link, setLink] = useState('');
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState('already-know');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async fn => { setBusy(true); setErr(''); try { await act(fn); setMode(null); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  const finished = item.status !== 'todo';
  return (
    <article className={`pf-unit${finished ? ' finished' : ''}`} aria-label={item.title}>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}>
        <Pill tone={TYPE_TONE[item.type]}>{TYPE_LABEL[item.type]}</Pill>
        <b className="pf-grow">{item.title}</b>
        <span className="pf-small pf-muted">{fmtMinutes(item.minutes)}</span>
        {item.status === 'done' && <Pill tone="leaf" icon="check">Done</Pill>}
        {item.status === 'skipped' && <Pill tone="grey">Skipped</Pill>}
      </div>
      <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>{item.reason}</p>
      {!finished && (
        <>
          <p className="pf-small" style={{ margin: '8px 0 0' }}><b>You will be able to:</b> {item.goal}</p>
          <p className="pf-small" style={{ margin: '4px 0 0' }}><b>To show it:</b> {item.evidence}</p>
        </>
      )}
      {item.status === 'done' && item.resourceUrl && <p className="pf-small" style={{ margin: '6px 0 0' }}>Learned from: <a href={item.resourceUrl} target="_blank" rel="noopener noreferrer">{item.resourceTitle || item.resourceUrl}</a></p>}
      <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 10 }}>
        {!finished && <a className="pf-btn sm ghost" href={item.searchUrl} target="_blank" rel="noopener noreferrer"><Icon name="search" size={14} />Find a free video</a>}
        {!finished && mode === null && <button type="button" className="pf-btn sm" onClick={() => setMode('done')}>I have done this</button>}
        {!finished && mode === null && <button type="button" className="pf-btn sm ghost" onClick={() => setMode('skip')}>Skip</button>}
        {finished && <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => run(() => loopApi.undo(item.id))}>Undo</button>}
      </div>
      {mode === 'done' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(() => loopApi.done(item.id, { ...(link.trim() ? { resourceUrl: link.trim() } : {}), ...(rating ? { rating } : {}) })); }}>
          <label className="pf-label" htmlFor={`link-${item.id}`}>Which video or page did you learn from? (optional)</label>
          <input id={`link-${item.id}`} className="pf-input" type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=…" value={link} onChange={e => setLink(e.target.value)} />
          <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 8 }} role="group" aria-label="How good was it?">
            <span className="pf-small">How good was it?</span>
            {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={`pf-star${rating >= n ? ' on' : ''}`} aria-pressed={rating === n} aria-label={`${n} out of 5`} onClick={() => setRating(n)}>★</button>)}
          </div>
          <div className="pf-row" style={{ gap: 8, marginTop: 10 }}><button type="submit" className="pf-btn sm" disabled={busy}>{busy ? 'Saving…' : 'Mark as done'}</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {mode === 'skip' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(() => loopApi.skip(item.id, reason)); }}>
          <label className="pf-label" htmlFor={`skip-${item.id}`}>Why skip it?</label>
          <select id={`skip-${item.id}`} className="pf-select" value={reason} onChange={e => setReason(e.target.value)}>{SKIPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <div className="pf-row" style={{ gap: 8, marginTop: 10 }}><button type="submit" className="pf-btn sm" disabled={busy}>Skip it</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 6 }}>{err}</p>}
    </article>
  );
}

/** The end-of-week check: locked until a couple of steps are done, then 5 quick questions, then answers explained. */
function WeekCheck({ check, act }) {
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async fn => { setBusy(true); setErr(''); try { await act(fn); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  let body;
  if (check.status === 'locked') body = <p className="pf-small" style={{ margin: 0 }}>Unlocks after you finish {check.need} of this week’s steps ({check.done} done so far). It is 5 quick questions on what you learned, and it decides how fast next week moves.</p>;
  else if (check.status === 'ready') body = <><p className="pf-small" style={{ marginTop: 0 }}>5 quick questions on what you studied this week. About 5 minutes. Your result shapes next week: ahead, steady, or a little revision.</p><button type="button" className="pf-btn sm" disabled={busy} onClick={() => go(() => loopApi.openCheck())}>{busy ? 'Preparing your questions…' : 'Start the check'}</button></>;
  else if (check.status === 'open') {
    const all = check.questions.every(q => answers[q.id] !== undefined);
    body = (
      <form onSubmit={e => { e.preventDefault(); go(() => loopApi.submitCheck(check.questions.map(q => answers[q.id]))); }}>
        {check.questions.map((q, i) => (
          <fieldset key={q.id} className="pf-quizq">
            <legend><b>{i + 1}.</b> {q.q}</legend>
            {q.options.map((o, k) => <label key={k} className="pf-row" style={{ gap: 8, padding: '4px 0' }}><input type="radio" name={q.id} checked={answers[q.id] === k} onChange={() => setAnswers(a => ({ ...a, [q.id]: k }))} />{o}</label>)}
          </fieldset>
        ))}
        <button type="submit" className="pf-btn sm" disabled={busy || !all}>{busy ? 'Marking…' : all ? 'Submit my answers' : 'Answer every question'}</button>
      </form>
    );
  } else {
    const pct = Math.round(check.score * 100);
    body = (
      <>
        <p style={{ marginTop: 0 }}><b>{pct}%</b> · {pct >= 80 ? 'Great work. Next week moves ahead.' : pct >= 50 ? 'Good going. Next week revises what you missed, then continues.' : 'That is fine. Next week goes over these again, a little slower.'}</p>
        <ol style={{ margin: 0, paddingLeft: 18 }}>{check.questions.map(q => (
          <li key={q.id} className="pf-small" style={{ marginBottom: 8 }}>
            {q.q} <Pill tone={q.correct ? 'leaf' : 'coral'}>{q.correct ? 'Right' : 'Not quite'}</Pill>
            {!q.correct && <div>Answer: <b>{q.options[q.answer]}</b>. {q.explanation}</div>}
          </li>
        ))}</ol>
      </>
    );
  }
  return <Card><CardHead title="Week check" icon="clipboard" />{body}{err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 8 }}>{err}</p>}</Card>;
}

export default function LoopPlanPage() {
  const { loop, loading, closed, error, act } = useLoop();
  const [replanState, setReplan] = useState('');
  const head = <PageHead eyebrow="Weekly plan" title="Your week, planned for you" actions={<Link className="pf-btn sm ghost" to="roadmap">My journey</Link>}>Small steps that fit your free time. Learn from a free video, show what you learned, tick it off, then take the week check.</PageHead>;
  if (loading) return <>{head}<p role="status">Loading your week… (a new week takes a few seconds to plan)</p></>;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Weekly plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;
  if (loop.mode === 'chat') return <>{head}<Card><Empty icon="target" title={loop.currentGoal ? 'You are planning a new goal' : 'Tell your guide what you want to become'}>{loop.currentGoal ? 'Finish the chat on My goal, or keep your current goal.' : 'A short chat, then your plan appears here.'}</Empty><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="../goal">Go to My goal</Link></p></Card></>;

  const w = loop.week, g = loop.goal;
  const byDay = DAYS.map((_, d) => w.items.filter(i => i.day === d));
  const pct = w.plannedMinutes ? Math.round((w.doneMinutes / w.plannedMinutes) * 100) : 0;
  const pace = PACE[g.pace] || PACE['on-track'];
  return (
    <>
      {head}
      {w.notices.map(n => <div key={n.key} className="pf-note" role="note" style={{ marginBottom: 10 }}>{n.text}</div>)}
      <div className="pf-grid g-main">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card>
            <div className="pf-row pf-wrap pf-weekhead" style={{ gap: 10 }}>
              <div className="pf-grow"><b>Week {w.weekNumber} · {g.title}</b><div className="pf-small pf-muted">{w.focus || g.phases[Math.min(g.progress.phaseIndex, g.phases.length - 1)].title} · {fmtMinutes(w.doneMinutes)} of {fmtMinutes(w.plannedMinutes)} done{w.mode === 'exam' ? ' · exam week' : w.mode === 'reset' ? ' · lighter week' : ''}</div></div>
              <button type="button" className="pf-btn sm ghost" disabled={replanState === 'busy'} onClick={async () => { setReplan('busy'); try { await act(() => loopApi.replan()); setReplan('done'); } catch (e) { setReplan(messageFor(e)); } }}>{replanState === 'busy' ? 'Re-planning…' : 'Re-plan the rest of this week'}</button>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={pct} label="This week" /></div>
            {replanState && replanState !== 'busy' && <p className="pf-small" role="status" style={{ marginTop: 6 }}>{replanState === 'done' ? 'Planned again around your current week.' : replanState}</p>}
          </Card>
          {w.items.length === 0 && <Card><Empty icon="calendar" title="Nothing planned this week">{w.notices.length ? 'See the note above.' : 'Add some free time to your week on My goal.'}</Empty></Card>}
          {byDay.map((items, d) => (items.length ? (
            <Card key={d} className={d === w.todayIndex ? 'pf-today' : ''}>
              <CardHead title={`${DAYS[d]}${d === w.todayIndex ? ' · today' : ''}`} icon="calendar" />
              <div style={{ display: 'grid', gap: 10 }}>{items.map(i => <Item key={i.id} item={i} act={act} />)}</div>
            </Card>
          ) : null))}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <WeekCheck check={loop.check} act={act} />
          <Card><CardHead title="Your journey" icon="trend" action="Open" to="roadmap" />
            <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 8 }}><Pill tone={pace[1]}>{pace[0]}</Pill><span className="pf-small pf-muted">phase {Math.min(g.progress.phaseIndex + 1, g.progress.phases)} of {g.progress.phases}</span></div>
            <p className="pf-small" style={{ margin: '0 0 8px' }}>{g.progress.topicsDone} of {g.progress.topicsTotal} topics studied, {g.progress.mastered} mastered</p>
            <Progress value={g.progress.topicsTotal ? (g.progress.topicsDone / g.progress.topicsTotal) * 100 : 0} label="Topics studied" />
          </Card>
          {w.source === 'fallback' && <div className="pf-note" role="note"><Icon name="info" size={15} /> This week was planned simply from your topics, because the guide could not be reached. Next week is planned in full.</div>}
        </div>
      </div>
    </>
  );
}
