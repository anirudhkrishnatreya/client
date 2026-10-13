import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminOrgs as defaultApi, errorCode } from '../api';
import '../v4.css';

const GRADES = { junior: ['6', '7', '8', '9'], senior: ['10', '11', '12'], college: ['ug1', 'ug2', 'ug3', 'ug4', 'pg', 'diploma'] };
const TRACK = { junior: 'Classes 6–9', senior: 'Classes 10–12', college: 'College' };
const fmt = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const explain = e => ({ DPA_REQUIRED: 'Record the data-processing agreement first.', EMAIL_TAKEN: 'That email already has an account.', ORGANIZATION_SUSPENDED: 'This organization is suspended.' }[errorCode(e)]
  || (e.response && e.response.data && e.response.data.details && Object.values(e.response.data.details).flat().join('. ')) || `That did not work (${errorCode(e) || 'network error'}).`);

// Superadmin: schools and colleges, their classes (with join codes), counsellor accounts, and deletion requests.
export default function AdminOrgs({ api = defaultApi }) {
  const nav = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [state, setState] = useState('loading');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', type: 'school', board: '', city: '' });

  const load = useCallback(async () => {
    try {
      const [o, r] = await Promise.all([api.list(), api.deletionRequests()]);
      setOrgs(o.data.organizations); setRequests(r.data.requests); setState('ready');
    } catch (e) {
      if (e.response && e.response.status === 401) { localStorage.removeItem('im_admin_token'); nav('/admin/login'); return; }
      setState(e.response && e.response.status === 403 ? 'forbidden' : 'error');
    }
  }, [api, nav]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, ok) => { setMsg(''); try { await fn(); if (ok) setMsg(ok); await load(); return true; } catch (e) { setMsg(explain(e)); return false; } };

  if (state === 'loading') return <div className="v4-main"><p role="status">Loading…</p></div>;
  if (state === 'forbidden') return <div className="v4-main"><h1 className="v4-h1">Superadmin only</h1><Link to="/admin">Back</Link></div>;
  if (state === 'error') return <div className="v4-main"><div className="v4-alert error" role="alert">Could not load.</div><button className="v4-btn" onClick={load}>Try again</button></div>;

  return (
    <div className="v4-shell">
      <header className="v4-top"><strong>iMenteo admin · Schools</strong><Link to="/admin">← Dashboard</Link></header>
      <main className="v4-main" style={{ maxWidth: 900 }}>
        {msg && <div className="v4-alert info" role="status">{msg}</div>}

        <section className="v4-card" aria-labelledby="new-org">
          <h2 id="new-org" className="v4-h2">Add a school or college</h2>
          <form className="v4-row" onSubmit={async e => { e.preventDefault(); if (await act(() => api.create(form), 'Organization added.')) setForm({ name: '', type: 'school', board: '', city: '' }); }}>
            <div className="v4-field v4-grow" style={{ marginBottom: 0 }}><label htmlFor="on">Name</label><input id="on" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor="ot">Type</label><select id="ot" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="school">School</option><option value="college">College</option></select></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor="ob">Board</label><input id="ob" type="text" value={form.board} onChange={e => setForm({ ...form, board: e.target.value })} /></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor="oc">City</label><input id="oc" type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <button className="v4-btn" type="submit" style={{ alignSelf: 'flex-end' }} disabled={form.name.trim().length < 2}>Add</button>
          </form>
        </section>

        {orgs.length === 0 && <p className="v4-muted" style={{ marginTop: 16 }}>No organizations yet.</p>}
        {orgs.map(o => <OrgCard key={o._id} api={api} org={o} act={act} />)}

        <section className="v4-card" aria-labelledby="dr" style={{ marginTop: 24 }}>
          <h2 id="dr" className="v4-h2">Deletion requests</h2>
          {requests.length === 0 ? <p className="v4-muted">None waiting.</p> : (
            <ul style={{ listStyle: 'none' }}>
              {requests.map(r => <Request key={r.id} r={r} act={act} api={api} />)}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Request({ r, api, act }) {
  const [sure, setSure] = useState(false);
  return (
    <li className="v4-row" style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
      <div className="v4-grow"><strong>{r.name}</strong> <span className="v4-muted">{r.email} · asked {fmt(r.requestedAt)} · consent {r.consentStatus}</span></div>
      {!sure ? <button className="v4-btn secondary" onClick={() => setSure(true)}>Delete account…</button>
        : <><span className="v4-err">This permanently removes the account and every result.</span><button className="v4-btn danger" onClick={() => act(() => api.deleteUser(r.id), 'Account deleted.')}>Yes, delete</button><button className="v4-btn secondary" onClick={() => setSure(false)}>Cancel</button></>}
    </li>
  );
}

function OrgCard({ api, org, act }) {
  const [open, setOpen] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [dpa, setDpa] = useState('');
  const [cls, setCls] = useState({ name: '', track: 'junior', grade: '8' });
  const [c, setC] = useState({ fullName: '', email: '', password: '' });
  const refresh = useCallback(async () => {
    const [a, b] = await Promise.all([api.cohorts(org._id), api.counsellors(org._id)]);
    setCohorts(a.data.cohorts); setCounsellors(b.data.counsellors);
  }, [api, org._id]);
  useEffect(() => { if (open) refresh(); }, [open, refresh]);
  const and = fn => async () => { const ok = await fn(); if (ok !== false && open) await refresh(); };

  return (
    <section className="v4-card" aria-label={org.name} style={{ marginTop: 16 }}>
      <div className="v4-row">
        <div className="v4-grow"><h2 className="v4-h2">{org.name}</h2><p className="v4-muted">{org.type === 'school' ? 'School' : 'College'}{org.board ? ` · ${org.board}` : ''}{org.city ? ` · ${org.city}` : ''}</p></div>
        <button className="v4-btn secondary" aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Manage'}</button>
      </div>
      {open && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>Data-processing agreement</h3>
          {org.dpa && org.dpa.signedAt
            ? <p>Version {org.dpa.version}, recorded {fmt(org.dpa.signedAt)}.</p>
            : <form className="v4-row" onSubmit={e => { e.preventDefault(); act(() => api.recordDpa(org._id, dpa), 'Agreement recorded.'); }}>
                <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`dpa-${org._id}`}>Agreement version</label><input id={`dpa-${org._id}`} type="text" value={dpa} onChange={e => setDpa(e.target.value)} /></div>
                <button className="v4-btn" type="submit" disabled={!dpa.trim()} style={{ alignSelf: 'flex-end' }}>Record</button>
                <span className="v4-muted">Required before any class can be created.</span>
              </form>}

          <h3 style={{ fontSize: 15, margin: '18px 0 6px' }}>Classes</h3>
          {cohorts.length === 0 ? <p className="v4-muted">No classes yet.</p> : (
            <ul style={{ listStyle: 'none' }}>
              {cohorts.map(k => (
                <li key={k._id} className="v4-row" style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <div className="v4-grow"><strong>{k.name}</strong> <span className="v4-muted">{TRACK[k.track]} · grade {k.grade}</span></div>
                  <code aria-label={`Class code ${k.code}`} style={{ fontSize: 16, letterSpacing: 2 }}>{k.code}</code>
                  <button className="v4-btn secondary" onClick={and(() => act(() => api.setCohortStatus(k._id, k.status === 'open' ? 'closed' : 'open')))}>{k.status === 'open' ? 'Close to new students' : 'Reopen'}</button>
                </li>
              ))}
            </ul>
          )}
          <form className="v4-row" style={{ marginTop: 10 }} onSubmit={e => { e.preventDefault(); and(() => act(() => api.createCohort(org._id, cls), 'Class created. Share its code with the students.'))(); }}>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`cn-${org._id}`}>Class name</label><input id={`cn-${org._id}`} type="text" value={cls.name} onChange={e => setCls({ ...cls, name: e.target.value })} /></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`ct-${org._id}`}>Track</label>
              <select id={`ct-${org._id}`} value={cls.track} onChange={e => setCls({ ...cls, track: e.target.value, grade: GRADES[e.target.value][0] })}>{Object.keys(TRACK).map(t => <option key={t} value={t}>{TRACK[t]}</option>)}</select></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`cg-${org._id}`}>Grade</label>
              <select id={`cg-${org._id}`} value={cls.grade} onChange={e => setCls({ ...cls, grade: e.target.value })}>{GRADES[cls.track].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <button className="v4-btn" type="submit" disabled={!cls.name.trim()} style={{ alignSelf: 'flex-end' }}>Create class</button>
          </form>

          <h3 style={{ fontSize: 15, margin: '18px 0 6px' }}>Counsellors</h3>
          {counsellors.length === 0 ? <p className="v4-muted">None yet.</p> : <ul style={{ marginLeft: 18 }}>{counsellors.map(x => <li key={x.id}>{x.fullName} <span className="v4-muted">{x.email}</span></li>)}</ul>}
          <form className="v4-row" style={{ marginTop: 10 }} onSubmit={e => { e.preventDefault(); and(async () => { const ok = await act(() => api.createCounsellor(org._id, c), 'Counsellor added. Share the password with them securely.'); if (ok) setC({ fullName: '', email: '', password: '' }); return ok; })(); }}>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`cf-${org._id}`}>Name</label><input id={`cf-${org._id}`} type="text" value={c.fullName} onChange={e => setC({ ...c, fullName: e.target.value })} /></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`ce-${org._id}`}>Email</label><input id={`ce-${org._id}`} type="email" value={c.email} onChange={e => setC({ ...c, email: e.target.value })} /></div>
            <div className="v4-field" style={{ marginBottom: 0 }}><label htmlFor={`cp-${org._id}`}>Temporary password</label><input id={`cp-${org._id}`} type="text" autoComplete="off" value={c.password} onChange={e => setC({ ...c, password: e.target.value })} /></div>
            <button className="v4-btn" type="submit" disabled={!c.fullName.trim() || !c.email.trim() || !c.password} style={{ alignSelf: 'flex-end' }}>Add counsellor</button>
          </form>
        </div>
      )}
    </section>
  );
}
