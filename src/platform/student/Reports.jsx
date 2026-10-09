import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../data/store';
import { Card, Drawer, Icon, PageHead, Pill, Spark } from '../ui/kit';
import { fmtDate } from '../ui/format';

const TONE = { Weekly: 'sky', Career: 'gold', Monthly: 'leaf' };

export default function Reports() {
  const { data } = usePlatform();
  const [open, setOpen] = useState(null);
  const r = data.reports.find(x => x.id === open);
  return (
    <>
      <PageHead eyebrow="Reports" title="Your progress, in writing">Every week and every month the platform writes up what you did, how you scored and what to do next. Your Career Discovery Report lives here too.</PageHead>
      <div className="pf-grid g-main">
        <div className="pf-grid">
          {data.reports.map(x => (
            <Card key={x.id}><div className="pf-row"><span className="pf-pill" style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}><Icon name="file" size={22} /></span><div className="pf-grow"><div className="pf-row pf-wrap" style={{ gap: 8 }}><b style={{ fontSize: 16 }}>{x.title}</b><Pill tone={TONE[x.kind]}>{x.kind}</Pill></div><div className="pf-small pf-muted">{fmtDate(x.date)}</div></div>
              {x.link ? <Link to={x.link} className="pf-btn sm">Open report</Link> : <button type="button" className="pf-btn sm ghost" onClick={() => setOpen(x.id)}>Read</button>}</div>
              <p className="pf-small" style={{ margin: '10px 0 0' }}>{x.summary}</p></Card>
          ))}
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><b>Check-in scores</b><div style={{ marginTop: 10 }}><Spark data={data.scoreTrend} label="Score trend" /></div><div className="pf-small pf-muted">From {data.scoreTrend[0]}% to {data.scoreTrend[data.scoreTrend.length - 1]}% over {data.scoreTrend.length} check-ins</div></Card>
          <Card ai><span className="tag"><Icon name="sparkles" size={14} />Coming soon</span><p style={{ margin: '6px 0 0', fontSize: 14 }}>Downloadable PDF progress reports, and a yearly review you can share with colleges and mentors.</p></Card>
        </div>
      </div>
      <Drawer open={!!r} title={r ? r.title : ''} onClose={() => setOpen(null)}>{r && <>
        <div className="pf-small pf-muted" style={{ marginBottom: 10 }}>{fmtDate(r.date)}</div><p>{r.summary}</p>
        <div className="pf-grid g2" style={{ margin: '14px 0' }}><div className="pf-note"><b>4 of 5</b><br />study days completed</div><div className="pf-note"><b>+12 points</b><br />Python check-in</div></div>
        <p className="pf-small pf-muted">The full written report, with charts and your mentor’s notes, will appear here once the platform is live.</p></>}
      </Drawer>
    </>
  );
}
