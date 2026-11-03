import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Drawer, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { errMessage, firstName, studentApi } from '../liveApi';
import Thread from '../Thread';

const inDays = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

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

/** The next session with its agenda: what you want to talk about, and what your mentor added. */
function NextSession({ s, onChange }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const add = async e => { e.preventDefault(); setErr(''); try { await studentApi.addAgenda(s.id, text.trim()); setText(''); await onChange(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Card ai>
      <span className="tag"><Icon name="calendar" size={14} />{s.status === 'requested' ? 'You asked for' : 'Next session'}</span>
      <h4 style={{ fontSize: 20, margin: '8px 0 2px' }}>{fmtDate(s.date)}{s.time ? `, ${s.time}` : ''}</h4>
      {s.topic && <p className="pf-small" style={{ margin: 0 }}>{s.topic}</p>}
      {s.status === 'requested' && <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>Waiting for your mentor to confirm.</p>}
      <div className="pf-eyebrow" style={{ marginTop: 12 }}>To talk about</div>
      {(s.agenda || []).length === 0 ? <p className="pf-small pf-muted" style={{ margin: '4px 0' }}>Nothing yet. Add a question or something you are stuck on.</p>
        : <ul className="pf-agenda">{(s.agenda || []).map((a, k) => <li key={k}><Icon name={a.by === 'mentor' ? 'users' : 'bulb'} size={13} />{a.text}{a.by === 'mentor' && <span className="pf-small pf-muted"> · from your mentor</span>}</li>)}</ul>}
      <form className="pf-row" style={{ gap: 6, marginTop: 6 }} onSubmit={add}>
        <label className="pf-sr" htmlFor={`ag-${s.id}`}>Add something to talk about</label>
        <input id={`ag-${s.id}`} className="pf-input" maxLength={300} value={text} onChange={e => setText(e.target.value)} placeholder="Add a question to bring" />
        <button type="submit" className="pf-btn sm" disabled={text.trim().length < 2}>Add</button>
      </form>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

function RequestSession({ open, onClose, onDone }) {
  const [f, setF] = useState({ date: inDays(2), time: '', topic: '', note: '' });
  const [err, setErr] = useState('');
  const submit = async e => { e.preventDefault(); setErr(''); try { await studentApi.requestSession({ date: f.date, time: f.time || undefined, topic: f.topic.trim(), note: f.note.trim() }); await onDone(); onClose(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Drawer open={open} title="Ask for a session" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Suggest a day and time that suits you. Your mentor confirms it, or suggests another.</p>
        <div className="pf-grid g2"><div className="pf-field"><label className="pf-label" htmlFor="rq-date">Day</label><input id="rq-date" type="date" className="pf-input" min={inDays(0)} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="rq-time">Time (optional)</label><input id="rq-time" type="time" className="pf-input" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></div></div>
        <div className="pf-field"><label className="pf-label" htmlFor="rq-topic">What about?</label><input id="rq-topic" className="pf-input" maxLength={200} value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="e.g. I am stuck on this week’s maths" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="rq-note">Anything else (optional)</label><input id="rq-note" className="pf-input" maxLength={300} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="e.g. After 5 pm works best on weekdays" /></div>
        <button type="submit" className="pf-btn" disabled={!f.date}>Send the request</button>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      </form>
    </Drawer>
  );
}

/** The student's hub with their mentor: messages, the next session and its agenda, summaries and past sessions. */
export default function LiveMentor() {
  const { data, actions } = usePlatform();
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => studentApi.messages(), []);
  const send = useCallback(text => studentApi.sendMessage(text), []);
  const m = data.mentor, s = data.sessions;
  if (!m) return <Connect />;
  const coming = [...(s.requested || []), ...(s.next ? [s.next] : [])];
  const summaries = (data.mentorNotes || []);
  const cancel = async id => { setMsg(''); try { await studentApi.cancelSession(id); await actions.reload(); } catch (x) { setMsg(errMessage(x)); } };
  return (
    <>
      <PageHead eyebrow="Your mentor" title={m.name} actions={<button type="button" className="pf-btn" onClick={() => setAsking(true)}><Icon name="calendar" size={16} />Ask for a session</button>}>
        You meet once a week. In between, message {firstName(m.name)} with questions, add things to talk about, and read their feedback here.
      </PageHead>
      {msg && <div className="pf-note" role="alert">{msg}</div>}
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card flush>
            <div className="pf-card-h" style={{ padding: '16px 18px 0' }}><Icon name="message" size={20} className="pf-faint" /><h3>Messages</h3></div>
            <Thread load={load} send={send} me="student" names={{ mentor: firstName(m.name), student: 'You' }} onRead={() => data.inbox && data.inbox.unread && actions.reload()}
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
          {coming.length ? coming.map(x => <div key={x.id}><NextSession s={x} onChange={actions.reload} />{x.status === 'requested' && <button type="button" className="pf-btn sm ghost" style={{ marginTop: 6 }} onClick={() => cancel(x.id)}>Withdraw this request</button>}</div>)
            : <Card ai><span className="tag"><Icon name="calendar" size={14} />Next session</span><p className="pf-small" style={{ margin: '8px 0 10px' }}>Nothing booked yet. Your mentor will set one, or you can ask.</p><button type="button" className="pf-btn sm" onClick={() => setAsking(true)}>Ask for a session</button></Card>}
          {(s.declined || []).map(x => <div key={x.id} className="pf-note" role="note"><b>{fmtDate(x.date)} did not work for your mentor.</b>{x.note ? ` “${x.note}”` : ''} Ask for another day.</div>)}
          <Card><CardHead title="Bring to the session" icon="bulb" /><ul className="pf-list"><li>Your daily learning log: what clicked and what was hard</li><li>Tasks you finished, and ones you are stuck on</li><li>One thing you are proud of</li></ul></Card>
        </div>
      </div>
      <RequestSession open={asking} onClose={() => setAsking(false)} onDone={actions.reload} />
    </>
  );
}
