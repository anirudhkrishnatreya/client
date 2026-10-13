import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { reportApi } from '../liveApi';
import { WithChild } from './shared';

async function download(childId, r, setMsg) {
  try {
    const blob = await reportApi.pdf('parent', childId, r.assessmentId);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'iMenteo-career-report.pdf'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch { setMsg('The PDF is not ready yet. It is prepared after the student asks for it.'); }
}
export default function LiveParentReports() {
  const [msg, setMsg] = useState('');
  return (
    <WithChild eyebrow="Reports" title="Reports" intro={c => `${c.firstName}’s Career Discovery Report, and progress reports as they are added.`}>
      {d => d.reports.length === 0 ? <Card><p className="pf-muted" style={{ margin: 0 }}>No report yet. It appears here once {d.child.firstName} finishes the career assessment.</p></Card> :
        <div className="pf-grid">{msg && <div className="pf-note" role="status">{msg}</div>}{d.reports.map(r => (
          <Card key={r.assessmentId}><div className="pf-row pf-wrap"><span className="pf-pill" style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}><Icon name="file" size={22} /></span>
            <div className="pf-grow"><div className="pf-row pf-wrap" style={{ gap: 8 }}><b>Career Discovery Report</b><Pill tone="gold">Career</Pill></div><div className="pf-small pf-muted">{fmtDate(String(r.completedAt).slice(0, 10))}{r.hollandCode ? ` · interest code ${r.hollandCode}` : ''}</div></div>
            <Link className="pf-btn sm" to={`/platform/report/parent/${d.child.id}/${r.assessmentId}`}>Read</Link>
            {r.pdf.status === 'ready' && <button type="button" className="pf-btn sm ghost" onClick={() => download(d.child.id, r, setMsg)}><Icon name="download" size={14} />PDF</button>}</div></Card>))}</div>}
    </WithChild>
  );
}
