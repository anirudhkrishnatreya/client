import { Link } from 'react-router-dom';
import { Icon, Pill } from '../../ui/kit';
import { TYPE_LABEL, TYPE_TONE, BAND, fmtMinutes, fmtShort, weekdayOf, pct } from './loopApi';

export const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** The 7 dates of the week, each with its steps. */
export const daysOf = week => Array.from({ length: 7 }, (_, k) => { const date = addDays(week.weekStart, k); return { date, index: k, items: week.items.filter(i => i.date === date) }; });
export const minutesOf = items => items.reduce((a, i) => a + i.minutes, 0);
export const doneOf = items => items.filter(i => i.status !== 'todo').length;

/** One day of the week at a glance: the date, what is planned, how long, and how far along. Opens the day's page. */
export function DayCard({ day, todayIndex }) {
  const { date, index, items } = day;
  const today = index === todayIndex, past = index < todayIndex;
  if (!items.length) {
    return (
      <div className={`pf-daycard empty${today ? ' today' : ''}`} aria-label={`${weekdayOf(date)}, ${fmtShort(date)}: nothing planned`}>
        <div className="pf-daycard-head"><b>{weekdayOf(date)}</b><span className="pf-small pf-muted">{fmtShort(date)}</span>{today && <Pill tone="sky">Today</Pill>}</div>
        <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>Nothing planned. A free day.</p>
      </div>
    );
  }
  const done = doneOf(items), all = done === items.length;
  const learn = items.filter(i => i.type === 'learn'), doing = items.filter(i => i.type !== 'learn');
  return (
    <Link to={`day/${date}`} className={`pf-daycard${today ? ' today' : ''}${all ? ' complete' : ''}${past && !all ? ' behind' : ''}`} aria-label={`${weekdayOf(date)}, ${fmtShort(date)}: ${items.length} step${items.length > 1 ? 's' : ''}, ${done} done`}>
      <div className="pf-daycard-head">
        <b>{weekdayOf(date)}</b><span className="pf-small pf-muted">{fmtShort(date)}</span>
        {today && <Pill tone="sky">Today</Pill>}
        {all ? <Pill tone="leaf" icon="check">Done</Pill> : past ? <Pill tone="gold">Catch up</Pill> : null}
      </div>
      <p className="pf-small" style={{ margin: '8px 0 6px' }}>
        {learn.length > 0 && <>Learn: <b>{[...new Set(learn.map(i => i.topic || i.title))].join(', ')}</b>. </>}
        {doing.length > 0 && <>Then {doing.length === 1 ? TYPE_LABEL[doing[0].type].toLowerCase() : 'practise'}{doing[0].topic && !learn.length ? `: ${doing[0].topic}` : ''}.</>}
      </p>
      <ul className="pf-daysteps">{items.slice(0, 4).map(i => (
        <li key={i.id} className={i.status !== 'todo' ? 'done' : ''}><span className={`dot ${TYPE_TONE[i.type] || ''}`} aria-hidden="true" />{i.status === 'done' ? <Icon name="check" size={13} /> : null}<span className="t">{i.title}</span><span className="m">{fmtMinutes(i.minutes)}</span></li>
      ))}{items.length > 4 && <li className="more">and {items.length - 4} more</li>}</ul>
      <div className="pf-daycard-foot">
        <span className="pf-small pf-muted">{done} of {items.length} done · {fmtMinutes(minutesOf(items))}</span>
        <span className="pf-small pf-daycard-open">Open day <Icon name="chevronRight" size={14} /></span>
      </div>
      <div className="pf-hbar" style={{ marginTop: 8 }}><i style={{ width: `${(done / items.length) * 100}%` }} /></div>
    </Link>
  );
}

/** Where the week's assessment stands, and what it unlocks: always visible on the week page, never hidden in a corner. */
export function AssessmentBanner({ a, next, week }) {
  const quiz = a.quiz && a.quiz.status === 'done' ? a.quiz.score : null;
  const j = a.task && a.task.judgement;
  if (a.stage === 'done') {
    return (
      <div className="pf-assessbar done" role="status">
        <Icon name="check" size={18} />
        <div className="pf-grow"><b>{a.task && a.task.levelUp ? 'Level-up assessment done' : 'Assessment done'}</b><div className="pf-small">{quiz !== null ? `Quiz ${pct(quiz)}` : ''}{j && j.status === 'judged' && BAND[j.overall] ? ` · your work: ${BAND[j.overall][0]}` : ''}{next.canPlan ? ' · your next week is ready to plan' : ''}</div></div>
        <Link className="pf-btn sm ghost" to="assessment">See feedback</Link>
      </div>
    );
  }
  const ended = next.over;
  if (a.stage === 'locked') {
    return (
      <div className="pf-assessbar locked">
        <Icon name="lock" size={18} />
        <div className="pf-grow"><b>Week assessment</b><div className="pf-small">Opens after {a.need} finished steps ({a.done} so far), or when the week ends on {fmtShort(week.weekEnd)}. Your next week opens after the assessment.</div></div>
        <Link className="pf-btn sm ghost" to="assessment">What is it?</Link>
      </div>
    );
  }
  return (
    <div className={`pf-assessbar ready${ended ? ' due' : ''}`}>
      <Icon name="clipboard" size={18} />
      <div className="pf-grow">
        <b>{a.stage === 'ready' ? (ended ? 'This week has ended: take your assessment' : 'Your assessment is ready') : 'Finish your assessment'}</b>
        <div className="pf-small">{ended ? 'Your next week stays locked until you take it. ' : ''}A 5-question quiz and one short piece of work, about 15 minutes. Next week is built from how it goes.</div>
      </div>
      <Link className="pf-btn sm" to="assessment">{a.stage === 'ready' ? 'Take the assessment' : 'Continue'}</Link>
    </div>
  );
}
