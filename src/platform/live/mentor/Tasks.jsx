import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Card, CardHead, Drawer, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { dueLabel } from '../../ui/format';
import { errMessage, gradeLabel, mentorApi } from '../liveApi';
import { PriorityPicker } from '../student/Tasks';

const ST = { todo: ['grey', 'To do'], doing: ['sky', 'In progress'], review: ['gold', 'Waiting for you'], done: ['leaf', 'Done'] };
const PRIO = { high: ['coral', 'High'], medium: ['gold', 'Medium'], low: ['grey', 'Low'] };
const RANK = { high: 0, medium: 1, low: 2 };
const FROM = { mentor: 'You', student: 'Student', parent: 'Parent' };
const inDays = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** One task handed in: what was asked, what the student said, and feedback that approves it or sends it back. */
function Review({ t, onDone }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const send = async status => { setBusy(status); setErr(''); try { await mentorApi.updateTask(t.id, { status, feedback: text.trim() }); setText(''); await onDone(); } catch (e) { setErr(errMessage(e)); } finally { setBusy(''); } };
  return (
    <li className="pf-review">
      <div className="pf-row pf-wrap" style={{ gap: 8 }}><Avatar name={t.studentName} size={30} /><b className="pf-grow">{t.title}</b><Pill tone={PRIO[t.priority][0]}>{PRIO[t.priority][1]}</Pill><span className="pf-small pf-muted">{t.studentName}</span></div>
      {t.notes && <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>{t.notes}</p>}
      {t.studentNote ? <p className="pf-small" style={{ margin: '6px 0 0' }}><b>They wrote:</b> “{t.studentNote}”</p> : <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>They handed it in without a note.</p>}
      <textarea className="pf-textarea" rows={2} maxLength={1000} aria-label={`Feedback on ${t.title}`} placeholder="Your feedback, shown to the student" value={text} onChange={e => setText(e.target.value)} style={{ marginTop: 8 }} />
      <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 6 }}>
        <button type="button" className="pf-btn sm" disabled={!!busy} onClick={() => send('done')}><Icon name="check" size={14} />{busy === 'done' ? 'Saving…' : 'Approve, mark done'}</button>
        <button type="button" className="pf-btn sm ghost" disabled={!!busy || text.trim().length < 2} onClick={() => send('doing')}>{busy === 'doing' ? 'Saving…' : 'Send back to improve'}</button>
      </div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </li>
  );
}

/** A task for one or many students at once. */
function NewTask({ open, onClose, students, onMade }) {
  const [f, setF] = useState({ ids: [], title: '', notes: '', subject: 'General', due: inDays(3), priority: 'medium' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = id => setF(x => ({ ...x, ids: x.ids.includes(id) ? x.ids.filter(i => i !== id) : [...x.ids, id] }));
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await mentorApi.bulkAssign({ studentIds: f.ids, title: f.title.trim(), notes: f.notes.trim(), subject: f.subject, due: f.due, priority: f.priority }); setF({ ...f, title: '', notes: '' }); await onMade(r.count); onClose(); }
    catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  return (
    <Drawer open={open} title="New task" onClose={onClose}>
      <form onSubmit={submit}>
        <fieldset className="pf-field" style={{ border: 0, padding: 0 }}>
          <legend className="pf-label">For</legend>
          <div className="pf-row pf-wrap" style={{ gap: 6, marginBottom: 6 }}>
            <button type="button" className="pf-chip" aria-pressed={f.ids.length === students.length && students.length > 0} onClick={() => setF({ ...f, ids: f.ids.length === students.length ? [] : students.map(s => String(s.id)) })}>Everyone ({students.length})</button>
            {students.map(s => <button key={s.id} type="button" className="pf-chip" aria-pressed={f.ids.includes(String(s.id))} onClick={() => toggle(String(s.id))}>{s.name}</button>)}
          </div>
        </fieldset>
        <div className="pf-field"><label className="pf-label" htmlFor="mt-title">Task</label><input id="mt-title" className="pf-input" maxLength={200} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="What should they do?" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="mt-notes">Details (optional)</label><textarea id="mt-notes" className="pf-textarea" rows={3} maxLength={1000} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
        <div className="pf-field"><span className="pf-label">Priority</span><PriorityPicker id="mt-prio" value={f.priority} onChange={p => setF({ ...f, priority: p })} /></div>
        <div className="pf-grid g2">
          <div className="pf-field"><label className="pf-label" htmlFor="mt-subject">Subject</label><input id="mt-subject" className="pf-input" maxLength={60} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="mt-due">Due</label><input id="mt-due" type="date" className="pf-input" value={f.due} onChange={e => setF({ ...f, due: e.target.value })} /></div>
        </div>
        <button type="submit" className="pf-btn" disabled={busy || !f.ids.length || f.title.trim().length < 2 || !f.due}>{busy ? 'Assigning…' : f.ids.length > 1 ? `Assign to ${f.ids.length} students` : 'Assign task'}</button>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      </form>
    </Drawer>
  );
}

/** Every task of every student, the ones waiting for review first, with filters and one task for many students at once. */
export default function LiveMentorTasks() {
  const [all, setAll] = useState(null);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ student: '', status: 'open', priority: '', source: '' });
  const load = useCallback(() => mentorApi.allTasks().then(d => { setAll(d); setErr(''); }).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { load(); }, [load]);
  const rows = useMemo(() => (all ? all.tasks : []).filter(t => (!f.student || String(t.studentId) === f.student) && (f.status === 'all' || (f.status === 'open' ? t.status !== 'done' : t.status === f.status)) && (!f.priority || t.priority === f.priority) && (!f.source || t.source === f.source))
    .sort((a, b) => RANK[a.priority] - RANK[b.priority] || (a.due < b.due ? -1 : 1)), [all, f]);
  if (err) return <><PageHead eyebrow="Tasks" title="Tasks" /><p role="alert">{err}</p></>;
  if (!all) return <><PageHead eyebrow="Tasks" title="Tasks" /><p role="status">Loading…</p></>;
  const review = all.tasks.filter(t => t.status === 'review');
  const late = all.tasks.filter(t => t.status !== 'done' && dueLabel(t.due).tone === 'coral');
  const setStatus = async (t, status) => { try { await mentorApi.updateTask(t.id, { status }); await load(); } catch (e) { setMsg(errMessage(e)); } };
  const setPrio = async (t, priority) => { try { await mentorApi.updateTask(t.id, { priority }); await load(); } catch (e) { setMsg(errMessage(e)); } };
  return (
    <>
      <PageHead eyebrow="Tasks" title="Every student’s tasks" actions={<div className="pf-row" style={{ gap: 8 }}><Link className="pf-btn ghost" to="../assistant"><Icon name="sparkles" size={16} />Ask the assistant</Link><button type="button" className="pf-btn" onClick={() => setAdding(true)} disabled={!all.students.length}><Icon name="plus" size={16} />New task</button></div>}>
        Set work for one student or many at once, check what is handed in, and see who is running late. Students see your tasks on their Tasks page; parents see them too.
      </PageHead>
      {msg && <div className="pf-note" role="status">{msg}</div>}
      {all.students.length === 0 ? <Card><Empty icon="users" title="No students to set tasks for yet">You can set tasks once a student’s parent has confirmed.</Empty></Card> : <>
        <div className="pf-grid g-main" style={{ marginBottom: 18 }}>
          <Card><CardHead title={`Waiting for your review (${review.length})`} icon="clipboard" />
            {review.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing handed in right now. When a student moves a task to “With mentor”, it appears here.</p>
              : <ul className="pf-list">{review.map(t => <Review key={t.id} t={t} onDone={load} />)}</ul>}</Card>
          <Card><CardHead title="Running late" icon="alert" />
            {late.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No overdue tasks.</p> :
              <ul className="pf-list">{[...new Set(late.map(t => String(t.studentId)))].map(id => { const mine = late.filter(t => String(t.studentId) === id); return <li key={id}><Avatar name={mine[0].studentName} size={30} /><span className="pf-grow"><b>{mine[0].studentName}</b><br /><span className="pf-small pf-muted">{mine.map(t => t.title).slice(0, 2).join('; ')}</span></span><Pill tone="coral">{mine.length} overdue</Pill></li>; })}</ul>}</Card>
        </div>
        <Card flush>
          <div className="pf-row pf-wrap" style={{ gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--line2)' }}>
            <select className="pf-select" style={{ width: 'auto' }} aria-label="Student" value={f.student} onChange={e => setF({ ...f, student: e.target.value })}><option value="">All students</option>{all.students.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({gradeLabel(s.grade)})</option>)}</select>
            <select className="pf-select" style={{ width: 'auto' }} aria-label="Status" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="open">Not done</option><option value="all">Any status</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[1]}</option>)}</select>
            <select className="pf-select" style={{ width: 'auto' }} aria-label="Priority" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option value="">Any priority</option>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v[1]}</option>)}</select>
            <select className="pf-select" style={{ width: 'auto' }} aria-label="Set by" value={f.source} onChange={e => setF({ ...f, source: e.target.value })}><option value="">Set by anyone</option><option value="mentor">Set by you</option><option value="student">Added by the student</option><option value="parent">Set by a parent</option></select>
            <span className="pf-grow" /><span className="pf-small pf-muted">{rows.length} task{rows.length === 1 ? '' : 's'}</span>
          </div>
          <div className="pf-scroll"><table className="pf-table"><thead><tr><th>Task</th><th>Student</th><th>Priority</th><th>Due</th><th>Set by</th><th>Status</th></tr></thead><tbody>
            {rows.map(t => { const d = dueLabel(t.due, t.status === 'done'); return (
              <tr key={t.id}>
                <td><b>{t.title}</b><div className="pf-small pf-muted">{t.subject}{t.feedback ? ' · feedback given' : ''}</div></td>
                <td><Link to={`../students?open=${t.studentId}`}>{t.studentName}</Link></td>
                <td><select className="pf-select" style={{ width: 110 }} aria-label={`Priority of ${t.title}`} value={t.priority} onChange={e => setPrio(t, e.target.value)}>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v[1]}</option>)}</select></td>
                <td><Pill tone={d.tone}>{d.text}</Pill></td><td>{FROM[t.source]}</td>
                <td><select className="pf-select" style={{ width: 170 }} aria-label={`Status of ${t.title}`} value={t.status} onChange={e => setStatus(t, e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[1]}</option>)}</select></td>
              </tr>); })}
            {rows.length === 0 && <tr><td colSpan="6" className="pf-muted" style={{ padding: 24 }}>No tasks match.</td></tr>}
          </tbody></table></div>
        </Card>
      </>}
      <NewTask open={adding} onClose={() => setAdding(false)} students={all.students} onMade={async n => { await load(); setMsg(`Assigned to ${n} student${n === 1 ? '' : 's'}.`); }} />
    </>
  );
}
