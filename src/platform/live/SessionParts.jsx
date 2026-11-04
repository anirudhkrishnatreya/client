// The pieces every session screen shares: what state it is in, how long until it starts, the Join button (open from 10 minutes
// before), adding it to a calendar, picking a time, and one card per session with the moves the viewer may make.
// The server decides everything (services/sessions.js); these only show it and send the viewer's choice.
import { useEffect, useState } from 'react';
import { Avatar, Icon, Pill } from '../ui/kit';
import { errMessage, sessionApi } from './liveApi';

const IST = { timeZone: 'Asia/Kolkata' };
export const fmtWhen = iso => (iso ? new Date(iso).toLocaleString('en-IN', { ...IST, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '');
export const todayIST = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
const plusDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** Re-renders every `ms` so countdowns and the Join button stay right. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const PHASE = { upcoming: ['Confirmed', 'leaf'], soon: ['Starting soon', 'sky'], live: ['Happening now', 'coral'], tbd: ['Time to be set', 'grey'] };
/** The status in words, as this viewer should read it. */
export function statusOf(s, role) {
  if (s.status === 'requested') return role === 'mentor' ? ['Waiting for you', 'gold'] : ['Waiting for the mentor', 'gold'];
  if (s.status === 'proposed') return role === 'student' ? ['New time offered', 'gold'] : ['Waiting for the student', 'grey'];
  if (s.status === 'scheduled') {
    if (s.phase === 'writeup') return role === 'mentor' ? ['Waiting for write-up', 'gold'] : ['Summary coming', 'grey'];
    return PHASE[s.phase] || PHASE.upcoming;
  }
  return { done: ['Done', 'leaf'], missed: ['Missed', 'grey'], declined: ['Declined', 'coral'], withdrawn: ['Withdrawn', 'grey'], expired: ['Expired', 'grey'], cancelled: [s.closed && s.closed.late ? 'Cancelled late' : 'Cancelled', 'grey'] }[s.status] || [s.status, 'grey'];
}
export const StatusPill = ({ s, role }) => { const [label, tone] = statusOf(s, role); return <Pill tone={tone}>{label}</Pill>; };

export function untilText(s, now) {
  if (!s.start || !['scheduled', 'requested', 'proposed'].includes(s.status)) return '';
  const ms = Date.parse(s.start) - now;
  if (ms <= 0) return now <= Date.parse(s.end) ? 'Happening now' : '';
  const m = Math.round(ms / 60000);
  if (m < 60) return `Starts in ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Starts in ${h} h${m % 60 ? ` ${m % 60} min` : ''}`;
  const d = Math.round(h / 24);
  return `In ${d} day${d > 1 ? 's' : ''}`;
}

/** Join opens 10 minutes before the start and stays open until 15 minutes after the end. */
export function Join({ s, role, now }) {
  if (!s.start || s.status !== 'scheduled' || s.phase === 'writeup') return null;
  if (!s.meetingUrl) return <span className="pf-small pf-muted">{role === 'mentor' ? 'No meeting link yet: add one so they can join.' : role === 'parent' ? '' : 'Your mentor will add the meeting link.'}</span>;
  const open = now >= Date.parse(s.joinFrom) && now <= Date.parse(s.joinUntil);
  return open
    ? <a className="pf-btn sm" href={s.meetingUrl} target="_blank" rel="noopener noreferrer"><Icon name="video" size={15} />Join now</a>
    : <span className="pf-btn sm ghost pf-disabled" aria-disabled="true" title={s.meetingUrl}><Icon name="video" size={15} />Join opens 10 min before</span>;
}

const gStamp = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
/** "Add to calendar": straight into Google Calendar, or a file for any other calendar. */
export function AddToCalendar({ s, title }) {
  const [err, setErr] = useState('');
  if (!s.start || s.status !== 'scheduled') return null;
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gStamp(s.start)}/${gStamp(s.end)}&details=${encodeURIComponent([s.topic, 'Open iMenteo to see the agenda.'].filter(Boolean).join('\n'))}${s.meetingUrl ? `&location=${encodeURIComponent(s.meetingUrl)}` : ''}`;
  const file = async () => {
    setErr('');
    try {
      const blob = await sessionApi.calendar(s.id);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'mentor-session.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (x) { setErr(errMessage(x, 'Could not make the calendar file.')); }
  };
  return (
    <details className="pf-cal">
      <summary className="pf-btn sm ghost"><Icon name="calendar" size={15} />Add to calendar</summary>
      <div className="pf-cal-menu"><a href={google} target="_blank" rel="noopener noreferrer">Google Calendar</a><button type="button" onClick={file}>Other calendars (.ics file)</button>{err && <span className="pf-small" role="alert">{err}</span>}</div>
    </details>
  );
}

/** A day, a time (India time) and a length. `minHours`: how far ahead the earliest allowed time is (said, and checked by the server). */
export function TimeFields({ value, onChange, idp, minHours = 3, lengths = [30, 45, 60] }) {
  const set = k => e => onChange({ ...value, [k]: k === 'durationMin' ? Number(e.target.value) : e.target.value });
  return (
    <div className="pf-timefields">
      <div className="pf-field"><label className="pf-label" htmlFor={`${idp}-date`}>Day</label><input id={`${idp}-date`} type="date" className="pf-input" min={todayIST()} max={plusDays(todayIST(), 90)} value={value.date} onChange={set('date')} /></div>
      <div className="pf-field"><label className="pf-label" htmlFor={`${idp}-time`}>Time</label><input id={`${idp}-time`} type="time" step="900" className="pf-input" value={value.time} onChange={set('time')} /></div>
      <div className="pf-field"><label className="pf-label" htmlFor={`${idp}-len`}>Length</label><select id={`${idp}-len`} className="pf-input" value={value.durationMin} onChange={set('durationMin')}>{lengths.map(l => <option key={l} value={l}>{l} minutes</option>)}</select></div>
      <p className="pf-small pf-faint" style={{ gridColumn: '1 / -1', margin: 0 }}>India time. {minHours >= 1 ? `At least ${minHours} hours from now.` : 'Any time from now on.'}</p>
    </div>
  );
}

/** The mentor's free times, by day. */
export function SlotPicker({ days, value, onPick }) {
  if (!days.length) return <p className="pf-small pf-muted">No free times in the next two weeks. Message your mentor to find a time.</p>;
  return (
    <div className="pf-slots">{days.map(d => (
      <div key={d.date} className="pf-slotday"><b className="pf-small">{d.label}</b>
        <div className="pf-chip-row">{d.times.map(t => <button key={t.start} type="button" className="pf-chip" aria-pressed={value === t.start} onClick={() => onPick(t.start)}>{new Date(t.start).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit', hour12: true })}</button>)}</div>
      </div>))}</div>
  );
}

const blankTime = (len = 45) => ({ date: plusDays(todayIST(), 1), time: '', durationMin: len });

/**
 * One session as the viewer sees it, with the moves they may make. `name`: the other person. `onChanged`: called after a move.
 * `children`: extra buttons from the page (the mentor's write-up, for example).
 */
export function SessionCard({ s, role, name, onChanged, children, highlight = false }) {
  const now = useNow();
  const [mode, setMode] = useState(null);                                  // null · move · cancel · decline
  const [t, setT] = useState(() => ({ ...blankTime(s.durationMin), durationMin: s.durationMin || 45 }));
  const [why, setWhy] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async (action, body = {}) => {
    setBusy(true); setErr('');
    try { await sessionApi.act(s.id, action, body); setMode(null); setWhy(''); await onChanged(); }
    catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  const addPoint = async e => { e.preventDefault(); setErr(''); try { await sessionApi.act(s.id, 'agenda', { text: text.trim() }); setText(''); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  const other = role === 'mentor' ? 'the student' : 'your mentor';
  const upcoming = s.status === 'scheduled' && s.phase !== 'writeup' && (!s.start || Date.parse(s.start) > now);
  const open = ['requested', 'proposed'].includes(s.status);
  const canTalk = role !== 'parent' && (open || (s.status === 'scheduled' && s.phase !== 'writeup'));
  const ch = s.change;
  const agenda = s.agenda || [];
  return (
    <div className={`pf-sess${highlight ? ' hl' : ''}`} id={`session-${s.id}`}>
      <div className="pf-sess-h">
        <Avatar name={name} size={36} />
        <div className="pf-grow" style={{ minWidth: 0 }}>
          <div className="pf-row pf-wrap" style={{ gap: 8 }}><b>{name}</b><StatusPill s={s} role={role} />{s.requestedBy === 'student' && role === 'mentor' && s.status === 'scheduled' && <Pill tone="sky">They asked</Pill>}</div>
          <div className="pf-sess-when">{s.when}{s.start ? ` · ${s.durationMin} min` : ''}</div>
          {untilText(s, now) && <div className="pf-small pf-muted">{untilText(s, now)}</div>}
        </div>
      </div>
      {s.topic && <p className="pf-small" style={{ margin: '8px 0 0' }}><b>Topic:</b> {s.topic}</p>}
      {s.note && open && <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>“{s.note}”</p>}

      {s.status === 'requested' && role !== 'mentor' && <p className="pf-sess-note">{role === 'student' ? 'Your mentor' : 'The mentor'} answers by <b>{fmtWhen(s.answerBy)}</b>. If not, the request expires{role === 'student' ? ' and you can ask again' : ''}.</p>}
      {s.status === 'proposed' && role === 'student' && <div className="pf-sess-note"><p style={{ margin: 0 }}>{name} cannot do {s.askedStart ? fmtWhen(s.askedStart) : 'the time you asked for'} and suggests <b>{s.when}</b> instead. Answer by <b>{fmtWhen(s.answerBy)}</b>.</p>
        <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 8 }}><button type="button" className="pf-btn sm" disabled={busy} onClick={() => go('respond', { accept: true })}>Accept this time</button><button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => setMode('decline')}>Say no</button></div></div>}
      {s.status === 'proposed' && role === 'mentor' && <p className="pf-sess-note">You suggested this time{ s.askedStart ? ` instead of ${fmtWhen(s.askedStart)}` : ''}. Waiting for an answer until {fmtWhen(s.answerBy)}.</p>}
      {ch && role !== 'parent' && (ch.by !== role
        ? <div className="pf-sess-note"><p style={{ margin: 0 }}>{role === 'mentor' ? name : 'Your mentor'} asked to move this to <b>{ch.when}</b>{ch.note ? `: “${ch.note}”` : '.'} Until you answer, it stays at {s.when}. Answer by {fmtWhen(ch.answerBy)}.</p>
          <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 8 }}><button type="button" className="pf-btn sm" disabled={busy} onClick={() => go('respond', { accept: true })}>Accept the new time</button><button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => go('respond', { accept: false })}>Keep {s.time ? 'the old time' : 'it as it is'}</button></div></div>
        : <p className="pf-sess-note">You asked to move this to <b>{ch.when}</b>. Waiting for {other} to answer (until {fmtWhen(ch.answerBy)}); until then it stays at {s.when}.</p>)}
      {ch && role === 'parent' && <p className="pf-sess-note">A new time ({ch.when}) has been asked for.</p>}
      {s.closed && ['declined', 'cancelled', 'withdrawn', 'expired', 'missed'].includes(s.status) && <p className="pf-sess-note">
        {s.status === 'expired' ? 'Not answered in time.' : s.status === 'withdrawn' ? 'Withdrawn by the student.' : s.status === 'missed' ? `Did not happen${s.missedBy === 'student' ? ': the student could not make it' : s.missedBy === 'mentor' ? ': the mentor could not make it' : ''}.` : `${s.closed.by === role ? 'You' : s.closed.by === 'mentor' ? (role === 'student' ? 'Your mentor' : 'The mentor') : (role === 'mentor' ? name : 'The student')} ${s.status === 'declined' ? 'said no' : 'cancelled'}${s.closed.late ? ' less than 2 hours before' : ''}.`}
        {s.closed.reason ? ` “${s.closed.reason}”` : ''}</p>}

      {s.status === 'done' && s.summary && <div className="pf-sess-note"><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{s.summary}</p>
        {(s.actions || []).length > 0 && <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 6 }}>{s.actions.map(a => <span key={a} className="pf-pill grey"><Icon name="check" size={12} />{a}</span>)}</div>}</div>}
      {role !== 'parent' && <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 10 }}>
        <Join s={s} role={role} now={now} />
        <AddToCalendar s={s} title={`Mentor session${role === 'mentor' ? ` with ${name}` : ''}`} />
        {upcoming && !ch && s.start && <button type="button" className="pf-btn sm ghost" onClick={() => setMode(mode === 'move' ? null : 'move')}>Ask to move</button>}
        {upcoming && <button type="button" className="pf-btn sm ghost" onClick={() => setMode(mode === 'cancel' ? null : 'cancel')}>Cancel</button>}
        {open && role === 'student' && <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => go('withdraw')}>Withdraw</button>}
        {children}
      </div>}
      {role === 'parent' && s.status === 'scheduled' && <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>{s.hasLink ? 'Joined online with the link the mentor shares.' : 'The mentor will share a link to join.'}</p>}

      {mode === 'move' && <form className="pf-sess-form" onSubmit={e => { e.preventDefault(); go('reschedule', { ...t, note: why.trim() }); }}>
        <TimeFields idp={`mv-${s.id}`} value={t} onChange={setT} />
        <label className="pf-sr" htmlFor={`mvn-${s.id}`}>Why (optional)</label><input id={`mvn-${s.id}`} className="pf-input" maxLength={300} value={why} onChange={e => setWhy(e.target.value)} placeholder="Why (optional), e.g. I have an exam that morning" />
        <div className="pf-row" style={{ gap: 6 }}><button type="submit" className="pf-btn sm" disabled={busy || !t.date || !t.time}>Ask for this time</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Back</button></div>
        <p className="pf-small pf-faint" style={{ margin: 0 }}>{role === 'mentor' ? 'The student' : 'Your mentor'} accepts or keeps the current time.</p>
      </form>}
      {(mode === 'cancel' || mode === 'decline') && <form className="pf-sess-form" onSubmit={e => { e.preventDefault(); go(mode === 'cancel' ? 'cancel' : 'respond', mode === 'cancel' ? { reason: why.trim() } : { accept: false, reason: why.trim() }); }}>
        <label className="pf-label" htmlFor={`cx-${s.id}`}>{mode === 'cancel' ? 'Why are you cancelling?' : 'Why not? (optional)'}</label>
        <input id={`cx-${s.id}`} className="pf-input" maxLength={300} value={why} onChange={e => setWhy(e.target.value)} placeholder={mode === 'cancel' ? 'e.g. I am unwell. Can we do Thursday?' : 'e.g. I have school then'} />
        {mode === 'cancel' && s.start && Date.parse(s.start) - now < 2 * 3600000 && <p className="pf-small" style={{ color: 'var(--coral)', margin: 0 }}>It starts in under 2 hours, so this shows as a late cancellation.</p>}
        <div className="pf-row" style={{ gap: 6 }}><button type="submit" className="pf-btn sm" disabled={busy || (mode === 'cancel' && why.trim().length < 2)}>{mode === 'cancel' ? 'Cancel the session' : 'Say no'}</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Back</button></div>
      </form>}

      {(agenda.length > 0 || canTalk) && <div className="pf-agenda-box">
        {agenda.length > 0 && <><div className="pf-eyebrow">To talk about</div><ul className="pf-agenda">{agenda.map((a, k) => <li key={k}><Icon name={a.by === 'student' ? 'bulb' : 'users'} size={13} />{a.text}<span className="pf-small pf-muted"> · {a.by === role ? 'you' : a.by === 'mentor' ? 'from the mentor' : role === 'mentor' ? 'their question' : 'from the student'}</span></li>)}</ul></>}
        {canTalk && <form className="pf-row" style={{ gap: 6 }} onSubmit={addPoint}>
          <label className="pf-sr" htmlFor={`ag-${s.id}`}>Add something to talk about</label>
          <input id={`ag-${s.id}`} className="pf-input" maxLength={300} value={text} onChange={e => setText(e.target.value)} placeholder={role === 'mentor' ? 'Add a point to cover' : 'Add a question to bring'} />
          <button type="submit" className="pf-btn sm ghost" disabled={text.trim().length < 2}>Add</button>
        </form>}
      </div>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
    </div>
  );
}
