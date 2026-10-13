import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { v2 as defaultApi, errorCode } from '../api';
import Frame from './Frame';
import FullReport from './FullReport';

const DIMENSIONS = [['interest', 'Interests'], ['personality', 'Personality'], ['aptitude', 'Abilities'], ['ei', 'Emotional intelligence'], ['values', 'What matters at work']];
const HOLLAND = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
const POLE = { data: 'Data', ideas: 'Ideas', people: 'People', things: 'Things' };
const BAND = { developing: 'Developing', moderate: 'Moderate', strong: 'Strong' };

// The student's report. Shows the finished report (the same document the PDF is made from). While its wording is still
// being reviewed the server says "not ready", and the student sees the plain scores instead, with a short explanation.
export default function V4Results({ api = defaultApi }) {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [plain, setPlain] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    const missing = e => errorCode(e) === 'NOT_FOUND' || errorCode(e) === 'FORBIDDEN';
    api.fullReport(id).then(({ data }) => { setReport(data.report); setState('full'); }).catch(e => {
      if (missing(e)) return setState('missing');
      if (errorCode(e) !== 'REPORT_NOT_READY') return setState('error');
      api.report(id).then(({ data }) => { setPlain(data.report); setState('plain'); }).catch(e2 => setState(missing(e2) ? 'missing' : 'error'));
    });
  }, [api, id]);

  if (state === 'loading') return <Frame><p role="status">Loading your results…</p></Frame>;
  if (state === 'missing') return <Frame title="Results not found"><p>We could not find those results.</p><Link className="v4-btn" to="/v4">Back to your page</Link></Frame>;
  if (state === 'error') return <Frame><div className="v4-alert error" role="alert">We could not load your results.</div></Frame>;

  if (state === 'full') {
    return (
      <Frame bare>
        <FullReport report={report} />
        <p style={{ textAlign: 'center', padding: '0 16px 64px' }}><Link className="v4-btn secondary" to="/v4">Back to your page</Link></p>
      </Frame>
    );
  }
  return (
    <Frame title="Your results">
      {state === 'full' ? null : (
        <>
          <div className="v4-alert info" role="status">Your full report is still being finished. Here are your scores for now; the detailed report will appear on this page when it is ready.</div>
          <ReportView r={plain} />
        </>
      )}
      <p style={{ marginTop: 16 }}><Link className="v4-btn secondary" to="/v4">Back to your page</Link></p>
    </Frame>
  );
}

/** The report body. Shared by the student's page and by a counsellor's view of a student who agreed to share, so both always match. */
export function ReportView({ r, viewer = 'student' }) {
  const t = viewer === 'counsellor';        // a counsellor reads the same report, in the third person
  const invalid = r.validity.flag === 'invalid';
  const scaleLabel = sid => (r.scales[sid] ? r.scales[sid].label : sid);
  return (
    <>
      {r.norm.provisional && <div className="v4-alert info" role="note">These scores are <strong>provisional</strong>. We are still collecting the information needed to compare {t ? 'the student' : 'you'} accurately with other students of the same age.</div>}
      {invalid && <div className="v4-alert error" role="alert">The pattern of answers suggests this attempt may not show {t ? 'the student\'s' : 'your'} real strengths, so we have not suggested careers. Retaking the test when rested is recommended.</div>}
      {r.validity.flag === 'caution' && <div className="v4-alert info" role="note">A few answers looked unusual, so please read these results as a guide, not a verdict.</div>}

      {!invalid && (
        <>
          <section className="v4-card" aria-labelledby="h-code">
            <h2 id="h-code" className="v4-h2">{t ? 'Their' : 'Your'} interests in a word</h2>
            {r.holland && r.holland.code
              ? <p><strong style={{ fontSize: 28, letterSpacing: 4 }}>{r.holland.code}</strong><br /><span className="v4-muted">{r.holland.code.split('').map(c => HOLLAND[c]).join(' · ')}</span></p>
              : <p className="v4-muted">{t ? 'Their' : 'Your'} interests were spread fairly evenly, so there is no single leading pattern. That is normal; it means many paths could suit {t ? 'them' : 'you'}.</p>}
            {r.orientation && !r.orientation.undifferentiated && <p style={{ marginTop: 10 }}>{t ? 'They lean' : 'You lean'} towards working with <strong>{POLE[r.orientation.dominant]}</strong>, and then <strong>{POLE[r.orientation.secondary]}</strong>.</p>}
          </section>

          {DIMENSIONS.map(([dim, title]) => {
            const picks = (r.dominant[{ interest: 'interests', personality: 'personality', aptitude: 'aptitude', ei: 'ei', values: 'values' }[dim]] || []);
            const rows = Object.entries(r.scales).filter(([, s]) => s.dimension === dim && s.scored).sort((a, b) => b[1].stanine - a[1].stanine || b[1].pomp - a[1].pomp);
            if (!rows.length) return null;
            return (
              <section key={dim} className="v4-card" aria-label={title}>
                <h2 className="v4-h2">{title}</h2>
                {picks.length > 0 && <p style={{ marginBottom: 12 }}>Strongest: {picks.map(p => <span key={p} className="v4-pill" style={{ marginRight: 6 }}>{scaleLabel(p)}</span>)}</p>}
                <div className="v4-bars">
                  {rows.slice(0, dim === 'interest' ? 8 : 20).map(([sid, s]) => (
                    <div key={sid} className="v4-bar-row">
                      <span>{s.label}</span>
                      <div className="v4-bar" role="img" aria-label={`${s.label}: ${s.stanine} out of 9, ${BAND[s.band]}`}><div style={{ width: `${(s.stanine / 9) * 100}%` }} /></div>
                      <strong>{s.stanine}</strong>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <Matches matches={r.matches} viewer={viewer} />
        </>
      )}
    </>
  );
}

function Matches({ matches, viewer }) {
  const them = viewer === 'counsellor';
  if (!matches || matches.withheld) return null;
  if (matches.explore) {
    return (
      <section className="v4-card" aria-label="Areas to explore">
        <h2 className="v4-h2">Areas to explore</h2>
        {matches.explore.areas.length ? <ul style={{ marginLeft: 18 }}>{matches.explore.areas.map(a => <li key={a.id}>{a.family}</li>)}</ul> : <p className="v4-muted">Keep trying different activities; your favourites will become clearer.</p>}
        <p className="v4-muted" style={{ marginTop: 10 }}>{matches.explore.note}</p>
      </section>
    );
  }
  const list = (title, items, n) => (
    <section className="v4-card" aria-label={title}>
      <h2 className="v4-h2">{title}</h2>
      <ol style={{ listStyle: 'none' }}>
        {items.slice(0, n).map(m => (
          <li key={m.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
            <div className="v4-row"><strong className="v4-grow">{m.rank}. {m.label}</strong><span className="v4-pill">{m.overall}% match</span></div>
            <div className="v4-muted" style={{ marginTop: 4 }}>{Object.entries(m.components).map(([k, c]) => `${k === 'ei' ? 'emotional intelligence' : k} ${c.pct}%`).join(' · ')}</div>
          </li>
        ))}
      </ol>
    </section>
  );
  return <>{matches.streams && list(`Subject streams that may suit ${them ? 'them' : 'you'}`, matches.streams, 3)}{matches.fields && list(`Career fields that may suit ${them ? 'them' : 'you'}`, matches.fields, 5)}</>;
}
