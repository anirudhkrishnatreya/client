import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Frame from '../../v4/pages/Frame';
import FullReport from '../../v4/pages/FullReport';
import { reportApi } from './liveApi';

/** A mentor or parent reading a student's report. The server decides who may; this only fetches and lays it out. */
export default function ReportPage() {
  const { kind, personId, assessmentId } = useParams();
  const [state, setState] = useState('loading');
  const [report, setReport] = useState(null);
  const back = `/platform/${kind === 'mentor' ? 'mentor/students' : 'parent/reports'}`;
  useEffect(() => {
    const load = kind === 'mentor' ? reportApi.mentor : kind === 'parent' ? reportApi.parent : null;
    if (!load) { setState('missing'); return; }
    load(personId, assessmentId).then(d => { setReport(d.report); setState('ready'); }).catch(e => {
      const code = e.response && e.response.data && e.response.data.code;
      setState(code === 'REPORT_NOT_READY' ? 'notready' : code === 'NOT_FOUND' || code === 'WRONG_ROLE' || code === 'CONSENT_PENDING' ? 'missing' : 'error');
    });
  }, [kind, personId, assessmentId]);
  if (state === 'loading') return <Frame><p role="status">Loading the report…</p></Frame>;
  if (state === 'missing') return <Frame title="Report not found"><p>You do not have access to this report, or it does not exist.</p><Link className="v4-btn" to={back}>Back</Link></Frame>;
  if (state === 'notready') return <Frame title="Report not ready"><p>The wording for this report is still being reviewed. Please check again soon.</p><Link className="v4-btn" to={back}>Back</Link></Frame>;
  if (state === 'error') return <Frame><div className="v4-alert error" role="alert">We could not load the report.</div></Frame>;
  return <Frame bare><FullReport report={report} /><p style={{ textAlign: 'center', padding: '0 16px 64px' }}><Link className="v4-btn secondary" to={back}>Back</Link></p></Frame>;
}
