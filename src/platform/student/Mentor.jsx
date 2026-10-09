import { useEffect, useRef, useState } from 'react';
import { usePlatform } from '../data/store';
import { Avatar, Card, CardHead, Icon, PageHead } from '../ui/kit';
import { fmtDate } from '../ui/format';

export default function Mentor() {
  const { data, actions } = usePlatform();
  const m = data.mentor;
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }); }, [m.messages.length]);
  const send = e => { e.preventDefault(); if (!text.trim()) return; actions.sendMentorMessage(text.trim()); setText(''); };
  return (
    <>
      <PageHead eyebrow="Your mentor" title={m.name}>{m.role}. You meet once a week to look back, ask questions and set the next steps.</PageHead>
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Messages" icon="message" />
            <div className="pf-chat" style={{ maxHeight: 360, overflowY: 'auto' }} role="log" aria-label="Messages with your mentor">
              {m.messages.map(x => <div key={x.id} className={`pf-msg ${x.from === 'me' ? 'me' : 'them'}`}>{x.text}<small>{x.at.slice(5, 16).replace('T', ' ')}</small></div>)}<div ref={end} />
            </div>
            <form className="pf-row" style={{ marginTop: 12 }} onSubmit={send}><input className="pf-input pf-grow" placeholder="Write to your mentor" aria-label="Message" value={text} onChange={e => setText(e.target.value)} /><button type="submit" className="pf-btn" disabled={!text.trim()}><Icon name="send" size={16} />Send</button></form>
            <p className="pf-small pf-faint" style={{ margin: '8px 0 0' }}>Sample chat: replies will come from the real mentor once the platform is live.</p>
          </Card>
          <Card><CardHead title="Past sessions" icon="calendar" />
            <div className="pf-timeline">{m.history.map(h => (
              <div key={h.id} className="pf-tl"><b>{h.title}</b> <span className="pf-small pf-muted">· {fmtDate(h.date)}</span><p className="pf-small" style={{ margin: '4px 0 6px' }}>{h.notes}</p>
                <div className="pf-row pf-wrap">{h.actions.map(a => <span key={a} className="pf-pill grey"><Icon name="check" size={12} />{a}</span>)}</div></div>
            ))}</div></Card>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><div className="pf-row"><Avatar name={m.name} size={52} /><div><b>{m.name}</b><div className="pf-small pf-muted">Mentoring you since {fmtDate(m.since)}</div></div></div></Card>
          <Card ai><span className="tag"><Icon name="calendar" size={14} />Next session</span><h4 style={{ fontSize: 20, margin: '8px 0 2px' }}>{fmtDate(m.next.date)}, {m.next.time}</h4><p className="pf-small" style={{ margin: 0 }}>{m.next.topic}</p></Card>
          <Card><CardHead title="Bring to the session" icon="bulb" /><ul className="pf-list"><li>The questions you saved this week</li><li>Your mistakes notebook</li><li>One thing you are proud of</li></ul></Card>
        </div>
      </div>
    </>
  );
}
