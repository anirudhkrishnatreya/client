import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { school as defaultApi, errorCode } from '../api';
import Frame from './Frame';
import { ReportView } from './V4Results';

// A student's individual report, only if they (or their guardian) agreed to share it with the school.
export default function SchoolStudent({ api = defaultApi }) {
  const { cohortId, studentId } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    api.studentReport(cohortId, studentId).then(({ data: d }) => { setData(d); setState('ready'); })
      .catch(e => setState(errorCode(e) === 'NOT_SHARED' ? 'notShared' : errorCode(e) === 'NO_RESULT' ? 'noResult' : 'missing'));
  }, [api, cohortId, studentId]);
  const back = <p style={{ marginTop: 16 }}><Link className="v4-btn secondary" to={`/v4/school/${cohortId}`}>Back to the class</Link></p>;
  if (state === 'loading') return <Frame><p role="status">Loading…</p></Frame>;
  if (state === 'notShared') return <Frame title="Not shared"><p>This student, or their parent or guardian, has not agreed to share the individual report with the school.</p>{back}</Frame>;
  if (state === 'noResult') return <Frame title="No result yet"><p>This student has not finished the test.</p>{back}</Frame>;
  if (state === 'missing') return <Frame title="Not found"><p>We could not find that student in this class.</p>{back}</Frame>;
  return (
    <Frame title={`Results for ${data.student.name}`}>
      <div className="v4-alert info" role="note">Shown because the student agreed to share their report with the school. Treat it as guidance for a conversation, not a verdict.</div>
      <ReportView r={data.report} viewer="counsellor" />
      {back}
    </Frame>
  );
}
