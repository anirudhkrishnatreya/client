import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Icon, Pill } from '../../ui/kit';
import { loopApi, messageFor, BAND, pct } from './loopApi';
import { Working } from './Loader';
import AuthImage from './AuthImage';
import { shrinkImage } from './photos';
import { Fair } from './Steps';

// The week's assessment: a short quiz, then a piece of work, then feedback. Its result decides how next week is planned, and
// next week only opens once it is done.
const QUIZ_STEPS = ['Writing questions on what you studied…', 'Writing a short task for you…', 'Checking every answer is right…'];
const WORK_STEPS = ['Reading what you wrote…', 'Comparing it with the rubric…', 'Writing feedback to help you improve…'];

/** The week's assessment: a short quiz, then a piece of work, then feedback. Its results shape next week. */
/** "Add to my portfolio" for work that earned it; once in, a link to the portfolio. */
function PortfolioButton({ a, act }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (a.portfolio.itemId) return <p className="pf-small" style={{ margin: '8px 0' }}><Pill tone="leaf" icon="check">In your portfolio</Pill> <Link to="../portfolio">See my portfolio</Link></p>;
  const add = async () => { setBusy(true); setErr(''); try { await loopApi.addToPortfolio(a.id); await act(() => loopApi.state()); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  return (
    <div style={{ margin: '8px 0' }}>
      <button type="button" className="pf-btn sm" disabled={busy} onClick={add}><Icon name="award" size={14} />{busy ? 'Adding…' : 'Add to my portfolio'}</button>
      <span className="pf-small pf-muted" style={{ marginLeft: 8 }}>Proof of what you can do, to show colleges and employers.</span>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}
    </div>
  );
}

export function Assessment({ a, act, off }) {
  const [shots, setShots] = useState([]);           // photos of the work, already shrunk on this device
  const [shotErr, setShotErr] = useState('');
  const addShots = async files => {
    setShotErr('');
    for (const f of [...files].slice(0, 2 - shots.length)) {
      try { const url = await shrinkImage(f); setShots(x => (x.length < 2 ? [...x, url] : x)); }
      catch { setShotErr('That file is not a photo this browser can read. Try a JPEG or PNG.'); }
    }
  };
  const [answers, setAnswers] = useState({});
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(null);                 // 'open' | 'quiz' | 'work'
  const [err, setErr] = useState('');
  const go = async (kind, fn) => { setBusy(kind); setErr(''); try { await act(fn); } catch (e) { setErr(messageFor(e)); } finally { setBusy(null); } };
  let body;
  if (busy === 'open') body = <Working title="Preparing your assessment" steps={QUIZ_STEPS} />;
  else if (busy === 'work') body = <Working title="Judging your work" steps={WORK_STEPS} />;
  else if (a.stage === 'locked') body = <p className="pf-small" style={{ margin: 0 }}>Unlocks after you finish {a.need} of this week’s steps ({a.done} done so far), or when the week ends. It is a 5-question quiz and one short piece of work. Your next week opens after it, and is built from how it goes.</p>;
  else if (a.stage === 'ready') body = <><p className="pf-small" style={{ marginTop: 0 }}>A 5-question quiz and one short piece of work on what you learned this week. About 15 minutes. Your result decides next week: faster, steadier, or a little revision.</p><button type="button" className="pf-btn sm" disabled={off} onClick={() => go('open', () => loopApi.openCheck())}>Start the assessment</button></>;
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
      <form onSubmit={e => { e.preventDefault(); go('work', () => loopApi.submitWork(text.trim(), link.trim(), shots)); }}>
        <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Part 2 of 2: {a.task.levelUp ? 'your level-up proof' : 'show what you can do'} · quiz score {pct(a.quiz.score)}</p>
        <p style={{ margin: '0 0 6px' }}><b>{a.task.prompt}</b></p>
        <p className="pf-small pf-muted" style={{ margin: '0 0 8px' }}>{a.task.expects}. You will be judged on: {a.task.rubric.join(', ')}.</p>
        <label className="pf-sr" htmlFor="work-text">Your answer</label>
        <textarea id="work-text" className="pf-textarea" rows={7} maxLength={3000} value={text} onChange={e => setText(e.target.value)} placeholder="Write in your own words…" />
        <div className="pf-small pf-muted" style={{ textAlign: 'right' }}>{text.trim().length} / 3000</div>
        <label className="pf-sr" htmlFor="work-link">A link to something you made (optional)</label>
        <input id="work-link" className="pf-input" type="url" inputMode="url" placeholder="Link to something you made (optional)" value={link} onChange={e => setLink(e.target.value)} style={{ marginTop: 6 }} />
        <div className="pf-photos" style={{ marginTop: 10 }}>
          <span className="pf-small"><b>Photos of your work</b> (optional, up to 2): a sketch, a page of your notebook, a model. Photograph only the work, with no people in it.</span>
          <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 6 }}>
            {shots.map((src, k) => <span key={k} className="pf-shot"><img src={src} alt={`Photo ${k + 1} of your work`} /><button type="button" className="pf-shot-x" aria-label={`Remove photo ${k + 1}`} onClick={() => setShots(x => x.filter((_, j) => j !== k))}>×</button></span>)}
            {shots.length < 2 && <label className="pf-btn sm ghost" style={{ cursor: 'pointer' }}><Icon name="plus" size={14} />Add a photo<input type="file" accept="image/*" multiple className="pf-sr" aria-label="Add a photo of your work" onChange={e => { addShots(e.target.files); e.target.value = ''; }} /></label>}
          </div>
          {shotErr && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{shotErr}</p>}
        </div>
        {(() => { const ready = shots.length > 0 || text.trim().length >= 20; return <button type="submit" className="pf-btn sm" style={{ marginTop: 10 }} disabled={!ready}>{ready ? 'Submit my work' : 'Write a little more, or add a photo'}</button>; })()}
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
        {a.task && a.task.work && (
          <details className="pf-milestone" open={Boolean(a.task.work.photos.length)}><summary>Your work</summary>
            {a.task.work.text && <p className="pf-small" style={{ whiteSpace: 'pre-wrap' }}>{a.task.work.text}</p>}
            {a.task.work.photos.length > 0 && <div className="pf-row pf-wrap" style={{ gap: 8 }}>{a.task.work.photos.map((id, k) => <AuthImage key={id} path={`/v2/me/loop/photos/${id}`} alt={`Photo ${k + 1} of your work`} />)}</div>}
            {a.task.work.link && <p className="pf-small">Your link: <a href={a.task.work.link} target="_blank" rel="noopener noreferrer">{a.task.work.link}</a> {a.task.work.linkCheck === 'public' ? <Pill tone="leaf" icon="check">Public</Pill> : a.task.work.linkCheck === 'not-public' ? <Pill tone="coral">Not public: others cannot open it</Pill> : null}</p>}
          </details>
        )}
        {a.portfolio && a.portfolio.canAdd && <PortfolioButton a={a} act={act} />}
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

