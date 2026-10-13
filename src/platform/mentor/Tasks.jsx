import { useState } from 'react';
import { usePlatform } from '../data/store';
import { Avatar, Card, CardHead, Icon, PageHead, Pill } from '../ui/kit';
import { fmtShort } from '../ui/format';

const blank = { studentId: '', title: '', subject: 'Python', due: '', priority: 'medium' };
export default function MentorTasks() {
  const { data, actions } = usePlatform();
  const [f, setF] = useState({ ...blank, studentId: data.students[0].id });
  const [sent, setSent] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = e => { e.preventDefault(); if (!f.title.trim() || !f.due) return; actions.assignTask(f.studentId, { title: f.title.trim(), subject: f.subject, due: f.due, priority: f.priority }); setSent(data.students.find(s => s.id === f.studentId).name); setF({ ...f, title: '' }); };
  const list = data.assigned || [];
  return (
    <>
      <PageHead eyebrow="Tasks" title="Assign work">Give a student a task. It appears on their board with your name on it.</PageHead>
      <div className="pf-grid g-main-r">
        <Card><CardHead title="New task" icon="plus" />
          <form className="pf-grid" onSubmit={submit}>
            <label>Student<select className="pf-input" value={f.studentId} onChange={set('studentId')}>{data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Task<input className="pf-input" value={f.title} onChange={set('title')} placeholder="What should they do?" /></label>
            <div className="pf-grid g3"><label>Subject<select className="pf-input" value={f.subject} onChange={set('subject')}>{['Python', 'Mathematics', 'School', 'Projects', 'Reading'].map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Due date<input className="pf-input" type="date" value={f.due} onChange={set('due')} /></label>
              <label>Priority<select className="pf-input" value={f.priority} onChange={set('priority')}><option>low</option><option>medium</option><option>high</option></select></label></div>
            <div className="pf-row"><button type="submit" className="pf-btn" disabled={!f.title.trim() || !f.due}>Assign task</button>{sent && <span className="pf-small" style={{ color: 'var(--leaf)' }} role="status">Assigned to {sent}.</span>}</div>
          </form></Card>
        <Card><CardHead title="Assigned by you" icon="tasks" />
          <ul className="pf-list">{list.map(a => { const st = data.students.find(s => s.id === a.studentId); return <li key={a.id}><Avatar name={st.name} size={30} /><span className="pf-grow"><b>{a.title}</b><br /><span className="pf-small pf-muted">{st.name} · due {fmtShort(a.due)}</span></span><Pill tone="gold">{a.priority}</Pill></li>; })}{list.length === 0 && <li className="pf-muted">Nothing assigned yet this session.</li>}</ul></Card>
      </div>
    </>
  );
}
