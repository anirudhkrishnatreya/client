import { Link, useParams } from 'react-router-dom';
import { Card, PageHead, Pill } from '../../ui/kit';
import { rec, messageFor, codeOf } from './recApi';
import { useLatestAssessment, useLoad, useShortlist } from './hooks';
import { Closed, Problem, Reasons, SaveButton, BAND_TONE } from './bits';

const STREAM = { science_pcm: 'Science (PCM)', science_pcb: 'Science (PCB)', commerce: 'Commerce', humanities: 'Humanities', vocational: 'Vocational' };
const COST = { low: 'Lower cost', medium: 'Medium cost', high: 'Higher cost' };

/** How you get into this career in India. Draft wording is flagged by the server and shown as a notice, never hidden. */
function HowToEnter({ entry }) {
  return (
    <Card>
      <h3 style={{ marginBottom: 8 }}>How to get there in India</h3>
      {entry.summary && <p>{entry.summary}</p>}
      {entry.routes.length > 0 && <ul style={{ margin: '10px 0 0 18px' }}>{entry.routes.map((r, i) => <li key={i}><b>{STREAM[r.stream] || r.stream}:</b> {r.degrees.join(', ')}{r.exams && r.exams.length ? ` · exams: ${r.exams.join(', ')}` : ''}</li>)}</ul>}
      {entry.registration && <p className="pf-small" style={{ marginTop: 8 }}>Registration: {entry.registration}</p>}
      {entry.costBand && <p className="pf-small pf-muted" style={{ marginTop: 6 }}>{COST[entry.costBand]}</p>}
    </Card>
  );
}

/** "How it fits you": only when the student has a finished assessment, and never a verdict. */
function HowItFits({ assessmentId, slug }) {
  const s = useLoad(() => rec.check(assessmentId, slug), [assessmentId, slug]);
  if (s.loading) return <Card><p role="status">Checking how this fits you…</p></Card>;
  if (s.error) {
    const c = codeOf(s.error);
    return <Card><h3>How it fits you</h3><p className="pf-muted">{['JUNIOR_EXPLORE_ONLY', 'WITHHELD', 'NO_INTERESTS'].includes(c) ? messageFor(s.error) : 'We could not check this right now.'}</p></Card>;
  }
  const c = s.data.check;
  if (!c.available) return <Card><h3>How it fits you</h3><p className="pf-muted">{c.note ? c.note.text : 'Your interests were spread evenly, so we cannot say this one fits more than others.'}</p></Card>;
  return (
    <Card ai>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}><h3 className="pf-grow">How it fits you</h3><Pill tone={BAND_TONE[c.band]}>{c.bandLabel}</Pill>{c.readiness && <Pill tone="grey">{c.readiness.label}</Pill>}</div>
      <p className="pf-small pf-muted" style={{ marginTop: 6 }}>{c.inYourTopAreas ? 'This sits in one of the areas that suit you most.' : 'This is outside the areas that suit you most, which does not mean you could not do it.'}</p>
      <Reasons items={c.reasons} />
      {c.readiness && c.readiness.text && <p className="pf-small" style={{ marginTop: 8 }}>{c.readiness.text}</p>}
      {c.readiness && c.readiness.skillsToBuild.length > 0 && <p className="pf-small" style={{ marginTop: 4 }}>Skills to build: {c.readiness.skillsToBuild.map(x => x.label).join(', ')}</p>}
      {(c.notes || []).map(n => <p key={n.key} className="pf-small pf-muted" style={{ marginTop: 4 }}>{n.text}</p>)}
    </Card>
  );
}

export default function Occupation() {
  const { slug } = useParams();
  const page = useLoad(() => rec.occupation(slug), [slug]);
  const list = useShortlist();
  const latest = useLatestAssessment();
  if (page.closed) return <Closed />;
  if (page.loading) return <p role="status">Loading…</p>;
  if (page.error) return <><PageHead eyebrow="Careers" title="Career not found" /><Card><p>We could not find that career.</p><Link className="pf-btn sm" to="/platform/student/explore">Back to explore</Link></Card></>;
  const o = page.data.occupation;
  return (
    <>
      <PageHead eyebrow={o.clusterLabel} title={o.title} actions={<><Link className="pf-btn sm ghost" to="/platform/student/explore">All careers</Link><SaveButton saved={list.has(o.id)} title={o.title} onClick={() => list.toggle(o.id)} /></>}>{o.description}</PageHead>
      {list.notice && <Problem>{list.notice}</Problem>}
      {o.notices.map(n => <div key={n.key} className="pf-note" role="note">{n.text}</div>)}
      <div className="pf-grid">
        {latest && <HowItFits assessmentId={latest.assessmentId} slug={o.slug} />}
        <Card><h3 style={{ marginBottom: 6 }}>Preparation</h3><p>{o.jobZoneText}</p>{o.alsoInLabels.length > 0 && <p className="pf-small pf-muted" style={{ marginTop: 6 }}>Also relevant to: {o.alsoInLabels.map(a => a.label).join(', ')}</p>}</Card>
        <HowToEnter entry={o.entry} />
      </div>
      {o.attribution && <p className="pf-small pf-faint" style={{ marginTop: 16 }}>{o.attribution}</p>}
    </>
  );
}
