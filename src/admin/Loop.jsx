import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Card, CardHead, Pill } from '../platform/ui/kit';
import { PageSkeleton } from '../platform/live/loop/Loader';
import { adminLoopMetrics, adminLoopAttention, adminLoopReply, adminQualityGet, adminQualityStart } from '../api';
import { errOf, money, can } from './adminApi';
import { Kpi } from './common';

const pct = v => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`);
const LEVEL = { high: ['coral', 'Urgent'], medium: ['gold', 'Needs a look'], good: ['leaf', 'Good news'] };

/** One made-up student's results from the quality check: the journey, the first week, a practice set. */
function PersonaReport({ p }) {
  const j = p.journey || {};
  const critic = j.run ? j.run.steps.filter(s => s.agent === 'journey-critic') : [];
  return (
    <details className="pf-milestone">
      <summary>{p.label}{p.error ? ` · failed (${p.error})` : j.outcome ? ` · journey ${j.outcome}` : ''}{p.week ? ` · week ${p.week.outcome}` : ''}</summary>
      {j.plan && (
        <div className="pf-small" style={{ marginTop: 8 }}>
          <p><b>{j.plan.careerTitle}</b>: {j.plan.startPoint.summary} → {j.plan.endPoint.summary} ({j.plan.endPoint.horizonWeeks} weeks, {j.plan.weeklyMinutes} min a week)</p>
          {critic.map((c, k) => <p key={k} className="pf-muted">Critic: {c.verdict || 'no verdict'}{c.notes.length ? ` · ${c.notes.join(' · ')}` : ''}</p>)}
          {j.ruleIssuesAfter && j.ruleIssuesAfter.length > 0 && <p style={{ color: 'var(--coral)' }}>Rules still unmet: {j.ruleIssuesAfter.join(' · ')}</p>}
          <ol>{j.plan.phases.map(ph => <li key={ph.id} style={{ marginBottom: 6 }}><b>{ph.title}</b> ({ph.weeks} wk): {ph.topics.map(t => `${t.title} [${t.kind}]`).join('; ')}{ph.levelUp && <div className="pf-muted">Level-up: {ph.levelUp.proof}</div>}</li>)}</ol>
        </div>
      )}
      {p.week && (
        <div className="pf-small">
          <p><b>Week 1</b> ({p.week.minutes} min available){p.week.ruleIssuesAfter.length ? <span style={{ color: 'var(--coral)' }}> · rules unmet: {p.week.ruleIssuesAfter.join(' · ')}</span> : ''}</p>
          <ol>{p.week.units.map((u, k) => (
            <li key={k} style={{ marginBottom: 6 }}>[{u.type}, {u.minutes} min] <b>{u.title}</b> <span className="pf-muted">({u.topic})</span>
              <div className="pf-muted">Goal: {u.goal} · Show: {u.evidence}</div>
              {u.help && <div className="pf-muted">Help: {u.help}</div>}
              {u.video && <div>{u.video.role === 'practice' ? 'Follow-along' : 'Video'}: <a href={u.video.url} target="_blank" rel="noopener noreferrer">{u.video.title}</a> <span className="pf-muted">({u.video.channel}, {u.video.minutes} min)</span></div>}
              {u.practice.map(x => <div key={x.url}>Practice: <a href={x.url} target="_blank" rel="noopener noreferrer">{x.provider}: {x.title}</a> <span className="pf-muted">{x.what}</span></div>)}
            </li>
          ))}</ol>
        </div>
      )}
      {p.practice && (
        <div className="pf-small">
          <p><b>Practice for “{p.practice.step}”</b> · {p.practice.run.steps.filter(s => s.agent === 'practice-checker').map(s => s.notes.join(' · ')).join(' | ')}</p>
          <ol>{p.practice.items.map((x, k) => <li key={k} style={{ marginBottom: 6 }}>{x.prompt}<div className="pf-muted">{x.kind === 'question' ? `Answer: ${x.answer}` : `Checklist: ${(x.checklist || []).join('; ')}`}</div></li>)}</ol>
        </div>
      )}
    </details>
  );
}

/** Runs the real agents on made-up students (it spends credit, so it asks first) and shows the report for a person to read. */
function Quality({ me }) {
  const [q, setQ] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => adminQualityGet().then(r => setQ(r.data)).catch(e => setMsg(errOf(e)));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!q || !q.run || q.run.status !== 'running') return undefined; const t = setInterval(load, 5000); return () => clearInterval(t); }, [q]);
  const start = async () => {
    if (!window.confirm(`This runs the real AI on ${q.personas.length} made-up students and spends up to $${q.maxUsd} of credit. Go ahead?`)) return;
    try { await adminQualityStart(); await load(); } catch (e) { setMsg((e.response && e.response.data && e.response.data.code) === 'ALREADY_RUNNING' ? 'A check is already running.' : errOf(e)); }
  };
  if (!q) return msg ? <Card><p role="alert">{msg}</p></Card> : null;
  const r = q.run;
  return (
    <Card>
      <CardHead title="Quality check of the planning agents" icon="sparkles" />
      <p className="pf-small pf-muted">Runs the real AI on {q.personas.length} made-up students ({q.personas.join(', ')}). Nothing is saved to anyone’s account. Read each journey, week and practice set and note what is wrong. Spends up to ${q.maxUsd}.</p>
      {can(me, 'manage') ? <button type="button" className="pf-btn sm" onClick={start} disabled={r && r.status === 'running'}>{r && r.status === 'running' ? 'Running…' : 'Run quality check'}</button> : <p className="pf-small pf-muted">Only a superadmin can start a check.</p>}
      {msg && <p role="alert" className="pf-small" style={{ color: 'var(--coral)' }}>{msg}</p>}
      {r && <p className="pf-small pf-muted" style={{ marginTop: 10 }}>Last run: {r.status}{r.note ? ` (${r.note})` : ''} · cost {money(r.costUsd)} · {r.personas.length} of {q.personas.length} students done</p>}
      {r && r.personas.map(p => <PersonaReport key={p.label} p={p} />)}
    </Card>
  );
}

/** Whether the learning loop works (the numbers), who needs a person, and the agents' quality check. */
export default function Loop() {
  const { me } = useOutletContext() || {};
  const [m, setM] = useState(null);
  const [att, setAtt] = useState(null);
  const [reply, setReply] = useState({});
  const [msg, setMsg] = useState('');
  const load = () => Promise.all([adminLoopMetrics(30), adminLoopAttention()]).then(([a, b]) => { setM(a.data); setAtt(b.data); }).catch(e => setMsg(errOf(e)));
  useEffect(() => { load(); }, []);
  const send = async id => { setMsg(''); try { await adminLoopReply(id, (reply[id] || '').trim()); setReply(r => ({ ...r, [id]: '' })); await load(); } catch (e) { setMsg(errOf(e)); } };
  if (msg && !m) return <p role="alert">{msg}</p>;
  if (!m || !att) return <PageSkeleton label="Loading the learning loop" />;
  return (
    <>
      <div className="pf-kpis">
        <Kpi label="Plans started (30 days)" value={m.funnel.plansStarted} sub={`${pct(m.funnel.chatToPlan)} of ${m.funnel.chatsStarted} chats`} />
        <Kpi label="Came back for week 2" value={pct(m.retention.week2Return)} sub={`of ${m.retention.week2Eligible} plans over a week old`} />
        <Kpi label="Reached week 4" value={pct(m.retention.week4Reached)} sub={`of ${m.retention.week4Eligible} plans over 4 weeks old`} />
        <Kpi label="Steps finished" value={pct(m.work.stepsFinished)} sub={`${m.work.finishedWeeks} finished weeks · ${m.work.assessmentsDone} assessments`} />
        <Kpi label="Level-ups passed" value={m.levels.levelUpPasses} sub={`of ${m.levels.levelUpAttempts} attempts`} />
        <Kpi label="Felt fair" value={pct(m.fairness.fairShare)} sub={`${m.fairness.waitingForReply} waiting for a reply`} />
        <Kpi label="AI cost per active student" value={m.cost.perActiveStudentUsd === null ? '—' : money(m.cost.perActiveStudentUsd)} sub={`${money(m.cost.aiUsd)} total · ${m.cost.activeStudents} active`} />
      </div>
      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Card>
          <CardHead title={`Needs a person (${att.alerts.filter(a => a.level !== 'good').length})`} icon="alert" />
          {att.alerts.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nobody right now.</p> : (
            <ul className="pf-list">{att.alerts.map(a => <li key={a.id}><span className="pf-grow"><Pill tone={LEVEL[a.level][0]}>{LEVEL[a.level][1]}</Pill> {a.text}{!a.hasMentor && <span className="pf-small pf-muted"> (no mentor)</span>}</span><Link to={`/admin/users/${a.studentId}`}>Open</Link></li>)}</ul>
          )}
        </Card>
        <Card>
          <CardHead title={`“Not fair” waiting for a reply (${att.feedback.length})`} icon="message" />
          {att.feedback.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>None.</p> : att.feedback.map(f => (
            <div key={f.id} style={{ borderTop: '1px solid var(--line2)', padding: '10px 0' }}>
              <div className="pf-small"><b><Link to={`/admin/users/${f.studentId}`}>{f.name || 'A student'}</Link></b> · {f.target === 'judgement' ? `week ${f.weekNumber} feedback` : 'practice questions'}{f.hasMentor ? ' · their mentor can reply too' : ' · no mentor'}</div>
              {f.note && <p className="pf-small" style={{ margin: '4px 0' }}>“{f.note}”</p>}
              {can(me, 'act') && <div className="pf-row" style={{ gap: 8, marginTop: 6 }}>
                <input className="pf-input pf-grow" aria-label={`Reply to ${f.name || 'the student'}`} value={reply[f.id] || ''} onChange={e => setReply(r => ({ ...r, [f.id]: e.target.value }))} placeholder="Reply as the iMenteo team" maxLength={1000} />
                <button type="button" className="pf-btn sm" onClick={() => send(f.id)} disabled={(reply[f.id] || '').trim().length < 2}>Send</button>
              </div>}
            </div>
          ))}
          {msg && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{msg}</p>}
        </Card>
      </div>
      <Quality me={me} />
    </>
  );
}
