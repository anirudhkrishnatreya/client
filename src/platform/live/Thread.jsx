import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/kit';
import { errMessage } from './liveApi';
import { useLiveEvent, useLiveStatus } from './events';

const when = at => { const d = new Date(at); const same = new Date().toDateString() === d.toDateString(); return d.toLocaleString('en-IN', same ? { hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); };
const REF = { step: 'About a step of the plan', task: 'About a task', session: 'About a session' };

/** The messages, oldest first, as bubbles. `me` is the side shown on the right. */
export function Bubbles({ messages, me, names = {}, seen = false }) {
  if (!messages.length) return null;
  const lastMine = seen ? [...messages].reverse().find(m => m.from === me) : null;
  return messages.map(m => (
    <div key={m.id} className={`pf-bubble ${m.from === me ? 'mine' : 'theirs'}`}>
      {m.ref && <span className="pf-msgref"><Icon name="link" size={11} />{REF[m.ref.kind]}: {m.ref.title}</span>}
      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
      <span className="pf-msgtime">{names[m.from] ? `${names[m.from]} · ` : ''}{when(m.at)}{lastMine && lastMine.id === m.id && m.read ? ' · Seen' : ''}</span>
    </div>
  ));
}

/**
 * A conversation between a student and their mentor. Loads with `load()` (which also marks it read) and sends with `send(text)`.
 * New messages and "Seen" arrive by themselves through the live stream; if the stream is down it checks every 30 seconds
 * instead (every 2 minutes as a backstop while it is up).
 */
export default function Thread({ load, send, me, names, empty, note, onRead, studentId }) {
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef(null);
  const read = useRef(onRead);
  read.current = onRead;
  const refresh = useCallback(() => load().then(d => { setMsgs(d.messages); if (read.current) read.current(); }).catch(e => setErr(errMessage(e))), [load]);
  const live = useLiveStatus() === 'open';
  useEffect(() => { setMsgs(null); refresh(); }, [refresh]);
  useEffect(() => { const t = setInterval(refresh, live ? 120000 : 30000); return () => clearInterval(t); }, [refresh, live]);
  useLiveEvent(['message.new', 'message.read'], d => { if (!studentId || String(d.studentId) === String(studentId)) refresh(); });
  useEffect(() => { if (end.current && end.current.scrollIntoView) end.current.scrollIntoView({ block: 'end' }); }, [msgs]);
  const submit = async e => {
    e.preventDefault(); const t = text.trim(); if (!t) return;
    setBusy(true); setErr('');
    try { const r = await send(t); setMsgs(m => ((m || []).some(x => x.id === r.message.id) ? m : [...(m || []), r.message])); setText(''); }
    catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  return (
    <div className="pf-thread">
      <div className="pf-thread-log" aria-live="polite">
        {msgs === null ? <p className="pf-small pf-muted" role="status">Loading messages…</p>
          : msgs.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 'auto', textAlign: 'center' }}>{empty}</p>
            : <Bubbles messages={msgs} me={me} names={names} seen />}
        <div ref={end} />
      </div>
      <form className="pf-chat-input" onSubmit={submit}>
        <label className="pf-sr" htmlFor={`msg-${me}`}>Write a message</label>
        <textarea id={`msg-${me}`} className="pf-textarea" rows={2} maxLength={2000} value={text} placeholder="Write a message" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }} />
        <button type="submit" className="pf-btn" disabled={busy || !text.trim()} aria-label="Send message"><Icon name="send" size={16} /></button>
      </form>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 14px' }}>{err}</p>}
      {note && <p className="pf-small pf-faint" style={{ margin: '6px 14px 10px' }}>{note}</p>}
    </div>
  );
}
