import { useState } from 'react';
import { usePlatform } from '../data/store';
import { Avatar, Card, CardHead, Icon, PageHead } from '../ui/kit';
import { fmtDate } from '../ui/format';

export default function ParentMentor() {
  const { data } = usePlatform();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHead eyebrow="Mentor" title={data.mentor.name}>{data.mentor.role}. Notes shared with you after each weekly session.</PageHead>
      <div className="pf-grid g-main">
        <Card><CardHead title="Notes from sessions" icon="file" /><div className="pf-timeline">{data.mentorNotes.map(n => <div key={n.id} className="pf-tl"><b>{fmtDate(n.date)}</b><p className="pf-small" style={{ margin: '4px 0 0' }}>{n.text}</p></div>)}</div></Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card ai><span className="tag"><Icon name="calendar" size={14} />Next session</span><h4 style={{ fontSize: 20, margin: '8px 0 2px' }}>{fmtDate(data.mentor.next.date)}, {data.mentor.next.time}</h4><p className="pf-small" style={{ margin: 0 }}>{data.mentor.next.topic}</p></Card>
          <Card><CardHead title="Message the mentor" icon="message" />
            <form onSubmit={e => { e.preventDefault(); if (text.trim()) { setSent(true); setText(''); } }}><textarea className="pf-input" rows="3" aria-label="Message" value={text} onChange={e => { setText(e.target.value); setSent(false); }} placeholder="Ask a question or share something" /><button type="submit" className="pf-btn sm" style={{ marginTop: 8 }} disabled={!text.trim()}><Icon name="send" size={14} />Send</button>{sent && <span className="pf-small" style={{ marginLeft: 10, color: 'var(--leaf)' }} role="status">Sent (sample).</span>}</form></Card>
        </div>
      </div>
    </>
  );
}
