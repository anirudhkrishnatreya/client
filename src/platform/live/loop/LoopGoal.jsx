import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { usePlatform } from '../../data/store';
import { loopApi, useLoop, messageFor, detailsOf, DAYS, SHORT_DAYS, VERDICT, fmtMinutes, fmtDay } from './loopApi';

const MINUTE_CHOICES = [0, 15, 30, 45, 60, 90, 120, 180, 240];
const addYears = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString().slice(0, 10); };

/** The goal form: career, stages and date, and the student's real week (free time, rest day, exams). */
function Setup({ loop, onSaved, onCancel }) {
  const g = loop.goal || {};
  const [careerSlug, setCareer] = useState(g.careerSlug || '');
  const [startStage, setStart] = useState(g.startStage || loop.suggestedStage);
  const [targetStage, setTarget] = useState(g.targetStage || loop.suggestedStage);
  const [targetDate, setDate] = useState(g.targetDate || addYears(loop.today, 1));
  const [free, setFree] = useState(loop.profile.freeMinutes);
  const [restDay, setRest] = useState(loop.profile.restDay);
  const [exams, setExams] = useState(loop.profile.exams);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fields, setFields] = useState({});
  const stageIds = loop.stages.map(s => s.id);
  const weekly = free.reduce((a, m, d) => a + (d === restDay ? 0 : m), 0);

  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr(''); setFields({});
    try {
      await loopApi.setSchedule({ freeMinutes: free, restDay, exams: exams.filter(x => x.title.trim() && x.date) });
      const { data } = await loopApi.setGoal({ careerSlug, startStage, targetStage, targetDate });
      onSaved(data.loop);
    } catch (x) { setErr(messageFor(x)); setFields(detailsOf(x)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <Card><CardHead title="1. What do you want to become?" icon="target" />
        <div className="pf-grid g3" role="radiogroup" aria-label="Career">
          {loop.careers.map(c => (
            <label key={c.slug} className={`pf-choice${careerSlug === c.slug ? ' on' : ''}`}>
              <input type="radio" name="career" value={c.slug} checked={careerSlug === c.slug} onChange={() => setCareer(c.slug)} />
              <b>{c.title}</b><span className="pf-small pf-muted">{c.summary}</span>
            </label>
          ))}
        </div>
        {fields.careerSlug && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{fields.careerSlug}</p>}
      </Card>

      <Card style={{ marginTop: 16 }}><CardHead title="2. Where are you starting, and how far this time?" icon="trend" />
        <div className="pf-row pf-wrap" style={{ gap: 16 }}>
          <div className="pf-field"><label className="pf-label" htmlFor="start">Start from</label>
            <select id="start" className="pf-select" value={startStage} onChange={e => { setStart(e.target.value); if (stageIds.indexOf(targetStage) < stageIds.indexOf(e.target.value)) setTarget(e.target.value); }}>{loop.stages.map(s => <option key={s.id} value={s.id}>{s.title} ({s.forWho})</option>)}</select></div>
          <div className="pf-field"><label className="pf-label" htmlFor="target">Go as far as</label>
            <select id="target" className="pf-select" value={targetStage} onChange={e => setTarget(e.target.value)}>{loop.stages.filter(s => stageIds.indexOf(s.id) >= stageIds.indexOf(startStage)).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
          <div className="pf-field"><label className="pf-label" htmlFor="date">By</label>
            <input id="date" type="date" className="pf-input" value={targetDate} min={loop.today} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <p className="pf-small pf-muted" style={{ marginTop: 8 }}>{(loop.stages.find(s => s.id === startStage) || {}).aim}</p>
        {(fields.targetStage || fields.targetDate) && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{fields.targetStage || fields.targetDate}</p>}
      </Card>

      <Card style={{ marginTop: 16 }}><CardHead title="3. Your real week" icon="calendar" />
        <p className="pf-small pf-muted" style={{ marginBottom: 10 }}>How much free time do you have on each day, after school, college, coaching and sleep? Be honest: a plan that fits is a plan you will follow.</p>
        <div className="pf-grid g4">{DAYS.map((d, i) => (
          <div className="pf-field" key={d}><label className="pf-label" htmlFor={`free-${i}`}>{d}</label>
            <select id={`free-${i}`} className="pf-select" value={free[i]} disabled={restDay === i} onChange={e => setFree(f => f.map((m, k) => (k === i ? Number(e.target.value) : m)))}>{MINUTE_CHOICES.map(m => <option key={m} value={m}>{m ? fmtMinutes(m) : 'No time'}</option>)}</select></div>
        ))}</div>
        <div className="pf-field" style={{ marginTop: 12, maxWidth: 260 }}><label className="pf-label" htmlFor="rest">Rest day</label>
          <select id="rest" className="pf-select" value={restDay === null ? '' : restDay} onChange={e => setRest(e.target.value === '' ? null : Number(e.target.value))}><option value="">No fixed rest day</option>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
        <p className="pf-small" style={{ marginTop: 8 }} role="status">About {fmtMinutes(Math.round(weekly * 0.8))} a week will be planned, leaving some room for the unexpected.</p>

        <h4 style={{ margin: '18px 0 6px' }}>Exams coming up</h4>
        <p className="pf-small pf-muted" style={{ marginBottom: 8 }}>School tests, boards, entrance exams. The week before an exam gets much lighter, so your exam comes first.</p>
        {exams.map((x, i) => (
          <div className="pf-row pf-wrap" key={i} style={{ gap: 8, marginBottom: 6 }}>
            <input className="pf-input" aria-label={`Exam ${i + 1} name`} value={x.title} maxLength={60} placeholder="For example: Half-yearly exams" onChange={e => setExams(xs => xs.map((y, k) => (k === i ? { ...y, title: e.target.value } : y)))} style={{ flex: '1 1 220px' }} />
            <input className="pf-input" aria-label={`Exam ${i + 1} date`} type="date" value={x.date} onChange={e => setExams(xs => xs.map((y, k) => (k === i ? { ...y, date: e.target.value } : y)))} style={{ width: 170 }} />
            <button type="button" className="pf-btn sm ghost" onClick={() => setExams(xs => xs.filter((_, k) => k !== i))} aria-label={`Remove exam ${i + 1}`}>Remove</button>
          </div>
        ))}
        {exams.length < 20 && <button type="button" className="pf-btn sm ghost" onClick={() => setExams(xs => [...xs, { title: '', date: '' }])}>Add an exam</button>}
      </Card>

      <div className="pf-row" style={{ gap: 12, marginTop: 16 }}>
        <button type="submit" className="pf-btn" disabled={!careerSlug || busy}>{busy ? 'Saving…' : loop.goal ? 'Save changes' : 'Make my plan'}</button>
        {onCancel && <button type="button" className="pf-btn ghost" onClick={onCancel}>Cancel</button>}
        {err && <span role="alert" style={{ color: 'var(--coral)' }}>{err}</span>}
      </div>
    </form>
  );
}

export default function LoopGoalPage() {
  const { loop, loading, closed, error, act } = useLoop();
  const platform = usePlatform();
  // the dashboard's own data (overview banner, mentor and parent views) shows the goal too: refresh it after a change
  const refreshDashboard = () => { if (platform && platform.actions && platform.actions.reload) platform.actions.reload(); };
  const [editing, setEditing] = useState(false);
  const head = <PageHead eyebrow="My goal" title="Where do you want to get to?">Pick a career, tell us about your real week, and iMenteo turns it into a weekly plan you can actually follow.</PageHead>;
  if (loading) return <>{head}<p role="status">Loading…</p></>;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Career roadmaps and weekly plans are not open yet.</Empty></Card></>;
  if (error) return <>{head}<p role="alert">{messageFor(error)}</p></>;
  if (!loop.goal || editing) return <>{head}<Setup loop={loop} onSaved={l => { act(async () => ({ data: { loop: l } })); setEditing(false); refreshDashboard(); }} onCancel={loop.goal ? () => setEditing(false) : null} /></>;

  const career = loop.careers.find(c => c.slug === loop.goal.careerSlug) || {};
  const v = loop.feasibility && VERDICT[loop.feasibility.verdict];
  return (
    <>
      {head}
      <div className="pf-grid g-main-r">
        <Card><CardHead title="Your goal" icon="target" action="Change" onAction={() => setEditing(true)} />
          <h3 style={{ margin: '4px 0' }}>{career.title}</h3>
          <p className="pf-muted" style={{ margin: 0 }}>{loop.stages.find(s => s.id === loop.goal.startStage).title}{loop.goal.targetStage !== loop.goal.startStage ? ` to ${loop.stages.find(s => s.id === loop.goal.targetStage).title}` : ''} stage, by {fmtDay(loop.goal.targetDate)} {loop.goal.targetDate.slice(0, 4)}</p>
          {v && <div className="pf-note" role="status" style={{ marginTop: 12 }}><Pill tone={v.tone}>{loop.feasibility.verdict === 'fits' ? 'On track' : loop.feasibility.verdict === 'tight' ? 'Tight' : 'Does not fit'}</Pill> {v.text}{loop.feasibility.weeksNeeded ? ` About ${loop.feasibility.weeksNeeded} weeks of work; ${loop.feasibility.weeksAvailable} weeks until your date.` : ''}</div>}
          <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 14 }}><Link className="pf-btn" to="../plan">See this week’s plan</Link><Link className="pf-btn ghost" to="../plan/roadmap">See the whole roadmap</Link></div>
        </Card>
        <Card><CardHead title="Your week" icon="calendar" action="Edit" onAction={() => setEditing(true)} />
          <ul className="pf-list">{loop.profile.freeMinutes.map((m, i) => <li key={i}><span className="pf-grow">{SHORT_DAYS[i]}</span><span className="pf-small pf-muted">{i === loop.profile.restDay ? 'Rest day' : m ? fmtMinutes(m) : 'No time'}</span></li>)}</ul>
          {loop.profile.exams.length > 0 && <p className="pf-small" style={{ marginTop: 8 }}>Next exam: <b>{loop.profile.exams.filter(e => e.date >= loop.today)[0] ? `${loop.profile.exams.filter(e => e.date >= loop.today)[0].title}, ${fmtDay(loop.profile.exams.filter(e => e.date >= loop.today)[0].date)}` : 'none ahead'}</b></p>}
        </Card>
      </div>
      {loop.roadmap && loop.roadmap.reviewStatus === 'draft' && <div className="pf-note" role="note" style={{ marginTop: 18 }}><Icon name="info" size={15} /> {loop.roadmap.reviewNote}</div>}
    </>
  );
}
