import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill, Progress } from '../../ui/kit';
import { loopApi, useLoop, messageFor, TYPE_LABEL, TYPE_TONE, PACE, BAND, fmtMinutes, fmtShort, weekdayOf, pct } from './loopApi';
import { Working, PageSkeleton, Orbit } from './Loader';

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
function Fair({ target, refId, fair, act, what }) {
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
function Exercises({ item, act }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const make = async () => { setBusy(true); setErr(''); try { await act(() => loopApi.makePractice(item.id)); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  if (busy) return <div style={{ marginTop: 10 }}><Working compact title="Making your practice" steps={PRACTICE_STEPS} /></div>;
  if (!item.exercises) {
    return (
      <div style={{ marginTop: 10 }}>
        <button type="button" className="pf-btn sm ghost" onClick={make}><Icon name="sparkles" size={14} />Give me practice questions</button>
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
      {!finished && item.help && <p className="pf-help"><b>{item.type === 'learn' ? 'Tip:' : 'How to go about it:'}</b> {item.help}</p>}
      {item.video && !(finished && item.status === 'skipped') && <Video unit={item} act={act} />}
      {!finished && item.practice && item.practice.length > 0 && <Places places={item.practice} />}
      {!finished && item.type !== 'learn' && <Exercises item={item} act={act} />}
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

const QUIZ_STEPS = ['Writing questions on what you studied…', 'Writing a short task for you…', 'Checking every answer is right…'];
const WORK_STEPS = ['Reading what you wrote…', 'Comparing it with the rubric…', 'Writing feedback to help you improve…'];

/** The week's assessment: a short quiz, then a piece of work, then feedback. Its results shape next week. */
function Assessment({ a, act }) {
  const [answers, setAnswers] = useState({});
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(null);                 // 'open' | 'quiz' | 'work'
  const [err, setErr] = useState('');
  const go = async (kind, fn) => { setBusy(kind); setErr(''); try { await act(fn); } catch (e) { setErr(messageFor(e)); } finally { setBusy(null); } };
  let body;
  if (busy === 'open') body = <Working title="Preparing your assessment" steps={QUIZ_STEPS} />;
  else if (busy === 'work') body = <Working title="Judging your work" steps={WORK_STEPS} />;
  else if (a.stage === 'locked') body = <p className="pf-small" style={{ margin: 0 }}>Unlocks after you finish {a.need} of this week’s steps ({a.done} done so far). It is a 5-question quiz and one short piece of work, and the result decides how next week is planned.</p>;
  else if (a.stage === 'ready') body = <><p className="pf-small" style={{ marginTop: 0 }}>A 5-question quiz and one short piece of work on what you learned this week. About 15 minutes. Your result decides next week: faster, steadier, or a little revision.</p><button type="button" className="pf-btn sm" onClick={() => go('open', () => loopApi.openCheck())}>Start the assessment</button></>;
  else if (a.stage === 'quiz') {
    const all = a.quiz.questions.every(q => answers[q.id] !== undefined);
    body = (
      <form onSubmit={e => { e.preventDefault(); go('quiz', () => loopApi.submitQuiz(a.quiz.questions.map(q => answers[q.id]))); }}>
        <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Part 1 of 2: the quiz</p>
        {a.quiz.questions.map((q, i) => (
          <fieldset key={q.id} className="pf-quizq">
            <legend><b>{i + 1}.</b> {q.q}</legend>
            {q.options.map((o, k) => <label key={k} className="pf-row" style={{ gap: 8, padding: '4px 0' }}><input type="radio" name={q.id} checked={answers[q.id] === k} onChange={() => setAnswers(x => ({ ...x, [q.id]: k }))} />{o}</label>)}
          </fieldset>
        ))}
        <button type="submit" className="pf-btn sm" disabled={busy === 'quiz' || !all}>{busy === 'quiz' ? 'Marking…' : all ? 'Submit my answers' : 'Answer every question'}</button>
      </form>
    );
  } else if (a.stage === 'work') {
    body = (
      <form onSubmit={e => { e.preventDefault(); go('work', () => loopApi.submitWork(text.trim(), link.trim())); }}>
        <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Part 2 of 2: {a.task.levelUp ? 'your level-up proof' : 'show what you can do'} · quiz score {pct(a.quiz.score)}</p>
        <p style={{ margin: '0 0 6px' }}><b>{a.task.prompt}</b></p>
        <p className="pf-small pf-muted" style={{ margin: '0 0 8px' }}>{a.task.expects}. You will be judged on: {a.task.rubric.join(', ')}.</p>
        <label className="pf-sr" htmlFor="work-text">Your answer</label>
        <textarea id="work-text" className="pf-textarea" rows={7} maxLength={3000} value={text} onChange={e => setText(e.target.value)} placeholder="Write in your own words…" />
        <div className="pf-small pf-muted" style={{ textAlign: 'right' }}>{text.trim().length} / 3000</div>
        <label className="pf-sr" htmlFor="work-link">A link to something you made (optional)</label>
        <input id="work-link" className="pf-input" type="url" inputMode="url" placeholder="Link to something you made (optional)" value={link} onChange={e => setLink(e.target.value)} style={{ marginTop: 6 }} />
        <button type="submit" className="pf-btn sm" style={{ marginTop: 10 }} disabled={text.trim().length < 20}>{text.trim().length < 20 ? 'Write a little more' : 'Submit my work'}</button>
      </form>
    );
  } else {
    const j = a.task && a.task.judgement;
    const rows = a.quiz.questions;
    body = (
      <>
        <p style={{ marginTop: 0 }}><b>Quiz: {pct(a.quiz.score)}</b> · {rows.filter(q => q.correct).length} of {rows.length} right</p>
        {j && j.status === 'judged' && (
          <div className="pf-judged">
            <div className="pf-row pf-wrap" style={{ gap: 8 }}><b>Your work</b><Pill tone={BAND[j.overall][1]}>{BAND[j.overall][0]}</Pill></div>
            <ul className="pf-list" style={{ marginTop: 8 }}>{j.criteria.map(c => <li key={c.name}><span className="pf-grow"><b>{c.name}</b><br /><span className="pf-small pf-muted">{c.comment}</span></span><Pill tone={BAND[c.band][1]}>{BAND[c.band][0]}</Pill></li>)}</ul>
            {j.feedback && <p className="pf-small">{j.feedback}</p>}
            {j.nextStep && <p className="pf-small"><b>Next step:</b> {j.nextStep}</p>}
            <Fair target="judgement" refId={a.id} fair={a.fair} act={act} what="this feedback" />
          </div>
        )}
        {a.task && a.task.levelUp && a.task.submitted && (a.task.levelPassed
          ? <p className="pf-levelup" role="status"><b>Level complete!</b> Your proof was accepted: the next level opens with your next week.</p>
          : <p className="pf-small" style={{ margin: '8px 0' }}><b>Not quite ready to move up.</b> Next week works on what the feedback says, then you get another go at the proof.</p>)}
        {j && j.status === 'unjudged' && <p className="pf-small" style={{ margin: '8px 0' }}>Your work is saved. We could not read it just now, so next week is planned from your quiz and your finished steps.</p>}
        <details className="pf-milestone"><summary>See the quiz answers</summary>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>{rows.map(q => <li key={q.id} className="pf-small" style={{ marginBottom: 8 }}>{q.q} <Pill tone={q.correct ? 'leaf' : 'coral'}>{q.correct ? 'Right' : 'Not quite'}</Pill>{!q.correct && <div>Answer: <b>{q.options[q.answer]}</b>. {q.explanation}</div>}</li>)}</ol>
        </details>
      </>
    );
  }
  const levelUp = a.task && a.task.levelUp;
  return <Card><CardHead title={levelUp ? 'Level-up assessment' : 'Week assessment'} icon="clipboard" />{body}{err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 8 }}>{err}</p>}</Card>;
}

const NEXT_STEPS = ['Looking at how your week went…', 'Adjusting the plan to your pace…', 'The Week Planner is writing next week…', 'A Week Critic is checking it…', 'Scouts are finding videos and practice…'];
/** After the assessment: review the week and plan the next, with a loader while it works. */
function NextWeek({ next, act }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (busy) return <Card ai><Working title="Planning your next week" steps={NEXT_STEPS} /></Card>;
  return (
    <Card ai>
      <span className="tag"><Icon name="sparkles" size={14} />Ready for the next week</span>
      <p style={{ margin: '8px 0 10px' }}>{next.assessed ? 'Your assessment is done. Your plan will now adapt to how this week went: faster, steadier, or with some revision.' : 'This week has ended. You can plan the next one now; without an assessment, your plan continues at the same pace.'}</p>
      <button type="button" className="pf-btn" onClick={async () => { setBusy(true); setErr(''); try { await act(() => loopApi.planNext()); } catch (e) { setErr(messageFor(e)); setBusy(false); } }}>Plan my next week</button>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 8 }}>{err}</p>}
    </Card>
  );
}

export default function LoopPlanPage() {
  const { loop, loading, closed, error, act } = useLoop();
  const [replan, setReplan] = useState('');
  const head = <PageHead eyebrow="Weekly plan" title="Your week, planned for you" actions={<Link className="pf-btn sm ghost" to="roadmap">My progress</Link>}>This is your week. Learn from the videos, show what you learned, then take the assessment. Your next week is built from how it goes.</PageHead>;
  if (loading) return <PageSkeleton label="Loading your week" />;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Weekly plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;
  if (loop.mode === 'chat') return <>{head}<Card><Empty icon="target" title={loop.currentGoal ? 'You are planning a new goal' : 'Tell your guide what you want to become'}>{loop.currentGoal ? 'Finish the chat on My goal, or keep your current goal.' : 'A short chat, then your plan appears here.'}</Empty><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="../goal">Go to My goal</Link></p></Card></>;

  const w = loop.week, g = loop.goal;
  const days = [...new Set(w.items.map(i => i.date))].sort();
  const done = w.plannedMinutes ? Math.round((w.doneMinutes / w.plannedMinutes) * 100) : 0;
  const pace = PACE[g.pace] || PACE['on-track'];
  const note = w.summary || (g.adaptations.length ? g.adaptations[g.adaptations.length - 1].summary : '');
  const changes = g.adaptations.length && g.adaptations[g.adaptations.length - 1].week === w.weekNumber - 1 ? g.adaptations[g.adaptations.length - 1].changes : [];
  return (
    <>
      {head}
      {w.weekNumber > 1 && note && <Card ai style={{ marginBottom: 12 }}><span className="tag"><Icon name="sparkles" size={14} />What changed for this week</span><p style={{ margin: '8px 0 0' }}>{note}</p>{changes.length > 0 && <ul className="pf-small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{changes.map(c => <li key={c}>{c}</li>)}</ul>}</Card>}
      {w.notices.map(n => <div key={n.key} className="pf-note" role="note" style={{ marginBottom: 10 }}>{n.text}</div>)}
      <div className="pf-grid g-main">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card>
            <div className="pf-row pf-wrap pf-weekhead" style={{ gap: 10 }}>
              <div className="pf-grow"><b>Week {w.weekNumber} · {g.title}</b><div className="pf-small pf-muted">{fmtShort(w.weekStart)} to {fmtShort(w.weekEnd)} · {w.focus || g.phase.title} · {fmtMinutes(w.doneMinutes)} of {fmtMinutes(w.plannedMinutes)} done{w.mode === 'exam' ? ' · exam week' : w.mode === 'reset' ? ' · lighter week' : ''}</div></div>
              <button type="button" className="pf-btn sm ghost" disabled={replan === 'busy'} onClick={async () => { setReplan('busy'); try { await act(() => loopApi.replan()); setReplan('done'); } catch (e) { setReplan(messageFor(e)); } }}>{replan === 'busy' ? 'Re-planning…' : 'Re-plan the rest of this week'}</button>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={done} label="This week" /></div>
            {replan && replan !== 'busy' && <p className="pf-small" role="status" style={{ marginTop: 6 }}>{replan === 'done' ? 'Planned again around your current week.' : replan}</p>}
          </Card>
          {w.items.length === 0 && <Card><Empty icon="calendar" title="Nothing planned this week">{w.notices.length ? 'See the note above.' : 'Add some free time to your week on My goal.'}</Empty></Card>}
          {days.map(date => (
            <Card key={date} className={w.items.find(i => i.date === date).day === w.todayIndex ? 'pf-today' : ''}>
              <CardHead title={`${weekdayOf(date)}, ${fmtShort(date)}${w.items.find(i => i.date === date).day === w.todayIndex ? ' · today' : ''}`} icon="calendar" />
              <div style={{ display: 'grid', gap: 10 }}>{w.items.filter(i => i.date === date).map(i => <Item key={i.id} item={i} act={act} />)}</div>
            </Card>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {loop.next.canPlan && <NextWeek next={loop.next} act={act} />}
          <Assessment a={loop.assessment} act={act} />
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
