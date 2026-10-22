import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Empty, Pill } from '../platform/ui/kit';
import { adminApi, errOf, money, num, ago, day } from './adminApi';
import { StatusPill } from './common';

/** Every account: search, filter by role and status, sort (including by AI spend), and open one. */
export default function Users() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const params = { q: sp.get('q') || '', role: sp.get('role') || '', status: sp.get('status') || '', sort: sp.get('sort') || 'newest', page: Number(sp.get('page') || 1) };
  const [q, setQ] = useState(params.q);
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const set = patch => { const next = { ...params, ...patch }; if (!('page' in patch)) next.page = 1; setSp(Object.fromEntries(Object.entries(next).filter(([k, v]) => v && !(k === 'sort' && v === 'newest') && !(k === 'page' && v === 1)))); };
  useEffect(() => {
    setD(null); setErr('');
    adminApi.users({ q: params.q || undefined, role: params.role || undefined, status: params.status || undefined, sort: params.sort, page: params.page, limit: 25 }).then(r => setD(r.data)).catch(e => setErr(errOf(e)));
  }, [sp.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <form className="pf-filters" onSubmit={e => { e.preventDefault(); set({ q: q.trim() }); }} role="search">
        <input className="pf-input" style={{ minWidth: 240 }} placeholder="Name, email or username" aria-label="Search accounts" value={q} onChange={e => setQ(e.target.value)} />
        <button type="submit" className="pf-btn sm">Search</button>
        <select className="pf-select" aria-label="Role" value={params.role} onChange={e => set({ role: e.target.value })}><option value="">All roles</option><option value="student">Students</option><option value="mentor">Mentors</option><option value="parent">Parents</option><option value="counsellor">Counsellors</option></select>
        <select className="pf-select" aria-label="Status" value={params.status} onChange={e => set({ status: e.target.value })}><option value="">Any status</option><option value="active">Active</option><option value="disabled">Paused</option><option value="unverified">Email not confirmed</option><option value="waiting-for-parent">Waiting for parent</option></select>
        <select className="pf-select" aria-label="Sort" value={params.sort} onChange={e => set({ sort: e.target.value })}><option value="newest">Newest first</option><option value="lastLogin">Last signed in</option><option value="aiSpend">Most AI spend (30 days)</option><option value="name">Name</option><option value="oldest">Oldest first</option></select>
      </form>
      {err && <p role="alert">{err}</p>}
      <Card flush>
        {!d ? <p className="pf-muted" role="status" style={{ padding: 20 }}>Loading accounts…</p> : d.users.length === 0 ? <div style={{ padding: 20 }}><Empty icon="users" title="No accounts match">Try another search or filter.</Empty></div> : (
          <div className="pf-tablewrap"><table className="pf-atable">
            <thead><tr><th>Account</th><th>Role</th><th>Status</th><th>Plan</th><th className="r">AI today</th><th className="r">AI 30 days</th><th className="r">Tokens 30 days</th><th>Last sign-in</th><th>Joined</th></tr></thead>
            <tbody>{d.users.map(u => (
              <tr key={u.id} className="click" onClick={() => nav(`/admin/users/${u.id}`)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') nav(`/admin/users/${u.id}`); }}>
                <td><b>{u.name}</b><div className="pf-small pf-muted">{u.email}</div></td>
                <td>{u.role}{u.grade ? <div className="pf-small pf-muted">{/^\d+$/.test(u.grade) ? `Class ${u.grade}` : u.grade}</div> : null}</td>
                <td><StatusPill status={u.status} /></td>
                <td className="pf-small">{u.goal ? `${u.goal.title} · L${u.goal.level}/${u.goal.levels}` : '—'}</td>
                <td className="r">{num(u.ai.callsToday)}{u.ai.ownLimit !== null ? <div className="pf-small pf-muted">{u.ai.ownLimit < 0 ? 'no limit' : `limit ${u.ai.ownLimit}`}</div> : null}</td>
                <td className="r"><b>{money(u.ai.usd30)}</b><div className="pf-small pf-muted">{num(u.ai.calls30)} calls</div></td>
                <td className="r">{num(u.ai.tokens30)}</td>
                <td className="pf-small">{ago(u.lastLoginAt)}</td>
                <td className="pf-small">{day(u.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      {d && d.pages > 1 && (
        <div className="pf-row" style={{ gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
          <span className="pf-small pf-muted">{num(d.total)} accounts · page {d.page} of {d.pages}</span>
          <button type="button" className="pf-btn sm ghost" disabled={d.page <= 1} onClick={() => set({ page: d.page - 1 })}>Previous</button>
          <button type="button" className="pf-btn sm ghost" disabled={d.page >= d.pages} onClick={() => set({ page: d.page + 1 })}>Next</button>
        </div>
      )}
      {d && d.pages <= 1 && <p className="pf-small pf-muted" style={{ marginTop: 10 }}>{num(d.total)} account{d.total === 1 ? '' : 's'}{params.sort === 'aiSpend' ? ' with AI use in the last 30 days' : ''}.</p>}
      {params.sort === 'aiSpend' && <p className="pf-small pf-muted"><Pill tone="sky">Note</Pill> Sorting by AI spend lists only accounts that used AI in the last 30 days.</p>}
    </>
  );
}
