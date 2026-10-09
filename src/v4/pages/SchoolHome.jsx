import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { school as defaultApi } from '../api';
import Frame from './Frame';

const TRACK = { junior: 'Classes 6–9', senior: 'Classes 10–12', college: 'College' };

// A counsellor's home: their organization's classes, with the code students use to join and how many have finished.
export default function SchoolHome({ api = defaultApi }) {
  const [state, setState] = useState('loading');
  const [cohorts, setCohorts] = useState([]);
  const load = () => api.cohorts().then(({ data }) => { setCohorts(data.cohorts); setState('ready'); }).catch(e => setState(e.response && e.response.status === 403 ? 'forbidden' : 'error'));
  useEffect(() => { load(); }, []);                                     // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'loading') return <Frame><p role="status">Loading your classes…</p></Frame>;
  if (state === 'forbidden') return <Frame title="Not available"><p>This page is for school counsellors.</p></Frame>;
  if (state === 'error') return <Frame><div className="v4-alert error" role="alert">We could not load your classes.</div><button className="v4-btn" onClick={load}>Try again</button></Frame>;

  return (
    <Frame title="Your school's classes">
      {cohorts.length === 0 && <p className="v4-muted">No classes yet. Ask your iMenteo administrator to create one.</p>}
      {cohorts.map(c => (
        <section key={c.id} className="v4-card" aria-label={c.name}>
          <div className="v4-row">
            <div className="v4-grow">
              <h2 className="v4-h2">{c.name}</h2>
              <p className="v4-muted">{TRACK[c.track]} · {c.students} student{c.students === 1 ? '' : 's'} · {c.submitted} finished{c.status === 'closed' ? ' · closed to new students' : ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="v4-muted">Class code</div>
              <strong style={{ fontSize: 20, letterSpacing: 3, fontFamily: 'ui-monospace, Menlo, monospace' }}>{c.code}</strong>
            </div>
          </div>
          <p style={{ marginTop: 12 }}><Link className="v4-btn secondary" to={`/v4/school/${c.id}`}>Open class</Link></p>
        </section>
      ))}
    </Frame>
  );
}
