import { useState } from 'react';
import { usePlatform } from '../data/store';
import { Card, Drawer, Icon, PageHead, Pill, Tabs } from '../ui/kit';
import { dueLabel } from '../ui/format';
import { iso } from '../data/mock';

const COLS = [{ id: 'todo', label: 'To do' }, { id: 'doing', label: 'In progress' }, { id: 'review', label: 'With mentor' }, { id: 'done', label: 'Done' }];
const PRIO = { high: 'coral', medium: 'gold', low: 'grey' };

export default function Tasks() {
  const { data, actions } = usePlatform();
  const [view, setView] = useState('board');
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', subject: 'Python', due: iso(new Date(Date.now() + 2 * 86400000)) });
  const task = data.tasks.find(t => t.id === open);
  const res = task && task.source ? (data.library || []).find(l => l.id === task.source) : null;
  const submit = e => { e.preventDefault(); if (!draft.title.trim()) return; actions.addTask({ ...draft, title: draft.title.trim() }); setAdding(false); setDraft(d => ({ ...d, title: '' })); };

  return (
    <>
      <PageHead eyebrow="Tasks" title="What to do next" actions={<button type="button" className="pf-btn" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Add a task</button>}>Tasks come from your weekly plan, your mentor and your school. Move them along as you work.</PageHead>
      <Tabs label="Task view" value={view} onChange={setView} tabs={[{ id: 'board', label: 'Board', icon: 'grid' }, { id: 'list', label: 'List', icon: 'menu' }]} />
      {view === 'board' ? (
        <div className="pf-kanban">
          {COLS.map(c => { const items = data.tasks.filter(t => t.status === c.id); return (
            <div key={c.id} className="pf-col" aria-label={c.label}><h5><span>{c.label}</span><span className="pf-pill grey">{items.length}</span></h5>
              {items.map(t => { const d = dueLabel(t.due, t.status === 'done'); return (
                <button type="button" key={t.id} className="pf-task" onClick={() => setOpen(t.id)}><b>{t.title}</b>
                  <div className="pf-row pf-wrap" style={{ gap: 6 }}><Pill tone={d.tone}>{d.text}</Pill><Pill tone={PRIO[t.priority]}>{t.priority}</Pill></div>
                  <div className="pf-small pf-faint" style={{ marginTop: 6 }}>{t.subject} · {t.by}</div></button>
              ); })}
              {items.length === 0 && <div className="pf-small pf-faint" style={{ padding: 8 }}>Nothing here</div>}
            </div>
          ); })}
        </div>
      ) : (
        <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Task</th><th>Subject</th><th>Due</th><th>From</th><th>Status</th></tr></thead>
          <tbody>{data.tasks.map(t => { const d = dueLabel(t.due, t.status === 'done'); return (
            <tr key={t.id} className="click" onClick={() => setOpen(t.id)}><td><b>{t.title}</b></td><td>{t.subject}</td><td><Pill tone={d.tone}>{d.text}</Pill></td><td>{t.by}</td><td><Pill tone={t.status === 'done' ? 'leaf' : t.status === 'review' ? 'sky' : 'grey'}>{COLS.find(c => c.id === t.status).label}</Pill></td></tr>
          ); })}</tbody></table></div></Card>
      )}
      <Drawer open={!!task} title={task ? task.title : ''} onClose={() => setOpen(null)}>
        {task && <>
          <div className="pf-row pf-wrap" style={{ marginBottom: 14 }}><Pill tone={dueLabel(task.due).tone} icon="calendar">{dueLabel(task.due).text}</Pill>{task.est ? <Pill icon="clock">about {task.est} min</Pill> : null}<Pill tone={PRIO[task.priority]}>{task.priority} priority</Pill><Pill>{task.by}</Pill></div>
          {task.notes && <p>{task.notes}</p>}
          {res && <Card style={{ marginBottom: 14 }}><div className="pf-eyebrow">Study from</div><b>{res.title}</b><div className="pf-small pf-muted">{res.provider}</div>{res.url && <a className="pf-btn sm ghost" style={{ marginTop: 8 }} href={res.url} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} />Open</a>}</Card>}
          <label className="pf-label" htmlFor="st">Status</label>
          <select id="st" className="pf-select" value={task.status} onChange={e => actions.setTaskStatus(task.id, e.target.value)}>{COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          <p className="pf-small pf-muted" style={{ marginTop: 10 }}>Move a task to “With mentor” when you want it checked.</p>
        </>}
      </Drawer>
      <Drawer open={adding} title="Add a task" onClose={() => setAdding(false)}>
        <form onSubmit={submit}>
          <div className="pf-field"><label className="pf-label" htmlFor="nt">What do you want to do?</label><input id="nt" className="pf-input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Read about matrices" /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="ns">Subject</label><select id="ns" className="pf-select" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })}>{['Python', 'Mathematics', 'Projects', 'School', 'Reflection'].map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="pf-field"><label className="pf-label" htmlFor="nd">Due</label><input id="nd" type="date" className="pf-input" value={draft.due} onChange={e => setDraft({ ...draft, due: e.target.value })} /></div>
          <button type="submit" className="pf-btn" disabled={!draft.title.trim()}>Add task</button>
        </form>
      </Drawer>
    </>
  );
}
