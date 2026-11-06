import { useEffect, useState } from 'react';
import { Card, Icon } from '../../ui/kit';
import { observeApi, errMessage } from '../liveApi';
import { KIND_ICON, when } from './parts';

const KINDS = [['step', 'Steps'], ['log', 'Daily log'], ['checkin', 'Check-ins'], ['focus', 'Focus'], ['task', 'Tasks'], ['message', 'Messages'], ['coach', 'AI coach'], ['assessment', 'Assessments'], ['change', 'Plan changes'], ['session', 'Sessions']];

/** Everything the student did, newest first, filtered by kind and days. */
export default function Timeline({ studentId, initial }) {
  const [days, setDays] = useState(7);
  const [kinds, setKinds] = useState([]);
  const [rows, setRows] = useState(initial || null);
  const [err, setErr] = useState('');
  useEffect(() => { if (days === 7 && !kinds.length && initial) { setRows(initial); return; } setRows(null); observeApi.timeline(studentId, { days, kinds: kinds.length ? kinds : null }).then(r => setRows(r.timeline)).catch(e => setErr(errMessage(e))); }, [studentId, days, kinds, initial]);
  const toggle = k => setKinds(v => (v.includes(k) ? v.filter(x => x !== k) : [...v, k]));
  return (
    <Card>
      <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 12 }}>
        <label className="pf-small">Show the last <select className="pf-input" style={{ width: 90, display: 'inline-block', padding: '4px 8px' }} value={days} onChange={e => setDays(Number(e.target.value))}>{[1, 7, 14, 30, 60].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}</select></label>
        <div className="pf-chip-row" role="group" aria-label="What to show">{KINDS.map(([k, l]) => <button key={k} type="button" className="pf-chip" aria-pressed={kinds.includes(k)} onClick={() => toggle(k)}>{l}</button>)}</div>
      </div>
      {err && <p role="alert" className="pf-small">{err}</p>}
      {!rows ? <p className="pf-small pf-muted" role="status">Loading…</p> : rows.length === 0 ? <p className="pf-small pf-muted">Nothing in this period.</p> :
        <ol className="pf-tlx">{rows.map((e, i) => (
          <li key={`${e.at}-${i}`}>
            <span className={`pf-tlx-ic ${e.kind}`}><Icon name={KIND_ICON[e.kind] || 'info'} size={13} /></span>
            <div className="pf-grow" style={{ minWidth: 0 }}><b>{e.title}</b>{e.detail && <div className="pf-small pf-muted" style={{ overflowWrap: 'anywhere' }}>{e.detail}</div>}</div>
            <span className="pf-small pf-faint" style={{ whiteSpace: 'nowrap' }}>{when(e.at)}</span>
          </li>))}</ol>}
    </Card>
  );
}
