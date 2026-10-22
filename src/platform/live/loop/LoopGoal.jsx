import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { usePlatform } from '../../data/store';
import { loopApi, useLoop, messageFor, DAYS, SHORT_DAYS, PACE, fmtMinutes, fmtDay } from './loopApi';
import { Working, PageSkeleton } from './Loader';

const MINUTE_CHOICES = [0, 15, 30, 45, 60, 90, 120, 180, 240];

const PLAN_STEPS = ['The Journey Architect is working out where you start\u2026', 'Choosing an end point you can reach in your time\u2026', 'Laying out the levels between the two\u2026', 'A Journey Critic is checking the order and the load\u2026', 'Fixing anything the critic found\u2026'];
/** The guide's typing dots; if it takes a while (it may be writing the plan), say what it is doing. */
function Thinking() {
  const [long, setLong] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLong(true), 4000); return () => clearTimeout(t); }, []);
  return long ? <div className="pf-msg ai" style={{ padding: 0, background: 'transparent', border: 0 }}><Working compact title="Your guide is thinking" steps={PLAN_STEPS} /></div> : <div className="pf-msg ai pf-typing" aria-label="The guide is typing"><span /><span /><span /></div>;
}

/** The career chat: the guide asks one question at a time; quick replies for common answers. */
function Chat({ intake, act }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(null);       // what the student just sent, shown while the guide thinks
  const log = useRef(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [intake.messages.length, pending]);
  const send = async value => {
    const t = (value || '').trim();
    if (!t || busy) return;
    setBusy(true); setErr(''); setPending(t); setText('');
    try { await act(() => loopApi.chat(t)); }
    catch (e) { setErr(messageFor(e)); setText(t); }               // keep what they typed, so they can send it again
    finally { setBusy(false); setPending(null); }
  };
  const last = intake.messages[intake.messages.length - 1];
  return (
    <Card>
      <CardHead title="Your iMenteo guide" icon="sparkles" />
      <div className="pf-chat pf-loopchat" ref={log} role="log" aria-label="Conversation with your guide" aria-live="polite">
        {intake.messages.map((m, i) => <div key={i} className={`pf-msg ${m.role === 'user' ? 'me' : 'ai'}`}>{m.text}</div>)}
        {pending && <div className="pf-msg me">{pending}</div>}
        {busy && <Thinking />}
      </div>
      {!busy && last && last.role === 'assistant' && last.quickReplies && last.quickReplies.length > 0 && (
        <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 10 }}>{last.quickReplies.map(q => <button key={q} type="button" className="pf-chipbtn" onClick={() => send(q)}>{q}</button>)}</div>
      )}
      <form className="pf-row" style={{ gap: 8, marginTop: 12 }} onSubmit={e => { e.preventDefault(); send(text); }}>
        <label className="pf-sr" htmlFor="chat-input">Your message</label>
        <input id="chat-input" className="pf-input pf-grow" value={text} maxLength={500} placeholder={intake.status === 'proposed' ? 'Tell me what to change, or start the plan below' : 'Type your answer…'} onChange={e => setText(e.target.value)} disabled={busy} autoComplete="off" />
        <button type="submit" className="pf-btn" disabled={busy || !text.trim()}>Send</button>
      </form>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 8 }}>{err}</p>}
    </Card>
  );
}

const START_STEPS = ['The Week Planner is writing your first week\u2026', 'A Week Critic is checking it\u2026', 'Scouts are finding free videos and practice\u2026', 'Fitting everything into your real free time\u2026'];
/** The drafted plan: where they start and where they are heading. The steps in between are shown one week at a time, not all at once. */
function Proposal({ plan, act, onStarted }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const start = async () => { setBusy(true); setErr(''); try { await act(() => loopApi.confirm()); onStarted(); } catch (e) { setErr(messageFor(e)); setBusy(false); } };
  if (busy) return <Card style={{ marginTop: 16 }}><Working title="Starting your plan" steps={START_STEPS} /></Card>;
  return (
    <Card style={{ marginTop: 16 }} ai>
      <span className="tag"><Icon name="sparkles" size={14} />Your plan</span>
      <h3 style={{ margin: '6px 0 12px' }}>{plan.careerTitle}</h3>
      <div className="pf-grid g2">
        <div className="pf-point"><div className="pf-eyebrow">Starting point</div><p style={{ margin: '4px 0 0' }}>{plan.startPoint.summary}</p></div>
        <div className="pf-point end"><div className="pf-eyebrow">End point · about {plan.endPoint.horizonWeeks} weeks</div><p style={{ margin: '4px 0 0' }}>{plan.endPoint.summary}</p></div>
      </div>
      {plan.endPoint.outcomes.length > 0 && <><h4 style={{ margin: '14px 0 6px' }}>By the end, you will be able to show</h4><ul style={{ margin: 0, paddingLeft: 18 }}>{plan.endPoint.outcomes.map(o => <li key={o} className="pf-small">{o}</li>)}</ul></>}
      <p className="pf-small" style={{ marginTop: 14 }}><b>How it works:</b> you get one week at a time. After each week you do a short assessment, and the next week is built from how it went, faster if you are flying, slower if you need time. The road between here and the end point changes with you.</p>
      {plan.firstLevel && (
        <div className="pf-levelcard">
          <div className="pf-eyebrow">Level 1 of {plan.phaseCount} · about {plan.firstLevel.weeks} weeks</div>
          <b>{plan.firstLevel.title}</b>
          <p className="pf-small" style={{ margin: '4px 0 0' }}>{plan.firstLevel.outcome}</p>
          {plan.firstLevel.levelUp && <p className="pf-small" style={{ margin: '6px 0 0' }}><b>To move up to Level 2:</b> {plan.firstLevel.levelUp}</p>}
          <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>Each level ends with a proof like this. Pass it and the next level opens.</p>
        </div>
      )}
      {plan.longPath && <p className="pf-small"><b>The longer road:</b> {plan.longPath}</p>}
      {plan.notes.length > 0 && <ul className="pf-small pf-muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{plan.notes.map(n => <li key={n}>{n}</li>)}</ul>}
      <div className="pf-row pf-wrap" style={{ gap: 10, marginTop: 16 }}>
        <button type="button" className="pf-btn" onClick={start}>Start this plan</button>
        <span className="pf-small pf-muted">Want something different? Tell the guide in the chat above.</span>
      </div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 8 }}>{err}</p>}
      <p className="pf-small pf-faint" style={{ marginTop: 12 }}>Drafted by AI from what you said and real occupation data, then reviewed by a second AI acting as a senior practitioner. Not yet checked by a person: a mentor can help you adjust it.</p>
    </Card>
  );
}

/** Free time per day, rest day and exams: the week every plan is built around. */
/** Reminder emails: on by default, one tap to stop (only shown while reminders are being sent at all). */
function Emails({ on, act }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const flip = async () => { setBusy(true); setErr(''); try { await act(() => loopApi.setEmails(!on)); } catch (e) { setErr(messageFor(e)); } finally { setBusy(false); } };
  return (
    <div className="pf-row pf-wrap" style={{ gap: 10, marginTop: 16 }}>
      <label className="pf-row" style={{ gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={on} disabled={busy} onChange={flip} /><span>Email me when my week is ending or my next week is ready to plan</span></label>
      <span className="pf-small pf-muted">At most one email a day, in the evening.</span>
      {err && <span className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</span>}
    </div>
  );
}

function Schedule({ profile, act, intro }) {
  const [free, setFree] = useState(profile.freeMinutes);
  const [restDay, setRest] = useState(profile.restDay);
  const [exams, setExams] = useState(profile.exams);
  const [state, setState] = useState('');
  const weekly = free.reduce((a, m, d) => a + (d === restDay ? 0 : m), 0);
  const save = async e => {
    e.preventDefault(); setState('saving');
    try { await act(() => loopApi.setSchedule({ freeMinutes: free, restDay, exams: exams.filter(x => x.title.trim() && x.date) })); setState('saved'); }
    catch (x) { setState(messageFor(x)); }
  };
  return (
    <form onSubmit={save}>
      {intro && <p className="pf-small pf-muted" style={{ marginTop: 0 }}>{intro}</p>}
      <div className="pf-grid g4">{DAYS.map((d, i) => (
        <div className="pf-field" key={d}><label className="pf-label" htmlFor={`free-${i}`}>{d}</label>
          <select id={`free-${i}`} className="pf-select" value={free[i]} disabled={restDay === i} onChange={e => { setFree(f => f.map((m, k) => (k === i ? Number(e.target.value) : m))); setState(''); }}>{[...new Set([...MINUTE_CHOICES, free[i]])].sort((a, b) => a - b).map(m => <option key={m} value={m}>{m ? fmtMinutes(m) : 'No time'}</option>)}</select></div>
      ))}</div>
      <div className="pf-field" style={{ marginTop: 12, maxWidth: 260 }}><label className="pf-label" htmlFor="rest">Rest day</label>
        <select id="rest" className="pf-select" value={restDay === null ? '' : restDay} onChange={e => { setRest(e.target.value === '' ? null : Number(e.target.value)); setState(''); }}><option value="">No fixed rest day</option>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
      <p className="pf-small" style={{ marginTop: 8 }}>About {fmtMinutes(Math.round(weekly * 0.8))} a week will be planned, leaving room for the unexpected.</p>
      <h4 style={{ margin: '16px 0 6px' }}>Exams coming up</h4>
      <p className="pf-small pf-muted" style={{ marginBottom: 8 }}>School tests, boards, entrance exams. Weeks around an exam get much lighter.</p>
      {exams.map((x, i) => (
        <div className="pf-row pf-wrap" key={i} style={{ gap: 8, marginBottom: 6 }}>
          <input className="pf-input" aria-label={`Exam ${i + 1} name`} value={x.title} maxLength={60} placeholder="For example: Half-yearly exams" onChange={e => setExams(xs => xs.map((y, k) => (k === i ? { ...y, title: e.target.value } : y)))} style={{ flex: '1 1 220px' }} />
          <input className="pf-input" aria-label={`Exam ${i + 1} date`} type="date" value={x.date} onChange={e => setExams(xs => xs.map((y, k) => (k === i ? { ...y, date: e.target.value } : y)))} style={{ width: 170 }} />
          <button type="button" className="pf-btn sm ghost" onClick={() => setExams(xs => xs.filter((_, k) => k !== i))} aria-label={`Remove exam ${i + 1}`}>Remove</button>
        </div>
      ))}
      {exams.length < 20 && <button type="button" className="pf-btn sm ghost" onClick={() => setExams(xs => [...xs, { title: '', date: '' }])}>Add an exam</button>}
      <div className="pf-row" style={{ gap: 12, marginTop: 14 }}>
        <button type="submit" className="pf-btn" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save my week'}</button>
        {state === 'saved' && <span className="pf-small" role="status">Saved. It shapes next week, or use "Re-plan the rest of this week" on your plan.</span>}
        {state && !['saved', 'saving'].includes(state) && <span className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{state}</span>}
      </div>
    </form>
  );
}

export default function LoopGoalPage() {
  const { loop, loading, closed, error, act } = useLoop();
  const platform = usePlatform();
  const [justStarted, setJustStarted] = useState(false);
  const refreshDashboard = () => { if (platform && platform.actions && platform.actions.reload) platform.actions.reload(); };
  const head = <PageHead eyebrow="My goal" title="Where do you want to get to?">Tell your guide what you want to become, any career at all. It asks a few questions, then drafts a plan from where you are to where you want to be, one week at a time.</PageHead>;
  if (loading) return <PageSkeleton label="Loading your goal" cards={2} />;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Goals and weekly plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;

  if (loop.mode === 'chat') {
    return (
      <>
        {head}
        {loop.currentGoal && <div className="pf-note" role="note" style={{ marginBottom: 14 }}>You are planning a new goal. Your current goal, <b>{loop.currentGoal.title}</b>, stays until you start the new plan. <button type="button" className="pf-link" onClick={() => act(() => loopApi.cancelNewGoal())}>Keep my current goal</button></div>}
        <Chat intake={loop.intake} act={act} />
        {loop.intake.proposal && <Proposal plan={loop.intake.proposal} act={act} onStarted={() => { setJustStarted(true); refreshDashboard(); }} />}
      </>
    );
  }

  const g = loop.goal;
  const pace = PACE[g.pace] || PACE['on-track'];
  return (
    <>
      {head}
      {justStarted && <div className="pf-note" role="status" style={{ marginBottom: 14 }}><b>Your plan has started.</b> Check your week below, so it fits your real free time; then open your <Link to="../plan">weekly plan</Link>.</div>}
      <div className="pf-grid g-main-r">
        <Card><CardHead title="Your goal" icon="target" />
          <h3 style={{ margin: '4px 0' }}>{g.title}</h3>
          <div className="pf-row pf-wrap" style={{ gap: 8, margin: '6px 0 12px' }}><Pill tone={pace[1]}>{pace[0]}</Pill><span className="pf-small pf-muted">Week {g.weekNumber} · Level {g.phase.number} of {g.phase.total}: {g.phase.title} · target {fmtDay(g.targetDate)}</span></div>
          <div className="pf-grid g2">
            <div className="pf-point"><div className="pf-eyebrow">Started from</div><p style={{ margin: '4px 0 0' }} className="pf-small">{g.startPoint.summary}</p></div>
            <div className="pf-point end"><div className="pf-eyebrow">Heading to</div><p style={{ margin: '4px 0 0' }} className="pf-small">{g.endPoint.summary}</p></div>
          </div>
          <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 14 }}><Link className="pf-btn" to="../plan">This week’s plan</Link><Link className="pf-btn ghost" to="../plan/roadmap">My progress</Link>
            <button type="button" className="pf-btn ghost" onClick={() => { if (window.confirm('Start planning a new goal? Your current goal stays until you start the new plan.')) act(() => loopApi.newGoal()); }}>Start a new goal</button></div>
        </Card>
        <Card><CardHead title="Your week" icon="calendar" />
          <ul className="pf-list">{loop.profile.freeMinutes.map((m, i) => <li key={i}><span className="pf-grow">{SHORT_DAYS[i]}</span><span className="pf-small pf-muted">{i === loop.profile.restDay ? 'Rest day' : m ? fmtMinutes(m) : 'No time'}</span></li>)}</ul>
        </Card>
      </div>
      <Card style={{ marginTop: 18 }}><CardHead title="Set your real week" icon="calendar" />
        <Schedule profile={loop.profile} act={act} intro="How much free time do you have each day, after school, college, coaching and sleep? Be honest: a plan that fits is a plan you will follow." />
        {loop.emailsOn && <Emails on={loop.emails} act={act} />}
      </Card>
    </>
  );
}
