import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, CardHead, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';
import { coachApi, errMessage } from '../liveApi';
import Markdown from '../coach/Markdown';

// The AI coach: a study companion that knows the student's plan. The server builds what it knows, checks every action card and
// quiz, keeps to the daily limit and handles safety; this page shows the conversation and sends the student's choices.
const FOCUS_STARTERS = {
  step: ['Explain this simply', 'Give me a real-life example', 'Quiz me on this'],
  task: ['Help me get started', 'Break it into small steps', 'What should I check before handing it in?'],
  check: ['Go over what I got wrong', 'Quiz me again on the hard parts']
};
const KIND = { explain: 'Explained', quiz: 'Practice quiz', plan: 'Planning', career: 'Careers', support: 'Support', reflect: 'Reflecting', other: '' };
const FOCUS_LABEL = { step: 'About a step', task: 'About a task', check: 'About your assessment' };

/** A practice quiz from the coach: marked here, the result goes back into the chat. Never counted anywhere. */
function Quiz({ chatId, index, quiz, result, onChat, onAsk }) {
  const [ans, setAns] = useState(() => (result ? result.answers : quiz.map(() => -1)));
  const [err, setErr] = useState('');
  const check = async () => { setErr(''); try { onChat((await coachApi.quiz(chatId, index, ans)).chat); } catch (x) { setErr(errMessage(x)); } };
  return (
    <div className="pf-cquiz">
      {quiz.map((q, k) => (
        <fieldset key={k} className="pf-cquiz-q">
          <legend><b>{k + 1}.</b> {q.q}</legend>
          {q.options.map((o, j) => {
            const mark = result ? (j === q.answer ? 'right' : j === result.answers[k] ? 'wrong' : '') : '';
            return <label key={j} className={`pf-cquiz-opt ${mark}`}><input type="radio" name={`q-${index}-${k}`} disabled={Boolean(result)} checked={ans[k] === j} onChange={() => setAns(a => a.map((x, i) => (i === k ? j : x)))} />{o}</label>;
          })}
          {result && <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>{result.answers[k] === q.answer ? '✓ ' : '✗ '}{q.why}</p>}
        </fieldset>))}
      {result ? <div className="pf-row pf-wrap" style={{ gap: 8 }}><b>{result.score} of {result.of} right</b>{result.score < result.of && <button type="button" className="pf-btn sm ghost" onClick={() => onAsk('Explain the ones I got wrong')}>Explain the ones I missed</button>}</div>
        : <button type="button" className="pf-btn sm" disabled={ans.some(a => a < 0)} onClick={check}>Check my answers</button>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      <p className="pf-small pf-faint" style={{ margin: 0 }}>Practice only: this quiz is not marked anywhere.</p>
    </div>
  );
}

/** One thing the coach suggests doing. Links open a page; the rest are done by the server when tapped, after the student edits. */
function ActionCard({ chatId, index, k, a, mentor, onChat }) {
  const [text, setText] = useState(a.text || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async (body = {}) => { setBusy(true); setErr(''); try { onChat((await coachApi.act(chatId, { index, action: k, ...body })).chat); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const done = label => <div className="pf-cact done"><Icon name="check" size={14} />{label}</div>;
  if (a.type === 'open_step') return <Link className="pf-cact link" to={`/platform/student/plan/day/${a.date}`}><Icon name="calendar" size={14} />Open “{a.title}”</Link>;
  if (a.type === 'ask_session') return mentor ? <Link className="pf-cact link" to="/platform/student/mentor?ask=1"><Icon name="calendar" size={14} />Ask {mentor} for a session</Link> : null;
  if (a.type === 'add_task') return a.done ? done(`Added to your tasks: ${a.title}`) : (
    <div className="pf-cact"><span className="pf-grow"><b>{a.title}</b><br /><span className="pf-small pf-muted">Due {fmtDate(a.due)} · {a.priority} priority</span></span>
      <button type="button" className="pf-btn sm" disabled={busy} onClick={() => go()}>Add to my tasks</button>{err && <span className="pf-small" role="alert">{err}</span>}</div>);
  if (a.type === 'save_note') return a.done ? done(`Saved to your notes on “${a.title}”`) : (
    <div className="pf-cact"><span className="pf-grow"><span className="pf-small pf-muted">Keep this in your notes on “{a.title}”:</span><br />{a.text}</span>
      <button type="button" className="pf-btn sm" disabled={busy} onClick={() => go()}>Save to my notes</button>{err && <span className="pf-small" role="alert">{err}</span>}</div>);
  if (a.type === 'log_day' || a.type === 'message_mentor') {
    if (a.done) return done(a.type === 'log_day' ? 'Saved to today’s learning log' : `Sent to ${mentor || 'your mentor'}`);
    const id = `ca-${index}-${k}`;
    return (
      <div className="pf-cact col">
        <label className="pf-small pf-muted" htmlFor={id}>{a.type === 'log_day' ? 'Today’s learning log (change it to your own words)' : `A message to ${mentor || 'your mentor'} (edit before sending)`}</label>
        <textarea id={id} className="pf-input" rows={3} maxLength={a.type === 'log_day' ? 1500 : 2000} value={text} onChange={e => setText(e.target.value)} />
        <div className="pf-row" style={{ gap: 6 }}><button type="button" className="pf-btn sm" disabled={busy || text.trim().length < (a.type === 'log_day' ? 10 : 2)} onClick={() => go({ text: text.trim() })}>{a.type === 'log_day' ? 'Save to today’s log' : `Send to ${mentor || 'my mentor'}`}</button></div>
        {err && <span className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</span>}
      </div>);
  }
  return null;
}

function Bubble({ m, chat, last, mentor, onChat, onAsk }) {
  const [err, setErr] = useState('');
  if (m.role === 'student') return <div className="pf-cmsg me"><div className="pf-cbub">{m.text}</div></div>;
  const rate = async v => { setErr(''); try { onChat((await coachApi.feedback(chat.id, m.i, m.feedback === v ? null : v)).chat); } catch (x) { setErr(errMessage(x)); } };
  return (
    <div className={`pf-cmsg coach${m.kind === 'safety' ? ' safety' : ''}`}>
      <span className="pf-cavatar" aria-hidden="true"><Icon name="sparkles" size={15} /></span>
      <div className="pf-grow" style={{ minWidth: 0 }}>
        <div className="pf-cbub">
          {KIND[m.kind] && <span className="pf-ckind">{KIND[m.kind]}</span>}
          <Markdown text={m.text} />
          {m.quiz.length > 0 && <Quiz chatId={chat.id} index={m.i} quiz={m.quiz} result={m.quizResult} onChat={onChat} onAsk={onAsk} />}
          {m.actions.length > 0 && <div className="pf-cacts">{m.actions.map((a, k) => <ActionCard key={k} chatId={chat.id} index={m.i} k={k} a={a} mentor={mentor} onChat={onChat} />)}</div>}
        </div>
        {!['safety', 'refused'].includes(m.kind) && <div className="pf-crate">
          <button type="button" aria-label="Helpful" aria-pressed={m.feedback === 'up'} onClick={() => rate('up')}>👍</button>
          <button type="button" aria-label="Not helpful" aria-pressed={m.feedback === 'down'} onClick={() => rate('down')}>👎</button>
          {err && <span className="pf-small">{err}</span>}
        </div>}
        {last && m.followups.length > 0 && <div className="pf-chip-row" style={{ marginTop: 6 }}>{m.followups.map(f => <button key={f} type="button" className="pf-chip" onClick={() => onAsk(f)}>{f}</button>)}</div>}
      </div>
    </div>
  );
}

export default function LiveCoach() {
  const { data } = usePlatform();
  const [sp, setSp] = useSearchParams();
  const [home, setHome] = useState(null);
  const [chat, setChat] = useState(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sharing, setSharing] = useState(null);
  const log = useRef(null);
  const started = useRef('');
  const loadHome = useCallback(() => coachApi.home().then(setHome).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { loadHome(); }, [loadHome]);

  // ?chat=… opens a chat; ?step= / ?task= / ?check= start one about that thing (once, even if the page renders twice)
  const chatId = sp.get('chat');
  const focusKey = ['step', 'task', 'check'].find(k => sp.get(k));
  useEffect(() => {
    if (!focusKey) { started.current = ''; return; }
    const key = `${focusKey}:${sp.get(focusKey)}`;
    if (started.current === key) return;
    started.current = key;
    coachApi.start({ kind: focusKey, id: sp.get(focusKey) }).then(r => { setChat(r.chat); setSp({ chat: r.chat.id }, { replace: true }); loadHome(); })
      .catch(x => { setErr(errMessage(x, 'That step or task could not be found.')); setSp({}, { replace: true }); });
  }, [focusKey, sp, setSp, loadHome]);
  useEffect(() => {
    if (focusKey) return;
    if (!chatId) { setChat(null); return; }
    if (chat && chat.id === chatId) return;
    coachApi.get(chatId).then(r => setChat(r.chat)).catch(() => setSp({}, { replace: true }));
  }, [chatId, focusKey]);                                     // not `chat`: opening it must not trigger another fetch
  useEffect(() => { const el = log.current; if (el) el.scrollTop = el.scrollHeight; }, [chat, pending]);   // the newest message in view

  const ask = async (q, focus = null) => {
    const t = String(q || '').trim(); if (!t || busy) return;
    setBusy(true); setErr(''); setPending(t); setText('');
    try {
      let c = chat;
      if (!c) { c = (await coachApi.start(focus)).chat; setChat(c); setSp({ chat: c.id }, { replace: true }); }
      const r = await coachApi.send(c.id, t);
      setChat(r.chat);
      setHome(h => (h ? { ...h, allowance: r.allowance } : h));
      loadHome();
    } catch (x) { setErr(errMessage(x, 'The coach could not answer just now. Please try again.')); setText(t); }
    finally { setBusy(false); setPending(''); }
  };
  const fresh = () => { setChat(null); setErr(''); setSp({}, { replace: false }); };
  const remove = async id => { try { await coachApi.remove(id); if (chat && chat.id === id) fresh(); loadHome(); } catch (x) { setErr(errMessage(x)); } };
  const share = async e => { e.preventDefault(); try { setChat((await coachApi.share(chat.id, sharing.trim())).chat); setSharing(null); } catch (x) { setErr(errMessage(x)); } };

  if (!home) return <><PageHead eyebrow="AI coach" title="Your study coach" /><p role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p></>;
  const mentor = home.mentor && home.mentor.firstName;
  const a = home.allowance;
  const msgs = chat ? chat.messages : [];
  const lastCoach = [...msgs].reverse().find(m => m.role === 'coach');
  const name = data && data.me ? data.me.firstName : '';
  const starters = chat && chat.focus && !msgs.length ? FOCUS_STARTERS[chat.focus.kind].map(t => ({ text: t })) : home.starters;
  return (
    <>
      <PageHead eyebrow="AI coach" title={`Hi ${name || 'there'}, what shall we work on?`}>
        Your coach knows your goal, this week’s plan and what you found hard. It explains, quizzes you, helps you use the time you have, and helps you prepare for {mentor || 'your mentor'}.
      </PageHead>
      <div className="pf-grid g-main">
        <Card flush className="pf-coach">
          <div className="pf-coach-h">
            <div className="pf-grow" style={{ minWidth: 0 }}><b className="pf-ellipsis">{chat ? chat.title : 'New chat'}</b>
              {chat && chat.focus && <span className="pf-small pf-muted"> · {FOCUS_LABEL[chat.focus.kind]}</span>}{chat && chat.sharedAt && <> <Pill tone="sky">Shared with {mentor || 'your mentor'}</Pill></>}</div>
            {chat && msgs.length > 0 && mentor && sharing === null && <button type="button" className="pf-btn sm ghost" onClick={() => setSharing('')}><Icon name="users" size={14} />Share with {mentor}</button>}
            {chat && <button type="button" className="pf-btn sm ghost" onClick={fresh}><Icon name="plus" size={14} />New chat</button>}
          </div>
          {sharing !== null && <form className="pf-sess-form" style={{ margin: '0 16px' }} onSubmit={share}>
            <label className="pf-label" htmlFor="share-note">A note to {mentor} (optional)</label>
            <input id="share-note" className="pf-input" maxLength={1500} value={sharing} onChange={e => setSharing(e.target.value)} placeholder={`e.g. I still do not get this part. Can we go over it?`} />
            <div className="pf-row" style={{ gap: 6 }}><button type="submit" className="pf-btn sm">Send to {mentor}</button><button type="button" className="pf-btn sm ghost" onClick={() => setSharing(null)}>Back</button></div>
          </form>}
          <div ref={log} className="pf-coach-log" role="log" aria-label="Conversation with the AI coach" aria-live="polite">
            {msgs.length === 0 && !pending && <div className="pf-coach-empty">
              <span className="pf-cavatar big" aria-hidden="true"><Icon name="sparkles" size={22} /></span>
              <p style={{ margin: '10px 0 4px' }}><b>{chat && chat.focus ? `Let’s work on “${chat.focus.title}”.` : 'Ask me anything about your learning.'}</b></p>
              <p className="pf-small pf-muted" style={{ margin: 0 }}>Pick one to start, or type your own question below.</p>
            </div>}
            {msgs.map(m => <Bubble key={m.i} m={m} chat={chat} last={lastCoach && m.i === lastCoach.i} mentor={mentor} onChat={setChat} onAsk={q => ask(q)} />)}
            {pending && <><div className="pf-cmsg me"><div className="pf-cbub">{pending}</div></div><div className="pf-cmsg coach"><span className="pf-cavatar" aria-hidden="true"><Icon name="sparkles" size={15} /></span><div className="pf-cbub pf-typing" role="status" aria-label="The coach is thinking"><i /><i /><i /></div></div></>}
          </div>
          {msgs.length === 0 && starters.length > 0 && <div className="pf-chip-row pf-coach-starters">{starters.map(s => <button key={s.text} type="button" className="pf-chip" disabled={busy || a.left <= 0} onClick={() => ask(s.text, s.focus || null)}>{s.text}</button>)}</div>}
          {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '0 16px 8px' }}>{err}</p>}
          <form className="pf-chat-input" onSubmit={e => { e.preventDefault(); ask(text); }}>
            <label className="pf-sr" htmlFor="coach-input">Ask the coach</label>
            <textarea id="coach-input" className="pf-textarea" rows={2} maxLength={1500} value={text} placeholder={a.left > 0 ? 'Ask a question, or say what you are stuck on' : 'No coach messages left today'} disabled={a.left <= 0}
              onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(text); } }} />
            <button type="submit" className="pf-btn" disabled={busy || !text.trim() || a.left <= 0} aria-label="Send to the coach"><Icon name="send" size={16} /></button>
          </form>
          <p className="pf-small pf-faint" style={{ margin: '0 16px 12px' }}>{mentor ? `${mentor}, your mentor, can read your chats with the coach. ` : 'Your mentor can read your chats with the coach. '}The coach is an AI and can make mistakes: check anything important. For graded work it gives hints, not answers.</p>
        </Card>

        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Today" icon="calendar" />
            {home.today.steps.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>{home.hasPlan ? 'Nothing planned for today. A good day to revise or get ahead.' : 'You have no weekly plan yet. Ask the coach to help you choose what to learn first.'}</p>
              : <ul className="pf-list">{home.today.steps.map(s => <li key={s.id}><span className="pf-grow"><b>{s.title}</b><br /><span className="pf-small pf-muted">{s.minutes} min{s.late ? ' · from earlier this week' : ''}</span></span>
                {s.status === 'done' ? <Pill tone="leaf">Done</Pill> : <button type="button" className="pf-btn sm ghost" disabled={busy || a.left <= 0} onClick={() => { fresh(); setSp({ step: s.id }); }}>Ask</button>}</li>)}</ul>}
            {home.today.due.length > 0 && <><div className="pf-eyebrow" style={{ marginTop: 12 }}>Due soon</div><ul className="pf-list">{home.today.due.map(t => <li key={t.id}><span className="pf-grow">{t.title}<br /><span className="pf-small" style={{ color: t.overdue ? 'var(--coral)' : 'var(--muted)' }}>{t.overdue ? 'Overdue' : `Due ${fmtDate(t.due)}`}</span></span></li>)}</ul></>}
            {home.today.next && <p className="pf-small" style={{ margin: '12px 0 0' }}><Icon name="users" size={13} /> Next with {mentor}: <b>{home.today.next.when}</b></p>}
          </Card>
          <Card><div className="pf-row pf-between"><b>Coach messages today</b><span className="pf-small">{a.left} of {a.limit} left</span></div>
            <div className="pf-progress" style={{ marginTop: 8 }}><i style={{ width: `${a.limit ? Math.round((a.left / a.limit) * 100) : 0}%` }} /></div>
            <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>{a.paused ? 'The coach is resting for today. It is back tomorrow.' : a.reduced ? 'With a plan you get 20 a day. ' : ''}They reset at 5:30 am.</p></Card>
          <Card><CardHead title="Your chats" icon="message" />
            {home.chats.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Your conversations with the coach will be kept here for six months.</p>
              : <ul className="pf-list pf-coach-chats">{home.chats.map(c => (
                <li key={c.id}><button type="button" className="pf-coach-chat" aria-current={chat && chat.id === c.id ? 'true' : undefined} onClick={() => setSp({ chat: c.id })}>
                  <b className="pf-ellipsis">{c.title}</b><span className="pf-small pf-muted">{new Date(c.lastAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{c.focus ? ` · ${FOCUS_LABEL[c.focus.kind].toLowerCase()}` : ''}</span></button>
                  <button type="button" className="pf-iconbtn" aria-label={`Delete the chat “${c.title}”`} onClick={() => remove(c.id)}><Icon name="x" size={14} /></button></li>))}</ul>}
          </Card>
        </div>
      </div>
    </>
  );
}
