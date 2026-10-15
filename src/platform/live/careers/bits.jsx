import { Link } from 'react-router-dom';
import { Card, Empty, Pill } from '../../ui/kit';

export const BAND_TONE = { strong: 'gold', good: '', explore: 'grey' };

export const Closed = () => <Card><Empty icon="sparkles" title="Coming soon">Career suggestions are not open yet. We will tell you when they are ready.</Empty></Card>;
export const Problem = ({ error, children }) => <div className="pf-note" role="alert">{children || error}</div>;

export function SaveButton({ saved, onClick, title }) {
  return <button type="button" className={`pf-btn sm ${saved ? '' : 'ghost'}`} aria-pressed={saved} aria-label={`${saved ? 'Remove from' : 'Save to'} my shortlist: ${title}`} onClick={onClick}>{saved ? 'Saved' : 'Save'}</button>;
}

/** One reason a career was suggested, in plain words. */
export const Reasons = ({ items }) => (items && items.length ? <ul style={{ margin: '6px 0 0 18px' }}>{items.map(r => <li key={r.key} className="pf-small">{r.text}</li>)}</ul> : null);

export function OccupationLine({ o, saved, onToggle }) {
  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--line, #e7e9f0)' }}>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}>
        <Link className="pf-grow pf-link" to={`/platform/student/explore/${o.slug}`}><b>{o.title}</b></Link>
        {o.bandLabel && <Pill tone={BAND_TONE[o.band]}>{o.bandLabel}</Pill>}
        {o.readiness && <Pill tone="grey">{o.readiness.label}</Pill>}
        {onToggle && <SaveButton saved={saved} title={o.title} onClick={() => onToggle(o.id)} />}
      </div>
      <Reasons items={o.reasons} />
      {o.readiness && o.readiness.skillsToBuild.length > 0 && <div className="pf-small pf-muted" style={{ marginTop: 4 }}>Skills to build: {o.readiness.skillsToBuild.map(s => s.label).join(', ')}</div>}
      {(o.notes || []).map(n => <div key={n.key} className="pf-small pf-muted" style={{ marginTop: 4 }}>{n.text}</div>)}
    </div>
  );
}
