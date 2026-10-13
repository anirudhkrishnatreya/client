import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { school as defaultApi } from '../api';
import Frame from './Frame';

const STATE = { not_started: 'Not started', in_progress: 'In progress', submitted: 'Finished' };
const CONSENT = { pending: 'Waiting for guardian', granted: 'Confirmed', not_required: '', withdrawn: 'Withdrawn' };
const DIM = { interest: 'Interests', personality: 'Personality', aptitude: 'Abilities', ei: 'Emotional intelligence', values: 'Work values' };

// One class: who has finished (no scores), and an anonymised summary that appears only once enough students have finished.
export default function SchoolClass({ api = defaultApi }) {
  const { cohortId } = useParams();
  const [progress, setProgress] = useState(null);
  const [summary, setSummary] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    Promise.all([api.progress(cohortId), api.summary(cohortId)])
      .then(([p, s]) => { setProgress(p.data); setSummary(s.data.summary); setState('ready'); })
      .catch(e => setState(e.response && e.response.status === 404 ? 'missing' : 'error'));
  }, [api, cohortId]);

  if (state === 'loading') return <Frame><p role="status">Loading…</p></Frame>;
  if (state === 'missing') return <Frame title="Class not found"><Link className="v4-btn" to="/v4/school">Back to your classes</Link></Frame>;
  if (state === 'error') return <Frame><div className="v4-alert error" role="alert">We could not load this class.</div></Frame>;

  const { cohort, students } = progress;
  const done = students.filter(s => s.state === 'submitted').length;
  return (
    <Frame title={cohort.name}>
      <p style={{ marginBottom: 16 }}><Link to="/v4/school">← All classes</Link></p>

      <section className="v4-card" aria-labelledby="pg">
        <h2 id="pg" className="v4-h2">Progress</h2>
        <p className="v4-muted" style={{ marginBottom: 12 }}>{done} of {students.length} finished. You see who has finished, not their answers or scores.</p>
        {students.length === 0 ? <p className="v4-muted">No students have joined yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ textAlign: 'left' }}><th scope="col">Student</th><th scope="col">Status</th><th scope="col">Consent</th><th scope="col"><span className="sr-only">Report</span></th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 0' }}>{s.name}</td>
                  <td>{STATE[s.state]}</td>
                  <td>{CONSENT[s.consent] || ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    {s.state === 'submitted' && (s.shared
                      ? <Link to={`/v4/school/${cohortId}/student/${s.id}`}>View report</Link>
                      : <span className="v4-muted" title="The student, or their guardian, has not agreed to share the individual report">Not shared</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="v4-card" aria-labelledby="sm">
        <h2 id="sm" className="v4-h2">Class summary</h2>
        {summary.suppressed ? <div className="v4-alert info" role="status">{summary.reason} This protects students: a summary of a very small group could identify one person.</div> : <Summary s={summary} />}
      </section>
    </Frame>
  );
}

function Summary({ s }) {
  const dims = Object.entries(DIM).map(([d, title]) => [title, Object.entries(s.scales).filter(([, v]) => v.dimension === d).sort((a, b) => b[1].meanStanine - a[1].meanStanine)]).filter(([, rows]) => rows.length);
  const counts = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <p className="v4-muted" style={{ marginBottom: 12 }}>Based on {s.n} students{s.excludedInvalid ? ` (${s.excludedInvalid} attempt${s.excludedInvalid === 1 ? '' : 's'} left out because the answers looked unreliable)` : ''}. {s.norm && s.norm.provisional ? 'Provisional scores.' : ''}</p>
      {dims.map(([title, rows]) => (
        <div key={title} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>{title}: average (1–9)</h3>
          <div className="v4-bars">
            {rows.slice(0, 8).map(([id, v]) => (
              <div key={id} className="v4-bar-row">
                <span>{v.label}</span>
                <div className="v4-bar" role="img" aria-label={`${v.label}: average ${v.meanStanine} out of 9`}><div style={{ width: `${(v.meanStanine / 9) * 100}%` }} /></div>
                <strong>{v.meanStanine}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(s.topThreeFieldMatches).length > 0 && (
        <div><h3 style={{ fontSize: 15, marginBottom: 8 }}>Fields most often among a student's top three</h3>
          <ol style={{ marginLeft: 18 }}>{counts(s.topThreeFieldMatches).slice(0, 6).map(([id, n]) => <li key={id}>{id.replace(/_/g, ' ')}: {n} student{n === 1 ? '' : 's'}</li>)}</ol></div>
      )}
    </>
  );
}
