import { useEffect, useState } from 'react';
import { Card, CardHead, Icon } from '../../ui/kit';
import { observeApi, errMessage } from '../liveApi';
import { when } from './parts';

// Working together: a nudge in the mentor's words (now or later, AI can draft it), comments on the plan, and a hand-over note.
function Nudge({ id, name }) {
  const [text, setText] = useState('');
  const [at, setAt] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const draft = async () => { setErr(''); try { setText((await observeApi.draftNudge(id, 'encourage them this week')).text); } catch (x) { setErr(errMessage(x)); } };
  const send = async e => { e.preventDefault(); setErr(''); setMsg(''); try { const r = await observeApi.nudge(id, { text: text.trim(), at: at ? new Date(at).toISOString() : null }); setMsg(r.scheduled ? `Scheduled for ${when(at)}.` : `Sent to ${name}.`); setText(''); setAt(''); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Card><CardHead title={`Nudge ${name}`} icon="bell" />
      <form onSubmit={send}>
        <label className="pf-sr" htmlFor="ng">Nudge</label>
        <textarea id="ng" className="pf-input" rows={3} maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder={`e.g. Proud of your streak, ${name}! One practice set today?`} />
        <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 8 }}>
          <button type="button" className="pf-btn sm ghost" onClick={draft}><Icon name="sparkles" size={13} />Draft it for me</button>
          <label className="pf-small" htmlFor="ng-at">Send at (optional)</label><input id="ng-at" type="datetime-local" className="pf-input" style={{ width: 220 }} value={at} onChange={e => setAt(e.target.value)} />
          <button type="submit" className="pf-btn sm" disabled={text.trim().length < 3}>{at ? 'Schedule' : 'Send now'}</button>
        </div>
      </form>
      <p className="pf-small pf-faint" style={{ margin: '6px 0 0' }}>{'{name}'} becomes their first name. It arrives under their bell.</p>
      {msg && <p className="pf-small" role="status">{msg}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

export function Comments({ id, mine = false, unitId = null }) {
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const load = () => (mine ? observeApi.myComments() : observeApi.comments(id)).then(r => setList(r.comments)).catch(e => setErr(errMessage(e)));
  useEffect(() => { load(); }, [id]);                          // reload when the student changes
  const send = async e => { e.preventDefault(); setErr(''); try { const date = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10); await (mine ? observeApi.myComment({ unitId, date, text: text.trim() }) : observeApi.comment(id, { unitId, date, text: text.trim() })); setText(''); await load(); } catch (x) { setErr(errMessage(x)); } };
  const shown = (list || []).filter(c => !unitId || c.unitId === unitId);
  return (
    <div className="pf-o-comments">
      {shown.map(c => <div key={c.id} className={`pf-cmsg ${(c.by === 'mentor') !== mine ? 'me' : 'coach'}`}><div className="pf-cbub"><span className="pf-small pf-muted">{c.by === 'mentor' ? 'Mentor' : 'Student'} · {when(c.at)}</span><br />{c.text}</div></div>)}
      <form className="pf-row" style={{ gap: 6 }} onSubmit={send}>
        <label className="pf-sr" htmlFor={`cm-${unitId || 'day'}`}>Comment</label>
        <input id={`cm-${unitId || 'day'}`} className="pf-input" maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={mine ? 'Reply to your mentor' : 'Comment on their plan'} />
        <button type="submit" className="pf-btn sm" disabled={!text.trim()}>Post</button>
      </form>
      {err && <p className="pf-small" role="alert">{err}</p>}
    </div>
  );
}

function Handover({ id }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const save = async e => { e.preventDefault(); try { await observeApi.handover(id, text.trim()); setMsg('Saved. Whoever mentors them next will see it.'); setText(''); } catch (x) { setMsg(errMessage(x)); } };
  return (
    <Card><CardHead title="Hand-over note" icon="users" />
      <form onSubmit={save}><label className="pf-sr" htmlFor="ho">Hand-over note</label>
        <textarea id="ho" className="pf-input" rows={3} maxLength={4000} value={text} onChange={e => setText(e.target.value)} placeholder="What the next mentor should know: what works, what to watch, what was agreed." />
        <button type="submit" className="pf-btn sm" style={{ marginTop: 8 }} disabled={text.trim().length < 10}>Save hand-over note</button></form>
      {msg && <p className="pf-small" role="status">{msg}</p>}
    </Card>
  );
}

export default function Together({ p }) {
  const id = p.header.id, name = p.header.name.split(' ')[0];
  return (
    <div className="pf-grid g-main" style={{ alignItems: 'start' }}>
      <div className="pf-grid" style={{ alignContent: 'start' }}>
        <Nudge id={id} name={name} />
        <Card><CardHead title="Comments on the plan" icon="message" /><Comments id={id} /></Card>
      </div>
      <Handover id={id} />
    </div>
  );
}
