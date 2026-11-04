import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Drawer, Icon, PageHead } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { errMessage, firstName, studentApi } from '../liveApi';
import Thread from '../Thread';
import { Join, SessionCard, SlotPicker, TimeFields, todayIST, useNow } from '../SessionParts';

/** No mentor yet: enter the code your mentor or school gave you, or wait for iMenteo to assign one. */
function Connect() {
  const { data, actions } = usePlatform();
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const r = data.mentorRequest;
  const ask = async e => { e.preventDefault(); setBusy(true); setErr(''); try { await studentApi.requestMentor(code, note.trim()); await actions.reload(); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const cancel = async () => { setErr(''); try { await studentApi.cancelMentorRequest(); await actions.reload(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <>
      <PageHead eyebrow="Your mentor" title="Connect with your mentor">Every student has a mentor who meets them once a week, reads their learning log, checks their work and answers questions in between.</PageHead>
      <div className="pf-grid g-main">
        <Card ai>
          {r && r.status === 'pending' ? <>
            <span className="tag"><Icon name="clock" size={14} />Request sent</span>
            <h3 style={{ fontSize: 22, margin: '10px 0 6px' }}>Waiting for {r.mentor ? r.mentor.name : 'your mentor'} to accept</h3>
            <p style={{ margin: '0 0 12px' }}>You will see them here, with your sessions and messages, as soon as they accept.</p>
            <button type="button" className="pf-btn sm ghost" onClick={cancel}>Withdraw the request</button>
          </> : <form onSubmit={ask}>
            <span className="tag"><Icon name="users" size={14} />Have a mentor code?</span>
            <p style={{ margin: '10px 0 12px' }}>If your mentor or your school gave you a 6-letter code, enter it here to ask them to be your mentor.</p>
            <label className="pf-label" htmlFor="mcode">Mentor code</label>
            <input id="mcode" className="pf-input pf-code" maxLength={8} autoComplete="off" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. K7M2QX" style={{ maxWidth: 220 }} />
            <label className="pf-label" htmlFor="mnote" style={{ marginTop: 10 }}>A line about you (optional)</label>
            <input id="mnote" className="pf-input" maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Class 10, I want to become a pilot" />
            <button type="submit" className="pf-btn" style={{ marginTop: 12 }} disabled={busy || code.replace(/[^A-Z0-9]/g, '').length !== 6}>{busy ? 'Sending…' : 'Ask to connect'}</button>
          </form>}
          {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
        </Card>
        <Card><CardHead title="No code?" icon="info" /><p className="pf-small" style={{ margin: 0 }}>That is fine: the iMenteo team gives every student a mentor. You do not need to do anything. Meanwhile, keep going with <Link to="../plan">your weekly plan</Link> and <Link to="../tasks">your tasks</Link>.</p></Card>
      </div>
    </>
  );
}

/** Ask for a session: one of the mentor's free times when they have set hours, or any day and time at least 3 hours ahead. */
function RequestSession({ open, onClose, onDone, mentorName }) {
  const [slots, setSlots] = useState(null);
  const [pick, setPick] = useState('');
  const [t, setT] = useState({ date: todayIST(), time: '', durationMin: 45 });
  const [f, setF] = useState({ topic: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open) return;
    setErr(''); setPick('');
    studentApi.slots().then(r => { setSlots(r); setT(v => ({ ...v, durationMin: r.length || 45 })); }).catch(() => setSlots({ hoursSet: false, days: [] }));
  }, [open]);
  const useSlots = slots && slots.hoursSet;
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const when = useSlots ? { start: pick, durationMin: slots.length } : t;
      const r = await studentApi.requestSession({ ...when, topic: f.topic.trim(), note: f.note.trim() });
      await onDone(r.session && r.session.status === 'scheduled' ? 'Booked. It is in your sessions, and a calendar invite is on its way.' : `Sent. ${firstName(mentorName)} will confirm it or suggest another time.`);
      setF({ topic: '', note: '' }); onClose();
    } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  return (
    <Drawer open={open} title="Ask for a session" onClose={onClose}>
      <form onSubmit={submit}>
        {slots === null ? <p className="pf-small pf-muted" role="status">Finding free times…</p> : useSlots ? <>
          <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Pick one of {firstName(mentorName)}’s free times ({slots.length} minutes, India time).{slots.autoConfirm ? ' It is booked straight away.' : ` ${firstName(mentorName)} confirms it.`}</p>
          <SlotPicker days={slots.days} value={pick} onPick={setPick} />
        </> : <>
          <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Suggest a day and time that suits you. {firstName(mentorName)} confirms it, or suggests another time.</p>
          <TimeFields idp="rq" value={t} onChange={setT} />
        </>}
        <div className="pf-field"><label className="pf-label" htmlFor="rq-topic">What about?</label><input id="rq-topic" className="pf-input" maxLength={200} value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="e.g. I am stuck on this week’s maths" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="rq-note">Anything else (optional)</label><input id="rq-note" className="pf-input" maxLength={300} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="e.g. After 5 pm works best on weekdays" /></div>
        <button type="submit" className="pf-btn" disabled={busy || slots === null || (useSlots ? !pick : !t.date || !t.time)}>{useSlots && slots.autoConfirm ? 'Book this time' : 'Send the request'}</button>
        <p className="pf-small pf-faint">If your mentor does not answer within 2 days (or an hour before the time), the request expires and you can ask again.</p>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      </form>
    </Drawer>
  );
}

/** A session starting within the hour (or happening now) goes to the top of the page, with the Join button, so it cannot be missed on a phone. */
function JoinBanner({ list, name }) {
  const now = useNow();
  const s = list.find(x => x.status === 'scheduled' && x.start && Date.parse(x.start) - now < 3600000 && now <= Date.parse(x.joinUntil));
  if (!s) return null;
  return (
    <div className="pf-joinbar" role="status">
      <Icon name="video" size={18} />
      <span className="pf-grow">{Date.parse(s.start) <= now ? `Your session with ${firstName(name)} is happening now` : `Your session with ${firstName(name)} starts at ${s.when.split(', ').pop()}`}{s.topic ? ` · ${s.topic}` : ''}</span>
      <Join s={s} role="student" now={now} />
    </div>
  );
}

/** The student's hub with their mentor: messages, the next session and its agenda, summaries and past sessions. */
export default function LiveMentor() {
  const { data, actions } = usePlatform();
  const [sp] = useSearchParams();
  const [asking, setAsking] = useState(sp.get('ask') === '1');           // the coach's "Ask for a session" card opens it straight away
  const [msg, setMsg] = useState('');
  const load = useCallback(() => studentApi.messages(), []);
  const send = useCallback(text => studentApi.sendMessage(text), []);
  const m = data.mentor, s = data.sessions;
  if (!m) return <Connect />;
  // soonest first, so a session happening now is on top; one waiting for the summary goes last
  const at = x => (x.phase === 'writeup' ? Infinity : Date.parse(x.start || `${x.date}T23:59:00Z`));
  const coming = [...(s.requested || []), ...(s.upcoming || (s.next ? [s.next] : [])), ...(s.writeup || [])].sort((a, b) => at(a) - at(b));
  const closed = (s.closed || s.declined || []).slice(0, 4);
  const summaries = (data.mentorNotes || []);
  const done = async note => { await actions.reload(); if (note) setMsg(note); };
  return (
    <>
      <PageHead eyebrow="Your mentor" title={m.name} actions={<button type="button" className="pf-btn" onClick={() => setAsking(true)}><Icon name="calendar" size={16} />Ask for a session</button>}>
        You meet once a week. In between, message {firstName(m.name)} with questions, add things to talk about, and read their feedback here.
      </PageHead>
      {msg && <div className="pf-note" role="status">{msg}</div>}
      <JoinBanner list={coming} name={m.name} />
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card flush>
            <div className="pf-card-h" style={{ padding: '16px 18px 0' }}><Icon name="message" size={20} className="pf-faint" /><h3>Messages</h3></div>
            <Thread studentId={data.me.id} load={load} send={send} me="student" names={{ mentor: firstName(m.name), student: 'You' }} onRead={() => data.inbox && data.inbox.unread && actions.reload()}
              empty={`Ask ${firstName(m.name)} anything about your plan, a task or a career. They usually reply within a day or two.`}
              note="Messages stay on iMenteo. Your parent can read them too." />
          </Card>
          <Card><CardHead title="Summaries and notes from your mentor" icon="file" />
            {summaries.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>After your sessions, your mentor’s weekly summaries appear here.</p> :
              <div className="pf-timeline">{summaries.map(n => <div key={n.id} className="pf-tl"><b>{n.title || (n.kind === 'summary' ? 'Weekly summary' : 'Note')}</b> <span className="pf-small pf-muted">· {fmtDate(n.at)}</span><p className="pf-small" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.text}</p></div>)}</div>}</Card>
          <Card><CardHead title="Past sessions" icon="calendar" />
            {s.history.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Your first session has not happened yet. Notes and next steps will appear here afterwards.</p> :
              <div className="pf-timeline">{s.history.map(h => (
                <div key={h.id} className="pf-tl"><b>{fmtDate(h.date)}</b>{h.topic && <span className="pf-small pf-muted"> · {h.topic}</span>}<p className="pf-small" style={{ margin: '4px 0 6px' }}>{h.summary}</p>
                  <div className="pf-row pf-wrap">{h.actions.map(a => <span key={a} className="pf-pill grey"><Icon name="check" size={12} />{a}</span>)}</div>
                  {h.tasksCreated && <p className="pf-small" style={{ margin: '6px 0 0' }}><Link to="../tasks">These next steps are in your tasks</Link></p>}</div>))}</div>}</Card>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><div className="pf-row"><Avatar name={m.name} size={52} /><div><b>{m.name}</b><div className="pf-small pf-muted">Your mentor</div></div></div></Card>
          <Card><CardHead title="Your sessions" icon="calendar" />
            {coming.length ? <div className="pf-sess-list">{coming.map(x => <SessionCard key={x.id} s={x} role="student" name={m.name} onChanged={actions.reload} />)}</div>
              : <><p className="pf-small" style={{ margin: '0 0 10px' }}>Nothing booked yet. Your mentor will set one, or you can ask.</p><button type="button" className="pf-btn sm" onClick={() => setAsking(true)}>Ask for a session</button></>}
          </Card>
          {closed.length > 0 && <Card><CardHead title="Recently closed" icon="clock" /><div className="pf-sess-list">{closed.map(x => <SessionCard key={x.id} s={{ agenda: [], ...x }} role="student" name={m.name} onChanged={actions.reload} />)}</div></Card>}
          <Card><CardHead title="Bring to the session" icon="bulb" /><ul className="pf-list"><li>Your daily learning log: what clicked and what was hard</li><li>Tasks you finished, and ones you are stuck on</li><li>One thing you are proud of</li></ul></Card>
        </div>
      </div>
      <RequestSession open={asking} onClose={() => setAsking(false)} onDone={done} mentorName={m.name} />
    </>
  );
}
