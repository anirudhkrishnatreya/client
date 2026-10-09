import { useState } from 'react';
import { usePlatform } from '../data/store';
import { Avatar, Card, Drawer, Icon, PageHead, Pill } from '../ui/kit';

export default function Sessions() {
  const { data, actions } = usePlatform();
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const x = data.sessions.find(s => s.id === open), s = x && data.students.find(t => t.id === x.studentId);
  const brief = st => [
    `${st.name} is ${st.status === 'risk' ? 'struggling to keep up' : st.status === 'watch' ? 'slightly off pace' : 'on track'}: ${st.tasksDone} of ${st.tasksTotal} tasks done and a latest score of ${st.score}%.`,
    `Streak: ${st.streak} days. Last active ${st.lastActive}.`,
    st.status === 'risk' ? 'Start by asking what got in the way, before talking about the work.' : 'Open with something they did well, then move to the next step.'
  ];
  return (
    <>
      <PageHead eyebrow="Sessions" title="This week’s sessions">Open a session to see an AI brief on the student and to write your notes.</PageHead>
      <div className="pf-grid g2">{data.sessions.map(z => { const st = data.students.find(t => t.id === z.studentId); return (
        <Card key={z.id}><div className="pf-row"><Avatar name={st.name} /><div className="pf-grow"><b>{st.name}</b><div className="pf-small pf-muted">{z.when}</div></div>{z.prepped ? <Pill tone="leaf">Ready</Pill> : <Pill tone="gold">To prepare</Pill>}</div>
          <p className="pf-small" style={{ margin: '10px 0 12px' }}>{z.topic}</p><button type="button" className="pf-btn sm" onClick={() => setOpen(z.id)}>{z.prepped ? 'View brief' : 'Prepare'}</button></Card>); })}</div>
      <Drawer open={!!x} title={s ? `Session with ${s.name}` : ''} onClose={() => setOpen(null)}>{x && <>
        <div className="pf-small pf-muted">{x.when} · {x.topic}</div>
        <div className="pf-ai pf-card" style={{ margin: '12px 0' }}><span className="tag"><Icon name="sparkles" size={14} />AI brief</span><ul className="pf-list" style={{ marginTop: 6 }}>{brief(s).map(b => <li key={b} style={{ borderColor: '#F3E3B8' }}>{b}</li>)}</ul></div>
        <form onSubmit={e => { e.preventDefault(); if (note.trim()) { actions.saveNote(s.id, { text: note.trim() }); setNote(''); setOpen(null); } }}><label className="pf-small pf-muted" htmlFor="sn">Your preparation notes</label><textarea id="sn" className="pf-input" rows="4" value={note} onChange={e => setNote(e.target.value)} /><button type="submit" className="pf-btn sm" style={{ marginTop: 8 }} disabled={!note.trim()}>Save and mark ready</button></form></>}
      </Drawer>
    </>
  );
}
