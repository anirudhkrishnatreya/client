import { useEffect, useState } from 'react';
import { Icon } from '../../ui/kit';
import { loopApi, messageFor, weekdayOf } from './loopApi';
import { Working } from './Loader';

/** Revision notes made for a lesson: a recap, key points, terms and a few questions to test yourself. */
export function Revision({ r }) {
  return (
    <div className="pf-revision">
      <p style={{ margin: '0 0 8px' }}>{r.recap}</p>
      <div className="pf-eyebrow">Key points</div>
      <ul>{r.points.map(p => <li key={p}>{p}</li>)}</ul>
      {r.terms.length > 0 && <><div className="pf-eyebrow">Words to know</div><dl className="pf-terms">{r.terms.map(t => <div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}</dd></div>)}</dl></>}
      {r.selfCheck.length > 0 && <><div className="pf-eyebrow">Test yourself</div><ol>{r.selfCheck.map(q => <li key={q}>{q}</li>)}</ol></>}
      <p className="pf-small pf-faint" style={{ margin: '6px 0 0' }}>Written by AI from the lesson’s outline (its title, what it covers and its chapters), not from the video itself. If something here differs from the video, trust the video and tell your mentor.</p>
    </div>
  );
}

const REVISION_STEPS = ['Reading the lesson’s outline…', 'Writing the key points and terms…', 'Adding a few questions to test yourself…'];

/** Notes for one step: the student's own, saved to read back later, and revision notes made on request. */
export function LessonNotes({ item, act, off }) {
  const saved = (item.notes && item.notes.text) || '';
  const revision = item.notes && item.notes.revision;
  const [open, setOpen] = useState(Boolean(saved || revision));
  const [text, setText] = useState(saved);
  const [state, setState] = useState('');          // '' | 'saving' | 'saved' | error text
  const [making, setMaking] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setText(saved); }, [saved]);
  const dirty = text.trim() !== saved.trim();
  const save = async () => { setState('saving'); try { await act(() => loopApi.saveNotes(item.id, text.trim())); setState('saved'); } catch (e) { setState(messageFor(e)); } };
  const make = async () => { setMaking(true); setErr(''); try { await act(() => loopApi.revision(item.id)); setOpen(true); } catch (e) { setErr(messageFor(e)); } finally { setMaking(false); } };
  if (!open) {
    return (
      <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 10 }}>
        <button type="button" className="pf-btn sm ghost" onClick={() => setOpen(true)}><Icon name="edit" size={14} />Take notes</button>
        <button type="button" className="pf-btn sm ghost" onClick={make} disabled={off || making} title={off ? 'Comes back when today’s AI resets' : undefined}><Icon name="book" size={14} />{making ? 'Making notes…' : 'Revision notes'}</button>
        {err && <span className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</span>}
      </div>
    );
  }
  return (
    <section className="pf-notes" aria-label={`Notes on ${item.title}`}>
      <div className="pf-notes-grid">
        <div>
          <label className="pf-eyebrow" htmlFor={`notes-${item.id}`}>My notes</label>
          <textarea id={`notes-${item.id}`} className="pf-textarea" rows={6} maxLength={5000} value={text} placeholder="What did this lesson say? Write it in your own words: key ideas, examples, a formula, a question to ask." onChange={e => { setText(e.target.value); setState(''); }} />
          <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 6 }}>
            <button type="button" className="pf-btn sm" disabled={!dirty || state === 'saving'} onClick={save}>{state === 'saving' ? 'Saving…' : 'Save notes'}</button>
            {state === 'saved' && !dirty && <span className="pf-small" role="status" style={{ color: 'var(--leaf)' }}>Saved. Find them any time in your Learning library.</span>}
            {state && !['saving', 'saved'].includes(state) && <span className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{state}</span>}
          </div>
        </div>
        <div>
          <div className="pf-eyebrow">Revision notes</div>
          {making ? <Working compact title="Making your revision notes" steps={REVISION_STEPS} />
            : revision ? <Revision r={revision} />
              : <div className="pf-revision empty"><p className="pf-small" style={{ margin: '0 0 8px' }}>Short notes to revise from later: the key points, the words to know and a few questions to test yourself.</p>
                <button type="button" className="pf-btn sm ghost" onClick={make} disabled={off} title={off ? 'Comes back when today’s AI resets' : undefined}><Icon name="sparkles" size={14} />Make revision notes</button>
                {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}</div>}
        </div>
      </div>
    </section>
  );
}

const SURE = [[1, 'Lost'], [2, 'Shaky'], [3, 'Okay'], [4, 'Good'], [5, 'Could teach it']];

/** After a day's steps: what the student learned, in their own words. Their mentor reads it; it also shapes the week's assessment. */
export function DayLog({ date, log, act, prompt }) {
  const [editing, setEditing] = useState(!log);
  const [learned, setLearned] = useState(log ? log.learned : '');
  const [hard, setHard] = useState(log ? log.hard : '');
  const [sure, setSure] = useState(log ? log.confidence : null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setEditing(!log); if (log) { setLearned(log.learned); setHard(log.hard); setSure(log.confidence); } }, [log]);
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await act(() => loopApi.logDay(date, { learned: learned.trim(), hard: hard.trim(), confidence: sure })); setEditing(false); }
    catch (x) { setErr(messageFor(x)); } finally { setBusy(false); }
  };
  if (log && !editing) {
    return (
      <section className="pf-card pf-daylog done" aria-label="What you learned">
        <div className="pf-row pf-wrap" style={{ gap: 8 }}><span className="tag"><Icon name="check" size={14} />Learning logged</span><span className="pf-grow" /><button type="button" className="pf-btn sm ghost" onClick={() => setEditing(true)}><Icon name="edit" size={14} />Edit</button></div>
        <p style={{ margin: '10px 0 4px', whiteSpace: 'pre-wrap' }}>{log.learned}</p>
        {log.hard && <p className="pf-small" style={{ margin: '4px 0' }}><b>Hard:</b> {log.hard}</p>}
        {log.confidence && <p className="pf-small pf-muted" style={{ margin: 0 }}>How sure you felt: {SURE[log.confidence - 1][1]}</p>}
      </section>
    );
  }
  return (
    <form className="pf-card pf-daylog" onSubmit={save} aria-label={`What you learned on ${weekdayOf(date)}`}>
      <span className="tag"><Icon name="edit" size={14} />Daily learning log</span>
      <h3 style={{ fontSize: 20, margin: '10px 0 4px' }}>{prompt || `What did you learn on ${weekdayOf(date)}?`}</h3>
      <p className="pf-small pf-muted" style={{ margin: '0 0 12px' }}>Explain it in your own words, as if to a friend. Writing it down is how it sticks. Your mentor reads this, and your week’s assessment builds on it. Your parent only sees that you logged the day.</p>
      <label className="pf-label" htmlFor={`learned-${date}`}>What I learned</label>
      <textarea id={`learned-${date}`} className="pf-textarea" rows={4} maxLength={1500} value={learned} onChange={e => setLearned(e.target.value)} placeholder="For example: an orbit is really falling sideways fast enough to keep missing the Earth…" />
      <label className="pf-label" htmlFor={`hard-${date}`} style={{ marginTop: 10 }}>What was hard or still confusing (optional)</label>
      <input id={`hard-${date}`} className="pf-input" maxLength={600} value={hard} onChange={e => setHard(e.target.value)} placeholder="Next week’s plan gives this another look" />
      <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 12 }} role="group" aria-label="How sure do you feel?">
        <span className="pf-small">How sure do you feel?</span>
        {SURE.map(([n, l]) => <button key={n} type="button" className="pf-chip" aria-pressed={sure === n} onClick={() => setSure(sure === n ? null : n)}>{l}</button>)}
      </div>
      <div className="pf-row" style={{ gap: 8, marginTop: 14 }}>
        <button type="submit" className="pf-btn" disabled={busy || learned.trim().length < 10}>{busy ? 'Saving…' : 'Save my log'}</button>
        {log && <button type="button" className="pf-btn ghost" onClick={() => setEditing(false)}>Cancel</button>}
      </div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
    </form>
  );
}
