import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Drawer, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { errMessage, mentorApi } from '../liveApi';

const iso = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** What a session will cover: the student's questions and the mentor's points, with a box to add one. */
function Agenda({ s, onChange }) {
  const [text, setText] = useState('');
  const add = async e => { e.preventDefault(); try { await mentorApi.addAgenda(s.id, text.trim()); setText(''); await onChange(); } catch { /* shown on reload */ } };
  return (
    <div className="pf-agenda-box">
      {(s.agenda || []).length > 0 && <ul className="pf-agenda">{(s.agenda || []).map((a, k) => <li key={k}><Icon name={a.by === 'student' ? 'bulb' : 'users'} size={13} />{a.text}<span className="pf-small pf-muted"> · {a.by === 'student' ? 'their question' : 'your point'}</span></li>)}</ul>}
      <form className="pf-row" style={{ gap: 6 }} onSubmit={add}>
        <label className="pf-sr" htmlFor={`mag-${s.id}`}>Add a point to cover</label>
        <input id={`mag-${s.id}`} className="pf-input" maxLength={300} value={text} onChange={e => setText(e.target.value)} placeholder="Add a point to cover" />
        <button type="submit" className="pf-btn sm ghost" disabled={text.trim().length < 2}>Add</button>
      </form>
    </div>
  );
}

/** A session a student asked for: accept it (optionally at another time), or decline with a reason they will see. */
function Request({ s, name, onDone }) {
  const [mode, setMode] = useState(null);
  const [time, setTime] = useState(s.time || '');
  const [why, setWhy] = useState('');
  const [err, setErr] = useState('');
  const go = async body => { setErr(''); try { await mentorApi.updateSession(s.id, body); await onDone(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <li style={{ display: 'block' }}>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}><Avatar name={name} size={32} /><span className="pf-grow"><b>{name}</b> asked for {fmtDate(s.date)}{s.time ? `, ${s.time}` : ''}<br /><span className="pf-small pf-muted">{s.topic || 'No topic given'}{s.note ? ` · “${s.note}”` : ''}</span></span>
        {mode === null && <><button type="button" className="pf-btn sm" onClick={() => go({ status: 'scheduled' })}>Accept</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode('time')}>Accept at another time</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode('decline')}>Decline</button></>}</div>
      {(s.agenda || []).length > 0 && <ul className="pf-agenda" style={{ marginLeft: 40 }}>{(s.agenda || []).map((a, k) => <li key={k}><Icon name="bulb" size={13} />{a.text}</li>)}</ul>}
      {mode === 'time' && <form className="pf-row" style={{ gap: 6, margin: '8px 0 0 40px' }} onSubmit={e => { e.preventDefault(); go({ status: 'scheduled', time }); }}><label className="pf-sr" htmlFor={`rt-${s.id}`}>Time</label><input id={`rt-${s.id}`} type="time" className="pf-input" style={{ width: 140 }} value={time} onChange={e => setTime(e.target.value)} /><button type="submit" className="pf-btn sm" disabled={!time}>Accept at {time || '…'}</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></form>}
      {mode === 'decline' && <form className="pf-row" style={{ gap: 6, margin: '8px 0 0 40px' }} onSubmit={e => { e.preventDefault(); go({ status: 'declined', note: why.trim() }); }}><label className="pf-sr" htmlFor={`dw-${s.id}`}>Reason</label><input id={`dw-${s.id}`} className="pf-input" maxLength={300} value={why} onChange={e => setWhy(e.target.value)} placeholder="e.g. I am away that day. Thursday works." /><button type="submit" className="pf-btn sm" disabled={why.trim().length < 2}>Decline</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></form>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </li>
  );
}

export default function LiveSessions() {
  const { data, actions } = usePlatform();
  const [sp] = useSearchParams();
  const ready = data.students.filter(s => !s.limited);
  const by = id => data.students.find(s => String(s.id) === String(id)) || { name: 'Student' };
  const pre = ready.find(s => String(s.id) === sp.get('student'));
  const [f, setF] = useState({ studentId: pre ? pre.id : ready[0] ? ready[0].id : '', date: iso(0), time: '', topic: '' });
  const [open, setOpen] = useState(null);
  const [w, setW] = useState({ summary: '', actions: '', makeTasks: true, due: iso(7) });
  const [msg, setMsg] = useState('');
  const x = data.sessions.find(s => s.id === open);
  const book = async e => { e.preventDefault(); setMsg(''); try { await actions.schedule(f.studentId, { date: f.date, time: f.time || undefined, topic: f.topic }); setF({ ...f, topic: '' }); setMsg('Session booked.'); } catch (err) { setMsg(errMessage(err)); } };
  const finish = async e => {
    e.preventDefault();
    const steps = w.actions.split('\n').map(a => a.trim()).filter(Boolean);
    try { const r = await mentorApi.updateSession(x.id, { status: 'done', summary: w.summary, actions: steps, createTasks: w.makeTasks && steps.length > 0, tasksDue: w.due }); await actions.reload(); setOpen(null); setW({ summary: '', actions: '', makeTasks: true, due: iso(7) }); setMsg(r.tasksMade ? `Saved. ${r.tasksMade} next step${r.tasksMade > 1 ? 's are' : ' is'} now in ${by(x.studentId).name}’s tasks.` : 'Saved.'); }
    catch (err) { setMsg(errMessage(err)); }
  };
  const requests = data.sessionRequests || [];
  return (
    <>
      <PageHead eyebrow="Sessions" title="Weekly sessions">Answer requests, book the next session, see what each student wants to talk about, and write it up afterwards. The summary and next steps are shared with the student and their parent.</PageHead>
      {msg && <div className="pf-note" role="status">{msg}</div>}
      {requests.length > 0 && <Card ai style={{ marginBottom: 18 }}><span className="tag"><Icon name="calendar" size={14} />Students asking for a session</span>
        <ul className="pf-list" style={{ marginTop: 6 }}>{requests.map(s => <Request key={s.id} s={s} name={by(s.studentId).name} onDone={actions.reload} />)}</ul></Card>}
      <div className="pf-grid g-main">
        <Card><CardHead title="Coming up" icon="calendar" />
          {data.sessions.length === 0 ? <Empty icon="calendar" title="Nothing booked">Book a session with the form.</Empty> :
            <ul className="pf-list">{data.sessions.map(s => (
              <li key={s.id} style={{ display: 'block' }}>
                <div className="pf-row pf-wrap" style={{ gap: 8 }}><Avatar name={by(s.studentId).name} size={34} /><span className="pf-grow"><b>{by(s.studentId).name}</b>{s.requestedBy === 'student' && <> <Pill tone="sky">They asked</Pill></>}<br /><span className="pf-small pf-muted">{fmtDate(s.date)}{s.time ? `, ${s.time}` : ''}{s.topic ? ` · ${s.topic}` : ''}</span></span>
                  <button type="button" className="pf-btn sm" onClick={() => { setOpen(s.id); setW(v => ({ ...v, actions: '' })); }}>Write up</button>
                  <button type="button" className="pf-btn sm ghost" onClick={() => actions.updateSession(s.id, { status: 'cancelled' })}>Cancel</button></div>
                <Agenda s={s} onChange={actions.reload} />
              </li>))}</ul>}</Card>
        <Card><CardHead title="Book a session" icon="plus" />
          {ready.length === 0 ? <p className="pf-small pf-muted">You can book once a student’s parent has confirmed.</p> :
            <form className="pf-grid" onSubmit={book}>
              <label>Student<select className="pf-input" value={f.studentId} onChange={e => setF({ ...f, studentId: e.target.value })}>{ready.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <div className="pf-grid g2"><label>Date<input className="pf-input" type="date" value={f.date} min={iso(0)} onChange={e => setF({ ...f, date: e.target.value })} /></label><label>Time<input className="pf-input" type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></label></div>
              <label>Topic<input className="pf-input" value={f.topic} maxLength={200} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="What will you cover?" /></label>
              <div className="pf-row"><button type="submit" className="pf-btn" disabled={!f.date}>Book</button></div>
            </form>}</Card>
      </div>
      <Drawer open={!!x} title={x ? `Session with ${by(x.studentId).name}` : ''} onClose={() => setOpen(null)}>{x && <form onSubmit={finish}>
        <p className="pf-small pf-muted">{fmtDate(x.date)}{x.time ? `, ${x.time}` : ''}{x.topic ? ` · ${x.topic}` : ''}</p>
        {(x.agenda || []).length > 0 && <><div className="pf-eyebrow">What you planned to cover</div><ul className="pf-agenda">{(x.agenda || []).map((a, k) => <li key={k}><Icon name={a.by === 'student' ? 'bulb' : 'users'} size={13} />{a.text}</li>)}</ul></>}
        <label className="pf-label" htmlFor="sum">What happened</label><textarea id="sum" className="pf-input" rows="5" value={w.summary} maxLength={3000} onChange={e => setW({ ...w, summary: e.target.value })} />
        <label className="pf-label" htmlFor="act" style={{ marginTop: 12 }}>Next steps (one per line)</label><textarea id="act" className="pf-input" rows="4" value={w.actions} onChange={e => setW({ ...w, actions: e.target.value })} />
        <div className="pf-row pf-wrap" style={{ gap: 10, margin: '10px 0' }}>
          <label className="pf-small pf-row" style={{ gap: 6 }}><input type="checkbox" checked={w.makeTasks} onChange={e => setW({ ...w, makeTasks: e.target.checked })} />Add the next steps to their tasks, due</label>
          <label className="pf-sr" htmlFor="tdue">Due date for the tasks</label><input id="tdue" type="date" className="pf-input" style={{ width: 170 }} min={iso(0)} value={w.due} disabled={!w.makeTasks} onChange={e => setW({ ...w, due: e.target.value })} />
        </div>
        <p className="pf-small pf-faint">The student and parent can read this. Use Notes for anything private.</p>
        <button type="submit" className="pf-btn" disabled={!w.summary.trim()}><Icon name="check" size={16} />Save and mark done</button></form>}</Drawer>
    </>
  );
}
