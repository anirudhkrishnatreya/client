import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, PageHead, Pill } from '../../ui/kit';
import { rec, messageFor, codeOf } from './recApi';
import { useLoad, useShortlist } from './hooks';
import { Closed, Problem, SaveButton } from './bits';

const ZONES = [[2, 'Short training'], [3, 'Some training or a diploma'], [4, 'A bachelor’s degree'], [5, 'An advanced degree']];

/** Browse every career, search by name, and narrow by area or how long the preparation is. */
export default function Explore() {
  const meta = useLoad(() => rec.meta(), []);
  const list = useShortlist();
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [cluster, setCluster] = useState('');
  const [jobZone, setJobZone] = useState('');
  const [rows, setRows] = useState([]);
  const [next, setNext] = useState(null);
  const [total, setTotal] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const fetchPage = async (cursor, replace) => {
    setBusy(true);
    try {
      const { data } = await rec.browse({ ...(term ? { q: term } : {}), ...(cluster ? { cluster } : {}), ...(jobZone ? { jobZone } : {}), ...(cursor ? { cursor } : {}) });
      setRows(r => (replace ? data.items : [...r, ...data.items])); setNext(data.nextCursor); setTotal(data.total); setErr(null);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  useEffect(() => { if (!meta.closed) fetchPage(null, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [term, cluster, jobZone, meta.closed]);

  if (meta.closed) return <><PageHead eyebrow="Careers" title="Explore careers" /><Closed /></>;
  const clusters = (meta.data && meta.data.clusters) || [];
  return (
    <>
      <PageHead eyebrow="Careers" title="Explore careers" actions={<Link className="pf-btn sm ghost" to="/platform/student/shortlist">My shortlist{list.active.length ? ` (${list.active.length})` : ''}</Link>}>
        Browse any career, not only the ones suggested for you. Open one to see what the work involves and how to get there in India.
      </PageHead>
      <Card>
        <div className="pf-row pf-wrap" style={{ gap: 12 }}>
          <div className="pf-field pf-grow" style={{ minWidth: 200 }}><label className="pf-label" htmlFor="q">Search</label><input id="q" className="pf-input" type="search" value={q} maxLength={80} onChange={e => setQ(e.target.value)} placeholder="For example: pilot, designer, nurse" /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="cl">Area</label>
            <select id="cl" className="pf-select" value={cluster} onChange={e => setCluster(e.target.value)}><option value="">All areas</option>{clusters.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          <div className="pf-field"><label className="pf-label" htmlFor="jz">Preparation</label>
            <select id="jz" className="pf-select" value={jobZone} onChange={e => setJobZone(e.target.value)}><option value="">Any</option>{ZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
      </Card>
      {list.notice && <Problem>{list.notice}</Problem>}
      {err && <Problem>{codeOf(err) === 'VALIDATION_FAILED' ? 'Please check your search and try again.' : messageFor(err)}</Problem>}
      <Card>
        {total !== null && <div className="pf-small pf-muted" role="status">{total === 0 ? 'No careers match.' : `${total} career${total === 1 ? '' : 's'}`}</div>}
        {!busy && rows.length === 0 && !err && <Empty icon="search" title="No careers match">Try a shorter word, or clear the filters.</Empty>}
        {rows.map(o => (
          <div key={o.id} className="pf-row pf-wrap" style={{ gap: 8, padding: '10px 0', borderTop: '1px solid var(--line, #e7e9f0)' }}>
            <div className="pf-grow"><Link className="pf-link" to={`/platform/student/explore/${o.slug}`}><b>{o.title}</b></Link><div className="pf-small pf-muted">{o.clusterLabel}</div></div>
            {o.standIn && <Pill tone="grey">India-specific</Pill>}
            <SaveButton saved={list.has(o.id)} title={o.title} onClick={() => list.toggle(o.id)} />
          </div>
        ))}
        {next && <p style={{ textAlign: 'center', marginTop: 12 }}><button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => fetchPage(next, false)}>{busy ? 'Loading…' : 'Show more'}</button></p>}
      </Card>
    </>
  );
}
