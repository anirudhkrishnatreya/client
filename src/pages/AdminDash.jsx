import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminGetUsers, adminGetStats, adminLoopMetrics, adminLoopAttention, adminLoopReply, adminQualityGet, adminQualityStart } from '../api';
import logoImg from '../assets/imenteo_logo.png';
import { V4_ENABLED } from '../v4/config';

function StatChip({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', borderLeft: `4px solid ${color || 'var(--amber)'}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const pctOf = v => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`);
const box = { background: 'var(--white)', borderRadius: 12, padding: 24, border: '1.5px solid var(--border)', marginBottom: 28 };
const LEVEL = { high: ['#b42318', 'Urgent'], medium: ['#b54708', 'Needs a look'], good: ['#067647', 'Good news'] };

/** The learning loop at a glance: is it working (the numbers), and who needs a person (alerts and "not fair" flags). */
function LoopPanel() {
  const [m, setM] = useState(null);
  const [att, setAtt] = useState(null);
  const [reply, setReply] = useState({});
  const [msg, setMsg] = useState('');
  const load = () => Promise.all([adminLoopMetrics(30), adminLoopAttention()]).then(([a, b]) => { setM(a.data); setAtt(b.data); }).catch(() => setMsg('Could not load the learning loop.'));
  useEffect(() => { load(); }, []);
  const send = async id => { try { await adminLoopReply(id, (reply[id] || '').trim()); setReply(r => ({ ...r, [id]: '' })); await load(); } catch { setMsg('Could not send the reply.'); } };
  if (msg) return <div style={box}>{msg}</div>;
  if (!m || !att) return null;
  return (
    <div style={box}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>Learning loop · last 30 days</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12, marginBottom: 18 }}>
        <StatChip label="Plans started" value={m.funnel.plansStarted} sub={`${pctOf(m.funnel.chatToPlan)} of ${m.funnel.chatsStarted} chats`} color="var(--amber)" />
        <StatChip label="Came back for week 2" value={pctOf(m.retention.week2Return)} sub={`of ${m.retention.week2Eligible} plans over a week old`} color="var(--green)" />
        <StatChip label="Steps finished" value={pctOf(m.work.stepsFinished)} sub={`${m.work.finishedWeeks} finished weeks`} color="#3355CC" />
        <StatChip label="Level-ups passed" value={m.levels.levelUpPasses} sub={`of ${m.levels.levelUpAttempts} attempts`} color="#8a3ffc" />
        <StatChip label="Felt fair" value={pctOf(m.fairness.fairShare)} sub={`${m.fairness.waitingForReply} waiting for a reply`} color="#067647" />
        <StatChip label="AI cost" value={`$${m.cost.aiUsd}`} sub={m.cost.perActiveStudentUsd === null ? 'no active students' : `$${m.cost.perActiveStudentUsd} per active student`} color="#b54708" />
      </div>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: '0 0 8px' }}>Needs a person ({att.alerts.filter(a => a.level !== 'good').length})</h4>
      {att.alerts.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Nobody right now.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: 6 }}>{att.alerts.map(a => (
          <li key={a.id} style={{ fontSize: 13 }}><b style={{ color: LEVEL[a.level][0] }}>{LEVEL[a.level][1]}:</b> {a.text} {!a.hasMentor && <span style={{ color: 'var(--slate)' }}>(no mentor)</span>} <Link to={`/admin/user/${a.studentId}`}>Open</Link></li>
        ))}</ul>
      )}
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: '0 0 8px' }}>"Not fair" waiting for a reply ({att.feedback.length})</h4>
      {att.feedback.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>None.</p> : att.feedback.map(f => (
        <div key={f.id} style={{ borderTop: '1px solid var(--border)', padding: '10px 0', fontSize: 13 }}>
          <b>{f.name || 'A student'}</b> · {f.target === 'judgement' ? `week ${f.weekNumber} feedback` : 'practice questions'}{f.hasMentor ? ' · their mentor can reply too' : ' · no mentor'}
          {f.note && <div style={{ margin: '4px 0' }}>“{f.note}”</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input aria-label={`Reply to ${f.name || 'the student'}`} value={reply[f.id] || ''} onChange={e => setReply(r => ({ ...r, [f.id]: e.target.value }))} placeholder="Reply as the iMenteo team" maxLength={1000} style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
            <button type="button" onClick={() => send(f.id)} disabled={(reply[f.id] || '').trim().length < 2} style={{ padding: '8px 14px', borderRadius: 8, border: 0, background: 'var(--navy)', color: '#fff', fontWeight: 600, fontFamily: 'inherit' }}>Send</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const small = { fontSize: 13, color: 'var(--slate)' };
/** One made-up student's results: the journey (levels, proofs, the critic's verdict), the first week, and a practice set. */
function PersonaReport({ p }) {
  const j = p.journey || {};
  const critic = j.run ? j.run.steps.filter(s => s.agent === 'journey-critic') : [];
  return (
    <details style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--navy)' }}>{p.label}{p.error ? ` · failed (${p.error})` : j.outcome ? ` · journey ${j.outcome}` : ''}{p.week ? ` · week ${p.week.outcome}` : ''}</summary>
      {j.plan && (
        <div style={{ fontSize: 13, marginTop: 8 }}>
          <p><b>{j.plan.careerTitle}</b>: {j.plan.startPoint.summary} → {j.plan.endPoint.summary} ({j.plan.endPoint.horizonWeeks} weeks, {j.plan.weeklyMinutes} min a week)</p>
          {critic.map((c, k) => <p key={k} style={small}>Critic: {c.verdict || 'no verdict'}{c.notes.length ? ` · ${c.notes.join(' · ')}` : ''}</p>)}
          {j.ruleIssuesAfter && j.ruleIssuesAfter.length > 0 && <p style={{ color: '#b54708' }}>Rules still unmet: {j.ruleIssuesAfter.join(' · ')}</p>}
          <ol>{j.plan.phases.map(ph => <li key={ph.id} style={{ marginBottom: 6 }}><b>{ph.title}</b> ({ph.weeks} wk): {ph.topics.map(t => `${t.title} [${t.kind}]`).join('; ')}{ph.levelUp && <div style={small}>Level-up: {ph.levelUp.proof}</div>}</li>)}</ol>
        </div>
      )}
      {p.week && (
        <div style={{ fontSize: 13 }}>
          <p><b>Week 1</b> ({p.week.minutes} min available){p.week.ruleIssuesAfter.length ? <span style={{ color: '#b54708' }}> · rules unmet: {p.week.ruleIssuesAfter.join(' · ')}</span> : ''}</p>
          <ol>{p.week.units.map((u, k) => (
            <li key={k} style={{ marginBottom: 6 }}>[{u.type}, {u.minutes} min] <b>{u.title}</b> <span style={small}>({u.topic})</span>
              <div style={small}>Goal: {u.goal} · Show: {u.evidence}</div>
              {u.help && <div style={small}>Help: {u.help}</div>}
              {u.video && <div>{u.video.role === 'practice' ? 'Follow-along' : 'Video'}: <a href={u.video.url} target="_blank" rel="noopener noreferrer">{u.video.title}</a> <span style={small}>({u.video.channel}, {u.video.minutes} min)</span></div>}
              {u.practice.map(x => <div key={x.url}>Practice: <a href={x.url} target="_blank" rel="noopener noreferrer">{x.provider}: {x.title}</a> <span style={small}>{x.what}</span></div>)}
            </li>
          ))}</ol>
        </div>
      )}
      {p.practice && (
        <div style={{ fontSize: 13 }}>
          <p><b>Practice for "{p.practice.step}"</b> · {p.practice.run.steps.filter(s => s.agent === 'practice-checker').map(s => s.notes.join(' · ')).join(' | ')}</p>
          <ol>{p.practice.items.map((x, k) => <li key={k} style={{ marginBottom: 6 }}>{x.prompt}<div style={small}>{x.kind === 'question' ? `Answer: ${x.answer}` : `Checklist: ${(x.checklist || []).join('; ')}`}</div></li>)}</ol>
        </div>
      )}
    </details>
  );
}

/** Runs the real agents on made-up students (it spends credit, so it asks first) and shows the report for a person to read. */
function QualityPanel() {
  const [q, setQ] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => adminQualityGet().then(r => setQ(r.data)).catch(() => setMsg('Could not load the quality check.'));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!q || !q.run || q.run.status !== 'running') return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [q]);
  const start = async () => {
    if (!window.confirm(`This runs the real AI on ${q.personas.length} made-up students and spends up to $${q.maxUsd} of credit. Go ahead?`)) return;
    try { await adminQualityStart(); await load(); } catch (e) { setMsg(e.response?.data?.code === 'ALREADY_RUNNING' ? 'A check is already running.' : 'Could not start the check.'); }
  };
  if (!q) return msg ? <div style={box}>{msg}</div> : null;
  const r = q.run;
  return (
    <div style={box}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Quality check of the planning agents</h3>
      <p style={small}>Runs the real AI on {q.personas.length} made-up students ({q.personas.join(', ')}). Nothing is saved to anyone's account. Read each journey, week and practice set, and note what is wrong. Spends up to ${q.maxUsd}.</p>
      <button type="button" onClick={start} disabled={r && r.status === 'running'} style={{ margin: '10px 0', padding: '8px 14px', borderRadius: 8, border: 0, background: 'var(--navy)', color: '#fff', fontWeight: 600, fontFamily: 'inherit' }}>{r && r.status === 'running' ? 'Running…' : 'Run quality check'}</button>
      {msg && <p role="alert" style={{ color: '#b42318', fontSize: 13 }}>{msg}</p>}
      {r && <p style={small}>Last run: {r.status}{r.note ? ` (${r.note})` : ''} · cost ${r.costUsd} · {r.personas.length} of {q.personas.length} students done</p>}
      {r && r.personas.map(p => <PersonaReport key={p.label} p={p} />)}
    </div>
  );
}

export default function AdminDash() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const admin = JSON.parse(localStorage.getItem('im_admin') || '{}');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filter !== '') params.completed = filter;
      const [usersRes, statsRes] = await Promise.all([adminGetUsers(params), adminGetStats()]);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setStats(statsRes.data.stats);
    } catch (e) {
      if (e.response?.status === 401) { localStorage.removeItem('im_admin_token'); nav('/admin/login'); }
    } finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { load(1); }, []);
  const handleSearch = (e) => { e.preventDefault(); load(1); };
  const logout = () => { localStorage.removeItem('im_admin_token'); localStorage.removeItem('im_admin'); nav('/admin/login'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Nav */}
      <div style={{ background: 'var(--navy)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="iMenteo Logo" style={{ height: '32px', width: 'auto' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.5)', marginLeft: 8 }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>👤 {admin.username || 'Admin'}</span>
          {V4_ENABLED && <Link to="/admin/orgs" style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginRight: 14, textDecoration: 'underline' }}>Schools</Link>}
          <button onClick={logout} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 7, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 28 }}>Overview of all assessments and users</p>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 36 }}>
            <StatChip label="Total Users" value={stats.total_users} color="var(--amber)" />
            <StatChip label="Completed" value={stats.completed_assessments} sub={`${stats.completion_rate}% completion rate`} color="var(--green)" />
            <StatChip label="Avg Cognitive" value={stats.average_scores ? `${Math.round(stats.average_scores.avgCognitive)}%` : '—'} color="#3355CC" />
            <StatChip label="Avg Confidence" value={stats.average_scores ? `${Math.round(stats.average_scores.avgConfidence)}` : '—'} sub="out of 100" color="#884488" />
          </div>
        )}

        <LoopPanel />
        <QualityPanel />

        {/* Top careers */}
        {stats?.top_career_recommendations?.length > 0 && (
          <div style={{ background: 'var(--white)', borderRadius: 12, padding: 24, border: '1.5px solid var(--border)', marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>🏆 Most Recommended Careers (Rank #1)</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.top_career_recommendations.map(c => (
                <div key={c._id} style={{ background: 'var(--amber-lt)', border: '1px solid var(--amber)', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                  {c._id} <span style={{ color: 'var(--amber)', marginLeft: 6 }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ background: 'var(--white)', borderRadius: 12, padding: 24, border: '1.5px solid var(--border)', marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate)', marginBottom: 6 }}>Search</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email..." style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: 'var(--navy)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate)', marginBottom: 6 }}>Status</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: 'var(--navy)', outline: 'none', background: 'var(--white)' }}>
                <option value="">All Users</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>
            <button type="submit" className="btn-base btn-navy" style={{ padding: '10px 24px' }}>Search</button>
          </form>
        </div>

        {/* Users table */}
        <div style={{ background: 'var(--white)', borderRadius: 12, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Users <span style={{ color: 'var(--slate)', fontWeight: 400 }}>({pagination.total})</span></span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" style={{ width: 28, height: 28 }} /></div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)', fontSize: 14 }}>No users found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--mist)' }}>
                    {['Name','Email','Education','Status','Registered','Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--slate)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--cream)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{u.fullName}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--slate)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.educationLevel}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.assessmentCompleted ? 'var(--green-lt)' : 'var(--amber-lt)', color: u.assessmentCompleted ? 'var(--green)' : '#8A5200', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                          {u.assessmentCompleted ? '✓ Done' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate)', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`/admin/user/${u._id}`} style={{ background: 'var(--mist)', color: 'var(--navy)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 7, textDecoration: 'none', display: 'inline-block' }}>View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => load(p)} style={{ width: 36, height: 36, borderRadius: 7, border: `1.5px solid ${p === pagination.page ? 'var(--navy)' : 'var(--border)'}`, background: p === pagination.page ? 'var(--navy)' : 'var(--white)', color: p === pagination.page ? '#fff' : 'var(--navy)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
