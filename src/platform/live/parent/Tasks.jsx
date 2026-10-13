import { Card, Pill } from '../../ui/kit';
import { dueLabel } from '../../ui/format';
import { WithChild } from './shared';

const ST = { todo: ['grey', 'To do'], doing: ['sky', 'In progress'], review: ['gold', 'With mentor'], done: ['leaf', 'Done'] };
export default function LiveParentTasks() {
  return (
    <WithChild eyebrow="Tasks" title="What has been set" intro={c => `Everything ${c.firstName} has been asked to do.`}>
      {d => d.tasks.length === 0 ? <Card><p className="pf-muted" style={{ margin: 0 }}>No tasks have been set yet.</p></Card> :
        <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Task</th><th>Subject</th><th>Set by</th><th>Due</th><th>Status</th></tr></thead><tbody>
          {d.tasks.map(t => { const l = dueLabel(t.due, t.status === 'done'); return <tr key={t.id}><td><b>{t.title}</b>{t.notes && <div className="pf-small pf-muted">{t.notes}</div>}</td><td>{t.subject}</td><td>{t.by}</td><td><Pill tone={l.tone}>{l.text}</Pill></td><td><Pill tone={ST[t.status][0]}>{ST[t.status][1]}</Pill></td></tr>; })}</tbody></table></div></Card>}
    </WithChild>
  );
}
