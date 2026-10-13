import { usePlatform } from '../../data/store';
import { Bars, Card, CardHead, PageHead } from '../../ui/kit';

export default function LiveInsights() {
  const { data } = usePlatform();
  const S = data.students.filter(s => !s.limited);
  const count = f => S.filter(f).length;
  const assess = [{ label: 'Not started', value: count(s => s.assessment.state === 'not_started') }, { label: 'Started', value: count(s => s.assessment.state === 'in_progress') }, { label: 'Done', value: count(s => s.assessment.state === 'submitted') }];
  const tasks = [{ label: 'Open', value: S.reduce((n, s) => n + s.tasks.open - s.tasks.overdue, 0) }, { label: 'Overdue', value: S.reduce((n, s) => n + s.tasks.overdue, 0) }, { label: 'Done', value: S.reduce((n, s) => n + s.tasks.done, 0) }];
  const parents = [{ label: 'Set up', value: count(s => s.parent === 'linked') }, { label: 'Invited', value: count(s => s.parent === 'invited') }, { label: 'None', value: count(s => s.parent === 'none') }];
  return (
    <>
      <PageHead eyebrow="Insights" title="How your group is doing">A picture of everyone you mentor, to help you decide where to spend your time. Score trends will appear once weekly check-ins start.</PageHead>
      {S.length === 0 ? <Card><p className="pf-muted" style={{ margin: 0 }}>Insights appear once you have students whose parents have confirmed.</p></Card> :
        <div className="pf-grid g3">
          <Card><CardHead title="Career assessment" icon="clipboard" /><Bars data={assess} height={140} /></Card>
          <Card><CardHead title="Tasks" icon="tasks" /><Bars data={tasks} height={140} /></Card>
          <Card><CardHead title="Parent accounts" icon="heart" /><Bars data={parents} height={140} /></Card>
        </div>}
    </>
  );
}
