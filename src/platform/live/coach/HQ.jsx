import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, CardHead, Icon, PageHead, Pill, Tabs } from '../../ui/kit';
import { coachApi, errMessage } from '../liveApi';
import { useLiveEvent } from '../events';
import LiveCoach from '../student/Coach';
import Ritual from './Rituals';
import FocusMode from './FocusMode';
import Progress from './Progress';
import Settings from './Settings';

// Coach HQ: the student's cockpit. The coach runs the week with them: today's word and game plan, the check-in that is due,
// one-tap fixes, a command bar that hands requests to the coach, what the coach noticed and changed (with Undo), focus mode,
// their progress, and how the coach works for them.
const TYPE = { learn: ['Learn', 'sky'], practice: ['Practise', 'leaf'], revise: ['Revise', 'gold'], assess: ['Check', 'coral'], project: ['Project', 'gold'], task: ['Task', 'grey'] };
const EXAMPLES = ['I’m busy today, push my steps to later this week', 'Move practice to Saturday', 'Remind me at 6 pm to revise', 'I have a test on Friday', 'Add a task: revise chapter 3 tomorrow'];
const ago = at => { const m = Math.round((Date.now() - new Date(at).getTime()) / 60000); return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };
const tomorrowOf = d => new Date(Date.parse(`${d}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

function GamePlan({ plan, today, onFocus, onChanged }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const move = async id => { setBusy(id); setErr(''); try { await coachApi.changes([{ tool: 'move_step', stepId: id, date: tomorrowOf(today) }]); await onChanged(); } catch (x) { setErr(errMessage(x)); } finally { setBusy(''); } };
  if (!plan.items.length) return <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing planned today. A good day to revise, practise, or rest.</p>;
  return (
    <>
      <p className="pf-small pf-muted" style={{ marginTop: 0 }}>About <b>{plan.total} min</b> to do{plan.available !== null ? <> · you have <b>{plan.available} min</b> today</> : ''}.</p>
      <ol className="pf-gp">{plan.items.map(i => {
        const [t, tone] = TYPE[i.type] || TYPE.task; const finished = ['done', 'skipped'].includes(i.status);
        return (
          <li key={`${i.kind}-${i.id}`} className={`${finished ? 'done' : ''}${!i.fits && !finished ? ' later' : ''}`}>
            <span className="pf-gp-dot" aria-hidden="true">{finished ? <Icon name="check" size={13} /> : null}</span>
            <div className="pf-grow" style={{ minWidth: 0 }}>
              <div className="pf-row pf-wrap" style={{ gap: 6 }}><b className={finished ? 'pf-strike' : ''}>{i.title}</b><Pill tone={tone}>{t}</Pill>{i.late && !finished && <Pill tone="coral">{i.kind === 'task' ? 'Overdue' : 'From earlier'}</Pill>}{!i.fits && !finished && <Pill tone="grey">If there’s time</Pill>}</div>
              <span className="pf-small pf-muted">{i.minutes} min{i.kind === 'task' ? ` · due ${i.date === today ? 'today' : i.date < today ? 'already' : 'tomorrow'}` : ''}</span>
            </div>
            {!finished && <div className="pf-row" style={{ gap: 6 }}>
              <button type="button" className="pf-btn sm" onClick={() => onFocus(i)}><Icon name="play" size={13} />Focus</button>
              {i.kind === 'step' && <button type="button" className="pf-btn sm ghost" disabled={busy === i.id} onClick={() => move(i.id)} title="Move to tomorrow">Tomorrow</button>}
              {i.kind === 'step' ? <Link className="pf-btn sm ghost" to={`/platform/student/plan/day/${i.date}`}>Open</Link> : <Link className="pf-btn sm ghost" to="/platform/student/tasks">Open</Link>}
            </div>}
          </li>);
      })}</ol>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </>
  );
}

function Feed({ items, onUndo }) {
  if (!items.length) return <p className="pf-small pf-muted" style={{ margin: 0 }}>When your coach notices something or changes your week for you, it shows here.</p>;
  return (
    <ul className="pf-feed">{items.map(f => (
      <li key={`${f.kind}-${f.id}`}>
        <span className={`pf-feed-ic ${f.kind}`}><Icon name={f.kind === 'change' ? 'repeat' : 'bell'} size={14} /></span>
        <div className="pf-grow" style={{ minWidth: 0 }}>
          {f.kind === 'change' ? <><b className={f.undone ? 'pf-strike' : ''}>{f.lines.length === 1 ? f.lines[0] : `${f.lines.length} changes${f.source !== 'chat' ? ` after your ${f.source === 'reflow' ? 'one-tap fix' : `${f.source} check-in`}` : ''}`}</b>
            {f.lines.length > 1 && <ul className="pf-small" style={{ margin: '2px 0 0', paddingLeft: 18 }}>{f.lines.map(l => <li key={l}>{l}</li>)}</ul>}</>
            : <><b>{f.title}</b>{f.text && <div className="pf-small pf-muted">{f.text}</div>}</>}
          <div className="pf-small pf-faint">{ago(f.at)}{f.undone ? ' · undone' : ''}</div>
        </div>
        {f.kind === 'change' && !f.undone && <button type="button" className="pf-btn sm ghost" onClick={() => onUndo(f.id)}>Undo</button>}
      </li>))}</ul>
  );
}

function Today({ hq, reload, onFocus, openRitual, ritualKind, setRitualKind }) {
  const [cmd, setCmd] = useState('');
  const [, setSp] = useSearchParams();
  const [fix, setFix] = useState(null);
  const [err, setErr] = useState('');
  const t = hq.today;
  const ask = q => { if (q.trim()) setSp({ tab: 'coach', ask: q.trim() }); };
  const fixMissed = async () => { setErr(''); try { setFix((await coachApi.fixMissed()).change); await reload(); } catch (x) { setErr(errMessage(x)); } };
  const undo = async id => { setErr(''); try { await coachApi.undo(id); await reload(); } catch (x) { setErr(errMessage(x)); } };
  const kind = ritualKind || (hq.ritual && hq.ritual.kind) || (t.prep && openRitual === 'prep' ? 'prep' : null);
  return (
    <div className="pf-grid g-main">
      <div className="pf-grid" style={{ alignContent: 'start' }}>
        <section className="pf-hero-coach" aria-label="Your coach’s word for today">
          <span className="pf-cavatar big" aria-hidden="true"><Icon name="sparkles" size={22} /></span>
          <div className="pf-grow"><p>{t.word}</p>
            <div className="pf-row pf-wrap" style={{ gap: 14, marginTop: 10 }}>
              <span className="pf-hero-stat"><Icon name="flame" size={15} /><b>{t.streak.current}</b> day streak</span>
              {t.plan.available !== null && <span className="pf-hero-stat"><Icon name="clock" size={15} /><b>{t.plan.available}</b> min today</span>}
              <span className="pf-hero-stat"><Icon name="tasks" size={15} /><b>{t.plan.items.filter(i => !['done', 'skipped'].includes(i.status)).length}</b> to do</span>
            </div></div>
        </section>
        {kind && <Ritual kind={kind} view={hq.ritual && hq.ritual.kind === kind ? hq.ritual : null} onDone={async () => { setRitualKind(null); await reload(); }} />}
        {t.missed > 0 && !fix && <Card ai><div className="pf-row pf-wrap" style={{ gap: 10 }}><span className="pf-grow"><b>{t.missed} step{t.missed > 1 ? 's' : ''} from earlier {t.missed > 1 ? 'are' : 'is'} waiting.</b><br /><span className="pf-small">That’s okay, plans slip. I can fit {t.missed > 1 ? 'them' : 'it'} into the days with room this week.</span></span><button type="button" className="pf-btn" onClick={fixMissed}>Fit into my week</button></div></Card>}
        {fix && <Card><b><Icon name="check" size={14} /> Done.</b><ul className="pf-small">{fix.lines.map(l => <li key={l}>{l}</li>)}</ul><button type="button" className="pf-btn sm ghost" onClick={() => { undo(fix.id); setFix(null); }}>Undo</button></Card>}
        <Card><CardHead title="Today’s game plan" icon="target" /><GamePlan plan={t.plan} today={t.today} onFocus={onFocus} onChanged={reload} /></Card>
        <Card><CardHead title="Tell your coach" icon="message" />
          <form className="pf-row" style={{ gap: 8 }} onSubmit={e => { e.preventDefault(); ask(cmd); }}>
            <label className="pf-sr" htmlFor="cmd">Tell your coach</label>
            <input id="cmd" className="pf-input" value={cmd} maxLength={1500} onChange={e => setCmd(e.target.value)} placeholder="e.g. I’m sick today, move everything" />
            <button type="submit" className="pf-btn" disabled={!cmd.trim()}><Icon name="send" size={15} />Go</button>
          </form>
          <div className="pf-chip-row" style={{ marginTop: 10 }}>{EXAMPLES.map(x => <button key={x} type="button" className="pf-chip" onClick={() => ask(x)}>{x}</button>)}</div>
          <p className="pf-small pf-faint" style={{ margin: '8px 0 0' }}>Your coach can move steps, add tasks and reminders, note exams and remember things about you. Every change can be undone.</p>
        </Card>
      </div>
      <div className="pf-grid" style={{ alignContent: 'start' }}>
        {!kind && <Card><CardHead title="Check in" icon="sun" /><div className="pf-row pf-wrap" style={{ gap: 6 }}>
          {['morning', 'evening', 'weekly'].map(k => <button key={k} type="button" className="pf-btn sm ghost" onClick={() => setRitualKind(k)}>{{ morning: 'Morning', evening: 'Evening debrief', weekly: 'Week review' }[k]}</button>)}
          {t.prep && <button type="button" className="pf-btn sm ghost" onClick={() => setRitualKind('prep')}>Session prep</button>}</div></Card>}
        {t.prep && kind !== 'prep' && <Card ai><span className="tag"><Icon name="users" size={14} />Mentor session</span><p className="pf-small" style={{ margin: '8px 0' }}>{t.prep.session.when}. {t.prep.bring.length ? `${t.prep.bring.length} thing${t.prep.bring.length > 1 ? 's' : ''} worth bringing.` : ''}</p><button type="button" className="pf-btn sm" onClick={() => setRitualKind('prep')}>Prepare</button></Card>}
        <Card><CardHead title="Your coach’s feed" icon="bell" /><Feed items={hq.feed} onUndo={undo} /></Card>
        {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      </div>
    </div>
  );
}

export default function CoachHQ() {
  const { data } = usePlatform();
  const [sp, setSp] = useSearchParams();
  const [hq, setHq] = useState(null);
  const [err, setErr] = useState('');
  const [focus, setFocus] = useState(null);
  const [ritualKind, setRitualKind] = useState(sp.get('ritual') || null);
  const chatParams = ['chat', 'step', 'task', 'check', 'ask'].some(k => sp.get(k));
  const tab = sp.get('tab') || (chatParams ? 'coach' : 'today');
  const setTab = id => setSp(id === 'today' ? {} : { tab: id });
  const load = useCallback(() => coachApi.hq().then(setHq).catch(e => setErr(errMessage(e))), []);   // a running focus shows as a pill; it opens on tap
  useEffect(() => { load(); }, [load]);
  useLiveEvent(['coach.changed', 'task.changed', 'session.changed'], () => load());
  // a nudge's link: ?ritual=… opens that check-in, ?focus=task:… starts focus on it, ?fix=missed shows the fix card
  const handled = useRef('');
  useEffect(() => {
    const f = sp.get('focus'); const r = sp.get('ritual');
    if (r && r !== handled.current) { handled.current = r; setRitualKind(r); }
    if (f && f !== handled.current) { handled.current = f; const [kind, id] = f.split(':'); startFocus({ kind, id }); setSp({}, { replace: true }); }
  }, [sp]);                                                   // startFocus and setSp are stable enough here
  async function startFocus(i) {
    setErr('');
    try { setFocus((await coachApi.focusStart(i.kind === 'task' ? { taskId: i.id, minutes: 25 } : { stepId: i.id, minutes: i.minutes >= 45 ? 50 : 25 })).focus); }
    catch (x) { setErr(errMessage(x)); }
  }
  const name = data && data.me ? data.me.firstName : '';
  return (
    <>
      <PageHead eyebrow="AI coach" title={`Coach HQ${name ? `: ${name}` : ''}`}>Your coach runs your week with you: it plans your day, checks in, notices when things slip, makes the changes you ask for, and shows how far you’ve come.</PageHead>
      <Tabs label="Coach HQ" value={tab} onChange={setTab} tabs={[{ id: 'today', label: 'Today', icon: 'sun' }, { id: 'coach', label: 'Ask your coach', icon: 'sparkles' }, { id: 'progress', label: 'Progress', icon: 'trend' }, { id: 'settings', label: 'Settings', icon: 'settings' }]} />
      <div style={{ marginTop: 16 }}>
        {err && <p role="alert" className="pf-small" style={{ color: 'var(--coral)' }}>{err}</p>}
        {tab === 'today' && (hq ? <Today hq={hq} reload={load} onFocus={startFocus} openRitual={sp.get('ritual')} ritualKind={ritualKind} setRitualKind={setRitualKind} /> : !err && <p role="status" className="pf-small pf-muted">Getting your day ready…</p>)}
        {tab === 'coach' && <LiveCoach embedded />}
        {tab === 'progress' && <Progress />}
        {tab === 'settings' && <Settings />}
      </div>
      {focus && !focus.endedAt && <FocusMode session={focus} onClose={done => { if (done) { setFocus(null); load(); } else setFocus(null); }} />}
      {!focus && hq && hq.focus && <button type="button" className="pf-focus-pill" onClick={() => setFocus(hq.focus)}><Icon name="clock" size={14} />Focus running: {hq.focus.title}</button>}
    </>
  );
}
