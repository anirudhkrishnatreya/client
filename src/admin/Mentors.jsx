import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Card, CardHead, Pill } from '../platform/ui/kit';
import { adminApi, errOf } from './adminApi';

/**
 * Mentor accounts: who they are and how many students each one guides, and (superadmin) a new mentor account. A mentor signs in
 * on the normal login page and lands on the mentor dashboard. Students are given a mentor from the student's own account page.
 */
export default function Mentors() {
  const { me } = useOutletContext() || {};
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [made, setMade] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => adminApi.mentors().then(r => setList(r.data.mentors)).catch(e => setMsg(errOf(e)));
  useEffect(() => { load(); }, []);
  const create = async e => {
    e.preventDefault(); setMsg(''); setMade(null);
    try { const r = await adminApi.createMentor({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password }); setMade(r.data.mentor); setForm({ fullName: '', email: '', password: '' }); await load(); }
    catch (x) { setMsg(x && x.response && x.response.data && x.response.data.code === 'EMAIL_TAKEN' ? 'An account with this email already exists.' : errOf(x)); }
  };
  const superadmin = me && me.role === 'superadmin';
  return (
    <>
      <Card style={{ marginBottom: 14 }}>
        <CardHead title="Mentors" icon="users" />
        <p className="pf-small pf-muted">Mentors sign in on the normal login page and see only the students given to them, once each student’s parent has confirmed. Give a student a mentor from the student’s account page.</p>
        {!list ? <p className="pf-muted">Loading…</p> : list.length === 0 ? <p className="pf-muted">No mentors yet.</p> : (
          <div className="pf-tablewrap"><table className="pf-atable">
            <thead><tr><th>Mentor</th><th>Students</th><th /></tr></thead>
            <tbody>{list.map(m => (
              <tr key={m.id}><td><b>{m.fullName}</b><div className="pf-small pf-muted">{m.email}</div></td><td>{m.students ? <Pill tone="sky">{m.students}</Pill> : <Pill tone="grey">None yet</Pill>}</td>
                <td className="r"><Link className="pf-btn sm ghost" to={`/admin/users/${m.id}`}>Open account</Link></td></tr>))}</tbody>
          </table></div>)}
        {msg && !superadmin && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{msg}</p>}
      </Card>
      {superadmin && (
        <Card>
          <CardHead title="Add a mentor" icon="plus" />
          <form onSubmit={create} className="pf-grid g3" style={{ alignItems: 'end' }}>
            <label>Full name<input className="pf-input" value={form.fullName} maxLength={100} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label>
            <label>Email<input className="pf-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label>Password to start with<input className="pf-input" type="text" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
            <div><button type="submit" className="pf-btn" disabled={form.fullName.trim().length < 2 || !form.email.includes('@') || form.password.length < 8}>Create mentor account</button></div>
          </form>
          <p className="pf-small pf-muted" style={{ marginTop: 8 }}>At least 8 characters, with an uppercase letter, a lowercase letter and a number. Share it with the mentor privately and ask them to change it after signing in.</p>
          {made && <div className="pf-note" role="status">Created <b>{made.fullName}</b> ({made.email}). They can sign in now at the normal login page.</div>}
          {msg && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{msg}</p>}
        </Card>)}
    </>
  );
}
