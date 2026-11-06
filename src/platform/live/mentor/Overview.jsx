import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Avatar, Card, CardHead, Empty, Icon, PageHead, Pill, Progress, Stat } from '../../ui/kit';
import { fmtDate, greeting } from '../../ui/format';
import { errMessage, gradeLabel, mentorApi } from '../liveApi';

const GO = { reply: id => `messages?student=${id}`, nudge: id => `messages?student=${id}`, goal: id => `messages?student=${id}`, 'session-request': () => 'sessions', writeup: () => 'sessions', book: id => `sessions?student=${id}`, review: () => 'tasks', overdue: () => 'tasks', summary: id => `students?open=${id}&tab=week` };

/** This week with each student: where they are and the mentor's next step with them, most urgent first. */
function WeekBoard({ board }) {
  if (!board.length) return null;
  return (
    <Card flush style={{ marginBottom: 18 }}>
      <div className="pf-card-h" style={{ padding: '16px 18px 4px' }}><Icon name="calendar" size={20} className="pf-faint" /><h3>This week with each student</h3></div>
      <div className="pf-scroll"><table className="pf-table"><thead><tr><th>Student</th><th>Weekly plan</th><th>Learning log</th><th>Session</th><th>Your next step</th></tr></thead><tbody>
        {board.map(b => (
          <tr key={b.studentId}>
            <td><Link to={`students?open=${b.studentId}`} className="pf-row" style={{ gap: 8, color: 'inherit', textDecoration: 'none' }}><Avatar name={b.name} size={30} /><span><b>{b.name}</b><br /><span className="pf-small pf-muted">{b.goal || gradeLabel(b.grade)}</span></span></Link></td>
            <td>{b.plan ? <><span className="pf-small">Week {b.plan.weekNumber}: {b.plan.done}/{b.plan.steps} steps</span><Progress value={b.plan.steps ? (b.plan.done / b.plan.steps) * 100 : 0} label={`${b.name} plan`} /></> : <span className="pf-small pf-muted">No plan yet</span>}</td>
            <td><Pill tone={b.daysLogged >= 3 ? 'leaf' : b.daysLogged ? 'gold' : 'grey'}>{b.daysLogged} day{b.daysLogged === 1 ? '' : 's'}</Pill></td>
            <td className="pf-small">{b.nextSession ? `Booked ${fmtDate(b.nextSession)}` : b.metThisWeek ? 'Met this week' : b.sessionRequests ? 'Asked for one' : <span className="pf-muted">None booked</span>}</td>
            <td>{b.next.length === 0 ? <Pill tone="leaf" icon="check">All done</Pill> : <div className="pf-row pf-wrap" style={{ gap: 6 }}>{b.next.slice(0, 3).map(n => <Link key={n.kind} to={GO[n.kind](b.studentId)} className={`pf-nextact${n.urgent ? ' urgent' : ''}`}>{n.text}</Link>)}</div>}</td>
          </tr>))}
      </tbody></table></div>
    </Card>
  );
}

/** Students who entered this mentor's code and are waiting for an answer. */
function Requests({ requests, onDone }) {
  const [msg, setMsg] = useState('');
  if (!requests.length) return null;
  const decide = async (id, accept) => { setMsg(''); try { await mentorApi.decide(id, accept); await onDone(); } catch (e) { setMsg(e && e.response && e.response.data && e.response.data.code === 'HAS_MENTOR' ? 'This student has been given another mentor in the meantime.' : errMessage(e)); } };
  return (
    <Card ai style={{ marginBottom: 18 }}><span className="tag"><Icon name="users" size={14} />Asking you to be their mentor</span>
      <ul className="pf-list" style={{ marginTop: 6 }}>{requests.map(r => (
        <li key={r.id}><Avatar name={r.student.name} size={34} /><span className="pf-grow"><b>{r.student.name}</b><br /><span className="pf-small pf-muted">{gradeLabel(r.student.grade)}{r.student.goal ? ` · ${r.student.goal}` : ''}{r.note ? ` · “${r.note}”` : ''}</span></span>
          <button type="button" className="pf-btn sm" onClick={() => decide(r.id, true)}>Accept</button><button type="button" className="pf-btn sm ghost" onClick={() => decide(r.id, false)}>Decline</button></li>))}</ul>
      {msg && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{msg}</p>}
    </Card>
  );
}

/** The code a student enters to ask this mentor to mentor them. */
function MentorCode({ code, onChange }) {
  const [c, setC] = useState(code);
  const [copied, setCopied] = useState(false);
  const fresh = async () => { if (!window.confirm('Make a new code? The old one stops working.')) return; const r = await mentorApi.newCode(); setC(r.code); if (onChange) onChange(); };
  const copy = async () => { try { await navigator.clipboard.writeText(c); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* not allowed */ } };
  if (!c) return null;
  return (
    <Card><CardHead title="Your mentor code" icon="link" />
      <div className="pf-row pf-wrap" style={{ gap: 10 }}><span className="pf-bigcode" aria-label="Your mentor code">{c}</span><button type="button" className="pf-btn sm ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button><button type="button" className="pf-btn sm ghost" onClick={fresh}>New code</button></div>
      <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>Share it with a student. They enter it under Mentor, and you accept them here.</p>
    </Card>
  );
}

const A = { submitted: ['leaf', 'Assessment done'], in_progress: ['gold', 'Assessment started'], not_started: ['grey', 'Assessment not started'] };
export default function LiveMentorOverview() {
  const { data, actions } = usePlatform();
  const S = data.students, active = S.filter(s => !s.limited), by = id => S.find(s => String(s.id) === String(id));
  const open = active.reduce((n, s) => n + s.tasks.open, 0), overdue = active.reduce((n, s) => n + s.tasks.overdue, 0);
  const attention = data.alerts.filter(a => a.level === 'high').length;
  const review = active.reduce((n, s) => n + (s.tasks.review || 0), 0);
  if (S.length === 0) return <><PageHead eyebrow="Mentor overview" title={`${greeting()}, ${data.me.firstName}`}>You have no students yet.</PageHead><Requests requests={data.requests || []} onDone={actions.reload} /><div className="pf-grid g2"><Card><Empty icon="users" title="No students yet">An administrator assigns students to you, or a student asks to join you with your code. They appear here as soon as they do.</Empty></Card><MentorCode code={data.me.mentorCode} /></div></>;
  return (
    <>
      <PageHead eyebrow="Mentor overview" title={`${greeting()}, ${data.me.firstName}`}>You mentor {S.length} student{S.length === 1 ? '' : 's'}. Here is who needs you most this week.</PageHead>
      <Link to="command" className="pf-cc-banner"><Icon name="brain" size={20} /><span className="pf-grow"><b>Command centre</b><br /><span className="pf-small">Who needs you today, every student’s risk and trend, wellbeing alerts, and actions for several students at once.</span></span><Icon name="chevronRight" size={18} /></Link>
      <div className="pf-grid g4" style={{ marginBottom: 18 }}>
        <Stat label="Students" value={S.length} icon="users" hint="assigned to you" />
        <Stat label="Need attention" value={attention} icon="alert" up={false} hint="at risk this week" />
        <Stat label="Open tasks" value={open} icon="tasks" hint={`${overdue} overdue${review ? `, ${review} to review` : ''}`} />
        <Stat label="Sessions coming up" value={data.sessions.length} icon="calendar" hint="scheduled" />
      </div>
      <Requests requests={data.requests || []} onDone={actions.reload} />
      <WeekBoard board={data.board || []} />
      <div className="pf-quick" style={{ marginBottom: 18 }}>
        <Link className="pf-quick-item" to="assistant"><Icon name="sparkles" size={20} /><span><b>Ask the assistant</b><br /><span className="pf-small pf-muted">Tasks, sessions and notes in plain words</span></span></Link>
        <Link className="pf-quick-item" to="tasks"><Icon name="clipboard" size={20} /><span><b>{review ? `Review ${review} handed-in task${review > 1 ? 's' : ''}` : 'Set a task'}</b><br /><span className="pf-small pf-muted">{review ? 'Approve or send back with feedback' : 'For one student or everyone at once'}</span></span></Link>
        <Link className="pf-quick-item" to={active[0] ? `students?open=${active[0].id}` : 'students'}><Icon name="file" size={20} /><span><b>Write weekly summaries</b><br /><span className="pf-small pf-muted">Open a student, then This week</span></span></Link>
      </div>
      <div className="pf-grid g-main">
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Needs your attention" icon="alert" />
            {data.alerts.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing urgent. Everyone is on track.</p> :
              <ul className="pf-list">{data.alerts.map(a => <li key={a.id}><Pill tone={a.level === 'high' ? 'coral' : a.level === 'medium' ? 'gold' : 'leaf'}>{a.level === 'good' ? 'Good news' : a.level}</Pill><span className="pf-grow">{a.text}</span>{a.studentId && by(a.studentId) && !by(a.studentId).limited && <Link className="pf-btn sm ghost" to={`students?open=${a.studentId}`}>Open</Link>}</li>)}</ul>}</Card>
          <Card><CardHead title="Your students" action="See all" to="students" icon="users" />
            <div className="pf-grid g2">{S.map(s => (
              <Link key={s.id} to={s.limited ? 'students' : `students?open=${s.id}`} className="pf-card" style={{ boxShadow: 'none', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="pf-row"><Avatar name={s.name} /><div className="pf-grow"><b>{s.name}</b><div className="pf-small pf-muted">{gradeLabel(s.grade)}{s.goal ? ` · ${s.goal}` : ''}</div></div></div>
                {s.limited ? <div style={{ marginTop: 10 }}><Pill tone="gold">Waiting for parent</Pill></div> : <>
                  <div className="pf-row pf-between pf-small" style={{ margin: '10px 0 4px' }}><span className="pf-muted">Tasks done</span><b className="pf-num">{s.tasks.done}/{s.tasks.total}</b></div><Progress value={s.tasks.total ? (s.tasks.done / s.tasks.total) * 100 : 0} label={`${s.name} tasks done`} />
                  <div className="pf-row pf-wrap" style={{ marginTop: 10, gap: 6 }}><Pill tone={A[s.assessment.state][0]}>{A[s.assessment.state][1]}</Pill>{s.tasks.overdue > 0 && <Pill tone="coral">{s.tasks.overdue} overdue</Pill>}</div></>}
              </Link>))}</div></Card>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
        <MentorCode code={data.me.mentorCode} />
        <Card><CardHead title="Coming up" action="Sessions" to="sessions" icon="calendar" />
          {data.sessions.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No sessions scheduled. Book one from the Sessions page.</p> :
            <ul className="pf-list">{data.sessions.slice(0, 6).map(x => <li key={x.id}><Avatar name={by(x.studentId).name} size={32} /><span className="pf-grow"><b>{by(x.studentId).name}</b><br /><span className="pf-small pf-muted">{x.when || `${fmtDate(x.date)}${x.time ? `, ${x.time}` : ''}`}{x.agenda && x.agenda.length ? ` · ${x.agenda.length} to talk about` : ''}</span></span></li>)}</ul>}</Card>
        </div>
      </div>
    </>
  );
}
