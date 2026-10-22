import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHead, Pill } from '../platform/ui/kit';
import { adminApi, errOf, when, ROLE } from './adminApi';

/** The team's admin accounts (superadmin only): add one, change a role, deactivate, or sign one out everywhere. */
export default function Admins() {
  const { me } = useOutletContext() || {};
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ email: '', username: '', role: 'viewer', password: '' });
  const [made, setMade] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => adminApi.admins().then(r => setList(r.data.admins)).catch(e => setMsg(errOf(e)));
  useEffect(() => { load(); }, []);
  const run = async (fn, done) => { setMsg(''); try { await fn(); if (done) setMsg(done); await load(); } catch (e) { setMsg(errOf(e)); } };
  const create = async e => {
    e.preventDefault(); setMsg(''); setMade(null);
    try { const r = await adminApi.createAdmin({ ...form, password: form.password || undefined }); setMade({ email: r.data.admin.email, password: r.data.temporaryPassword || null }); setForm({ email: '', username: '', role: 'viewer', password: '' }); await load(); }
    catch (x) { setMsg(errOf(x)); }
  };
  return (
    <>
      <Card style={{ marginBottom: 14 }}>
        <CardHead title="Admins" icon="shield" />
        <p className="pf-small pf-muted">A <b>viewer</b> reads everything. An <b>admin</b> can also act on accounts (pause, reset passwords, AI limits). A <b>superadmin</b> can also manage admins, delete accounts and start costly jobs.</p>
        {!list ? <p className="pf-muted">Loading…</p> : (
          <div className="pf-tablewrap"><table className="pf-atable">
            <thead><tr><th>Admin</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Added by</th><th /></tr></thead>
            <tbody>{list.map(a => (
              <tr key={a.id}>
                <td><b>{a.username}</b><div className="pf-small pf-muted">{a.email}</div></td>
                <td>{me && me.id === a.id ? <span>{ROLE[a.role]} <span className="pf-small pf-muted">(you)</span></span> : <select className="pf-select" style={{ width: 'auto' }} aria-label={`Role of ${a.email}`} value={a.role} onChange={e => run(() => adminApi.updateAdmin(a.id, { role: e.target.value }), 'Role changed.')}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}</td>
                <td>{a.isActive ? (a.locked ? <Pill tone="gold">Locked for now</Pill> : <Pill tone="leaf">Active</Pill>) : <Pill tone="grey">Deactivated</Pill>}</td>
                <td className="pf-small">{when(a.lastLogin)}</td>
                <td className="pf-small">{a.createdBy || '—'}</td>
                <td className="r">{me && me.id === a.id ? <span className="pf-small pf-muted">Change your password in Settings</span> : <>
                  <button type="button" className="pf-btn sm ghost" onClick={() => run(() => adminApi.signOutAdmin(a.id), 'Signed out everywhere.')}>Sign out</button>{' '}
                  {a.isActive
                    ? <button type="button" className="pf-btn sm ghost pf-danger" onClick={() => { if (window.confirm(`Deactivate ${a.email}? They are signed out at once.`)) run(() => adminApi.updateAdmin(a.id, { isActive: false }), 'Deactivated.'); }}>Deactivate</button>
                    : <button type="button" className="pf-btn sm ghost" onClick={() => run(() => adminApi.updateAdmin(a.id, { isActive: true }), 'Reactivated.')}>Reactivate</button>}
                </>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {msg && <p className="pf-small" role="status" style={{ marginTop: 8 }}>{msg}</p>}
      </Card>
      <Card>
        <CardHead title="Add an admin" icon="plus" />
        <form onSubmit={create} className="pf-grid g2" style={{ gap: 12 }}>
          <div className="pf-field"><label className="pf-label" htmlFor="na-email">Email</label><input id="na-email" className="pf-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="na-user">Username</label><input id="na-user" className="pf-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="na-role">Role</label><select id="na-role" className="pf-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="pf-field"><label className="pf-label" htmlFor="na-pw">Password (optional)</label><input id="na-pw" className="pf-input" type="password" autoComplete="new-password" placeholder="Leave empty to make a temporary one" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div><button type="submit" className="pf-btn sm" disabled={!form.email || !form.username}>Add admin</button></div>
        </form>
        {made && (
          <div className="pf-unit-form" role="status">
            <p className="pf-small" style={{ marginTop: 0 }}>Added <b>{made.email}</b>.{made.password ? ' Their temporary password (shown only now; share it privately and ask them to change it in Settings):' : ''}</p>
            {made.password && <div className="pf-secret">{made.password}</div>}
          </div>
        )}
      </Card>
    </>
  );
}
