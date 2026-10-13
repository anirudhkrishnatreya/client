import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlatform } from '../data/store';
import { Avatar, Card, Drawer, Icon, PageHead, Pill, Progress, Spark, Tabs } from '../ui/kit';

const TONE = { on: ['leaf', 'On track'], watch: ['gold', 'Watch'], risk: ['coral', 'Needs help'] };
export default function Students() {
  const { data, actions } = usePlatform();
  const [sp, setSp] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('overview');
  const [note, setNote] = useState('');
  const open = data.students.find(s => s.id === sp.get('open'));
  const rows = data.students.filter(s => (filter === 'all' || s.status === filter) && s.name.toLowerCase().includes(q.toLowerCase()));
  const notes = (data.notes || []).filter(n => open && n.studentId === open.id);
  const close = () => { setSp({}); setTab('overview'); };
  return (
    <>
      <PageHead eyebrow="Students" title="Everyone you mentor">Click a student to see their goal, tasks, scores and your notes.</PageHead>
      <div className="pf-row pf-wrap" style={{ marginBottom: 14 }}>
        <input className="pf-input" style={{ maxWidth: 260 }} placeholder="Search students" aria-label="Search students" value={q} onChange={e => setQ(e.target.value)} />
        <div className="pf-chip-row" role="group" aria-label="Filter by status">{[['all', 'All'], ['on', 'On track'], ['watch', 'Watch'], ['risk', 'Needs help']].map(([k, l]) => <button key={k} type="button" className="pf-chip" aria-pressed={filter === k} style={filter === k ? { background: 'var(--indigo)', color: '#fff', borderColor: 'var(--indigo)' } : undefined} onClick={() => setFilter(k)}>{l}</button>)}</div>
      </div>
      <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Student</th><th>Goal</th><th>Progress</th><th>Tasks</th><th>Score</th><th>Last active</th><th>Status</th></tr></thead><tbody>
        {rows.map(s => <tr key={s.id} className="click" onClick={() => setSp({ open: s.id })}><td><div className="pf-row"><Avatar name={s.name} size={34} /><div><b>{s.name}</b><div className="pf-small pf-muted">Class {s.klass}</div></div></div></td><td>{s.goal}</td><td style={{ minWidth: 120 }}><Progress value={s.progress} label={`${s.name} progress`} /></td><td className="pf-num">{s.tasksDone}/{s.tasksTotal}</td><td className="pf-num">{s.score}%</td><td>{s.lastActive}</td><td><Pill tone={TONE[s.status][0]}>{TONE[s.status][1]}</Pill></td></tr>)}
        {rows.length === 0 && <tr><td colSpan="7" className="pf-muted" style={{ padding: 24 }}>No students match.</td></tr>}</tbody></table></div></Card>
      <Drawer open={!!open} title={open ? open.name : ''} onClose={close}>{open && <>
        <div className="pf-row" style={{ marginBottom: 12 }}><Avatar name={open.name} size={48} /><div><b>Class {open.klass} · {open.goal}</b><div className="pf-small pf-muted">Last active {open.lastActive} · next session {open.nextSession}</div></div></div>
        <Tabs label="Student sections" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'work', label: 'Work' }, { id: 'notes', label: 'Notes', count: notes.length }]} />
        {tab === 'overview' && <><div className="pf-grid g2"><div className="pf-note"><b>{open.progress}%</b><br />goal progress</div><div className="pf-note"><b>{open.streak} days</b><br />study streak</div></div>
          <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Score trend</h4><Spark data={open.trend} label={`${open.name} score trend`} width={320} />
          <p className="pf-small pf-muted">Mood in last check-in: {open.mood}.</p></>}
        {tab === 'work' && <><div className="pf-row pf-between pf-small"><span className="pf-muted">Tasks done</span><b>{open.tasksDone} of {open.tasksTotal}</b></div><Progress value={(open.tasksDone / open.tasksTotal) * 100} label="Tasks done" />
          <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Working on</h4><p>{open.currentTask}</p>
          <h4 style={{ fontSize: 16, margin: '16px 0 6px' }}>Latest score</h4><p className="pf-num">{open.score}%</p></>}
        {tab === 'notes' && <><form onSubmit={e => { e.preventDefault(); if (note.trim()) { actions.saveNote(open.id, { text: note.trim() }); setNote(''); } }}><textarea className="pf-input" rows="3" aria-label="New note" placeholder="Add a private note" value={note} onChange={e => setNote(e.target.value)} /><button type="submit" className="pf-btn sm" style={{ marginTop: 8 }} disabled={!note.trim()}>Save note</button></form>
          <ul className="pf-list" style={{ marginTop: 12 }}>{notes.map(n => <li key={n.id}><span>{n.text}<br /><span className="pf-small pf-faint">{n.at}</span></span></li>)}{notes.length === 0 && <li className="pf-muted">No notes yet.</li>}</ul></>}
      </>}</Drawer>
    </>
  );
}
