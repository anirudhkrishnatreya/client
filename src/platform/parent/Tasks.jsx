import { usePlatform } from '../data/store';
import { Card, PageHead, Pill } from '../ui/kit';
import { dueLabel, fmtShort } from '../ui/format';

const ST = { todo: ['grey', 'To do'], doing: ['sky', 'In progress'], review: ['gold', 'With mentor'], done: ['leaf', 'Done'] };
export default function ParentTasks() {
  const { data } = usePlatform();
  return (
    <>
      <PageHead eyebrow="Tasks and scores" title="What has been set">Everything {data.child.firstName} has been asked to do, and the check-ins marked so far.</PageHead>
      <Card flush style={{ marginBottom: 18 }}><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Task</th><th>Subject</th><th>Set by</th><th>Due</th><th>Status</th></tr></thead><tbody>
        {data.tasks.map(t => <tr key={t.id}><td><b>{t.title}</b></td><td>{t.subject}</td><td>{t.by}</td><td>{t.status === 'done' ? fmtShort(t.due) : <Pill tone={dueLabel(t.due).tone}>{dueLabel(t.due).text}</Pill>}</td><td><Pill tone={ST[t.status][0]}>{ST[t.status][1]}</Pill></td></tr>)}</tbody></table></div></Card>
      <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Check-in</th><th>Date</th><th>Score</th><th>Mentor’s feedback</th></tr></thead><tbody>
        {data.assessments.past.map(a => <tr key={a.id}><td><b>{a.title}</b></td><td>{fmtShort(a.date)}</td><td><Pill tone={a.score >= 75 ? 'leaf' : a.score >= 60 ? 'gold' : 'coral'}>{a.score}%</Pill></td><td className="pf-small">{a.feedback.summary}</td></tr>)}</tbody></table></div></Card>
    </>
  );
}
