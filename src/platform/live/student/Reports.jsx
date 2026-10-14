import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { v2 } from '../../../v4/api';

export default function LiveReports() {
  const { data } = usePlatform();
  const [mailState, setMailState] = useState({});     // assessmentId -> 'sending' | 'sent' | 'queued' | 'error'
  const emailReport = async id => {
    setMailState(s => ({ ...s, [id]: 'sending' }));
    try { const { data: d } = await v2.emailPdf(id); setMailState(s => ({ ...s, [id]: d.status === 'sent' ? 'sent' : 'queued' })); }
    catch { setMailState(s => ({ ...s, [id]: 'error' })); }
  };
  return (
    <>
      <PageHead eyebrow="Reports" title="Your reports">Your Career Discovery Report, and the weekly and monthly progress reports as they are added.</PageHead>
      {data.reports.length === 0 ? <Card><Empty icon="file" title="No reports yet">Finish the career assessment and your first report will appear here.</Empty><p style={{ textAlign: 'center' }}><Link to="/v4" className="pf-btn sm">Go to the career assessment</Link></p></Card> :
        <div className="pf-grid">{data.reports.map(r => (
          <Card key={r.assessmentId}><div className="pf-row"><span className="pf-pill" style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}><Icon name="file" size={22} /></span>
            <div className="pf-grow"><div className="pf-row pf-wrap" style={{ gap: 8 }}><b>Career Discovery Report</b><Pill tone="gold">Career</Pill>{r.provisional && <Pill tone="grey">Early norms</Pill>}</div><div className="pf-small pf-muted">{fmtDate(String(r.completedAt).slice(0, 10))}{r.hollandCode ? ` · interest code ${r.hollandCode}` : ''}</div>
              {mailState[r.assessmentId] === 'sent' && <div className="pf-small" style={{ color: '#2a8f4a' }}>Emailed to you.</div>}
              {mailState[r.assessmentId] === 'queued' && <div className="pf-small pf-muted">It's still being prepared — we'll email it the moment it's ready.</div>}
              {mailState[r.assessmentId] === 'error' && <div className="pf-small" style={{ color: '#b4442e' }}>Could not send it. Please try again.</div>}
            </div>
            {r.pdf.status !== 'unavailable' && (
              <button type="button" className="pf-btn sm ghost" disabled={mailState[r.assessmentId] === 'sending'} onClick={() => emailReport(r.assessmentId)}>
                {mailState[r.assessmentId] === 'sending' ? 'Sending…' : 'Email me this report'}
              </button>
            )}
            <Link to={`/v4/results/${r.assessmentId}`} className="pf-btn sm">Open</Link></div></Card>
        ))}</div>}
    </>
  );
}
