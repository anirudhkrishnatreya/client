import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Card, Drawer, Icon, PageHead, Pill } from '../../ui/kit';
import { schoolApi, errMessage, saveFile } from '../liveApi';
import { useDashboard } from './SchoolHome';

const RISK = { red: ['Needs attention', 'coral'], amber: ['Watch', 'gold'], green: ['On track', 'leaf'] };

/** Importing students from a spreadsheet: check first (what will happen to each row), then import. */
function RosterImport({ onDone }) {
  const [text, setText] = useState('');
  const [createClasses, setCreate] = useState(true);
  const [check, setCheck] = useState(null);
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const file = async e => { const f = e.target.files && e.target.files[0]; if (f) { setText(await f.text()); setCheck(null); setOut(null); } };
  const run = async commit => {
    setBusy(true); setErr('');
    try { if (commit) { setOut(await schoolApi.rosterCommit(text, createClasses)); await onDone(); } else setCheck(await schoolApi.rosterCheck(text, createClasses)); }
    catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  return (
    <div>
      <p className="pf-small" style={{ marginTop: 0 }}>A CSV with columns <b>name, email, class, parent name, parent email, mentor email</b>. Each student gets an account in their class, with their mentor, and an email to choose a password; their parent is asked for consent.</p>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}>
        <label className="pf-btn sm ghost" style={{ cursor: 'pointer' }}><Icon name="file" size={14} />Choose a CSV file<input type="file" accept=".csv,text/csv" onChange={file} style={{ display: 'none' }} /></label>
        <button type="button" className="pf-btn sm ghost" onClick={async () => saveFile(await schoolApi.rosterTemplate(), 'students-template.csv')}><Icon name="download" size={14} />Template</button>
      </div>
      <label className="pf-label" htmlFor="rt" style={{ marginTop: 10 }}>Or paste it here</label>
      <textarea id="rt" className="pf-input" rows={6} value={text} onChange={e => { setText(e.target.value); setCheck(null); }} placeholder={'name,email,class,parent email\nAsha Verma,asha@example.com,10-A,meera@example.com'} />
      <label className="pf-small pf-row" style={{ gap: 6, marginTop: 8 }}><input type="checkbox" checked={createClasses} onChange={e => setCreate(e.target.checked)} />Create classes that do not exist yet</label>
      <div className="pf-row" style={{ gap: 6, marginTop: 10 }}><button type="button" className="pf-btn sm" disabled={busy || !text.trim()} onClick={() => run(false)}>Check the file</button>
        {check && check.counts.create + check.counts.update > 0 && <button type="button" className="pf-btn sm" disabled={busy} onClick={() => run(true)}>Import {check.counts.create} new, update {check.counts.update}</button>}</div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      {check && !out && <div style={{ marginTop: 10 }}><p className="pf-small"><b>{check.counts.create}</b> to create · <b>{check.counts.update}</b> to update · <b>{check.counts.skip}</b> skipped</p>
        <ul className="pf-list" style={{ maxHeight: 280, overflowY: 'auto' }}>{check.rows.map(r => <li key={r.line} className="pf-small"><span className="pf-grow"><b>{r.name || '(no name)'}</b> {r.email} · {r.cls}{r.problems.length ? <><br /><span style={{ color: 'var(--coral)' }}>{r.problems.join('; ')}</span></> : null}{r.notes.length ? <><br /><span className="pf-muted">{r.notes.join('; ')}</span></> : null}</span><Pill tone={r.action === 'create' ? 'leaf' : r.action === 'update' ? 'sky' : 'grey'}>{r.action}</Pill></li>)}</ul></div>}
      {out && <div className="pf-ritual-done" role="status" style={{ marginTop: 10 }}>Created {out.created} and updated {out.updated} students{out.classesCreated.length ? `; new classes: ${out.classesCreated.join(', ')}` : ''}.{out.skipped.length ? ` Skipped ${out.skipped.length}.` : ''} Welcome and consent emails are on their way.</div>}
    </div>
  );
}

export default function SchoolStudents() {
  const { d } = useDashboard();
  const [sp, setSp] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState([]);
  const [mentor, setMentor] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const cohortId = sp.get('cohortId') || '';
  const risk = sp.get('risk') || '';
  const load = useCallback(() => schoolApi.students({ cohortId, risk }).then(r => setRows(r.students)).catch(e => setErr(errMessage(e))), [cohortId, risk]);
  useEffect(() => { load(); }, [load]);
  const shown = (rows || []).filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || String(r.email).toLowerCase().includes(q.toLowerCase()));
  const admin = d && d.school.admin;
  const assign = async () => { setErr(''); setMsg(''); try { const r = await schoolApi.allocate(mentor === 'balance' ? { studentIds: pick, mentorIds: d.mentors.map(m => m.id) } : { studentIds: pick, mentorId: mentor }); setMsg(`${r.assigned} student${r.assigned === 1 ? '' : 's'} given a mentor.`); setPick([]); await load(); } catch (x) { setErr(errMessage(x)); } };
  const invite = async () => { setErr(''); try { const r = await schoolApi.invite(pick); setMsg(`Sent ${r.invited} new welcome email${r.invited === 1 ? '' : 's'}.`); } catch (x) { setErr(errMessage(x)); } };
  const set = patch => setSp(Object.fromEntries(Object.entries({ cohortId, risk, ...patch }).filter(([, v]) => v)));
  return (
    <>
      <PageHead eyebrow="Students" title="Every student in your school" actions={<>{admin && <button type="button" className="pf-btn" onClick={() => setSp({ ...Object.fromEntries(sp), import: '1' })}><Icon name="plus" size={15} />Import students</button>}<button type="button" className="pf-btn ghost" onClick={async () => saveFile(await schoolApi.studentsCsv(), 'students.csv')}><Icon name="download" size={15} />Export CSV</button></>}>Risk, activity, mentor and plan for each student. Open anyone for their full observatory.</PageHead>
      <div className="pf-row pf-wrap" style={{ gap: 8, marginBottom: 12 }}>
        <input className="pf-input" style={{ maxWidth: 240 }} placeholder="Search by name or email" aria-label="Search students" value={q} onChange={e => setQ(e.target.value)} />
        <select className="pf-input" style={{ maxWidth: 200 }} aria-label="Class" value={cohortId} onChange={e => set({ cohortId: e.target.value })}><option value="">All classes</option>{d && d.cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="pf-input" style={{ maxWidth: 200 }} aria-label="Risk" value={risk} onChange={e => set({ risk: e.target.value })}><option value="">Any risk</option><option value="red">Needs attention</option><option value="amber">Watch</option><option value="green">On track</option></select>
      </div>
      {admin && pick.length > 0 && <Card style={{ marginBottom: 12 }}><div className="pf-row pf-wrap" style={{ gap: 8 }}><b>{pick.length} selected</b>
        <select className="pf-input" style={{ maxWidth: 240 }} aria-label="Mentor" value={mentor} onChange={e => setMentor(e.target.value)}><option value="">Choose a mentor…</option><option value="balance">Spread evenly over all mentors</option>{d.mentors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.students})</option>)}</select>
        <button type="button" className="pf-btn sm" disabled={!mentor} onClick={assign}>Give them this mentor</button><button type="button" className="pf-btn sm ghost" onClick={invite}>Resend welcome emails</button></div></Card>}
      {msg && <p className="pf-small" role="status">{msg}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr>{admin && <th><input type="checkbox" aria-label="Select all" checked={shown.length > 0 && pick.length === shown.length} onChange={e => setPick(e.target.checked ? shown.map(r => r.id) : [])} /></th>}<th>Student</th><th>Class</th><th>Class or year</th><th>Mentor</th><th>Risk</th><th>Steps (7d)</th><th>Last active</th><th>Consent</th><th /></tr></thead><tbody>
        {!rows ? <tr><td colSpan="10" className="pf-muted">Loading…</td></tr> : shown.map(r => <tr key={r.id}>
          {admin && <td><input type="checkbox" aria-label={`Select ${r.name}`} checked={pick.includes(r.id)} onChange={e => setPick(p => (e.target.checked ? [...p, r.id] : p.filter(x => x !== r.id)))} /></td>}
          <td><div className="pf-row"><Avatar name={r.name} size={30} /><span><b>{r.name}</b><br /><span className="pf-small pf-muted">{r.goal ? r.goal.title : 'No plan yet'}</span></span></div></td>
          <td className="pf-small">{r.cohort || '–'}</td><td className="pf-small">{r.education && r.education.label ? r.education.label : <span className="pf-muted">not set</span>}{r.education && r.education.needs.length > 0 && <> <Pill tone="gold">Check</Pill></>}</td><td className="pf-small">{r.mentor || <span className="pf-muted">none</span>}</td>
          <td><Pill tone={RISK[r.risk][1]}>{RISK[r.risk][0]}</Pill>{r.escalation && <> <Pill tone="coral">Alert</Pill></>}</td><td>{r.steps7}</td>
          <td className="pf-small">{r.quietDays === null ? 'never' : r.quietDays === 0 ? 'today' : `${r.quietDays}d ago`}</td>
          <td className="pf-small">{r.consent === 'granted' || r.consent === 'not_required' ? 'Yes' : <span style={{ color: '#8A5A07' }}>Waiting</span>}</td>
          <td>{(r.consent === 'granted' || r.consent === 'not_required') && <Link className="pf-btn sm ghost" to={`../observe/${r.id}`}>Open</Link>}</td></tr>)}
        {rows && shown.length === 0 && <tr><td colSpan="10" className="pf-muted" style={{ padding: 20 }}>No students{q || cohortId || risk ? ' match' : ' yet: import them from a spreadsheet'}.</td></tr>}
      </tbody></table></div></Card>
      <Drawer open={sp.get('import') === '1'} title="Import students" onClose={() => { const n = Object.fromEntries(sp); delete n.import; setSp(n); }}>{sp.get('import') === '1' && <RosterImport onDone={load} />}</Drawer>
    </>
  );
}
