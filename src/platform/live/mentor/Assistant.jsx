import { useEffect, useRef, useState } from 'react';
import { usePlatform } from '../../data/store';
import { Card, Icon, PageHead, Pill } from '../../ui/kit';
import { errMessage, firstName, mentorApi } from '../liveApi';
import { SummaryEditor } from './Summary';

const KEY = 'imenteo.mentor.assistant';
const LABEL = { assign_task: ['Give a task', 'tasks'], schedule_session: ['Book a session', 'calendar'], add_note: ['Write a note', 'edit'], weekly_summary: ['Draft a weekly summary', 'file'] };
const PRIO = { high: 'coral', medium: 'gold', low: 'grey' };
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } };
const keep = m => { try { sessionStorage.setItem(KEY, JSON.stringify(m.slice(-30))); } catch { /* private mode */ } };
const codeOf = e => e && e.response && e.response.data && e.response.data.code;

/** One proposed action, with what it will do, and Confirm / Skip. Nothing happens until Confirm. */
function Action({ a, onResult }) {
  const [state, setState] = useState(a.state || 'proposed');     // proposed | busy | done | skipped | failed
  const [note, setNote] = useState(a.result || '');
  const [summary, setSummary] = useState(null);
  const [lbl, icon] = LABEL[a.type] || ['Action', 'bolt'];
  const confirm = async () => {
    setState('busy');
    try { const r = await mentorApi.act({ ...a, studentIds: a.students.map(s => s.id) }); setState('done'); setNote(r.done); if (r.summary) setSummary(r.summary); onResult(a.id, 'done', r.done); }
    catch (e) { setState('failed'); setNote(errMessage(e, codeOf(e) === 'AI_DAILY_LIMIT' ? 'You have used today’s AI.' : 'That did not work. Please try again.')); }
  };
  return (
    <div className={`pf-action ${state}${a.problem ? ' problem' : ''}`}>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}>
        <Icon name={icon} size={16} /><b>{lbl}</b>
        <span className="pf-small">{a.students.length ? `for ${a.students.map(s => s.name).join(', ')}` : ''}</span>
        <span className="pf-grow" />
        {state === 'done' && <Pill tone="leaf" icon="check">Done</Pill>}{state === 'skipped' && <Pill tone="grey">Skipped</Pill>}
      </div>
      {a.type === 'assign_task' && <p className="pf-small" style={{ margin: '6px 0 0' }}><b>{a.title}</b>{a.notes ? ` · ${a.notes}` : ''}<br /><span className="pf-muted">{a.subject} · due {a.due}</span> <Pill tone={PRIO[a.priority]}>{a.priority}</Pill></p>}
      {a.type === 'schedule_session' && <p className="pf-small" style={{ margin: '6px 0 0' }}>{a.date || 'No date'}{a.time ? ` at ${a.time}` : ''}{a.topic ? ` · ${a.topic}` : ''}</p>}
      {a.type === 'add_note' && <p className="pf-small" style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>“{a.text}”<br /><span className="pf-muted">{a.shareWithParent || a.shareWithStudent ? `Shared with ${[a.shareWithStudent && 'the student', a.shareWithParent && 'the parent'].filter(Boolean).join(' and ')}` : 'Private to you'}</span></p>}
      {a.problem && <p className="pf-small" role="note" style={{ margin: '6px 0 0', color: 'var(--coral)' }}>Cannot do this as it stands: {a.problem} Tell the assistant what to change.</p>}
      {note && state !== 'proposed' && <p className="pf-small" role="status" style={{ margin: '6px 0 0', color: state === 'failed' ? 'var(--coral)' : 'var(--leaf)' }}>{note}</p>}
      {state === 'proposed' && !a.problem && <div className="pf-row" style={{ gap: 8, marginTop: 8 }}>
        <button type="button" className="pf-btn sm" onClick={confirm}><Icon name="check" size={14} />Confirm</button>
        <button type="button" className="pf-btn sm ghost" onClick={() => { setState('skipped'); onResult(a.id, 'skipped'); }}>Skip</button>
      </div>}
      {state === 'busy' && <p className="pf-small pf-muted" role="status" style={{ margin: '6px 0 0' }}>Doing it…</p>}
      {state === 'failed' && <button type="button" className="pf-btn sm ghost" style={{ marginTop: 6 }} onClick={confirm}>Try again</button>}
      {summary && <div style={{ marginTop: 10 }}><SummaryEditor studentId={summary.studentId} studentName={summary.studentName} draft={summary} /></div>}
    </div>
  );
}

/** The mentor's assistant: plain words in, proposed actions out, and each one done only when the mentor confirms it. */
export default function LiveAssistant() {
  const { data } = usePlatform();
  const [msgs, setMsgs] = useState(load);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef(null);
  useEffect(() => { keep(msgs); if (end.current && end.current.scrollIntoView) end.current.scrollIntoView({ block: 'end' }); }, [msgs]);
  const ready = data.students.filter(s => !s.limited);
  const first = ready[0] ? firstName(ready[0].name) : 'Riya';
  const ideas = [`Give everyone a revision task for Friday, high priority`, `Book a session with ${first} tomorrow at 5 pm about the weekly plan`, `Draft this week’s summary for ${first}`, `Write a private note: ${first} is finding the maths hard, check in next session`];
  const send = async (said = text) => {
    const t = said.trim(); if (!t || busy) return;
    const next = [...msgs, { role: 'mentor', text: t }];
    setMsgs(next); setText(''); setBusy(true); setErr('');
    try {
      const r = await mentorApi.assistant(next.map(m => ({ role: m.role, text: m.text })).slice(-12));
      setMsgs(m => [...m, { role: 'assistant', text: r.reply, actions: r.actions }]);
    } catch (e) { setErr(codeOf(e) === 'AI_DAILY_LIMIT' ? 'You have used today’s AI. It comes back tomorrow morning.' : codeOf(e) === 'AI_OFF' ? 'The assistant is switched off right now.' : errMessage(e, 'The assistant could not answer just now. Please try again.')); }
    finally { setBusy(false); }
  };
  const mark = (mi, id, state, result) => setMsgs(m => m.map((x, k) => (k === mi ? { ...x, actions: x.actions.map(a => (a.id === id ? { ...a, state, result } : a)) } : x)));
  return (
    <>
      <PageHead eyebrow="Assistant" title="Tell it what you want done" actions={msgs.length ? <button type="button" className="pf-btn sm ghost" onClick={() => setMsgs([])}>New conversation</button> : null}>
        Give tasks, book sessions, write notes and draft weekly summaries in plain words. The assistant only proposes: nothing happens until you confirm each one.
      </PageHead>
      <Card className="pf-chatcard">
        <div className="pf-chat-log" aria-live="polite">
          {msgs.length === 0 && (
            <div className="pf-chat-empty">
              <Icon name="sparkles" size={26} />
              <p style={{ margin: '8px 0 12px' }}>{ready.length ? `You mentor ${ready.length} student${ready.length === 1 ? '' : 's'}. Try one of these:` : 'You can use the assistant once a student’s parent has confirmed.'}</p>
              {ready.length > 0 && <div className="pf-chip-row" style={{ justifyContent: 'center' }}>{ideas.map(i => <button key={i} type="button" className="pf-chip" onClick={() => send(i)}>{i}</button>)}</div>}
            </div>)}
          {msgs.map((m, k) => (
            <div key={k} className={`pf-bubble ${m.role}`}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
              {m.actions && m.actions.length > 0 && <div className="pf-actions">{m.actions.map(a => <Action key={a.id} a={a} onResult={(id, st, r) => mark(k, id, st, r)} />)}</div>}
            </div>))}
          {busy && <div className="pf-bubble assistant"><span className="pf-typing" role="status" aria-label="The assistant is thinking"><i /><i /><i /></span></div>}
          <div ref={end} />
        </div>
        <form className="pf-chat-input" onSubmit={e => { e.preventDefault(); send(); }}>
          <label className="pf-sr" htmlFor="ask">Message the assistant</label>
          <textarea id="ask" className="pf-textarea" rows={2} maxLength={1000} value={text} disabled={!ready.length} placeholder="For example: give Aman and Riya a task to revise Newton’s laws by Friday" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button type="submit" className="pf-btn" disabled={busy || !text.trim() || !ready.length} aria-label="Send"><Icon name="send" size={16} /></button>
        </form>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
      </Card>
      <p className="pf-small pf-faint" style={{ marginTop: 10 }}>The assistant sees only your students’ names, classes, goals and task counts, never their written work. Each action is checked again when you confirm it.</p>
    </>
  );
}
