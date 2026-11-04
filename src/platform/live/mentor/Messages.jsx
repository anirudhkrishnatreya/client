import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, Empty, PageHead, Pill } from '../../ui/kit';
import { errMessage, firstName, gradeLabel, mentorApi } from '../liveApi';
import Thread from '../Thread';
import { useLiveEvent } from '../events';

/** Every conversation with the mentor's students: unread first, then the most recent; the chosen one opens beside the list. */
export default function LiveMessages() {
  const { actions } = usePlatform();
  const [sp, setSp] = useSearchParams();
  const [inbox, setInbox] = useState(null);
  const [err, setErr] = useState('');
  const loadInbox = useCallback(() => mentorApi.inbox().then(d => setInbox(d.inbox)).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { loadInbox(); }, [loadInbox]);
  useLiveEvent(['message.new', 'message.read', 'link.changed'], loadInbox);
  // with no student in the address, open the first conversation once and keep it: reading it reorders the list, and following
  // the list's first row would open (and mark read) the next conversation too
  useEffect(() => { if (inbox && inbox[0] && !sp.get('student')) setSp({ student: inbox[0].studentId }, { replace: true }); }, [inbox, sp, setSp]);
  const chosen = sp.get('student');
  const row = inbox && inbox.find(r => r.studentId === chosen);
  const load = useCallback(() => mentorApi.thread(chosen), [chosen]);
  const send = useCallback(text => mentorApi.sendMessage(chosen, text).then(r => { loadInbox(); return r; }), [chosen, loadInbox]);
  const read = useCallback(() => { if (row && row.unread) { loadInbox(); actions.reload(); } }, [row, loadInbox, actions]);
  if (err) return <><PageHead eyebrow="Messages" title="Messages" /><p role="alert">{err}</p></>;
  if (!inbox) return <><PageHead eyebrow="Messages" title="Messages" /><p role="status">Loading…</p></>;
  return (
    <>
      <PageHead eyebrow="Messages" title="Conversations with your students">Answer questions between sessions. Students can message you about a step of their plan, a task or a session. Their parent can read the conversation.</PageHead>
      {inbox.length === 0 ? <Card><Empty icon="message" title="No students to message yet">Once a student is connected and their parent has confirmed, you can message them here.</Empty></Card> : (
        <div className="pf-inbox">
          <Card flush className="pf-inbox-list">
            <ul>{inbox.map(r => (
              <li key={r.studentId}><button type="button" aria-current={r.studentId === chosen ? 'true' : undefined} onClick={() => setSp({ student: r.studentId })}>
                <Avatar name={r.name} size={36} />
                <span className="pf-grow" style={{ minWidth: 0 }}><b>{r.name}</b><span className="pf-small pf-muted pf-ellipsis">{r.last ? `${r.last.from === 'mentor' ? 'You: ' : ''}${r.last.text}` : gradeLabel(r.grade)}</span></span>
                {r.unread > 0 && <Pill tone="coral">{r.unread}</Pill>}
              </button></li>))}</ul>
          </Card>
          <Card flush>
            {row && <>
              <div className="pf-card-h" style={{ padding: '14px 18px 0' }}><Avatar name={row.name} size={34} /><h3 style={{ marginLeft: 8 }}>{row.name}</h3><Link className="act" to={`../students?open=${row.studentId}`}>Open student</Link></div>
              <Thread key={row.studentId} studentId={row.studentId} load={load} send={send} me="mentor" names={{ student: firstName(row.name), mentor: 'You' }} onRead={read}
                empty={`No messages yet. Say hello to ${firstName(row.name)}, or share something to try before your next session.`}
                note="Kept on iMenteo; the student’s parent can read this conversation." />
            </>}
          </Card>
        </div>)}
    </>
  );
}
