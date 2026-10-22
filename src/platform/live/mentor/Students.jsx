import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, Drawer, Empty, PageHead, Pill, Progress, Tabs } from '../../ui/kit';
import { dueLabel, fmtDate, fmtShort } from '../../ui/format';
import { errMessage, gradeLabel, mentorApi } from '../liveApi';
import AuthImage from '../loop/AuthImage';

const A = { submitted: ['leaf', 'Done'], in_progress: ['gold', 'Started'], not_started: ['grey', 'Not started'] };
const ST = { todo: 'To do', doing: 'In progress', review: 'With mentor', done: 'Done' };

const PACE = { 'speed-up': ['leaf', 'Faster'], 'slow-down': ['gold', 'Slower'], continue: ['sky', 'Steady'], start: ['grey', 'First week'] };

/** One "not fair" a student flagged: what they were asked, what they wrote, what the AI said, and the mentor's reply. */
function Flag({ studentId, f, onDone }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async e => { e.preventDefault(); setBusy(true); setErr(''); try { await mentorApi.replyLoop(studentId, f.id, text.trim()); setText(''); await onDone(); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const j = f.context && f.context.judgement;
  return (
    <li style={{ display: 'block' }}>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}><Pill tone={f.status === 'open' ? 'coral' : 'leaf'}>{f.status === 'open' ? 'Waiting for you' : 'Replied'}</Pill><b>{f.target === 'judgement' ? `Week ${f.weekNumber} feedback` : 'Practice questions'}</b></div>
      {f.note && <p className="pf-small" style={{ margin: '6px 0' }}>“{f.note}”</p>}
      {f.context && f.target === 'judgement' && (
        <details><summary className="pf-small">See the task, their work and the AI's judgement</summary>
          <p className="pf-small"><b>Task:</b> {f.context.task}</p>
          <p className="pf-small" style={{ whiteSpace: 'pre-wrap' }}><b>Their work:</b> {f.context.work}</p>
          {f.context.photos && f.context.photos.length > 0 && <div className="pf-row pf-wrap" style={{ gap: 8 }}>{f.context.photos.map((pid, k) => <AuthImage key={pid} path={`/v2/platform/mentor/students/${studentId}/photos/${pid}`} alt={`Photo ${k + 1} of their work`} />)}</div>}
          {j && j.criteria && <ul className="pf-small">{j.criteria.map(c => <li key={c.name}>{c.name}: {c.band}. {c.comment}</li>)}</ul>}
          {j && j.feedback && <p className="pf-small"><b>AI feedback:</b> {j.feedback}</p>}
        </details>
      )}
      {f.context && f.target === 'practice' && (
        <details><summary className="pf-small">See the questions</summary><ol className="pf-small">{f.context.items.map((x, k) => <li key={k}>{x.prompt}{x.answer ? ` (answer: ${x.answer})` : ''}</li>)}</ol></details>
      )}
      {f.reply ? <p className="pf-small" style={{ margin: '6px 0 0' }}><b>Your reply:</b> {f.reply.text}</p> : (
        <form onSubmit={send} style={{ marginTop: 8 }}>
          <textarea className="pf-input" rows="2" aria-label="Reply to the student" maxLength={1000} placeholder="Your reply, shown to the student" value={text} onChange={e => setText(e.target.value)} />
          <button type="submit" className="pf-btn sm" style={{ marginTop: 6 }} disabled={busy || text.trim().length < 2}>{busy ? 'Sending…' : 'Send reply'}</button>
          {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
        </form>
      )}
    </li>
  );
}

/** The student's weekly plan as their mentor sees it: where they are, how the last weeks went, and what they flagged. */
function LoopTab({ studentId, loop, reload }) {
  if (!loop) return <Empty icon="target" title="No weekly plan yet">They have not set a goal in the career chat yet.</Empty>;
  return (
    <>
      <p style={{ margin: '0 0 6px' }}><b>{loop.goal.title}</b> · Level {loop.goal.level.number} of {loop.goal.level.total}: {loop.goal.level.title}</p>
      <p className="pf-small pf-muted" style={{ margin: '0 0 6px' }}>Heading to: {loop.goal.endPoint}</p>
      {loop.goal.level.levelUp && <p className="pf-small" style={{ margin: '0 0 6px' }}><b>To move up:</b> {loop.goal.level.levelUp}</p>}
      <p className="pf-small" style={{ margin: '0 0 12px' }}>{loop.week ? `Week ${loop.week.number}` : 'No week yet'} · last active {fmtShort(String(loop.lastActive).slice(0, 10))}</p>
      {loop.recentWeeks.length > 0 && <><h4 style={{ fontSize: 15, margin: '12px 0 6px' }}>Recent weeks</h4>
        <ul className="pf-list">{loop.recentWeeks.map(w => <li key={w.weekNumber}><span className="pf-grow">Week {w.weekNumber}</span><Progress value={w.completion * 100} label={`Week ${w.weekNumber} finished`} /><span className="pf-small pf-muted" style={{ minWidth: 44, textAlign: 'right' }}>{Math.round(w.completion * 100)}%</span></li>)}</ul></>}
      {loop.adaptations.length > 0 && <><h4 style={{ fontSize: 15, margin: '12px 0 6px' }}>How the plan adapted</h4>
        <ul className="pf-list">{[...loop.adaptations].reverse().map(a => <li key={a.week}><span className="pf-grow"><b>After week {a.week}</b><br /><span className="pf-small">{a.summary}</span></span>{PACE[a.pace] && <Pill tone={PACE[a.pace][0]}>{PACE[a.pace][1]}</Pill>}</li>)}</ul></>}
      <h4 style={{ fontSize: 15, margin: '12px 0 6px' }}>Flagged as not fair</h4>
      {loop.flagged.length === 0 ? <p className="pf-small pf-muted">Nothing flagged.</p> : <ul className="pf-list">{loop.flagged.map(f => <Flag key={f.id} studentId={studentId} f={f} onDone={reload} />)}</ul>}
    </>
  );
}

function Detail({ id }) {
  const { actions } = usePlatform();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('overview');
  const [note, setNote] = useState(''); const [share, setShare] = useState(false); const [msg, setMsg] = useState('');
  const load = () => actions.loadStudent(id).then(setD).catch(e => setMsg(errMessage(e)));
  useEffect(() => { setD(null); setTab('overview'); load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!d) return <p role="status" className="pf-muted">{msg || 'Loading…'}</p>;
  const s = d.student;
  const setStatus = async (t, status) => { try { await actions.setTaskStatus(t.id, status); await load(); } catch (e) { setMsg(errMessage(e)); } };
  const saveNote = async e => { e.preventDefault(); try { await actions.addNote(id, { text: note, sharedWithParent: share }); setNote(''); setShare(false); await load(); } catch (err) { setMsg(errMessage(err)); } };
  return (
    <>
      <div className="pf-row" style={{ marginBottom: 12 }}><Avatar name={s.name} size={48} /><div><b>{gradeLabel(s.grade)}{s.goal ? ` · ${s.goal}` : ''}</b><div className="pf-small pf-muted">{s.lastLoginAt ? `Last signed in ${fmtShort(String(s.lastLoginAt).slice(0, 10))}` : 'Has not signed in yet'}</div></div></div>
      {msg && <div className="pf-note" role="alert">{msg}</div>}
      <Tabs label="Student sections" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'loop', label: 'Weekly plan', count: d.loop ? d.loop.flagged.filter(f => f.status === 'open').length || undefined : undefined }, { id: 'work', label: 'Work', count: d.tasks.length }, { id: 'sessions', label: 'Sessions' }, { id: 'notes', label: 'Notes', count: d.notes.length }]} />
      {tab === 'overview' && <>
        <div className="pf-grid g2"><div className="pf-note"><b>{s.tasks.done} of {s.tasks.total}</b><br />tasks done</div><div className="pf-note"><b>{s.tasks.overdue}</b><br />overdue</div></div>
        <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Career assessment</h4>
        <div className="pf-row pf-wrap"><Pill tone={A[s.assessment.state][0]}>{A[s.assessment.state][1]}</Pill>{s.assessment.hollandCode && <Pill tone="sky">Interest code {s.assessment.hollandCode}</Pill>}</div>
        {d.reports.map(r => <p key={r.assessmentId} style={{ margin: '10px 0 0' }}><Link className="pf-btn sm" to={`/platform/report/mentor/${s.id}/${r.assessmentId}`}>Open career report</Link> <span className="pf-small pf-muted">{fmtDate(String(r.completedAt).slice(0, 10))}</span></p>)}
        <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Parent</h4>
        <Pill tone={s.parent === 'linked' ? 'leaf' : 'gold'}>{s.parent === 'linked' ? 'Account set up' : s.parent === 'invited' ? 'Invited, not set up yet' : 'None'}</Pill></>}
      {tab === 'loop' && <LoopTab studentId={id} loop={d.loop} reload={load} />}
      {tab === 'work' && (d.tasks.length === 0 ? <Empty icon="tasks" title="No tasks yet">Give them one from Assign tasks.</Empty> :
        <ul className="pf-list">{d.tasks.map(t => { const l = dueLabel(t.due, t.status === 'done'); return <li key={t.id}><span className="pf-grow"><b>{t.title}</b><br /><span className="pf-small pf-muted">{t.subject} · by {t.by}</span></span><Pill tone={l.tone}>{l.text}</Pill>
          <select className="pf-select" style={{ width: 130 }} aria-label={`Status of ${t.title}`} value={t.status} onChange={e => setStatus(t, e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></li>; })}</ul>)}
      {tab === 'sessions' && <>{d.sessions.upcoming.map(x => <p key={x.id} className="pf-small"><Pill tone="gold">Upcoming</Pill> {fmtDate(x.date)}{x.time ? `, ${x.time}` : ''} {x.topic && `· ${x.topic}`}</p>)}
        {d.sessions.history.length === 0 && d.sessions.upcoming.length === 0 ? <p className="pf-muted">No sessions yet. Book one from the Sessions page.</p> :
          <div className="pf-timeline">{d.sessions.history.map(h => <div key={h.id} className="pf-tl"><b>{fmtDate(h.date)}</b>{h.topic && <span className="pf-small pf-muted"> · {h.topic}</span>}<p className="pf-small" style={{ margin: '4px 0 0' }}>{h.summary}</p></div>)}</div>}</>}
      {tab === 'notes' && <><form onSubmit={saveNote}><textarea className="pf-input" rows="3" aria-label="New note" placeholder="Add a note" value={note} onChange={e => setNote(e.target.value)} maxLength={2000} />
        <label className="pf-small" style={{ display: 'flex', gap: 8, margin: '8px 0' }}><input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} />Share this note with the parent</label>
        <button type="submit" className="pf-btn sm" disabled={!note.trim()}>Save note</button></form>
        <ul className="pf-list" style={{ marginTop: 12 }}>{d.notes.map(n => <li key={n.id}><span>{n.text}<br /><span className="pf-small pf-faint">{fmtShort(n.at)} · {n.sharedWithParent ? 'shared with parent' : 'only you'}</span></span></li>)}{d.notes.length === 0 && <li className="pf-muted">No notes yet.</li>}</ul></>}
    </>
  );
}

export default function LiveStudents() {
  const { data } = usePlatform();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const rows = data.students.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  const open = data.students.find(s => String(s.id) === sp.get('open') && !s.limited);
  return (
    <>
      <PageHead eyebrow="Students" title="Everyone you mentor">Open a student to see their tasks, sessions, report and your notes.</PageHead>
      <div style={{ marginBottom: 14 }}><input className="pf-input" style={{ maxWidth: 280 }} placeholder="Search students" aria-label="Search students" value={q} onChange={e => setQ(e.target.value)} /></div>
      <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Student</th><th>Class</th><th>Tasks</th><th>Assessment</th><th>Parent</th><th>Status</th></tr></thead><tbody>
        {rows.map(s => <tr key={s.id} className={s.limited ? '' : 'click'} onClick={() => !s.limited && setSp({ open: s.id })}>
          <td><div className="pf-row"><Avatar name={s.name} size={34} /><b>{s.name}</b></div></td><td>{gradeLabel(s.grade)}</td>
          {s.limited ? <td colSpan="3" className="pf-muted pf-small">Visible once a parent confirms</td> : <><td style={{ minWidth: 130 }}><Progress value={s.tasks.total ? (s.tasks.done / s.tasks.total) * 100 : 0} label={`${s.name} tasks`} /><span className="pf-small pf-muted">{s.tasks.done}/{s.tasks.total}</span></td><td><Pill tone={A[s.assessment.state][0]}>{A[s.assessment.state][1]}</Pill></td><td><Pill tone={s.parent === 'linked' ? 'leaf' : 'gold'}>{s.parent === 'linked' ? 'Set up' : 'Invited'}</Pill></td></>}
          <td>{s.limited ? <Pill tone="gold">Waiting</Pill> : s.tasks.overdue > 0 ? <Pill tone="coral">{s.tasks.overdue} overdue</Pill> : <Pill tone="leaf">On track</Pill>}</td></tr>)}
        {rows.length === 0 && <tr><td colSpan="6" className="pf-muted" style={{ padding: 24 }}>{data.students.length ? 'No students match.' : 'No students are assigned to you yet.'}</td></tr>}</tbody></table></div></Card>
      <Drawer open={!!open} title={open ? open.name : ''} onClose={() => setSp({})}>{open && <Detail id={open.id} />}</Drawer>
    </>
  );
}
