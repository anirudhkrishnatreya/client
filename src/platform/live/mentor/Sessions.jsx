import { useState } from 'react';
import { usePlatform } from '../../data/store';
import { Avatar, Card, Drawer, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { errMessage } from '../liveApi';

const today = () => new Date().toISOString().slice(0, 10);
export default function LiveSessions() {
  const { data, actions } = usePlatform();
  const ready = data.students.filter(s => !s.limited);
  const by = id => data.students.find(s => String(s.id) === String(id));
  const [f, setF] = useState({ studentId: ready[0] ? ready[0].id : '', date: today(), time: '', topic: '' });
  const [open, setOpen] = useState(null);
  const [w, setW] = useState({ summary: '', actions: '' });
  const [msg, setMsg] = useState('');
  const x = data.sessions.find(s => s.id === open);
  const book = async e => { e.preventDefault(); setMsg(''); try { await actions.schedule(f.studentId, { date: f.date, time: f.time || undefined, topic: f.topic }); setF({ ...f, topic: '' }); setMsg('Session booked.'); } catch (err) { setMsg(errMessage(err)); } };
  const finish = async e => { e.preventDefault(); try { await actions.updateSession(x.id, { status: 'done', summary: w.summary, actions: w.actions.split('\n') }); setOpen(null); setW({ summary: '', actions: '' }); } catch (err) { setMsg(errMessage(err)); } };
  return (
    <>
      <PageHead eyebrow="Sessions" title="Weekly sessions">Book the next session, and write it up afterwards. The summary and next steps are shared with the student and their parent.</PageHead>
      <div className="pf-grid g-main">
        <Card><div className="pf-card-h"><h3>Coming up</h3></div>
          {data.sessions.length === 0 ? <Empty icon="calendar" title="Nothing booked">Book a session with the form.</Empty> :
            <ul className="pf-list">{data.sessions.map(s => <li key={s.id}><Avatar name={by(s.studentId).name} size={34} /><span className="pf-grow"><b>{by(s.studentId).name}</b><br /><span className="pf-small pf-muted">{fmtDate(s.date)}{s.time ? `, ${s.time}` : ''}{s.topic ? ` · ${s.topic}` : ''}</span></span>
              <button type="button" className="pf-btn sm" onClick={() => setOpen(s.id)}>Write up</button>
              <button type="button" className="pf-btn sm ghost" onClick={() => actions.updateSession(s.id, { status: 'cancelled' })}>Cancel</button></li>)}</ul>}</Card>
        <Card><div className="pf-card-h"><h3>Book a session</h3></div>
          {ready.length === 0 ? <p className="pf-small pf-muted">You can book once a student’s parent has confirmed.</p> :
            <form className="pf-grid" onSubmit={book}>
              <label>Student<select className="pf-input" value={f.studentId} onChange={e => setF({ ...f, studentId: e.target.value })}>{ready.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <div className="pf-grid g2"><label>Date<input className="pf-input" type="date" value={f.date} min={today()} onChange={e => setF({ ...f, date: e.target.value })} /></label><label>Time<input className="pf-input" type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></label></div>
              <label>Topic<input className="pf-input" value={f.topic} maxLength={200} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="What will you cover?" /></label>
              <div className="pf-row"><button type="submit" className="pf-btn" disabled={!f.date}>Book</button>{msg && <span className="pf-small" role="status" style={{ color: msg === 'Session booked.' ? 'var(--leaf)' : 'var(--coral)' }}>{msg}</span>}</div>
            </form>}</Card>
      </div>
      <Drawer open={!!x} title={x ? `Session with ${by(x.studentId).name}` : ''} onClose={() => setOpen(null)}>{x && <form onSubmit={finish}>
        <p className="pf-small pf-muted">{fmtDate(x.date)}{x.time ? `, ${x.time}` : ''}{x.topic ? ` · ${x.topic}` : ''}</p>
        <label className="pf-label" htmlFor="sum">What happened</label><textarea id="sum" className="pf-input" rows="5" value={w.summary} maxLength={3000} onChange={e => setW({ ...w, summary: e.target.value })} />
        <label className="pf-label" htmlFor="act" style={{ marginTop: 12 }}>Next steps (one per line)</label><textarea id="act" className="pf-input" rows="4" value={w.actions} onChange={e => setW({ ...w, actions: e.target.value })} />
        <p className="pf-small pf-faint">The student and parent can read this. Use Notes for anything private.</p>
        <button type="submit" className="pf-btn" disabled={!w.summary.trim()}><Icon name="check" size={16} />Save and mark done</button></form>}</Drawer>
    </>
  );
}
