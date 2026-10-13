import { usePlatform } from '../data/store';
import { Card, Icon, PageHead, Pill } from '../ui/kit';
import { fmtDate } from '../ui/format';

const TONE = { Weekly: 'sky', Career: 'gold', Monthly: 'leaf' };
export default function ParentReports() {
  const { data } = usePlatform();
  return (
    <>
      <PageHead eyebrow="Reports" title="Written updates">Weekly and monthly summaries, and the Career Discovery Report.</PageHead>
      <div className="pf-grid">{data.reports.map(x => (
        <Card key={x.id}><div className="pf-row"><span className="pf-pill" style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}><Icon name="file" size={22} /></span><div className="pf-grow"><div className="pf-row pf-wrap" style={{ gap: 8 }}><b>{x.title}</b><Pill tone={TONE[x.kind]}>{x.kind}</Pill></div><div className="pf-small pf-muted">{fmtDate(x.date)}</div></div></div><p className="pf-small" style={{ margin: '10px 0 0' }}>{x.summary}</p></Card>))}</div>
    </>
  );
}
