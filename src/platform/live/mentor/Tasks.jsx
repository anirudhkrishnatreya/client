import { useState } from 'react';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, PageHead, Pill } from '../../ui/kit';
import { errMessage, gradeLabel } from '../liveApi';

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
export default function LiveMentorTasks() {
  const { data, actions } = usePlatform();
  const ready = data.students.filter(s => !s.limited);
  const [f, setF] = useState({ studentId: ready[0] ? ready[0].id : '', title: '', subject: 'General', due: tomorrow(), priority: 'medium', notes: '' });
  const [msg, setMsg] = useState({ ok: true, text: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    try { await actions.assignTask(f.studentId, { title: f.title, subject: f.subject, due: f.due, priority: f.priority, notes: f.notes }); setMsg({ ok: true, text: `Assigned to ${ready.find(s => String(s.id) === String(f.studentId)).name}.` }); setF({ ...f, title: '', notes: '' }); }
    catch (err) { setMsg({ ok: false, text: errMessage(err) }); }
  };
  const late = ready.filter(s => s.tasks.overdue > 0);
  return (
    <>
      <PageHead eyebrow="Tasks" title="Assign work">Give a student a task. It appears on their board with your name on it, and their parent can see it too.</PageHead>
      <div className="pf-grid g-main-r">
        <Card><CardHead title="New task" icon="plus" />
          {ready.length === 0 ? <p className="pf-small pf-muted">You can assign tasks once a student’s parent has confirmed.</p> :
            <form className="pf-grid" onSubmit={submit}>
              <label>Student<select className="pf-input" value={f.studentId} onChange={set('studentId')}>{ready.map(s => <option key={s.id} value={s.id}>{s.name} ({gradeLabel(s.grade)})</option>)}</select></label>
              <label>Task<input className="pf-input" value={f.title} onChange={set('title')} maxLength={200} placeholder="What should they do?" /></label>
              <label>Details (optional)<textarea className="pf-input" rows="2" value={f.notes} onChange={set('notes')} maxLength={1000} /></label>
              <div className="pf-grid g3"><label>Subject<input className="pf-input" value={f.subject} onChange={set('subject')} maxLength={60} /></label><label>Due date<input className="pf-input" type="date" value={f.due} onChange={set('due')} /></label>
                <label>Priority<select className="pf-input" value={f.priority} onChange={set('priority')}><option>low</option><option>medium</option><option>high</option></select></label></div>
              <div className="pf-row"><button type="submit" className="pf-btn" disabled={f.title.trim().length < 2 || !f.due}>Assign task</button>{msg.text && <span className="pf-small" role="status" style={{ color: msg.ok ? 'var(--leaf)' : 'var(--coral)' }}>{msg.text}</span>}</div>
            </form>}</Card>
        <Card><CardHead title="Running late" icon="alert" />
          {late.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No student has overdue tasks.</p> :
            <ul className="pf-list">{late.map(s => <li key={s.id}><Avatar name={s.name} size={30} /><span className="pf-grow"><b>{s.name}</b></span><Pill tone="coral">{s.tasks.overdue} overdue</Pill></li>)}</ul>}</Card>
      </div>
    </>
  );
}
