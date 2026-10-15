import { Link } from 'react-router-dom';
import { Card, Empty, PageHead, Pill } from '../../ui/kit';
import { rec, messageFor } from './recApi';
import { useLatestAssessment, useLoad, useShortlist } from './hooks';
import { Closed, OccupationLine, Problem, Reasons, BAND_TONE } from './bits';

function ClusterCard({ c, list }) {
  return (
    <Card>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}><h3 className="pf-grow">{c.label}</h3><Pill tone={BAND_TONE[c.band]}>{c.bandLabel}</Pill></div>
      <Reasons items={c.reasons} />
      <div style={{ marginTop: 8 }}>{c.occupations.map(o => <OccupationLine key={o.id} o={o} saved={list.has(o.id)} onToggle={list.toggle} />)}</div>
    </Card>
  );
}

/** The student's suggested careers: areas in bands with reasons, a few "worth a look" picks, and the streams that keep those areas open. */
export default function Matches() {
  const latest = useLatestAssessment();
  const list = useShortlist();
  const s = useLoad(() => (latest ? rec.recommendation(latest.assessmentId) : Promise.resolve({ data: null })), [latest && latest.assessmentId]);
  const head = <PageHead eyebrow="Careers" title="Careers that may suit you" actions={<Link className="pf-btn sm ghost" to="/platform/student/explore">Explore all careers</Link>}>Based on your interests, what matters to you at work, and how you like to work. These are starting points to explore, not decisions.</PageHead>;
  if (!latest) return <>{head}<Card><Empty icon="clipboard" title="Finish the career assessment first">Your suggestions are built from your results.</Empty><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="/v4">Go to the career assessment</Link></p></Card></>;
  if (s.closed) return <>{head}<Closed /></>;
  if (s.loading) return <>{head}<p role="status">Finding careers for you…</p></>;
  if (s.error) return <>{head}<Card><p>{messageFor(s.error)}</p><p style={{ marginTop: 10 }}><Link className="pf-btn sm" to="/platform/student/explore">Browse careers instead</Link></p></Card></>;
  const r = s.data.recommendation;
  if (!r.available) return <>{head}<Card><p>{r.note ? r.note.text : 'We could not suggest careers from this attempt.'}</p><p style={{ marginTop: 10 }}><Link className="pf-btn sm" to="/platform/student/explore">Browse careers instead</Link></p></Card></>;
  return (
    <>
      {head}
      {list.notice && <Problem>{list.notice}</Problem>}
      {r.profileSummary && r.profileSummary.hollandCode && <p className="pf-small pf-muted" style={{ marginBottom: 12 }}>Your interest code: <b>{r.profileSummary.hollandCode}</b></p>}
      {r.notes.map(n => <div key={n.key} className="pf-note" role="note">{n.text}</div>)}
      <div className="pf-grid">{r.clusters.map(c => <ClusterCard key={c.id} c={c} list={list} />)}</div>
      {r.stretch.length > 0 && <><h3 style={{ margin: '24px 0 8px' }}>Also worth a look</h3><p className="pf-small pf-muted" style={{ marginBottom: 8 }}>A few areas that are different from your top ones but still fit parts of you.</p><div className="pf-grid">{r.stretch.map(c => <ClusterCard key={c.id} c={c} list={list} />)}</div></>}
      {r.streams.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 6 }}>Subject streams and the areas they keep open</h3>
          {r.streams.map(st => <div key={st.id} style={{ padding: '8px 0', borderTop: '1px solid var(--line, #e7e9f0)' }}><b>{st.label}</b><div className="pf-small pf-muted">Keeps open: {st.keepsOpen.map(c => c.label).join(', ') || 'none of your top areas'}</div></div>)}
        </Card>
      )}
      <p className="pf-small pf-faint" style={{ marginTop: 16 }}>Suggestions use the O*NET occupation database, adapted for India. Always confirm exams and eligibility on official websites.</p>
    </>
  );
}
