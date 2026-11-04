import { Avatar, Card, CardHead, Icon } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { WithChild } from './shared';
import { Bubbles } from '../Thread';
import { SessionCard } from '../SessionParts';

export default function LiveParentMentor() {
  return (
    <WithChild eyebrow="Mentor" title={'Mentor notes'} intro={c => `What ${c.firstName}’s mentor shares with you after each weekly session.`}>
      {d => (
        <div className="pf-grid g-main">
          <Card><CardHead title="Session summaries" icon="file" />
            {d.sessions.history.length === 0 && d.notes.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing yet. After each weekly session, the mentor’s summary appears here.</p> :
              <div className="pf-timeline">{d.sessions.history.map(h => <div key={h.id} className="pf-tl"><b>{fmtDate(h.date)}</b>{h.topic && <span className="pf-small pf-muted"> · {h.topic}</span>}<p className="pf-small" style={{ margin: '4px 0 6px' }}>{h.summary}</p>
                {h.actions.map(a => <span key={a} className="pf-pill grey" style={{ marginRight: 6 }}><Icon name="check" size={12} />{a}</span>)}</div>)}
                {d.notes.map(n => <div key={n.id} className="pf-tl"><b>{n.title || fmtDate(n.at)}</b> <span className="pf-small pf-muted">· {n.kind === 'summary' ? 'weekly summary' : 'note'} from the mentor{n.title ? `, ${fmtDate(n.at)}` : ''}</span><p className="pf-small" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.text}</p></div>)}</div>}</Card>
          <div className="pf-grid" style={{ alignContent: 'start' }}>
            {d.mentor ? <Card><div className="pf-row"><Avatar name={d.mentor.name} size={48} /><div><b>{d.mentor.name}</b><div className="pf-small pf-muted">{d.child.firstName}’s mentor</div></div></div></Card> : <Card><p className="pf-small pf-muted" style={{ margin: 0 }}>A mentor has not been assigned yet.</p></Card>}
            {d.mentor && <Card><CardHead title="Messages with the mentor" icon="message" />
              {d.messages.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>{d.child.firstName} and their mentor have not messaged yet.</p>
                : <details><summary className="pf-small">Read the {d.messages.length} message{d.messages.length > 1 ? 's' : ''}</summary><div className="pf-thread-log" style={{ maxHeight: 360, marginTop: 8 }}><Bubbles messages={d.messages} me="mentor" names={{ mentor: d.mentor.name, student: d.child.firstName }} /></div></details>}
              <p className="pf-small pf-faint" style={{ margin: '8px 0 0' }}>You can read these so you know what is being discussed. Only {d.child.firstName} and their mentor write here.</p></Card>}
            <Card><CardHead title="Sessions" icon="calendar" />
              {[...(d.sessions.upcoming || (d.sessions.next ? [d.sessions.next] : [])), ...(d.sessions.requested || [])].length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Not booked yet.</p>
                : <div className="pf-sess-list">{[...(d.sessions.upcoming || (d.sessions.next ? [d.sessions.next] : [])), ...(d.sessions.requested || [])].map(x => <SessionCard key={x.id} s={x} role="parent" name={d.mentor ? d.mentor.name : 'Mentor'} onChanged={() => {}} />)}</div>}
              {(d.sessions.closed || []).filter(x => x.status === 'cancelled' || x.status === 'missed').slice(0, 3).map(x => <p key={x.id} className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>{x.when}: {x.status === 'missed' ? 'did not happen' : `cancelled${x.closed && x.closed.late ? ' late' : ''}`}{x.closed && x.closed.reason ? ` (“${x.closed.reason}”)` : ''}.</p>)}
            </Card>
          </div>
        </div>)}
    </WithChild>
  );
}
