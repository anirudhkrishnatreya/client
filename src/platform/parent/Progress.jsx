import { usePlatform } from '../data/store';
import { Bars, Card, CardHead, Heat, PageHead, Progress as Bar, Spark } from '../ui/kit';

export default function ParentProgress() {
  const { data } = usePlatform();
  const week = data.week, done = week.filter(b => b.done).length;
  const subjects = [...new Set(week.map(b => b.subject))].filter(s => s !== 'Rest').map(s => { const all = week.filter(b => b.subject === s); return { s, pct: Math.round((all.filter(b => b.done).length / all.length) * 100) }; });
  return (
    <>
      <PageHead eyebrow="Progress" title={`How ${data.child.firstName} is getting on`}>Time spent, plan completion and scores over the past weeks.</PageHead>
      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Card><CardHead title="Minutes studied this week" icon="clock" /><Bars data={data.weekMinutes} height={150} unit="m" /></Card>
        <Card><CardHead title="Check-in scores" icon="trend" /><Spark data={data.scoreTrend} width={400} height={110} label="Score trend" /><div className="pf-small pf-muted">From {data.scoreTrend[0]}% to {data.scoreTrend[data.scoreTrend.length - 1]}%</div></Card>
      </div>
      <div className="pf-grid g2">
        <Card><CardHead title="Plan completed" icon="calendar" /><p className="pf-small pf-muted">{done} of {week.length} planned blocks done this week.</p>
          <div className="pf-grid">{subjects.map(x => <div key={x.s}><div className="pf-row pf-between pf-small"><span>{x.s}</span><b className="pf-num">{x.pct}%</b></div><Bar value={x.pct} label={`${x.s} done`} /></div>)}</div></Card>
        <Card><CardHead title="Last 12 weeks" icon="flame" /><Heat values={data.heat} /><p className="pf-small pf-muted" style={{ marginTop: 8 }}>Each square is a day. Darker means more study.</p></Card>
      </div>
    </>
  );
}
