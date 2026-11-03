import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/kit';
import { errMessage } from './liveApi';

const when = at => { const d = new Date(at); const same = new Date().toDateString() === d.toDateString(); return d.toLocaleString('en-IN', same ? { hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); };
const REF = { step: 'About a step of the plan', task: 'About a task', session: 'About a session' };

/** The messages, oldest first, as bubbles. `me` is the side shown on the right. */
export function Bubbles({ messages, me, names = {} }) {
  if (!messages.length) return null;
  return messages.map(m => (
    <div key={m.id} className={`pf-bubble ${m.from === me ? 'mine' : 'theirs'}`}>
      {m.ref && <span className="pf-msgref"><Icon name="link" size={11} />{REF[m.ref.kind]}: {m.ref.title}</span>}
      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
      <span className="pf-msgtime">{names[m.from] ? `${names[m.from]} · ` : ''}{when(m.at)}</span>
    </div>
  ));
}

/**
 * A conversation between a student and their mentor. Loads with `load()` (which also marks it read), sends with `send(text)`, and
 * checks for new messages every 30 seconds while open.
 */
export default function Thread({ load, send, me, names, empty, note, onRead }) {
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef(null);
  const read = useRef(onRead);
  read.current = onRead;
  const refresh = useCallback(() => load().then(d => { setMsgs(d.messages); if (read.current) read.current(); }).catch(e => setErr(errMessage(e))), [load]);
  useEffect(() => { setMsgs(null); refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);
  useEffect(() => { if (end.current && end.current.scrollIntoView) end.current.scrollIntoView({ block: 'end' }); }, [msgs]);
  const submit = async e => {
    e.preventDefault(); const t = text.trim(); if (!t) return;
    setBusy(true); setErr('');
    try { const r = await send(t); setMsgs(m => [...(m || []), r.message]); setText(''); }
    catch (x) { setErr(errMessage(x)); } finally { setBusy(false); }
  };
  return (
    <div className="pf-thread">
      <div className="pf-thread-log" aria-live="polite">
        {msgs === null ? <p className="pf-small pf-muted" role="status">Loading messages…</p>
          : msgs.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 'auto', textAlign: 'center' }}>{empty}</p>
            : <Bubbles messages={msgs} me={me} names={names} />}
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
