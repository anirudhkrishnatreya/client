import { useCallback, useEffect, useState } from 'react';
import { Card, CardHead, Icon, Pill } from '../../ui/kit';
import { observeApi, errMessage } from '../liveApi';
import { Trajectory } from '../coach/Progress';

// The planning studio: the student's week (drag a step to another day, add or take off steps), the planning engine (say what
// you want; approve the changes it drafts), ready-made interventions, a what-if on time, the roadmap and targets. Every change
// is checked by the server, tells the student, and can be undone; steps you set are locked against the AI coach.
const TYPES = [['learn', 'Learn'], ['practise', 'Practise'], ['make', 'Make'], ['check', 'Check']];
const TARGETS = [['activeDays', 'Active days a week', 7], ['minutes', 'Study minutes a week', 3000], ['steps', 'Steps done a week (%)', 100], ['quiz', 'Weekly quiz (%)', 100], ['logs', 'Days logged a week', 7]];

function Week({ id, readOnly, onChanged }) {
  const [w, setW] = useState(null);
  const [drag, setDrag] = useState(null);
  const [adding, setAdding] = useState(null);
  const [f, setF] = useState({ title: '', stepType: 'practise', minutes: 25 });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback(() => observeApi.week(id).then(r => setW(r.week)).catch(e => setErr(errMessage(e))), [id]);
  useEffect(() => { load(); }, [load]);
  const run = async (changes, note) => { setErr(''); setMsg(''); try { const r = await observeApi.apply(id, changes, note); setMsg(`${r.change.lines.join('; ')}. The student has been told.`); await load(); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  if (!w) return <Card><p className="pf-small pf-muted" role={err ? 'alert' : 'status'}>{err || 'Loading the week…'}</p></Card>;
  return (
    <Card><CardHead title={`This week: ${w.days[0].label} to ${w.days[6].label}`} icon="calendar" />
      {w.focus && <p className="pf-small pf-muted" style={{ marginTop: 0 }}>{w.focus}</p>}
      <div className="pf-wk" role="list">{w.days.map(d => {
        const past = d.date < w.today; const over = d.planned > d.capacity;
        return (
          <div key={d.date} role="listitem" className={`pf-wk-day${past ? ' past' : ''}${drag && !past ? ' drop' : ''}`} onDragOver={e => { if (!past && drag) e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (drag && !past && drag.date !== d.date) run([{ tool: 'move_step', stepId: drag.id, date: d.date }]); setDrag(null); }}>
            <div className="pf-wk-h"><b>{d.label.split(' ').slice(0, 2).join(' ')}</b><span className={`pf-small ${over ? 'pf-over' : 'pf-muted'}`}>{d.planned}/{d.capacity} min</span></div>
            <div className="pf-wk-bar"><i style={{ width: `${Math.min(100, d.capacity ? (d.planned / d.capacity) * 100 : d.planned ? 100 : 0)}%` }} className={over ? 'over' : ''} /></div>
            {d.steps.map(s => (
              <div key={s.id} className={`pf-wk-step ${s.status}`} draggable={!readOnly && s.status === 'todo' && !past} onDragStart={() => setDrag({ id: s.id, date: d.date })} onDragEnd={() => setDrag(null)} title={s.title}>
                <span className="pf-grow">{s.locked && <Icon name="lock" size={11} />} {s.title}</span>
                <span className="pf-small pf-muted">{s.minutes}′{s.status !== 'todo' ? ` · ${s.status}` : ''}</span>
                {!readOnly && s.status === 'todo' && !past && <select className="pf-wk-move" aria-label={`Move “${s.title}” to`} value="" onChange={e => e.target.value && run([{ tool: 'move_step', stepId: s.id, date: e.target.value }])}><option value="">Move…</option>{w.days.filter(x => x.date >= w.today && x.date !== d.date).map(x => <option key={x.date} value={x.date}>{x.label.split(' ').slice(0, 2).join(' ')}</option>)}</select>}
                {!readOnly && s.status === 'todo' && <button type="button" className="pf-wk-x" aria-label={`Take “${s.title}” off this week`} onClick={() => run([{ tool: 'remove_step', stepId: s.id }])}><Icon name="x" size={11} /></button>}
              </div>))}
            {!readOnly && !past && (adding === d.date
              ? <form className="pf-wk-add" onSubmit={e => { e.preventDefault(); run([{ tool: 'add_step', date: d.date, title: f.title.trim(), stepType: f.stepType, minutes: Number(f.minutes), search: f.title.trim() }]); setAdding(null); setF({ title: '', stepType: 'practise', minutes: 25 }); }}>
                <label className="pf-sr" htmlFor={`as-${d.date}`}>New step</label><input id={`as-${d.date}`} className="pf-input" placeholder="e.g. Practise: 5 vector problems" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={120} />
                <div className="pf-row" style={{ gap: 4 }}><select className="pf-input" aria-label="Kind of step" value={f.stepType} onChange={e => setF({ ...f, stepType: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <select className="pf-input" aria-label="Minutes" value={f.minutes} onChange={e => setF({ ...f, minutes: e.target.value })}>{[15, 20, 25, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}</select></div>
                <div className="pf-row" style={{ gap: 4 }}><button type="submit" className="pf-btn sm" disabled={f.title.trim().length < 3}>Add</button><button type="button" className="pf-btn sm ghost" onClick={() => setAdding(null)}>Back</button></div>
              </form>
              : <button type="button" className="pf-wk-plus" onClick={() => setAdding(d.date)}><Icon name="plus" size={12} />Add a step</button>)}
          </div>);
      })}</div>
      {!readOnly && <p className="pf-small pf-faint" style={{ margin: '8px 0 0' }}>Drag a step to another day. <Icon name="lock" size={11} /> marks steps you set: the AI coach will not move them.</p>}
      {msg && <p className="pf-small" role="status" style={{ margin: '6px 0 0' }}><Icon name="check" size={13} /> {msg}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>{err}</p>}
    </Card>
  );
}

function Engine({ id, name, onChanged }) {
  const [prompt, setPrompt] = useState('');
  const [out, setOut] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const ask = async e => { e.preventDefault(); setBusy(true); setErr(''); setMsg(''); try { const r = await observeApi.prompt(id, prompt.trim()); setOut(r); setNote(r.note || ''); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const apply = async () => { setErr(''); try { const r = await observeApi.apply(id, out.requests, note); setMsg(`Done: ${r.change.lines.length} change${r.change.lines.length > 1 ? 's' : ''}. ${name} has been told.`); setOut(null); setPrompt(''); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Card ai><span className="tag"><Icon name="sparkles" size={14} />Planning engine</span>
      <form onSubmit={ask} style={{ marginTop: 8 }}>
        <label className="pf-sr" htmlFor="pe">What do you want for this student?</label>
        <textarea id="pe" className="pf-input" rows={3} maxLength={1500} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={`e.g. ${name} has a Physics test on Friday: move Maths practice to the weekend and add 25 minutes of revision each day until then.`} />
        <button type="submit" className="pf-btn sm" style={{ marginTop: 8 }} disabled={busy || prompt.trim().length < 5}>{busy ? 'Drafting…' : 'Draft the changes'}</button>
      </form>
      {out && <div className="pf-o-cap">
        <p className="pf-small" style={{ margin: 0 }}>{out.reply}</p>
        {out.lines.length > 0 ? <><ul className="pf-small">{out.lines.map(l => <li key={l}>{l}</li>)}</ul>
          <label className="pf-label" htmlFor="pe-note">Your note to {name} (shown with the change)</label><input id="pe-note" className="pf-input" maxLength={600} value={note} onChange={e => setNote(e.target.value)} />
          <div className="pf-row" style={{ gap: 6, marginTop: 8 }}><button type="button" className="pf-btn sm" onClick={apply}>Apply</button><button type="button" className="pf-btn sm ghost" onClick={() => setOut(null)}>Discard</button></div></>
          : <p className="pf-small pf-muted">Nothing it could change for that.</p>}
        {out.problems.length > 0 && <p className="pf-small pf-muted">Could not: {out.problems.join(' ')}</p>}
      </div>}
      {msg && <p className="pf-small" role="status">{msg}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

function Interventions({ id, onChanged }) {
  const [list, setList] = useState([]);
  const [pv, setPv] = useState(null);
  const [exam, setExam] = useState({ title: '', date: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { observeApi.interventions().then(r => setList(r.interventions)).catch(() => {}); }, []);
  const body = key => ({ key, ...(key === 'exam-crunch' ? { title: exam.title || 'Exam', date: exam.date || undefined } : {}) });
  const preview = async key => { setErr(''); setMsg(''); try { setPv({ key, ...(await observeApi.intervention(id, body(key))) }); } catch (x) { setErr(errMessage(x)); } };
  const apply = async () => { setErr(''); try { const r = await observeApi.intervention(id, { ...body(pv.key), apply: true }); setMsg(`${r.change.lines.length} change${r.change.lines.length > 1 ? 's' : ''} made.`); setPv(null); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Card><CardHead title="Ready-made plans" icon="layers" />
      <div className="pf-o-int">{list.map(i => <button key={i.key} type="button" className={`pf-o-intcard${pv && pv.key === i.key ? ' on' : ''}`} onClick={() => preview(i.key)}><b>{i.title}</b><span className="pf-small pf-muted">{i.text}</span></button>)}</div>
      <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 8 }}><span className="pf-small pf-muted">For the exam crunch:</span><input className="pf-input" style={{ width: 180 }} aria-label="Exam name" placeholder="Exam name" value={exam.title} onChange={e => setExam({ ...exam, title: e.target.value })} /><input className="pf-input" type="date" style={{ width: 170 }} aria-label="Exam date" value={exam.date} onChange={e => setExam({ ...exam, date: e.target.value })} /></div>
      {pv && <div className="pf-o-cap">{pv.lines.length ? <><ul className="pf-small">{pv.lines.map(l => <li key={l}>{l}</li>)}</ul><div className="pf-row" style={{ gap: 6 }}><button type="button" className="pf-btn sm" onClick={apply}>Apply {pv.intervention.title}</button><button type="button" className="pf-btn sm ghost" onClick={() => setPv(null)}>Back</button></div></> : <p className="pf-small pf-muted">{pv.problems[0] || 'Nothing to change for this student right now.'}</p>}</div>}
      {msg && <p className="pf-small" role="status">{msg}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

function WhatIf({ id, trajectory }) {
  const [extra, setExtra] = useState(0);
  const [exams, setExams] = useState(0);
  const [r, setR] = useState(null);
  useEffect(() => { const t = setTimeout(() => observeApi.whatIf(id, extra, exams).then(x => setR(x.whatIf)).catch(() => {}), 250); return () => clearTimeout(t); }, [id, extra, exams]);
  const fmt = d => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <Card><CardHead title="What if…" icon="trend" />
      {trajectory && <Trajectory t={trajectory} />}
      <label className="pf-small" htmlFor="wi-x" style={{ display: 'block', marginTop: 12 }}>Extra study a day: <b>{extra > 0 ? '+' : ''}{extra} min</b></label>
      <input id="wi-x" type="range" min={-60} max={120} step={15} value={extra} onChange={e => setExtra(Number(e.target.value))} style={{ width: '100%' }} />
      <label className="pf-small" htmlFor="wi-e" style={{ display: 'block' }}>Exam weeks ahead: <b>{exams}</b></label>
      <input id="wi-e" type="range" min={0} max={6} step={1} value={exams} onChange={e => setExams(Number(e.target.value))} style={{ width: '100%' }} />
      {r && <p style={{ margin: '8px 0 0' }}>They would finish around <b>{fmt(r.then)}</b> <span className="pf-small pf-muted">(now {fmt(r.now)}{r.target ? `, target ${fmt(r.target)}` : ''})</span> · {r.weeklyMinutes.then} min a week.</p>}
    </Card>
  );
}

function Roadmap({ id, levels, onChanged }) {
  const [order, setOrder] = useState(levels.map((l, i) => ({ ...l, i })));
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const fixed = levels.findIndex(l => l.state === 'current');
  const move = (k, d) => setOrder(o => { const n = o.slice(); const t = n[k]; n[k] = n[k + d]; n[k + d] = t; return n; });
  const save = async body => { setErr(''); setMsg(''); try { await observeApi.roadmap(id, body); setMsg('Saved. The next weeks follow it, and the student has been told.'); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Card><CardHead title="Roadmap" icon="flag" />
      <ol className="pf-o-road">{order.map((l, k) => <li key={l.title}><span className="pf-grow">{l.title} <span className="pf-small pf-muted">· {l.topics.length} topics</span></span>
        {k > fixed && <span className="pf-row" style={{ gap: 2 }}><button type="button" className="pf-iconbtn" aria-label={`Move ${l.title} earlier`} disabled={k <= fixed + 1} onClick={() => move(k, -1)}>↑</button><button type="button" className="pf-iconbtn" aria-label={`Move ${l.title} later`} disabled={k === order.length - 1} onClick={() => move(k, 1)}>↓</button></span>}</li>)}</ol>
      <div className="pf-row pf-wrap" style={{ gap: 6 }}>
        <button type="button" className="pf-btn sm ghost" disabled={order.every((l, k) => l.i === k)} onClick={() => save({ phaseOrder: order.map(l => l.id) })}>Save the new order</button>
        <label className="pf-sr" htmlFor="rd">New target date</label><input id="rd" type="date" className="pf-input" style={{ width: 170 }} value={date} onChange={e => setDate(e.target.value)} />
        <button type="button" className="pf-btn sm ghost" disabled={!date} onClick={() => save({ targetDate: date })}>Set target date</button>
      </div>
      {msg && <p className="pf-small" role="status">{msg}</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

function Targets({ id, targets, onChanged }) {
  const [kind, setKind] = useState('activeDays');
  const [value, setValue] = useState(5);
  const [err, setErr] = useState('');
  const add = async e => { e.preventDefault(); setErr(''); try { await observeApi.setTarget(id, { kind, value: Number(value) }); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  const drop = async t => { try { await observeApi.dropTarget(id, t); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <Card><CardHead title="Targets (tracked by themselves)" icon="target" />
      {targets.length > 0 && <ul className="pf-list">{targets.map(t => <li key={t.id}><span className="pf-grow pf-small">{(TARGETS.find(x => x[0] === t.kind) || [])[1]}: at least {t.value}</span><Pill tone={t.met ? 'leaf' : 'gold'}>{t.current === null ? '–' : `${t.current}${t.unit}`}</Pill><button type="button" className="pf-iconbtn" aria-label="Remove target" onClick={() => drop(t.id)}><Icon name="x" size={13} /></button></li>)}</ul>}
      <form className="pf-row pf-wrap" style={{ gap: 6 }} onSubmit={add}>
        <label className="pf-sr" htmlFor="tk">Target</label><select id="tk" className="pf-input" style={{ width: 220 }} value={kind} onChange={e => setKind(e.target.value)}>{TARGETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="pf-sr" htmlFor="tv">At least</label><input id="tv" type="number" className="pf-input" style={{ width: 90 }} min={1} max={(TARGETS.find(x => x[0] === kind) || [])[2]} value={value} onChange={e => setValue(e.target.value)} />
        <button type="submit" className="pf-btn sm">Set</button>
      </form>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

export default function Planning({ p, onChanged }) {
  const id = p.header.id;
  const mentor = p.as === 'mentor';
  return (
    <div className="pf-grid" style={{ gap: 18 }}>
      <Week id={id} readOnly={!mentor} onChanged={onChanged} />
      {mentor && <div className="pf-grid g-main" style={{ alignItems: 'start' }}><Engine id={id} name={p.header.name.split(' ')[0]} onChanged={onChanged} /><Interventions id={id} onChanged={onChanged} /></div>}
      <div className="pf-grid g-main" style={{ alignItems: 'start' }}>
        {p.as !== 'self' && <WhatIf id={id} trajectory={p.signals.trajectory} />}
        {mentor && <Targets id={id} targets={p.signals.targets} onChanged={onChanged} />}
      </div>
      {mentor && p.mastery.length > 0 && p.header.goalKind !== 'curriculum' && <Roadmap id={id} levels={p.mastery} onChanged={onChanged} />}
    </div>
  );
}
