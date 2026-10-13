import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';

export default function LiveReports() {
  const { data } = usePlatform();
  return (
    <>
      <PageHead eyebrow="Reports" title="Your reports">Your Career Discovery Report, and the weekly and monthly progress reports as they are added.</PageHead>
      {data.reports.length === 0 ? <Card><Empty icon="file" title="No reports yet">Finish the career assessment and your first report will appear here.</Empty><p style={{ textAlign: 'center' }}><Link to="/v4" className="pf-btn sm">Go to the career assessment</Link></p></Card> :
        <div className="pf-grid">{data.reports.map(r => (
          <Card key={r.assessmentId}><div className="pf-row"><span className="pf-pill" style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}><Icon name="file" size={22} /></span>
            <div className="pf-grow"><div className="pf-row pf-wrap" style={{ gap: 8 }}><b>Career Discovery Report</b><Pill tone="gold">Career</Pill>{r.provisional && <Pill tone="grey">Early norms</Pill>}</div><div className="pf-small pf-muted">{fmtDate(String(r.completedAt).slice(0, 10))}{r.hollandCode ? ` · interest code ${r.hollandCode}` : ''}</div></div>
            <Link to={`/v4/results/${r.assessmentId}`} className="pf-btn sm">Open</Link></div></Card>
        ))}</div>}
    </>
  );
}
