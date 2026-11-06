import { useEffect, useState } from 'react';
import { Card, CardHead, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { schoolApi, errMessage } from '../liveApi';
import { useDashboard } from './SchoolHome';

// Classes, mentors and settings for a school.
export function SchoolClasses() {
  const { d, load } = useDashboard();
  const [f, setF] = useState({ name: '', grade: '10' });
  const [err, setErr] = useState('');
  if (!d) return <p role="status">Loading…</p>;
  const add = async e => { e.preventDefault(); setErr(''); try { await schoolApi.createCohort(f); setF({ ...f, name: '' }); await load(); } catch (x) { setErr(errMessage(x)); } };
  const toggle = async c => { try { await schoolApi.setCohort(c.id, { status: c.status === 'open' ? 'closed' : 'open' }); await load(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <>
      <PageHead eyebrow="Classes" title="Classes">Each class has a join code students can use when they sign up themselves. Imports put students straight into their class.</PageHead>
      <div className="pf-grid g-main">
        <Card flush>{d.cohorts.length === 0 ? <Empty icon="layers" title="No classes yet">Create the first one.</Empty> :
          <div className="pf-scroll"><table className="pf-table"><thead><tr><th>Class</th><th>Join code</th><th>Students</th><th>Study plan</th><th /></tr></thead><tbody>
            {d.cohorts.map(c => <tr key={c.id}><td><b>{c.name}</b><br /><span className="pf-small pf-muted">Class {c.grade}</span></td><td><code className="pf-bigcode" style={{ fontSize: 15, letterSpacing: 2 }}>{c.code}</code></td><td>{c.students}</td><td className="pf-small">{c.curriculum || '–'}</td>
              <td>{d.school.admin && <button type="button" className="pf-btn sm ghost" onClick={() => toggle(c)}>{c.status === 'open' ? 'Close to new students' : 'Reopen'}</button>}</td></tr>)}
          </tbody></table></div>}</Card>
        {d.school.admin && <Card><CardHead title="New class" icon="plus" /><form className="pf-grid" onSubmit={add}>
          <label>Name<input className="pf-input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. 10-A" /></label>
          <label>Class<select className="pf-input" value={f.grade} onChange={e => setF({ ...f, grade: e.target.value })}>{['6', '7', '8', '9', '10', '11', '12'].map(g => <option key={g} value={g}>Class {g}</option>)}</select></label>
          <button type="submit" className="pf-btn" disabled={!f.name.trim()}>Create</button>
          {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: 0 }}>{err}</p>}</form></Card>}
      </div>
    </>
  );
}

export function SchoolMentors() {
  const { d, load } = useDashboard();
  const [f, setF] = useState({ fullName: '', email: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  if (!d) return <p role="status">Loading…</p>;
  const add = async e => { e.preventDefault(); setErr(''); setMsg(''); try { const r = await schoolApi.createMentor(f); setMsg(r.mentor.invited ? `${r.mentor.name} has an email to set their password.` : `${r.mentor.name} joined your school.`); setF({ fullName: '', email: '' }); await load(); } catch (x) { setErr(errMessage(x)); } };
  const total = d.mentors.reduce((a, m) => a + m.students, 0);
  return (
    <>
      <PageHead eyebrow="Mentors" title="Mentors">Who mentors whom. To give students a mentor, select them on the Students page (one mentor, or spread evenly).</PageHead>
      <div className="pf-grid g-main">
        <Card>{d.mentors.length === 0 ? <Empty icon="users" title="No mentors yet">Add your first mentor.</Empty> :
          <ul className="pf-list">{d.mentors.map(m => <li key={m.id}><span className="pf-grow"><b>{m.name}</b><br /><span className="pf-small pf-muted">{m.email}</span></span><div style={{ width: 160 }}><div className="pf-progress"><i style={{ width: `${total ? Math.round((m.students / Math.max(...d.mentors.map(x => x.students), 1)) * 100) : 0}%` }} /></div></div><Pill tone="grey">{m.students}</Pill></li>)}</ul>}
          <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>{d.totals.students - d.totals.withMentor} student{d.totals.students - d.totals.withMentor === 1 ? '' : 's'} without a mentor.</p></Card>
        {d.school.admin && <Card><CardHead title="Add a mentor" icon="plus" /><form className="pf-grid" onSubmit={add}>
          <label>Full name<input className="pf-input" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} /></label>
          <label>Email<input type="email" className="pf-input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
          <button type="submit" className="pf-btn" disabled={f.fullName.trim().length < 2 || !f.email.includes('@')}>Add and invite</button>
          {msg && <p className="pf-small" role="status" style={{ margin: 0 }}>{msg}</p>}{err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: 0 }}>{err}</p>}</form></Card>}
      </div>
    </>
  );
}

export function SchoolSettings() {
  const { d } = useDashboard();
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { schoolApi.settings().then(r => setS(r.settings)).catch(e => setErr(errMessage(e))); }, []);
  if (!s || !d) return <p role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p>;
  const save = async patch => { setErr(''); setMsg(''); try { setS((await schoolApi.saveSettings(patch)).settings); setMsg('Saved.'); } catch (x) { setErr(errMessage(x)); } };
  const admin = d.school.admin;
  return (
    <>
      <PageHead eyebrow="Settings" title="School settings">How iMenteo works for your school.</PageHead>
      <div className="pf-grid g-main">
        <Card><CardHead title="Your school" icon="settings" />
          <label className="pf-label" htmlFor="lg">Logo (an https link to an image)</label>
          <div className="pf-row" style={{ gap: 6 }}><input id="lg" className="pf-input" disabled={!admin} defaultValue={s.logoUrl} onBlur={e => e.target.value !== s.logoUrl && save({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />{s.logoUrl && <img src={s.logoUrl} alt="" style={{ height: 36 }} />}</div>
          <label className="pf-small pf-row" style={{ gap: 6, marginTop: 12 }}><input type="checkbox" disabled={!admin} checked={s.lockMentorSteps} onChange={e => save({ lockMentorSteps: e.target.checked })} />Steps a mentor sets are locked against the AI coach</label>
          <label className="pf-small pf-row" style={{ gap: 6, marginTop: 8 }}><input type="checkbox" disabled={!admin} checked={s.parentReports} onChange={e => save({ parentReports: e.target.checked })} />Mentors can share monthly reports with parents</label>
          <label className="pf-label" htmlFor="rd" style={{ marginTop: 12 }}>Keep a student’s data after they leave (days)</label>
          <input id="rd" type="number" className="pf-input" style={{ maxWidth: 160 }} disabled={!admin} defaultValue={s.retentionDays} min={30} max={3650} onBlur={e => Number(e.target.value) !== s.retentionDays && save({ retentionDays: Number(e.target.value) })} />
          {msg && <p className="pf-small" role="status">{msg}</p>}{err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
          {!admin && <p className="pf-small pf-faint">Only your school’s admin can change these.</p>}</Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="AI" icon="sparkles" /><p className="pf-small" style={{ margin: 0 }}>Today: ${d.ai.todayUsd.toFixed(4)} over {d.ai.calls} calls.{s.aiDailyUsd !== null ? ` Your daily budget is $${s.aiDailyUsd}; iMenteo sets it with you.` : ' No school budget is set: the platform limits apply.'}</p></Card>
          <Card><CardHead title="Privacy and safety" icon="shield" /><ul className="pf-small pf-o-list">
            <li>Students can see everything their mentor and you can see about them (“What my mentor sees”), and download a copy.</li>
            <li>Every look at a student’s data is recorded; admins can see who looked.</li>
            <li>Staff see what happened in messages and coach chats, never the words.</li>
            <li>Wellbeing alerts go to the mentor first and to you if nobody acknowledges them in 24 hours.</li>
            <li>A parent confirms consent before anyone sees a student’s work.</li>
            <li>No screen, keystroke or camera tracking: only learning activity on iMenteo.</li>
          </ul>{s.dpa && s.dpa.signedAt ? <p className="pf-small" style={{ margin: '6px 0 0' }}><Icon name="check" size={13} /> Data processing agreement signed ({s.dpa.version}).</p> : <p className="pf-small" style={{ margin: '6px 0 0', color: '#8A5A07' }}>No data processing agreement on record yet.</p>}</Card>
        </div>
      </div>
    </>
  );
}
