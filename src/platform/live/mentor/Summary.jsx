import { useEffect, useState } from 'react';
import { Card, Icon, Pill, Progress } from '../../ui/kit';
import { errMessage, mentorApi } from '../liveApi';
import { weekdayOf, fmtShort } from '../loop/loopApi';
import { Working } from '../loop/Loader';

const SURE = ['', 'Lost', 'Shaky', 'Okay', 'Good', 'Could teach it'];
const textOf = d => `${d.text}${d.actions && d.actions.length ? `\n\nFor next week:\n${d.actions.map(a => `• ${a}`).join('\n')}` : ''}`;

/** A weekly summary the mentor edits before saving, and chooses who sees it: the student, the parent, both, or only them. */
export function SummaryEditor({ studentId, studentName, draft, onSaved }) {
  const [title, setTitle] = useState(draft.title || '');
  const [text, setText] = useState(textOf(draft));
  const [toStudent, setToStudent] = useState(true);
  const [toParent, setToParent] = useState(true);
  const [state, setState] = useState('');
  useEffect(() => { setTitle(draft.title || ''); setText(textOf(draft)); setState(''); }, [draft]);
  const save = async e => {
    e.preventDefault(); setState('saving');
    try { await mentorApi.addNote(studentId, { kind: 'summary', title: title.trim(), text: text.trim(), sharedWithStudent: toStudent, sharedWithParent: toParent }); setState('saved'); if (onSaved) await onSaved(); }
    catch (x) { setState(errMessage(x)); }
  };
  if (state === 'saved') return <p className="pf-small" role="status" style={{ color: 'var(--leaf)', margin: 0 }}><Icon name="check" size={14} /> Saved{toStudent || toParent ? ` and shared with ${[toStudent && (studentName ? studentName.split(' ')[0] : 'the student'), toParent && 'their parent'].filter(Boolean).join(' and ')}` : ' (only you can see it)'}.</p>;
  return (
    <form onSubmit={save} className="pf-summary-edit" aria-label={`Weekly summary for ${studentName || 'the student'}`}>
      <label className="pf-label" htmlFor={`sum-title-${studentId}`}>Title</label>
      <input id={`sum-title-${studentId}`} className="pf-input" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} />
      <label className="pf-label" htmlFor={`sum-text-${studentId}`} style={{ marginTop: 8 }}>Summary (edit before saving)</label>
      <textarea id={`sum-text-${studentId}`} className="pf-textarea" rows={9} maxLength={4000} value={text} onChange={e => setText(e.target.value)} />
      <div className="pf-row pf-wrap" style={{ gap: 16, margin: '8px 0' }}>
        <label className="pf-small pf-row" style={{ gap: 6 }}><input type="checkbox" checked={toStudent} onChange={e => setToStudent(e.target.checked)} />Share with the student</label>
        <label className="pf-small pf-row" style={{ gap: 6 }}><input type="checkbox" checked={toParent} onChange={e => setToParent(e.target.checked)} />Share with the parent</label>
      </div>
      <button type="submit" className="pf-btn sm" disabled={state === 'saving' || text.trim().length < 20}>{state === 'saving' ? 'Saving…' : 'Save summary'}</button>
      {state && !['saving', 'saved'].includes(state) && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{state}</p>}
    </form>
  );
}

const DRAFT_STEPS = ['Reading the week: plan steps, tasks and the learning log…', 'Writing what went well and what to work on…', 'Adding actions for next week…'];

/** This week for one student, in facts (the digest), and a summary drafted from it that the mentor edits and shares. */
export function WeekTab({ studentId, studentName, onSaved }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { mentorApi.digest(studentId).then(r => setD(r.digest)).catch(e => setErr(errMessage(e))); }, [studentId]);
  const make = async () => { setBusy(true); setErr(''); try { const r = await mentorApi.draftSummary(studentId); setDraft(r.draft); } catch (e) { setErr(e && e.response && e.response.data && e.response.data.code === 'AI_DAILY_LIMIT' ? 'You have used today’s AI. It comes back tomorrow morning.' : errMessage(e, 'Could not draft the summary just now. You can still write one yourself below.')); setDraft(x => x || { title: 'This week', text: '', actions: [] }); } finally { setBusy(false); } };
  if (!d) return <p role="status" className="pf-muted">{err || 'Loading the week…'}</p>;
  const p = d.plan;
  return (
    <>
      <p className="pf-small pf-muted" style={{ marginTop: 0 }}>{fmtShort(d.from)} to {fmtShort(d.to)}</p>
      {p ? (
        <div className="pf-note" style={{ marginBottom: 12 }}>
          <b>Week {p.weekNumber} of “{p.goal}”</b> · level {p.level}<br />
          <span className="pf-small">{p.focus}</span>
          <div className="pf-row pf-between pf-small" style={{ marginTop: 8 }}><span>Steps done</span><b>{p.done} of {p.steps}{p.skipped ? ` (${p.skipped} skipped)` : ''}</b></div>
          <Progress value={p.steps ? (p.done / p.steps) * 100 : 0} label="Steps done" />
          <p className="pf-small" style={{ margin: '8px 0 0' }}>Assessment: {p.assessment ? `${p.assessment.quiz !== null ? `quiz ${p.assessment.quiz}%` : 'quiz not taken'}${p.assessment.work ? `, work ${p.assessment.work}` : ''}` : 'not taken yet'}</p>
          {p.notDone.length > 0 && <p className="pf-small" style={{ margin: '4px 0 0' }}>Not done yet: {p.notDone.slice(0, 4).join('; ')}</p>}
        </div>) : <p className="pf-small pf-muted">No weekly plan yet.</p>}
      <div className="pf-row pf-wrap" style={{ gap: 6, marginBottom: 12 }}>
        <Pill tone="sky">{d.tasks.open} open tasks</Pill>{d.tasks.overdue > 0 && <Pill tone="coral">{d.tasks.overdue} overdue</Pill>}{d.tasks.review > 0 && <Pill tone="gold">{d.tasks.review} to review</Pill>}<Pill tone="leaf">{d.tasks.doneThisWeek.length} done this week</Pill><Pill tone={d.logs.length ? 'sky' : 'grey'}>{d.logs.length} day{d.logs.length === 1 ? '' : 's'} logged</Pill>
      </div>
      <Card ai>
        <div className="pf-row pf-wrap" style={{ gap: 8 }}><span className="tag"><Icon name="file" size={14} />Weekly summary</span><span className="pf-grow" />
          {!draft && <button type="button" className="pf-btn sm" disabled={busy} onClick={make}><Icon name="sparkles" size={14} />Draft it for me</button>}
          {!draft && <button type="button" className="pf-btn sm ghost" onClick={() => setDraft({ title: `Week of ${fmtShort(d.from)}`, text: '', actions: [] })}>Write it myself</button>}</div>
        {busy ? <div style={{ marginTop: 10 }}><Working compact title="Drafting the summary" steps={DRAFT_STEPS} /></div>
          : draft ? <div style={{ marginTop: 10 }}><SummaryEditor studentId={studentId} studentName={studentName} draft={draft} onSaved={onSaved} /></div>
            : <p className="pf-small" style={{ margin: '8px 0 0' }}>A short note to {studentName ? studentName.split(' ')[0] : 'the student'} and their parent: what went well, what to work on, and actions for next week. Drafted from the facts above; you edit it before anyone sees it.</p>}
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
      </Card>
    </>
  );
}

/** The student's daily learning log, newest first: their own words about each day. */
export function LogTab({ logs }) {
  if (!logs.length) return <p className="pf-muted">No days logged yet. After each day of their plan, students write what they learned; it shows up here.</p>;
  return (
    <div className="pf-timeline">{logs.map(l => (
      <div key={l.date} className="pf-tl">
        <b>{weekdayOf(l.date)}, {fmtShort(l.date)}</b> <span className="pf-small pf-muted">· week {l.weekNumber}</span>{l.confidence ? <> <Pill tone={l.confidence >= 4 ? 'leaf' : l.confidence <= 2 ? 'coral' : 'gold'}>{SURE[l.confidence]}</Pill></> : null}
        <p className="pf-small" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{l.learned}</p>
        {l.hard && <p className="pf-small" style={{ margin: '4px 0 0' }}><b>Found hard:</b> {l.hard}</p>}
      </div>))}</div>
  );
}
