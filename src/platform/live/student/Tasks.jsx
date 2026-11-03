import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, CardHead, Drawer, Empty, Icon, PageHead, Pill, Tabs } from '../../ui/kit';
import { dueLabel, fmtDate } from '../../ui/format';
import { errMessage } from '../liveApi';
import { useLoop, TYPE_LABEL, TYPE_TONE, fmtMinutes, weekdayOf, fmtShort } from '../loop/loopApi';
import { LOOP_ENABLED } from '../loop/config';

const COLS = [{ id: 'todo', label: 'To do' }, { id: 'doing', label: 'In progress' }, { id: 'review', label: 'With mentor' }, { id: 'done', label: 'Done' }];
const PRIO = { high: ['coral', 'High'], medium: ['gold', 'Medium'], low: ['grey', 'Low'] };
const RANK = { high: 0, medium: 1, low: 2 };
const SOURCE = { mentor: ['sky', 'From your mentor'], parent: ['leaf', 'From your parent'], student: ['grey', 'Added by you'] };
const FILTERS = [['all', 'All'], ['mentor', 'From mentor'], ['parent', 'From parent'], ['student', 'Mine']];
const SUBJECTS = ['General', 'Maths', 'Science', 'Coding', 'English', 'Project', 'School', 'Revision'];
const iso = d => d.toISOString().slice(0, 10);
const inDays = n => iso(new Date(Date.now() + n * 86400000));

/** Priority as three buttons: quicker than a dropdown, and you can see all three at once. */
export function PriorityPicker({ value, onChange, id = 'prio', disabled }) {
  return (
    <div className="pf-row" style={{ gap: 6 }} role="radiogroup" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="pf-sr">Priority</span>
      {['high', 'medium', 'low'].map(p => (
        <button key={p} type="button" role="radio" aria-checked={value === p} disabled={disabled} className={`pf-prio ${p}${value === p ? ' on' : ''}`} onClick={() => onChange(p)}>{PRIO[p][1]}</button>
      ))}
    </div>
  );
}

/** The weekly plan's steps, as tasks: today's first, then the rest of the week by day, and the week's assessment. */
function PlanTasks() {
  const { loop, loading, locked } = useLoop();
  if (!LOOP_ENABLED || loading) return loading ? <Card><p className="pf-small pf-muted" role="status" style={{ margin: 0 }}>Loading your weekly plan…</p></Card> : null;
  if (locked) return <Card><CardHead title="From your weekly plan" icon="calendar" /><p className="pf-small pf-muted" style={{ margin: 0 }}>Your weekly plan is part of an iMenteo Plan. <Link to="../billing">See My plan</Link>.</p></Card>;
  if (!loop || loop.mode !== 'plan') return <Card><CardHead title="From your weekly plan" icon="calendar" /><p className="pf-small pf-muted" style={{ margin: 0 }}>Set a goal in <Link to="../goal">My goal</Link> and your daily steps will show up here as tasks.</p></Card>;
  const w = loop.week;
  const today = w.items.filter(i => i.date === loop.today);
  const ahead = w.items.filter(i => i.date > loop.today && i.status === 'todo');
  const behind = w.items.filter(i => i.date < loop.today && i.status === 'todo');
  const byDay = list => [...new Set(list.map(i => i.date))].sort().map(d => ({ date: d, items: list.filter(i => i.date === d) }));
  const logged = Boolean((w.logs || {})[loop.today]);
  const a = loop.assessment;
  const Step = ({ i }) => (
    <li className={i.status !== 'todo' ? 'done' : ''}>
      <span className={`pf-tickbox${i.status === 'done' ? ' on' : ''}`} aria-hidden="true">{i.status === 'done' && <Icon name="check" size={12} />}</span>
      <span className="pf-grow"><Link to={`../plan/day/${i.date}`}><b>{i.title}</b></Link><br /><span className="pf-small pf-muted">{TYPE_LABEL[i.type]} · {fmtMinutes(i.minutes)}{i.video ? ' · video lesson' : ''}</span></span>
      {i.status === 'done' ? <Pill tone="leaf">Done</Pill> : i.status === 'skipped' ? <Pill tone="grey">Skipped</Pill> : <Pill tone={TYPE_TONE[i.type] || 'sky'}>{TYPE_LABEL[i.type]}</Pill>}
    </li>
  );
  return (
    <Card>
      <CardHead title={`From your weekly plan · week ${w.weekNumber}`} icon="calendar" action="Open the week" to="../plan" />
      <div className="pf-plantasks">
        <div>
          <div className="pf-eyebrow">Today, {weekdayOf(loop.today)}</div>
          {today.length === 0 ? <p className="pf-small pf-muted">Nothing planned today. A free day{ahead.length ? `: next up is ${weekdayOf(ahead[0].date)}` : ''}.</p> : <ul className="pf-checklist">{today.map(i => <Step key={i.id} i={i} />)}</ul>}
          {today.length > 0 && <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 8 }}>
            <Link className="pf-btn sm" to={`../plan/day/${loop.today}`}>Open today</Link>
            {logged ? <Pill tone="sky" icon="edit">Today’s learning logged</Pill> : <Link className="pf-btn sm ghost" to={`../plan/day/${loop.today}`}><Icon name="edit" size={14} />Log what you learned</Link>}
          </div>}
          {behind.length > 0 && <p className="pf-small" style={{ margin: '12px 0 0' }}><Pill tone="gold">Catch up</Pill> {behind.length} step{behind.length > 1 ? 's' : ''} from earlier this week: {byDay(behind).map((d, k) => <span key={d.date}>{k > 0 && ', '}<Link to={`../plan/day/${d.date}`}>{weekdayOf(d.date)}</Link></span>)}</p>}
        </div>
        <div>
          <div className="pf-eyebrow">Later this week</div>
          {ahead.length === 0 ? <p className="pf-small pf-muted">Nothing else planned this week.</p> : byDay(ahead).map(d => (
            <div key={d.date} style={{ marginBottom: 8 }}>
              <Link className="pf-small" to={`../plan/day/${d.date}`}><b>{weekdayOf(d.date)}, {fmtShort(d.date)}</b></Link>
              <ul className="pf-checklist compact">{d.items.map(i => <Step key={i.id} i={i} />)}</ul>
            </div>))}
          <div className={`pf-assessrow ${a.stage}`}>
            <Icon name={a.stage === 'done' ? 'check' : a.stage === 'locked' ? 'lock' : 'clipboard'} size={16} />
            <span className="pf-grow pf-small"><b>Week assessment</b>: {a.stage === 'done' ? 'done' : a.stage === 'locked' ? `opens after ${a.need} finished steps (${a.done} so far)` : 'ready to take, about 15 minutes'}</span>
            {a.stage !== 'locked' && <Link className="pf-btn sm ghost" to="../plan/assessment">{a.stage === 'done' ? 'Feedback' : 'Take it'}</Link>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TaskCard({ t, onOpen }) {
  const d = dueLabel(t.due, t.status === 'done');
  return (
    <button type="button" className={`pf-task prio-${t.priority}`} onClick={() => onOpen(t.id)}>
      <b>{t.title}</b>
      <div className="pf-row pf-wrap" style={{ gap: 6 }}><Pill tone={d.tone}>{d.text}</Pill><Pill tone={PRIO[t.priority][0]}>{PRIO[t.priority][1]}</Pill></div>
      <div className="pf-small pf-faint" style={{ marginTop: 6 }}>{t.subject} · {SOURCE[t.source] ? SOURCE[t.source][1] : t.by}</div>
      {t.feedback && <div className="pf-small" style={{ marginTop: 6, color: 'var(--leaf)' }}><Icon name="message" size={12} /> Mentor feedback</div>}
    </button>
  );
}

function TaskDrawer({ task, onClose }) {
  const { actions } = usePlatform();
  const [handing, setHanding] = useState(false);
  const [handIn, setHandIn] = useState('');
  const [msg, setMsg] = useState('');
  const [edit, setEdit] = useState(null);
  if (!task) return <Drawer open={false} title="" onClose={onClose} />;
  const d = dueLabel(task.due, task.status === 'done');
  const save = async body => { setMsg(''); try { await actions.updateTask(task.id, body); return true; } catch (e) { setMsg(errMessage(e)); return false; } };
  return (
    <Drawer open title={task.title} onClose={() => { setEdit(null); setHanding(false); setHandIn(''); setMsg(''); onClose(); }}>
      <div className="pf-row pf-wrap" style={{ marginBottom: 14, gap: 6 }}><Pill tone={d.tone} icon="calendar">{d.text}</Pill><Pill tone={PRIO[task.priority][0]}>{PRIO[task.priority][1]} priority</Pill>{SOURCE[task.source] && <Pill tone={SOURCE[task.source][0]}>{SOURCE[task.source][1]}</Pill>}<Pill>{task.subject}</Pill></div>
      {task.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{task.notes}</p>}
      {task.feedback && <Card ai style={{ marginBottom: 14 }}><span className="tag"><Icon name="message" size={14} />Your mentor says</span><p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{task.feedback.text}</p></Card>}
      {task.studentNote && <p className="pf-small pf-muted">You wrote when handing in: “{task.studentNote}”</p>}

      <div className="pf-field"><span className="pf-label">Where it is</span>
        <div className="pf-row pf-wrap" style={{ gap: 6 }} role="group" aria-label="Status">{COLS.map(c => <button key={c.id} type="button" className="pf-chip" aria-pressed={task.status === c.id} onClick={() => (c.id === 'review' ? setHanding(true) : save({ status: c.id }))}>{c.label}</button>)}</div></div>
      {handing && (
        <form onSubmit={async e => { e.preventDefault(); if (await save({ status: 'review', studentNote: handIn.trim() })) { setHanding(false); setHandIn(''); } }} style={{ marginTop: 10 }}>
          <label className="pf-label" htmlFor="handin">A word for your mentor (optional)</label>
          <textarea id="handin" className="pf-textarea" rows={3} maxLength={1000} value={handIn} onChange={e => setHandIn(e.target.value)} placeholder="What you did, or what you want checked" />
          <div className="pf-row" style={{ gap: 8, marginTop: 8 }}><button type="submit" className="pf-btn sm">Send to my mentor</button><button type="button" className="pf-btn sm ghost" onClick={() => setHanding(false)}>Cancel</button></div>
        </form>)}

      <div className="pf-field" style={{ marginTop: 16 }}><span className="pf-label">Priority</span>
        <PriorityPicker id="drawer-prio" value={task.priority} disabled={!task.mine} onChange={p => save({ priority: p })} />
        {!task.mine && <span className="pf-small pf-muted">Set by your {task.source === 'parent' ? 'parent' : 'mentor'}.</span>}</div>

      {task.mine && (edit ? (
        <form onSubmit={async e => { e.preventDefault(); if (await save(edit)) setEdit(null); }} style={{ marginTop: 16 }}>
          <div className="pf-field"><label className="pf-label" htmlFor="et">Task</label><input id="et" className="pf-input" value={edit.title} maxLength={200} onChange={e => setEdit({ ...edit, title: e.target.value })} /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="en">Details</label><textarea id="en" className="pf-textarea" rows={3} maxLength={1000} value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="ed">Due</label><input id="ed" type="date" className="pf-input" value={edit.due} onChange={e => setEdit({ ...edit, due: e.target.value })} /></div>
          <div className="pf-row" style={{ gap: 8 }}><button type="submit" className="pf-btn sm" disabled={edit.title.trim().length < 2}>Save</button><button type="button" className="pf-btn sm ghost" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      ) : (
        <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 16 }}>
          <button type="button" className="pf-btn sm ghost" onClick={() => setEdit({ title: task.title, notes: task.notes || '', due: task.due })}><Icon name="edit" size={14} />Edit</button>
          <button type="button" className="pf-btn sm ghost danger" onClick={async () => { if (window.confirm('Delete this task?')) { try { await actions.deleteTask(task.id); onClose(); } catch (e) { setMsg(errMessage(e)); } } }}><Icon name="x" size={14} />Delete</button>
        </div>))}
      {msg && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{msg}</p>}
      <p className="pf-small pf-muted" style={{ marginTop: 14 }}>Move a task to “With mentor” when you want it checked. Your mentor’s feedback appears here.</p>
    </Drawer>
  );
}

export function AddTask({ open, onClose, onAdd, who = 'you' }) {
  const [f, setF] = useState({ title: '', notes: '', subject: 'General', due: inDays(2), priority: 'medium' });
  const [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault(); setErr('');
    try { await onAdd({ ...f, title: f.title.trim(), notes: f.notes.trim() }); setF({ ...f, title: '', notes: '' }); onClose(); }
    catch (x) { setErr(errMessage(x)); }
  };
  return (
    <Drawer open={open} title="Add a task" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="pf-field"><label className="pf-label" htmlFor="nt">{who === 'you' ? 'What do you want to do?' : 'What should they do?'}</label><input id="nt" className="pf-input" value={f.title} maxLength={200} onChange={e => setF({ ...f, title: e.target.value })} placeholder="e.g. Revise chapter 4 and make a one-page summary" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="nn">Details (optional)</label><textarea id="nn" className="pf-textarea" rows={3} maxLength={1000} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
        <div className="pf-field"><span className="pf-label" id="np-label">Priority</span><PriorityPicker id="np" value={f.priority} onChange={p => setF({ ...f, priority: p })} /></div>
        <div className="pf-grid g2">
          <div className="pf-field"><label className="pf-label" htmlFor="ns">Subject</label><input id="ns" className="pf-input" list="subjects" maxLength={60} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /><datalist id="subjects">{SUBJECTS.map(s => <option key={s} value={s} />)}</datalist></div>
          <div className="pf-field"><label className="pf-label" htmlFor="nd">Due</label><input id="nd" type="date" className="pf-input" value={f.due} onChange={e => setF({ ...f, due: e.target.value })} /></div>
        </div>
        <button type="submit" className="pf-btn" disabled={f.title.trim().length < 2 || !f.due}>Add task</button>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      </form>
    </Drawer>
  );
}

/** Everything to do, in one place: today's and this week's steps from the weekly plan, and tasks from the mentor, the parent and the student. */
export default function LiveStudentTasks() {
  const { data, actions } = usePlatform();
  const [view, setView] = useState('board');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const shown = useMemo(() => data.tasks.filter(t => filter === 'all' || t.source === filter)
    .sort((a, b) => RANK[a.priority] - RANK[b.priority] || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0)), [data.tasks, filter]);
  const openTasks = data.tasks.filter(t => t.status !== 'done');
  const overdue = openTasks.filter(t => dueLabel(t.due).tone === 'coral').length;
  const fromMentor = openTasks.filter(t => t.source === 'mentor').length;
  const task = data.tasks.find(t => t.id === open);
  return (
    <>
      <PageHead eyebrow="Tasks" title="What to do next" actions={<button type="button" className="pf-btn" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Add a task</button>}>
        Your plan’s steps for today and this week, and tasks from your mentor, your parent and you, in one place.
      </PageHead>
      <div className="pf-chip-row" style={{ marginBottom: 14 }}>
        <Pill tone={openTasks.length ? 'sky' : 'grey'}>{openTasks.length} open task{openTasks.length === 1 ? '' : 's'}</Pill>
        {fromMentor > 0 && <Pill tone="sky" icon="users">{fromMentor} from your mentor</Pill>}
        {overdue > 0 && <Pill tone="coral" icon="alert">{overdue} overdue</Pill>}
      </div>
      <div style={{ marginBottom: 18 }}><PlanTasks /></div>
      <div className="pf-row pf-wrap" style={{ gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Your tasks</h3>
        <div className="pf-chip-row" role="group" aria-label="Show tasks">{FILTERS.map(([id, l]) => <button key={id} type="button" className="pf-chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>{l}</button>)}</div>
        <span className="pf-grow" />
        <Tabs label="Task view" value={view} onChange={setView} tabs={[{ id: 'board', label: 'Board', icon: 'grid' }, { id: 'list', label: 'List', icon: 'menu' }]} />
      </div>
      {data.tasks.length === 0 ? <Card><Empty icon="tasks" title="No tasks yet">Tasks from your mentor and your parent appear here. Add your own with “Add a task”.</Empty></Card>
        : view === 'board' ? (
          <div className="pf-kanban">
            {COLS.map(c => { const items = shown.filter(t => t.status === c.id); return (
              <div key={c.id} className="pf-col" aria-label={c.label}><h5><span>{c.label}</span><span className="pf-pill grey">{items.length}</span></h5>
                {items.map(t => <TaskCard key={t.id} t={t} onOpen={setOpen} />)}
                {items.length === 0 && <div className="pf-small pf-faint" style={{ padding: 8 }}>Nothing here</div>}
              </div>); })}
          </div>
        ) : (
          <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Task</th><th>Priority</th><th>Due</th><th>From</th><th>Status</th></tr></thead>
            <tbody>{shown.map(t => { const d = dueLabel(t.due, t.status === 'done'); return (
              <tr key={t.id} className="click" onClick={() => setOpen(t.id)}><td><b>{t.title}</b><div className="pf-small pf-muted">{t.subject}</div></td><td><Pill tone={PRIO[t.priority][0]}>{PRIO[t.priority][1]}</Pill></td><td><Pill tone={d.tone}>{d.text}</Pill></td><td>{t.by}</td><td><Pill tone={t.status === 'done' ? 'leaf' : t.status === 'review' ? 'sky' : 'grey'}>{COLS.find(c => c.id === t.status).label}</Pill></td></tr>); })}</tbody></table></div></Card>
        )}
      <TaskDrawer task={task} onClose={() => setOpen(null)} />
      <AddTask open={adding} onClose={() => setAdding(false)} onAdd={t => actions.addTask(t)} />
      {data.mentorNotes && data.mentorNotes[0] && <Card style={{ marginTop: 18 }}><CardHead title="Latest from your mentor" icon="message" action="Mentor" to="../mentor" /><b>{data.mentorNotes[0].title || 'Note'}</b> <span className="pf-small pf-muted">· {fmtDate(data.mentorNotes[0].at)}</span><p className="pf-small" style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{data.mentorNotes[0].text.slice(0, 400)}{data.mentorNotes[0].text.length > 400 ? '…' : ''}</p></Card>}
    </>
  );
}
