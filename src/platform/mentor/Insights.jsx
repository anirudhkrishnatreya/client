import { usePlatform } from '../data/store';
import { Bars, Card, CardHead, PageHead, Pill, Spark } from '../ui/kit';

export default function Insights() {
  const { data } = usePlatform();
  const S = data.students;
  const avgTrend = S[0].trend.map((_, i) => Math.round(S.reduce((n, s) => n + s.trend[i], 0) / S.length));
  const status = [['On track', 'on'], ['Watch', 'watch'], ['Needs help', 'risk']].map(([label, k]) => ({ label, value: S.filter(s => s.status === k).length }));
  const top = [...S].sort((a, b) => b.score - a.score).slice(0, 3);
  return (
    <>
      <PageHead eyebrow="Insights" title="How your group is doing">Patterns across everyone you mentor, to help you decide where to spend your time.</PageHead>
      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Card><CardHead title="Average score, last 8 check-ins" icon="trend" /><Spark data={avgTrend} width={420} height={90} label="Group average" /><div className="pf-small pf-muted">From {avgTrend[0]}% to {avgTrend[avgTrend.length - 1]}%</div></Card>
        <Card><CardHead title="Students by status" icon="target" /><Bars data={status} height={130} /></Card>
      </div>
      <div className="pf-grid g2">
        <Card><CardHead title="Highest scores" icon="trophy" /><ul className="pf-list">{top.map(s => <li key={s.id}><span className="pf-grow">{s.name}</span><Pill tone="leaf">{s.score}%</Pill></li>)}</ul></Card>
        <Card ai><span className="tag">Pattern spotted</span><p style={{ margin: '8px 0 0' }}>Students with a streak under 4 days scored {Math.round(S.filter(s => s.streak < 4).reduce((n, s) => n + s.score, 0) / S.filter(s => s.streak < 4).length)}% on average, against {Math.round(S.filter(s => s.streak >= 4).reduce((n, s) => n + s.score, 0) / S.filter(s => s.streak >= 4).length)}% for the rest. A gentle nudge on routine may help most.</p></Card>
      </div>
    </>
  );
}
