import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, CardHead, Drawer, Empty, Icon, PageHead, Tabs } from '../../ui/kit';
import { errMessage, mentorApi, sessionApi } from '../liveApi';
import { SessionCard, TimeFields, fmtWhen, todayIST } from '../SessionParts';

const iso = n => new Date(Date.now() + 5.5 * 3600000 + n * 86400000).toISOString().slice(0, 10);
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The mentor's usual meeting link, weekly free hours, days away, session length and whether bookings in free hours are confirmed at once. */
function Settings({ open, onClose, onSaved }) {
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setErr(''); mentorApi.settings().then(r => setF(r.settings)).catch(x => setErr(errMessage(x))); } }, [open]);
  const set = patch => setF(v => ({ ...v, ...patch }));
  const row = (k, i, patch) => set({ [k]: f[k].map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await mentorApi.saveSettings({ meetingUrl: f.meetingUrl.trim(), availability: f.availability, away: f.away, length: f.length, autoConfirm: f.autoConfirm }); await onSaved('Saved. Students see your free times and get your link with each session.'); onClose(); }
    catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  return (
    <Drawer open={open} title="Meeting link and free hours" onClose={onClose}>
      {!f ? <p className="pf-small pf-muted" role="status">{err || 'Loading…'}</p> : <form onSubmit={save}>
        <div className="pf-field"><label className="pf-label" htmlFor="st-url">Your meeting link</label>
          <input id="st-url" className="pf-input" value={f.meetingUrl} maxLength={600} onChange={e => set({ meetingUrl: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" />
          <p className="pf-small pf-faint" style={{ margin: '4px 0 0' }}>A Google Meet, Zoom or Teams link you reuse. It goes to the student with every confirmed session and in the calendar invite. Their parent does not see it. To make a reusable Meet link, open meet.google.com, choose “Create a meeting for later” and copy it.</p></div>
        <div className="pf-field"><label className="pf-label" htmlFor="st-len">Usual session length</label>
          <select id="st-len" className="pf-input" value={f.length} onChange={e => set({ length: Number(e.target.value) })}>{[30, 45, 60].map(l => <option key={l} value={l}>{l} minutes</option>)}</select></div>
        <div className="pf-eyebrow" style={{ marginTop: 14 }}>Free hours each week (India time)</div>
        <p className="pf-small pf-muted" style={{ margin: '2px 0 8px' }}>Students pick from these times. Leave empty to let them suggest any time.</p>
        {f.availability.map((r, i) => (
          <div key={i} className="pf-row pf-wrap" style={{ gap: 6, marginBottom: 6 }}>
            <label className="pf-sr" htmlFor={`av-d-${i}`}>Day</label><select id={`av-d-${i}`} className="pf-input" style={{ width: 140 }} value={r.day} onChange={e => row('availability', i, { day: Number(e.target.value) })}>{DAYS.map((d, k) => <option key={d} value={k}>{d}</option>)}</select>
            <label className="pf-sr" htmlFor={`av-f-${i}`}>From</label><input id={`av-f-${i}`} type="time" step="900" className="pf-input" style={{ width: 140 }} value={r.from} onChange={e => row('availability', i, { from: e.target.value })} />
            <span className="pf-small">to</span>
            <label className="pf-sr" htmlFor={`av-t-${i}`}>To</label><input id={`av-t-${i}`} type="time" step="900" className="pf-input" style={{ width: 140 }} value={r.to} onChange={e => row('availability', i, { to: e.target.value })} />
            <button type="button" className="pf-iconbtn" aria-label="Remove these hours" onClick={() => set({ availability: f.availability.filter((_, j) => j !== i) })}><Icon name="x" size={15} /></button>
          </div>))}
        <button type="button" className="pf-btn sm ghost" onClick={() => set({ availability: [...f.availability, { day: 1, from: '17:00', to: '19:00' }] })}><Icon name="plus" size={14} />Add hours</button>
        {f.availability.length > 0 && <label className="pf-small pf-row" style={{ gap: 6, marginTop: 10 }}><input type="checkbox" checked={f.autoConfirm} onChange={e => set({ autoConfirm: e.target.checked })} />Confirm a booking in these hours straight away (otherwise you accept each one)</label>}
        <div className="pf-eyebrow" style={{ marginTop: 14 }}>Days away</div>
        {f.away.map((r, i) => (
          <div key={i} className="pf-row pf-wrap" style={{ gap: 6, marginBottom: 6 }}>
            <label className="pf-sr" htmlFor={`aw-f-${i}`}>First day away</label><input id={`aw-f-${i}`} type="date" className="pf-input" style={{ width: 170 }} value={r.from} onChange={e => row('away', i, { from: e.target.value })} />
            <span className="pf-small">to</span>
            <label className="pf-sr" htmlFor={`aw-t-${i}`}>Last day away</label><input id={`aw-t-${i}`} type="date" className="pf-input" style={{ width: 170 }} value={r.to} min={r.from} onChange={e => row('away', i, { to: e.target.value })} />
            <button type="button" className="pf-iconbtn" aria-label="Remove this time away" onClick={() => set({ away: f.away.filter((_, j) => j !== i) })}><Icon name="x" size={15} /></button>
          </div>))}
        <button type="button" className="pf-btn sm ghost" onClick={() => set({ away: [...f.away, { from: todayIST(), to: todayIST() }] })}><Icon name="plus" size={14} />Add days away</button>
        <div style={{ marginTop: 16 }}><button type="submit" className="pf-btn" disabled={busy}>Save</button></div>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      </form>}
    </Drawer>
  );
}

/** A request from a student: accept it, offer another time, or say no with a reason they will see. */
function Request({ s, name, onDone, noLink }) {
  const [mode, setMode] = useState(null);
  const [t, setT] = useState({ date: s.date || iso(1), time: s.time || '', durationMin: s.durationMin || 45 });
  const [why, setWhy] = useState('');
  const [err, setErr] = useState('');
  const go = async (action, body) => { setErr(''); try { await sessionApi.act(s.id, action, body); await onDone(action === 'accept' ? `Confirmed with ${name}. You both have a calendar invite.` : action === 'propose' ? `New time sent to ${name}.` : `${name} has been told.`); } catch (x) { setErr(errMessage(x)); } };
  return (
    <div>
      <SessionCard s={s} role="mentor" name={name} onChanged={onDone}>
        {mode === null && <><button type="button" className="pf-btn sm" onClick={() => go('accept', {})}>Accept</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode('time')}>Offer another time</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode('decline')}>Decline</button></>}
      </SessionCard>
      <p className="pf-small pf-muted" style={{ margin: '6px 4px 0' }}>Answer by <b>{fmtWhen(s.answerBy)}</b>, or it expires.{noLink ? ' Add your meeting link first, so it goes out with the confirmation.' : ''}</p>
      {mode === 'time' && <form className="pf-sess-form" onSubmit={e => { e.preventDefault(); go('propose', { ...t, note: why.trim() }); }}>
        <TimeFields idp={`pr-${s.id}`} value={t} onChange={setT} />
        <label className="pf-sr" htmlFor={`prn-${s.id}`}>A note (optional)</label><input id={`prn-${s.id}`} className="pf-input" maxLength={300} value={why} onChange={e => setWhy(e.target.value)} placeholder="A note (optional), e.g. I teach until 5 that day" />
        <div className="pf-row" style={{ gap: 6 }}><button type="submit" className="pf-btn sm" disabled={!t.date || !t.time}>Offer this time</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Back</button></div>
      </form>}
      {mode === 'decline' && <form className="pf-sess-form" onSubmit={e => { e.preventDefault(); go('decline', { reason: why.trim() }); }}>
        <label className="pf-label" htmlFor={`dw-${s.id}`}>Reason</label><input id={`dw-${s.id}`} className="pf-input" maxLength={300} value={why} onChange={e => setWhy(e.target.value)} placeholder="e.g. I am away that day. Thursday works." />
        <div className="pf-row" style={{ gap: 6 }}><button type="submit" className="pf-btn sm" disabled={why.trim().length < 2}>Decline</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Back</button></div>
      </form>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </div>
  );
}

/** A session that has happened (or should have): write it up, or say it was missed. */
function WriteUp({ s, name, onWrite, onDone }) {
  const [missing, setMissing] = useState(false);
  const [who, setWho] = useState('student');
  const [err, setErr] = useState('');
  const missed = async e => { e.preventDefault(); setErr(''); try { await sessionApi.act(s.id, 'missed', { who }); await onDone('Marked as missed.'); } catch (x) { setErr(errMessage(x)); } };
  return (
    <div>
      <SessionCard s={s} role="mentor" name={name} onChanged={onDone}>
        <button type="button" className="pf-btn sm" onClick={onWrite}>Write up</button>
        <button type="button" className="pf-btn sm ghost" onClick={() => setMissing(m => !m)}>It did not happen</button>
      </SessionCard>
      {missing && <form className="pf-sess-form" onSubmit={missed}>
        <label className="pf-label" htmlFor={`ms-${s.id}`}>Who could not make it?</label>
        <select id={`ms-${s.id}`} className="pf-input" style={{ maxWidth: 260 }} value={who} onChange={e => setWho(e.target.value)}><option value="student">{name}</option><option value="mentor">Me</option><option value="both">Neither of us</option></select>
        <div className="pf-row" style={{ gap: 6 }}><button type="submit" className="pf-btn sm">Mark as missed</button><button type="button" className="pf-btn sm ghost" onClick={() => setMissing(false)}>Back</button></div>
      </form>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </div>
  );
}

export default function LiveSessions() {
  const { data, actions } = usePlatform();
  const [sp] = useSearchParams();
  const ready = data.students.filter(s => !s.limited);
  const by = id => data.students.find(s => String(s.id) === String(id)) || { name: 'Student' };
  const pre = ready.find(s => String(s.id) === sp.get('student'));
  const focus = sp.get('session');
  const requests = [...(data.sessionRequests || []), ...(data.proposed || [])];
  const lists = { requests, upcoming: data.sessions, writeup: data.writeup || [], past: data.recentSessions || [] };
  const [tab, setTab] = useState(() => (focus && Object.keys(lists).find(k => lists[k].some(x => x.id === focus))) || (pre ? 'upcoming' : requests.length ? 'requests' : (data.writeup || []).length ? 'writeup' : 'upcoming'));
  const [f, setF] = useState({ studentId: pre ? pre.id : ready[0] ? ready[0].id : '', topic: '' });
  const [t, setT] = useState({ date: iso(1), time: '', durationMin: 45 });
  const [settings, setSettings] = useState(false);
  const [open, setOpen] = useState(null);
  const [w, setW] = useState({ summary: '', actions: '', makeTasks: true, due: iso(7) });
  const [msg, setMsg] = useState('');
  const [bookErr, setBookErr] = useState('');
  const x = (data.writeup || []).concat(data.sessions).find(s => s.id === open);
  const done = async note => { await actions.reload(); if (typeof note === 'string') setMsg(note); };
  useEffect(() => { if (focus) { const el = document.getElementById(`session-${focus}`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); } }, [focus, tab]);
  const book = async e => {
    e.preventDefault(); setMsg(''); setBookErr('');
    try { await actions.schedule(f.studentId, { ...t, topic: f.topic }); setF({ ...f, topic: '' }); setT({ ...t, time: '' }); setTab('upcoming'); setMsg(`Booked with ${by(f.studentId).name}. You both have a calendar invite.`); }
    catch (err) { setBookErr(errMessage(err)); }
  };
  const finish = async e => {
    e.preventDefault();
    const steps = w.actions.split('\n').map(a => a.trim()).filter(Boolean);
    try { const r = await sessionApi.act(x.id, 'complete', { summary: w.summary, actions: steps, createTasks: w.makeTasks && steps.length > 0, tasksDue: w.due }); await actions.reload(); setOpen(null); setW({ summary: '', actions: '', makeTasks: true, due: iso(7) }); setMsg(r.tasksMade ? `Saved. ${r.tasksMade} next step${r.tasksMade > 1 ? 's are' : ' is'} now in ${by(x.studentId).name}’s tasks.` : 'Saved.'); }
    catch (err) { setMsg(errMessage(err)); }
  };
  const tabs = useMemo(() => [
    { id: 'requests', label: 'Requests', count: requests.length || undefined }, { id: 'upcoming', label: 'Upcoming', count: data.sessions.length || undefined },
    { id: 'writeup', label: 'To write up', count: (data.writeup || []).length || undefined }, { id: 'past', label: 'Past' }], [requests.length, data.sessions.length, data.writeup]);
  const list = lists[tab];
  return (
    <>
      <PageHead eyebrow="Sessions" title="Sessions with your students" actions={<button type="button" className="pf-btn ghost" onClick={() => setSettings(true)}><Icon name="settings" size={16} />Meeting link and hours</button>}>
        Answer requests, book sessions, join from here when it is time, and write each one up afterwards. Students and parents are told at every step; students and you get calendar invites.
      </PageHead>
      {!data.me.meetingUrl && <div className="pf-note" role="note" style={{ marginBottom: 14 }}><b>Add your meeting link.</b> Students get it with each confirmed session and join with one tap. <button type="button" className="act" style={{ background: 'none', border: 0, color: 'var(--indigo)', fontWeight: 600 }} onClick={() => setSettings(true)}>Add it now</button></div>}
      {msg && <div className="pf-note" role="status" style={{ marginBottom: 14 }}>{msg}</div>}
      <div className="pf-grid g-main">
        <Card>
          <Tabs label="Session lists" value={tab} onChange={setTab} tabs={tabs} />
          <div className="pf-sess-list" style={{ marginTop: 12 }}>
            {list.length === 0 ? <Empty icon="calendar" title={{ requests: 'No requests waiting', upcoming: 'Nothing booked', writeup: 'Nothing to write up', past: 'No past sessions yet' }[tab]}>
              {{ requests: 'When a student asks for a session, it appears here.', upcoming: 'Book one with the form, or wait for a request.', writeup: 'After a session, write it up here.', past: 'Sessions from the last month appear here.' }[tab]}</Empty>
              : list.map(s => (
                tab === 'requests' && s.status === 'requested' ? <Request key={s.id} s={s} name={by(s.studentId).name} onDone={done} noLink={!data.me.meetingUrl} />
                  : tab === 'writeup' ? <WriteUp key={s.id} s={s} name={by(s.studentId).name} onWrite={() => { setOpen(s.id); setW(v => ({ ...v, summary: '', actions: '' })); }} onDone={done} />
                    : <SessionCard key={s.id} s={s} role="mentor" name={by(s.studentId).name} onChanged={done} highlight={s.id === focus}>
                      {s.status === 'scheduled' && s.phase === 'live' && <button type="button" className="pf-btn sm ghost" onClick={() => { setOpen(s.id); setW(v => ({ ...v, summary: '', actions: '' })); }}>Write up</button>}
                    </SessionCard>))}
          </div>
          {tab === 'past' && list.some(s => s.status === 'done') && <p className="pf-small pf-faint">Summaries and next steps are shared with the student and their parent.</p>}
        </Card>
        <Card><CardHead title="Book a session" icon="plus" />
          {ready.length === 0 ? <p className="pf-small pf-muted">You can book once a student’s parent has confirmed.</p> :
            <form className="pf-grid" onSubmit={book}>
              <label>Student<select className="pf-input" value={f.studentId} onChange={e => setF({ ...f, studentId: e.target.value })}>{ready.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <TimeFields idp="bk" value={t} onChange={setT} minHours={0} />
              <label>Topic<input className="pf-input" value={f.topic} maxLength={200} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="What will you cover?" /></label>
              <div className="pf-row"><button type="submit" className="pf-btn" disabled={!t.date || !t.time}>Book</button></div>
              {bookErr && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: 0 }}>{bookErr}</p>}
              <p className="pf-small pf-faint" style={{ margin: 0 }}>It is confirmed straight away. The student and their parent are told, and you both get a calendar invite.</p>
            </form>}</Card>
      </div>
      <Settings open={settings} onClose={() => setSettings(false)} onSaved={done} />
      <Drawer open={!!x} title={x ? `Session with ${by(x.studentId).name}` : ''} onClose={() => setOpen(null)}>{x && <form onSubmit={finish}>
        <p className="pf-small pf-muted">{x.when}{x.topic ? ` · ${x.topic}` : ''}</p>
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
