import { useState } from 'react';
import { usePlatform } from '../../data/store';
import { Card, Icon, Pill } from '../../ui/kit';
import { dueLabel } from '../../ui/format';
import { errMessage } from '../liveApi';
import { AddTask, PriorityPicker } from '../student/Tasks';
import { WithChild } from './shared';

const ST = { todo: ['grey', 'To do'], doing: ['sky', 'In progress'], review: ['gold', 'With mentor'], done: ['leaf', 'Done'] };
const PRIO = { high: ['coral', 'High'], medium: ['gold', 'Medium'], low: ['grey', 'Low'] };
const RANK = { high: 0, medium: 1, low: 2 };

/** Everything the child has been asked to do (by their mentor, by you, by themselves), and tasks you set for them, with a priority. */
export default function LiveParentTasks() {
  const { actions } = usePlatform();
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async fn => { setMsg(''); try { await fn(); } catch (e) { setMsg(errMessage(e)); } };
  return (
    <WithChild eyebrow="Tasks" title="What has been set" intro={c => `Everything ${c.firstName} has been asked to do, by their mentor, by you, and by ${c.firstName} for themselves. You can set tasks too.`}>
      {d => {
        const rows = [...d.tasks].sort((a, b) => (a.status === 'done') - (b.status === 'done') || RANK[a.priority] - RANK[b.priority] || (a.due < b.due ? -1 : 1));
        return (
          <>
            <div className="pf-row" style={{ marginBottom: 14 }}><button type="button" className="pf-btn" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Set a task for {d.child.firstName}</button></div>
            {msg && <div className="pf-note" role="alert">{msg}</div>}
            {rows.length === 0 ? <Card><p className="pf-muted" style={{ margin: 0 }}>No tasks have been set yet.</p></Card> :
              <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Task</th><th>Priority</th><th>Set by</th><th>Due</th><th>Status</th><th /></tr></thead><tbody>
                {rows.map(t => { const l = dueLabel(t.due, t.status === 'done'); return (
                  <tr key={t.id}>
                    <td><b>{t.title}</b>{t.notes && <div className="pf-small pf-muted">{t.notes}</div>}{t.feedback && <div className="pf-small" style={{ color: 'var(--leaf)' }}>Mentor: {t.feedback.text}</div>}</td>
                    <td>{t.mine ? <PriorityPicker id={`p-${t.id}`} value={t.priority} onChange={p => run(() => actions.updateTask(t.id, { priority: p }))} /> : <Pill tone={PRIO[t.priority][0]}>{PRIO[t.priority][1]}</Pill>}</td>
                    <td>{t.mine ? 'You' : t.by}</td><td><Pill tone={l.tone}>{l.text}</Pill></td><td><Pill tone={ST[t.status][0]}>{ST[t.status][1]}</Pill></td>
                    <td>{t.mine && <button type="button" className="pf-btn sm ghost" aria-label={`Delete ${t.title}`} onClick={() => { if (window.confirm('Delete this task?')) run(() => actions.deleteTask(t.id)); }}><Icon name="x" size={14} /></button>}</td>
                  </tr>); })}</tbody></table></div></Card>}
            <p className="pf-small pf-muted" style={{ marginTop: 10 }}>{d.child.firstName} moves tasks along as they work; their mentor checks the ones handed in.</p>
            <AddTask open={adding} onClose={() => setAdding(false)} onAdd={t => actions.addTask(t)} who="them" />
          </>
        );
      }}
    </WithChild>
  );
}
