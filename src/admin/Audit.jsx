import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../platform/ui/kit';
import { adminApi, errOf, num } from './adminApi';
import { AuditRows } from './common';

const GROUPS = [['', 'Everything'], ['admin.login', 'Sign-ins'], ['user', 'Account actions'], ['admin.', 'Admin changes'], ['loop', 'Learning loop'], ['org', 'Schools'], ['mentor', 'Mentors']];

/** Everything admins did: who, what, to whom, when and from where. */
export default function Audit() {
  const [sp, setSp] = useSearchParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const action = sp.get('action') || '', admin = sp.get('admin') || '', page = Number(sp.get('page') || 1);
  const [who, setWho] = useState(admin);
  useEffect(() => { setD(null); adminApi.audit({ action: action || undefined, admin: admin || undefined, target: sp.get('target') || undefined, page }).then(r => setD(r.data)).catch(e => setErr(errOf(e))); }, [sp.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = patch => setSp(Object.fromEntries(Object.entries({ action, admin, page: 1, ...patch }).filter(([k, v]) => v && !(k === 'page' && v === 1))));
  return (
    <>
      <form className="pf-filters" onSubmit={e => { e.preventDefault(); set({ admin: who.trim() }); }}>
        <select className="pf-select" aria-label="What" value={action} onChange={e => set({ action: e.target.value })}>{GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input className="pf-input" placeholder="Admin email" aria-label="Admin email" value={who} onChange={e => setWho(e.target.value)} />
        <button type="submit" className="pf-btn sm">Filter</button>
      </form>
      {err && <p role="alert">{err}</p>}
      <Card>{!d ? <p className="pf-muted">Loading…</p> : <AuditRows entries={d.entries} />}</Card>
      {d && <div className="pf-row" style={{ gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
        <span className="pf-small pf-muted">{num(d.total)} entries · page {d.page} of {d.pages}</span>
        <button type="button" className="pf-btn sm ghost" disabled={d.page <= 1} onClick={() => set({ page: d.page - 1 })}>Newer</button>
        <button type="button" className="pf-btn sm ghost" disabled={d.page >= d.pages} onClick={() => set({ page: d.page + 1 })}>Older</button>
      </div>}
    </>
  );
}
