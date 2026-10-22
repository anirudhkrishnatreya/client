import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill, Progress } from '../../ui/kit';
import { loopApi, useLoop, messageFor, DAYS, TYPE_LABEL, TYPE_TONE, fmtMinutes, fmtDay, VERDICT } from './loopApi';

const SKIPS = [['already-know', 'I already know this'], ['covered-elsewhere', 'Covered in school or coaching'], ['not-relevant', 'Not relevant for me'], ['too-hard', 'Too hard for now'], ['other', 'Another reason']];

/** One unit of the week: what, why, where to learn it, and the done/skip actions. */
function Item({ item, act }) {
  const [mode, setMode] = useState(null);          // null | 'done' | 'skip'
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

export default function LoopPlanPage() {
  const { loop, loading, closed, error, act } = useLoop();
  const [replanState, setReplan] = useState('');
  const head = <PageHead eyebrow="Weekly plan" title="Your week, planned for you" actions={<Link className="pf-btn sm ghost" to="roadmap">Whole roadmap</Link>}>Small steps that fit your free time. Learn from a free video, show what you learned, tick it off.</PageHead>;
  if (loading) return <>{head}<p role="status">Loading your week…</p></>;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Weekly plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;
  if (!loop.goal) return <>{head}<Card><Empty icon="target" title="Set your goal first">Pick a career and tell us about your week, and your plan appears here.</Empty><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="../goal">Set my goal</Link></p></Card></>;

  const w = loop.week;
  const v = loop.feasibility && VERDICT[loop.feasibility.verdict];
  const byDay = DAYS.map((_, d) => w.items.filter(i => i.day === d));
  const pct = w.plannedMinutes ? Math.round((w.doneMinutes / w.plannedMinutes) * 100) : 0;
  return (
    <>
      {head}
      {w.notices.map(n => <div key={n.key} className="pf-note" role="note" style={{ marginBottom: 10 }}>{n.text}</div>)}
      <div className="pf-grid g-main">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card>
            <div className="pf-row pf-wrap" style={{ gap: 10 }}>
              <div className="pf-grow"><b>Week of {fmtDay(w.weekStart)}</b><div className="pf-small pf-muted">{fmtMinutes(w.doneMinutes)} of {fmtMinutes(w.plannedMinutes)} done{w.mode === 'exam' ? ' · exam week' : w.mode === 'reset' ? ' · lighter week' : ''}</div></div>
              <button type="button" className="pf-btn sm ghost" disabled={replanState === 'busy'} onClick={async () => { setReplan('busy'); try { await act(() => loopApi.replan()); setReplan('done'); } catch (e) { setReplan(messageFor(e)); } }}>Re-plan the rest of this week</button>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={pct} label="This week" /></div>
            {replanState && replanState !== 'busy' && <p className="pf-small" role="status" style={{ marginTop: 6 }}>{replanState === 'done' ? 'Planned again around your current schedule.' : replanState}</p>}
          </Card>
          {w.items.length === 0 && <Card><Empty icon="calendar" title="Nothing planned this week">{w.notices.length ? 'See the note above.' : 'Add some free time to your week on the goal page.'}</Empty></Card>}
          {byDay.map((items, d) => (items.length ? (
            <Card key={d} className={d === w.todayIndex ? 'pf-today' : ''}>
              <CardHead title={`${DAYS[d]}${d === w.todayIndex ? ' · today' : ''}`} icon="calendar" />
              <div style={{ display: 'grid', gap: 10 }}>{items.map(i => <Item key={i.id} item={i} act={act} />)}</div>
            </Card>
          ) : null))}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card><CardHead title="Your progress" icon="trend" />
            <p className="pf-small" style={{ marginTop: 0 }}>{loop.progress.done} of {loop.progress.total} steps done in this goal</p>
            {loop.progress.stages.map(s => <div key={s.id} style={{ marginBottom: 10 }}><div className="pf-row"><span className="pf-small pf-grow">{s.title}</span><span className="pf-small pf-muted">{s.done}/{s.total}</span></div><Progress value={s.total ? (s.done / s.total) * 100 : 0} label={`${s.title} stage`} /></div>)}
          </Card>
          {v && <Card><CardHead title="Will you make it?" icon="target" /><p className="pf-small" style={{ margin: 0 }}><Pill tone={v.tone}>{loop.feasibility.verdict === 'fits' ? 'On track' : loop.feasibility.verdict === 'tight' ? 'Tight' : 'Not yet'}</Pill> {v.text}</p></Card>}
          {loop.lastWeek && loop.lastWeek.completion !== null && <Card><CardHead title="Last week" icon="chart" /><p className="pf-small" style={{ margin: 0 }}>You finished {Math.round(loop.lastWeek.completion * 100)}% of what was planned. {loop.lastWeek.completion >= 0.9 ? 'Brilliant.' : loop.lastWeek.completion >= 0.6 ? 'Good going.' : 'That is fine: this week is sized to match.'}</p></Card>}
          {loop.roadmap.reviewStatus === 'draft' && <div className="pf-note" role="note"><Icon name="info" size={15} /> {loop.roadmap.reviewNote}</div>}
        </div>
      </div>
    </>
  );
}
