import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';

export default function LiveMentor() {
  const { data } = usePlatform();
  const m = data.mentor, s = data.sessions;
  if (!m) return <><PageHead eyebrow="Your mentor" title="Your mentor is on the way">Every student meets a mentor once a week to look back, ask questions and set next steps.</PageHead>
    <Card ai><span className="tag"><Icon name="users" size={14} />Not assigned yet</span><p style={{ margin: '8px 0 0' }}>A mentor has not been assigned to you yet. As soon as one is, you will see their name and your sessions here.</p></Card></>;
  return (
    <>
      <PageHead eyebrow="Your mentor" title={m.name}>You meet once a week to look back, ask questions and set the next steps.</PageHead>
      <div className="pf-grid g-main">
        <Card><CardHead title="Past sessions" icon="calendar" />
          {s.history.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Your first session has not happened yet. Notes and next steps will appear here afterwards.</p> :
            <div className="pf-timeline">{s.history.map(h => (
              <div key={h.id} className="pf-tl"><b>{fmtDate(h.date)}</b>{h.topic && <span className="pf-small pf-muted"> · {h.topic}</span>}<p className="pf-small" style={{ margin: '4px 0 6px' }}>{h.summary}</p>
                <div className="pf-row pf-wrap">{h.actions.map(a => <span key={a} className="pf-pill grey"><Icon name="check" size={12} />{a}</span>)}</div></div>))}</div>}</Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><div className="pf-row"><Avatar name={m.name} size={52} /><div><b>{m.name}</b><div className="pf-small pf-muted">Your mentor</div></div></div></Card>
          <Card ai><span className="tag"><Icon name="calendar" size={14} />Next session</span>
            {s.next ? <><h4 style={{ fontSize: 20, margin: '8px 0 2px' }}>{fmtDate(s.next.date)}{s.next.time ? `, ${s.next.time}` : ''}</h4>{s.next.topic && <p className="pf-small" style={{ margin: 0 }}>{s.next.topic}</p>}</> : <p className="pf-small" style={{ margin: '8px 0 0' }}>Nothing booked yet. Your mentor will set the next one.</p>}</Card>
          <Card><CardHead title="Bring to the session" icon="bulb" /><ul className="pf-list"><li>The questions you saved this week</li><li>Your finished and unfinished tasks</li><li>One thing you are proud of</li></ul></Card>
        </div>
      </div>
    </>
  );
}
