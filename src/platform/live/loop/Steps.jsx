import { useState } from 'react';
import { Icon, Pill } from '../../ui/kit';
import { loopApi, messageFor, TYPE_LABEL, TYPE_TONE, fmtMinutes } from './loopApi';
import { Working } from './Loader';

// One step of the week in full: what and why, the video, practice places, practice questions, links back to the lessons, and
// done / skip. Used on each day's page.
const SKIPS = [['already-know', 'I already know this'], ['covered-elsewhere', 'Covered in school or coaching'], ['not-relevant', 'Not relevant for me'], ['too-hard', 'Too hard for now'], ['other', 'Another reason']];
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const SAFE_EMBED = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}(\?|$)/;

/** The video chosen for a unit: why it was chosen, what it covers, played here or on YouTube, and a way to ask for a different one. */
function Video({ unit, act }) {
  const v = unit.video;
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const another = async () => { setBusy(true); setErr(''); setPlaying(false); try { await act(() => loopApi.anotherVideo(unit.id)); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  return (
    <div className="pf-video">
      <div className="pf-video-head">
        {playing && SAFE_EMBED.test(v.embedUrl)
          ? <div className="pf-video-frame"><iframe src={v.embedUrl} title={v.title} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
          : <button type="button" className="pf-video-thumb" onClick={() => setPlaying(true)} aria-label={`Play: ${v.title}`}><img src={v.thumb} alt="" loading="lazy" /><span className="pf-play" aria-hidden="true"><Icon name="play" size={22} /></span></button>}
        <div className="pf-video-meta">
          {v.role === 'practice' && <Pill tone="grey">Follow along while you practise</Pill>}
          {v.role !== 'practice' && unit.sequence && unit.sequence.of > 1 && <Pill tone="grey">Video {unit.sequence.index} of {unit.sequence.of} for this topic, one for each learning step</Pill>}
          <b>{v.title}</b>
          <span className="pf-small pf-muted">{v.channel} · {v.minutes} min{v.start ? ` · from ${mmss(v.start)}${v.end ? ` to ${mmss(v.end)}` : ''}` : ''}</span>
          {v.covers && <span className="pf-small"><b>Covers:</b> {v.covers}</span>}
          {v.why && <span className="pf-small pf-muted">Why this one: {v.why}</span>}
        </div>
      </div>
      <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 8 }}>
        <a className="pf-btn sm ghost" href={v.watchUrl} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
        {unit.status === 'todo' && <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={another}>{busy ? 'Finding another…' : 'Show me a different video'}</button>}
      </div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}
    </div>
  );
}

/** Real free places to practise this, from iMenteo's checked list: what it is, what to do there, and whether it needs a free account. */
function Places({ places }) {
  return (
    <div className="pf-places">
      <div className="pf-eyebrow">Practise here</div>
      <ul>{places.map(p => (
        <li key={p.id}>
          <a href={p.url} target="_blank" rel="noopener noreferrer"><b>{p.provider}</b>: {p.title}</a>
          {p.login && <span className="pf-small pf-muted"> · free account</span>}
          {p.what && <div className="pf-small">{p.what}</div>}
        </li>
      ))}</ul>
    </div>
  );
}

/** "Was this fair?": a yes, or a "not really" (with an optional note) that goes to a person, whose reply then shows here. */
export function Fair({ target, refId, fair, act, what }) {
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async (yes, text = '') => { setBusy(true); setErr(''); try { await act(() => loopApi.feedback(target, refId, yes, text)); setMode(null); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  if (fair && fair.status === 'answered') {
    return <div className="pf-fair answered"><b>{fair.reply.by === 'mentor' ? 'Your mentor replied:' : 'The iMenteo team replied:'}</b> {fair.reply.text}</div>;
  }
  if (fair && !fair.fair) return <p className="pf-small pf-muted pf-fair">You said this did not feel fair. A mentor will look at it and reply here.</p>;
  if (fair && fair.fair) return <p className="pf-small pf-muted pf-fair">Thanks for telling us.</p>;
  if (mode === 'no') {
    return (
      <form className="pf-fair" onSubmit={e => { e.preventDefault(); send(false, note.trim()); }}>
        <label className="pf-label" htmlFor={`fair-${refId}`}>What felt wrong? (optional)</label>
        <textarea id={`fair-${refId}`} className="pf-textarea" rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="For example: I did explain that part in my second paragraph." />
        <div className="pf-row" style={{ gap: 8, marginTop: 8 }}><button type="submit" className="pf-btn sm" disabled={busy}>{busy ? 'Sending…' : 'Send to a mentor'}</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}
      </form>
    );
  }
  return (
    <div className="pf-row pf-wrap pf-fair" style={{ gap: 8 }} role="group" aria-label={`Was ${what} fair?`}>
      <span className="pf-small">Was {what} fair?</span>
      <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => send(true)}>Yes</button>
      <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => setMode('no')}>Not really</button>
      {err && <span className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</span>}
    </div>
  );
}

const PRACTICE_STEPS = ['The Practice Maker is writing exercises at your level…', 'The Practice Checker is solving each one first…', 'Keeping only the ones that passed…'];
/** Practice questions for this step, made on request (one tap, then kept): hints and answers stay hidden until asked for. */
function Exercises({ item, act, off }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const make = async () => { setBusy(true); setErr(''); try { await act(() => loopApi.makePractice(item.id)); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  if (busy) return <div style={{ marginTop: 10 }}><Working compact title="Making your practice" steps={PRACTICE_STEPS} /></div>;
  if (!item.exercises) {
    return (
      <div style={{ marginTop: 10 }}>
        <button type="button" className="pf-btn sm ghost" onClick={make} disabled={off} title={off ? 'Comes back when today’s AI resets' : undefined}><Icon name="sparkles" size={14} />Give me practice questions</button>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}
      </div>
    );
  }
  return (
    <div className="pf-exercises">
      <div className="pf-eyebrow">Practice questions · checked before you see them</div>
      <ol>{item.exercises.map((x, k) => (
        <li key={k}>
          <p style={{ margin: '0 0 4px', whiteSpace: 'pre-wrap' }}>{x.prompt}</p>
          {x.hint && <details><summary>Show a hint</summary><p className="pf-small">{x.hint}</p></details>}
          {x.kind === 'question' && x.answer && <details><summary>Show the answer</summary><p className="pf-small" style={{ whiteSpace: 'pre-wrap' }}>{x.answer}</p></details>}
          {x.kind === 'task' && x.checklist && <details><summary>How to check your work</summary><ul className="pf-small">{x.checklist.map(c => <li key={c}>{c}</li>)}</ul></details>}
        </li>
      ))}</ol>
      <Fair target="practice" refId={item.id} fair={item.exercisesFair} act={act} what="this practice" />
    </div>
  );
}

/** One unit: what, why, the video, and the done/skip actions. */
export function Item({ item, act, off }) {
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
      {!finished && item.help && <p className="pf-help"><b>{item.type === 'learn' ? 'Tip:' : 'How to go about it:'}</b> {item.help}</p>}
      {item.video && !(finished && item.status === 'skipped') && <Video unit={item} act={act} />}
      {!finished && item.practice && item.practice.length > 0 && <Places places={item.practice} />}
      {!finished && <Exercises item={item} act={act} off={off} />}
      {!finished && item.rewatch && item.rewatch.length > 0 && (
        <p className="pf-small" style={{ margin: '8px 0 0' }}><b>Stuck? Go back to:</b> {item.rewatch.map((r, k) => <span key={r.videoId}>{k > 0 && ' · '}<a href={r.watchUrl} target="_blank" rel="noopener noreferrer">{r.title}</a></span>)}</p>
      )}
      {item.status === 'done' && item.resourceUrl && <p className="pf-small" style={{ margin: '6px 0 0' }}>You also used: <a href={item.resourceUrl} target="_blank" rel="noopener noreferrer">{item.resourceTitle || item.resourceUrl}</a></p>}
      <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 10 }}>
        {!finished && !item.video && <a className="pf-btn sm ghost" href={item.searchUrl} target="_blank" rel="noopener noreferrer"><Icon name="search" size={14} />{item.type === 'learn' ? 'Find a free video' : 'Find a free video to help'}</a>}
        {!finished && mode === null && <button type="button" className="pf-btn sm" onClick={() => setMode('done')}>I have done this</button>}
        {!finished && mode === null && <button type="button" className="pf-btn sm ghost" onClick={() => setMode('skip')}>Skip</button>}
        {finished && <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => run(() => loopApi.undo(item.id))}>Undo</button>}
      </div>
      {mode === 'done' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(() => loopApi.done(item.id, { ...(link.trim() ? { resourceUrl: link.trim() } : {}), ...(rating ? { rating } : {}) })); }}>
          {item.video
            ? <p className="pf-small" style={{ marginTop: 0 }}>How was the video? Your rating helps other students get better videos. (You can also add another link you used.)</p>
            : <p className="pf-small" style={{ marginTop: 0 }}>Which video or page did you learn from? (optional)</p>}
          <label className="pf-sr" htmlFor={`link-${item.id}`}>A link you used (optional)</label>
          <input id={`link-${item.id}`} className="pf-input" type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=… (optional)" value={link} onChange={e => setLink(e.target.value)} />
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

