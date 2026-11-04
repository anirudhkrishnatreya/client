import { useEffect, useState } from 'react';
import { Card, CardHead, Icon } from '../../ui/kit';
import { coachApi, errMessage } from '../liveApi';

// How the coach works for this student: its style and language, when it checks in, when it stays quiet, how many nudges, whether
// it makes the changes they ask for straight away, and what it remembers about them (theirs to read, add to and delete).
const STYLES = [['calm', 'Calm', 'Warm and reassuring'], ['energetic', 'Energetic', 'Like a sports coach'], ['straight', 'Straight-talking', 'Short and direct']];
const LANGS = [['auto', 'Whatever I write in'], ['english', 'English'], ['hindi', 'Hindi'], ['hinglish', 'Hinglish']];

export default function Settings() {
  const [p, setP] = useState(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { coachApi.profile().then(r => setP(r.profile)).catch(e => setErr(errMessage(e))); }, []);
  const save = async patch => { setErr(''); setMsg(''); try { setP((await coachApi.saveProfile(patch)).profile); setMsg('Saved.'); } catch (x) { setErr(errMessage(x)); } };
  const remember = async e => { e.preventDefault(); setErr(''); try { setP((await coachApi.remember(text.trim())).profile); setText(''); } catch (x) { setErr(errMessage(x)); } };
  const forget = async id => { try { setP((await coachApi.forget(id)).profile); } catch (x) { setErr(errMessage(x)); } };
  if (!p) return <p role={err ? 'alert' : 'status'} className="pf-small pf-muted">{err || 'Loading…'}</p>;
  return (
    <div className="pf-grid g-main">
      <div className="pf-grid" style={{ alignContent: 'start' }}>
        <Card><CardHead title="Your coach’s style" icon="sparkles" />
          <div className="pf-row pf-wrap" style={{ gap: 8 }} role="radiogroup" aria-label="Coach style">{STYLES.map(([v, a, b]) => <button key={v} type="button" role="radio" aria-checked={p.style === v} className={`pf-choice${p.style === v ? ' on' : ''}`} onClick={() => save({ style: v })}>{a}<small>{b}</small></button>)}</div>
          <label className="pf-label" htmlFor="cl" style={{ marginTop: 14 }}>Language</label>
          <select id="cl" className="pf-input" style={{ maxWidth: 260 }} value={p.language} onChange={e => save({ language: e.target.value })}>{LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Card>
        <Card><CardHead title="When your coach checks in" icon="clock" />
          <div className="pf-grid g2">
            <div className="pf-field"><label className="pf-label" htmlFor="ma">Morning check-in</label><input id="ma" type="time" className="pf-input" value={p.morningAt} onChange={e => save({ morningAt: e.target.value })} /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="ea">Evening debrief</label><input id="ea" type="time" className="pf-input" value={p.eveningAt} onChange={e => save({ eveningAt: e.target.value })} /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="qf">Quiet from</label><input id="qf" type="time" className="pf-input" value={p.quiet.from} onChange={e => save({ quiet: { ...p.quiet, from: e.target.value } })} /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="qt">Quiet until</label><input id="qt" type="time" className="pf-input" value={p.quiet.to} onChange={e => save({ quiet: { ...p.quiet, to: e.target.value } })} /></div>
          </div>
          <label className="pf-small pf-row" style={{ gap: 6, marginTop: 6 }}><input type="checkbox" checked={p.nudges} onChange={e => save({ nudges: e.target.checked })} />Let my coach nudge me (in the app, never in quiet hours)</label>
          {p.nudges && <label className="pf-small pf-row" style={{ gap: 6, marginTop: 6 }}>At most <select className="pf-input" style={{ width: 70, padding: '4px 8px' }} aria-label="Nudges a day" value={p.nudgesPerDay} onChange={e => save({ nudgesPerDay: Number(e.target.value) })}>{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</select> a day</label>}
          <label className="pf-small pf-row" style={{ gap: 6, marginTop: 10 }}><input type="checkbox" checked={p.autoApply} onChange={e => save({ autoApply: e.target.checked })} />Make the changes I ask for straight away (I can always undo)</label>
          {msg && <p className="pf-small" role="status" style={{ margin: '8px 0 0' }}>{msg}</p>}
          {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '8px 0 0' }}>{err}</p>}
        </Card>
      </div>
      <Card><CardHead title="What your coach remembers" icon="brain" />
        <p className="pf-small pf-muted" style={{ marginTop: 0 }}>Things you told your coach, so you don’t have to repeat them. Delete anything you like.</p>
        {p.memory.length === 0 ? <p className="pf-small" style={{ margin: '0 0 10px' }}>Nothing yet. Try: “I have tuition on Mondays and Wednesdays till 6”.</p>
          : <ul className="pf-list">{p.memory.map(m => <li key={m.id}><span className="pf-grow pf-small">{m.text}<br /><span className="pf-faint">{m.source === 'coach' ? 'From a chat' : 'You added this'}</span></span><button type="button" className="pf-iconbtn" aria-label={`Forget “${m.text}”`} onClick={() => forget(m.id)}><Icon name="x" size={14} /></button></li>)}</ul>}
        <form className="pf-row" style={{ gap: 6, marginTop: 8 }} onSubmit={remember}>
          <label className="pf-sr" htmlFor="mem">Something to remember</label>
          <input id="mem" className="pf-input" maxLength={200} value={text} onChange={e => setText(e.target.value)} placeholder="e.g. I study best at night" />
          <button type="submit" className="pf-btn sm" disabled={text.trim().length < 4}>Add</button>
        </form>
      </Card>
    </div>
  );
}
