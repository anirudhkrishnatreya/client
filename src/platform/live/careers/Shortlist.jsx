import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, PageHead, Pill } from '../../ui/kit';
import { useShortlist } from './hooks';
import { Closed, Problem } from './bits';

const STATUS = [['exploring', 'Exploring'], ['interested', 'Interested'], ['decided', 'Decided']];

function Row({ item, onPatch, onRemove }) {
  const [note, setNote] = useState(item.note || '');
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ padding: '14px 0', borderTop: '1px solid var(--line, #e7e9f0)' }}>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}>
        <Link className="pf-grow pf-link" to={`/platform/student/explore/${item.slug || item.occupationId}`}><b>{item.title}</b></Link>
        <select className="pf-select" aria-label={`Status of ${item.title}`} value={item.status} onChange={e => onPatch(item.occupationId, { status: e.target.value })}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button type="button" className="pf-btn sm ghost" onClick={() => onRemove(item.occupationId)} aria-label={`Remove ${item.title}`}>Remove</button>
      </div>
      <div className="pf-row" style={{ gap: 8, marginTop: 8 }}>
        <input className="pf-input pf-grow" aria-label={`Note about ${item.title}`} value={note} maxLength={500} placeholder="A note to yourself: who to ask, what to read" onChange={e => { setNote(e.target.value); setSaved(false); }} />
        <button type="button" className="pf-btn sm" disabled={note === (item.note || '')} onClick={async () => setSaved(await onPatch(item.occupationId, { note }))}>Save note</button>
        {saved && <span className="pf-small" role="status">Saved</span>}
      </div>
    </div>
  );
}

/** Careers the student is keeping an eye on: up to ten, each with a status and a private note. */
export default function Shortlist() {
  const list = useShortlist();
  const head = <PageHead eyebrow="Careers" title="My shortlist" actions={<Link className="pf-btn sm ghost" to="/platform/student/explore">Find more careers</Link>}>Keep up to 10 careers you want to look into. Add a note to remember why.</PageHead>;
  if (list.closed) return <>{head}<Closed /></>;
  if (!list.ready) return <>{head}<p role="status">Loading…</p></>;
  return (
    <>
      {head}
      {list.notice && <Problem>{list.notice}</Problem>}
      <Card>
        {list.active.length === 0 ? <Empty icon="star" title="Nothing saved yet">Save careers from Explore or from your suggestions.</Empty>
          : <>
            <div className="pf-small pf-muted" role="status">{list.active.length} of 10 saved</div>
            {list.active.map(i => <Row key={i.occupationId} item={i} onPatch={list.patch} onRemove={list.toggle} />)}
          </>}
      </Card>
      {list.active.some(i => i.status === 'decided') && <p className="pf-small pf-muted" style={{ marginTop: 12 }}><Pill tone="grey">Tip</Pill> You can change a decision any time. Talk it through with your mentor or parent.</p>}
    </>
  );
}
