import { Avatar, Card, CardHead, Icon } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { WithChild } from './shared';

export default function LiveParentMentor() {
  return (
    <WithChild eyebrow="Mentor" title={'Mentor notes'} intro={c => `What ${c.firstName}’s mentor shares with you after each weekly session.`}>
      {d => (
        <div className="pf-grid g-main">
          <Card><CardHead title="Session summaries" icon="file" />
            {d.sessions.history.length === 0 && d.notes.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing yet. After each weekly session, the mentor’s summary appears here.</p> :
              <div className="pf-timeline">{d.sessions.history.map(h => <div key={h.id} className="pf-tl"><b>{fmtDate(h.date)}</b>{h.topic && <span className="pf-small pf-muted"> · {h.topic}</span>}<p className="pf-small" style={{ margin: '4px 0 6px' }}>{h.summary}</p>
                {h.actions.map(a => <span key={a} className="pf-pill grey" style={{ marginRight: 6 }}><Icon name="check" size={12} />{a}</span>)}</div>)}
                {d.notes.map(n => <div key={n.id} className="pf-tl"><b>{fmtDate(n.at)}</b> <span className="pf-small pf-muted">· note from the mentor</span><p className="pf-small" style={{ margin: '4px 0 0' }}>{n.text}</p></div>)}</div>}</Card>
          <div className="pf-grid" style={{ alignContent: 'start' }}>
            {d.mentor ? <Card><div className="pf-row"><Avatar name={d.mentor.name} size={48} /><div><b>{d.mentor.name}</b><div className="pf-small pf-muted">{d.child.firstName}’s mentor</div></div></div></Card> : <Card><p className="pf-small pf-muted" style={{ margin: 0 }}>A mentor has not been assigned yet.</p></Card>}
            <Card ai><span className="tag"><Icon name="calendar" size={14} />Next session</span>{d.sessions.next ? <><h4 style={{ fontSize: 20, margin: '8px 0 2px' }}>{fmtDate(d.sessions.next.date)}{d.sessions.next.time ? `, ${d.sessions.next.time}` : ''}</h4><p className="pf-small" style={{ margin: 0 }}>{d.sessions.next.topic}</p></> : <p className="pf-small" style={{ margin: '8px 0 0' }}>Not booked yet.</p>}</Card>
          </div>
        </div>)}
    </WithChild>
  );
}
