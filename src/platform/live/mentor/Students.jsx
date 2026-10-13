import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, Drawer, Empty, PageHead, Pill, Progress, Tabs } from '../../ui/kit';
import { dueLabel, fmtDate, fmtShort } from '../../ui/format';
import { errMessage, gradeLabel } from '../liveApi';

const A = { submitted: ['leaf', 'Done'], in_progress: ['gold', 'Started'], not_started: ['grey', 'Not started'] };
const ST = { todo: 'To do', doing: 'In progress', review: 'With mentor', done: 'Done' };

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
      <Tabs label="Student sections" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'work', label: 'Work', count: d.tasks.length }, { id: 'sessions', label: 'Sessions' }, { id: 'notes', label: 'Notes', count: d.notes.length }]} />
      {tab === 'overview' && <>
        <div className="pf-grid g2"><div className="pf-note"><b>{s.tasks.done} of {s.tasks.total}</b><br />tasks done</div><div className="pf-note"><b>{s.tasks.overdue}</b><br />overdue</div></div>
        <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Career assessment</h4>
        <div className="pf-row pf-wrap"><Pill tone={A[s.assessment.state][0]}>{A[s.assessment.state][1]}</Pill>{s.assessment.hollandCode && <Pill tone="sky">Interest code {s.assessment.hollandCode}</Pill>}</div>
        {d.reports.map(r => <p key={r.assessmentId} style={{ margin: '10px 0 0' }}><Link className="pf-btn sm" to={`/platform/report/mentor/${s.id}/${r.assessmentId}`}>Open career report</Link> <span className="pf-small pf-muted">{fmtDate(String(r.completedAt).slice(0, 10))}</span></p>)}
        <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Parent</h4>
        <Pill tone={s.parent === 'linked' ? 'leaf' : 'gold'}>{s.parent === 'linked' ? 'Account set up' : s.parent === 'invited' ? 'Invited, not set up yet' : 'None'}</Pill></>}
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
