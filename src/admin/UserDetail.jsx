import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Card, CardHead, Pill, Tabs, Avatar, Icon } from '../platform/ui/kit';
import { PageSkeleton } from '../platform/live/loop/Loader';
import { adminApi, errOf, money, num, when, day, ago, can } from './adminApi';
import { Kpi, CapBar, DayBars, AuditRows, StatusPill, Section } from './common';

const BAND = { strong: ['leaf', 'Strong'], 'getting-there': ['gold', 'Getting there'], 'not-yet': ['coral', 'Not yet'] };
const Row = ({ k, children }) => <li><span className="pf-grow pf-muted">{k}</span><span style={{ textAlign: 'right' }}>{children}</span></li>;

/** The actions an admin may take on an account, each confirmed, each recorded in the audit log. */
function Actions({ p, reload, me }) {
  const nav = useNavigate();
  const [mode, setMode] = useState(null);             // 'pause' | 'password' | 'delete'
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [temp, setTemp] = useState(null);
  const [product, setProduct] = useState('plan-3m');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn, done) => { setBusy(true); setMsg(''); try { const r = await fn(); setMode(null); setReason(''); setConfirm(''); if (done) setMsg(typeof done === 'function' ? done(r) : done); await reload(); } catch (e) { setMsg(errOf(e)); } finally { setBusy(false); } };
  if (!can(me, 'act')) return <p className="pf-small pf-muted">Your role can look but not change accounts.</p>;
  return (
    <div>
      <div className="pf-row pf-wrap" style={{ gap: 8 }}>
        {p.access.disabled
          ? <button type="button" className="pf-btn sm" disabled={busy} onClick={() => run(() => adminApi.enable(p.id), 'Account restored. They can sign in again.')}><Icon name="check" size={14} />Restore account</button>
          : <button type="button" className="pf-btn sm ghost pf-danger" onClick={() => setMode('pause')}><Icon name="lock" size={14} />Pause account</button>}
        <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => { if (window.confirm(`Sign ${p.name} out on every device? They will need to sign in again.`)) run(() => adminApi.signOut(p.id), 'Signed out everywhere.'); }}><Icon name="logout" size={14} />Sign out everywhere</button>
        <button type="button" className="pf-btn sm ghost" onClick={() => setMode('password')}><Icon name="lock" size={14} />Reset password</button>
        <button type="button" className="pf-btn sm ghost" onClick={() => setMode('grant')}><Icon name="bolt" size={14} />Give access</button>
        {can(me, 'manage') && <button type="button" className="pf-btn sm ghost" onClick={() => setMode('revoke')}><Icon name="lock" size={14} />End access</button>}
        {!p.isVerified && <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => run(() => adminApi.verifyEmail(p.id), 'Email marked as confirmed.')}><Icon name="mail" size={14} />Confirm email</button>}
        {can(me, 'manage') && <button type="button" className="pf-btn sm ghost pf-danger" onClick={() => setMode('delete')}><Icon name="x" size={14} />Delete account</button>}
      </div>
      {mode === 'pause' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(() => adminApi.disable(p.id, reason.trim()), 'Account paused and signed out everywhere.'); }}>
          <label className="pf-label" htmlFor="pause-reason">Why? (kept in the audit log)</label>
          <input id="pause-reason" className="pf-input" maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: account shared with a friend; parent asked us to" />
          <p className="pf-small pf-muted" style={{ margin: '6px 0' }}>They cannot sign in or use anything until you restore the account. Nothing is deleted.</p>
          <div className="pf-row" style={{ gap: 8 }}><button type="submit" className="pf-btn sm pf-danger" disabled={busy || reason.trim().length < 3}>Pause account</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {mode === 'password' && (
        <div className="pf-unit-form">
          <p className="pf-small" style={{ marginTop: 0 }}>Choose how {p.name} gets back in:</p>
          <div className="pf-row pf-wrap" style={{ gap: 8 }}>
            <button type="button" className="pf-btn sm" disabled={busy || !p.email} onClick={() => run(() => adminApi.resetPassword(p.id, 'email'), r => `A reset link was emailed to ${r.data.sentTo}.`)}>Email them a reset link</button>
            <button type="button" className="pf-btn sm ghost" disabled={busy} onClick={() => { if (window.confirm('Set a new temporary password? Their current password stops working and they are signed out everywhere.')) run(async () => { const r = await adminApi.resetPassword(p.id, 'temporary'); setTemp(r.data.temporaryPassword); return r; }); }}>Set a temporary password</button>
            <button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button>
          </div>
          <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>Use the temporary password only when their email does not work. Share it privately; ask them to change it.</p>
        </div>
      )}
      {temp && (
        <div className="pf-unit-form" role="status">
          <p className="pf-small" style={{ marginTop: 0 }}><b>Temporary password</b> (shown only now: copy it before leaving this page)</p>
          <div className="pf-secret">{temp}</div>
          <div className="pf-row" style={{ gap: 8, marginTop: 8 }}><button type="button" className="pf-btn sm" onClick={() => navigator.clipboard && navigator.clipboard.writeText(temp)}>Copy</button><button type="button" className="pf-btn sm ghost" onClick={() => setTemp(null)}>Done</button></div>
        </div>
      )}
      {mode === 'grant' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(() => adminApi.grant(p.id, product, reason.trim()), 'Access given.'); }}>
          <label className="pf-label" htmlFor="grant-product">What to give</label>
          <select id="grant-product" className="pf-select" value={product} onChange={e => setProduct(e.target.value)}>{[['plan-1m', 'Plan, 1 month'], ['plan-3m', 'Plan, 3 months (with the assessment)'], ['plan-6m', 'Plan, 6 months (with the assessment)'], ['plan-12m', 'Plan, 12 months (with the assessment)'], ['assessment', 'Career Assessment']].map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <label className="pf-label" htmlFor="grant-reason" style={{ marginTop: 8 }}>Why? (kept in the audit log)</label>
          <input id="grant-reason" className="pf-input" maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: school pilot, partner trial, fixing a missed payment" />
          <div className="pf-row" style={{ gap: 8, marginTop: 8 }}><button type="submit" className="pf-btn sm" disabled={busy || reason.trim().length < 3}>Give access</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {mode === 'revoke' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(() => adminApi.revoke(p.id, reason.trim()), 'Access ended.'); }}>
          <p className="pf-small" style={{ marginTop: 0 }}>This ends every plan and purchase access this person has, now. It does not refund money: do that in Razorpay.</p>
          <label className="pf-label" htmlFor="revoke-reason">Why? (kept in the audit log)</label>
          <input id="revoke-reason" className="pf-input" maxLength={300} value={reason} onChange={e => setReason(e.target.value)} />
          <div className="pf-row" style={{ gap: 8, marginTop: 8 }}><button type="submit" className="pf-btn sm pf-danger" disabled={busy || reason.trim().length < 3}>End access</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {mode === 'delete' && (
        <form className="pf-unit-form" onSubmit={e => { e.preventDefault(); run(async () => { await adminApi.deleteUser(p.id); nav('/admin/users'); }); }}>
          <p className="pf-small" style={{ marginTop: 0 }}>This permanently deletes {p.name}’s account and everything in it: assessments, reports, plans, work and photos. It cannot be undone. Type <b>DELETE</b> to confirm.</p>
          <input className="pf-input" aria-label="Type DELETE to confirm" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <div className="pf-row" style={{ gap: 8, marginTop: 8 }}><button type="submit" className="pf-btn sm pf-danger" disabled={busy || confirm !== 'DELETE'}>Delete permanently</button><button type="button" className="pf-btn sm ghost" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {msg && <p className="pf-small" role="status" style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}

/** Today's AI use against the limit, with a reset and the account's own limit. */
function AiLimit({ p, a, reload, me }) {
  const [own, setOwn] = useState('');
  const [msg, setMsg] = useState('');
  const run = async (body, done) => { setMsg(''); try { await adminApi.setAi(p.id, body); setOwn(''); setMsg(done); await reload(); } catch (e) { setMsg(errOf(e)); } };
  return (
    <div>
      <div className="pf-meter-line"><span>{a.unlimited ? `${num(a.used)} calls today (no limit on this account)` : `${num(a.used)} of ${num(a.limit)} calls today`}</span><span className="pf-small pf-muted">resets {when(a.resetsAt)}</span></div>
      {!a.unlimited && <CapBar used={a.used} cap={a.limit} label="AI calls today against the limit" />}
      {a.paused && <p className="pf-small" style={{ color: 'var(--coral)' }}>The app-wide AI budget is spent for now: AI is paused for everyone.</p>}
      {can(me, 'act') && (
        <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 10 }}>
          <button type="button" className="pf-btn sm ghost" onClick={() => run({ reset: true }, 'Today’s count starts again from now.')}>Reset today’s limit</button>
          <input className="pf-input" style={{ width: 130 }} type="number" min="-1" max="1000" placeholder="Own limit" aria-label="This account's own daily AI limit" value={own} onChange={e => setOwn(e.target.value)} />
          <button type="button" className="pf-btn sm ghost" disabled={own === ''} onClick={() => run({ dailyCalls: Number(own) }, 'Saved this account’s own limit.')}>Set limit</button>
          {p.settings.ownAiLimit !== null && <button type="button" className="pf-btn sm ghost" onClick={() => run({ dailyCalls: null }, 'Back to the default limit.')}>Use default</button>}
        </div>
      )}
      <p className="pf-small pf-muted" style={{ margin: '6px 0 0' }}>-1 means no daily limit (for the team’s own testing). The app-wide spending caps always apply.</p>
      {msg && <p className="pf-small" role="status">{msg}</p>}
    </div>
  );
}

/** Assigning this student to a mentor. */
function MentorPick({ p, reload, me }) {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (p.role === 'student' && can(me, 'act')) adminApi.mentors().then(r => setList(r.data.mentors || [])).catch(() => setList([])); }, [p.role]); // eslint-disable-line react-hooks/exhaustive-deps
  if (p.role !== 'student') return null;
  return (
    <li><span className="pf-grow pf-muted">Mentor</span>
      {list && can(me, 'act') ? (
        <select className="pf-select" style={{ width: 'auto' }} aria-label="Mentor" value={p.mentor ? p.mentor.id : ''} onChange={async e => { setMsg(''); try { await adminApi.assignMentor(p.id, e.target.value || null); await reload(); setMsg('Saved.'); } catch (x) { setMsg(errOf(x)); } }}>
          <option value="">No mentor</option>{list.map(m => <option key={m.id || m._id} value={m.id || m._id}>{m.fullName || m.name}</option>)}
        </select>
      ) : <span>{p.mentor ? p.mentor.name : 'No mentor'}</span>}
      {msg && <span className="pf-small pf-muted" role="status" style={{ marginLeft: 8 }}>{msg}</span>}
    </li>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const { me } = useOutletContext() || {};
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('overview');
  const load = () => adminApi.user(id).then(r => setD(r.data)).catch(e => setErr(errOf(e)));
  useEffect(() => { setD(null); load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <><p role="alert">{err}</p><Link to="/admin/users">Back to accounts</Link></>;
  if (!d) return <PageSkeleton label="Loading the account" />;
  const p = d.profile, ai = d.ai, l = d.loop;
  return (
    <>
      <p className="pf-small" style={{ marginBottom: 10 }}><Link to="/admin/users">← Accounts</Link></p>
      <Card style={{ marginBottom: 14 }}>
        <div className="pf-row pf-wrap" style={{ gap: 14, alignItems: 'flex-start' }}>
          <Avatar name={p.name} size={52} />
          <div className="pf-grow">
            <div className="pf-row pf-wrap" style={{ gap: 8 }}><h2 style={{ fontSize: 22 }}>{p.name}</h2><StatusPill status={p.status} /><Pill tone="sky">{p.role}</Pill></div>
            <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>{p.email} · @{p.username}{p.phone ? ` · ${p.phone}` : ''} · joined {day(p.createdAt)} · last signed in {ago(p.lastLoginAt)}</p>
            {p.access.disabled && <p className="pf-small" style={{ color: 'var(--coral)', margin: '6px 0 0' }}>Paused {when(p.access.disabledAt)}: {p.access.reason}</p>}
          </div>
        </div>
        <div style={{ marginTop: 14 }}><Actions p={p} reload={load} me={me} /></div>
      </Card>

      <Tabs label="Account sections" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'ai', label: 'AI usage' }, { id: 'loop', label: 'Learning loop' }, { id: 'activity', label: 'Activity', count: d.audit.length || undefined }]} />

      {tab === 'overview' && (
        <div className="pf-grid g2" style={{ marginTop: 14 }}>
          <Section title="Account" icon="user">
            <ul className="pf-list">
              <Row k="Role">{p.role}{p.grade ? ` · ${/^\d+$/.test(p.grade) ? `Class ${p.grade}` : p.grade}` : ''}{p.track ? ` · ${p.track}` : ''}</Row>
              <Row k="Email confirmed">{p.isVerified ? 'Yes' : <Pill tone="gold">No</Pill>}</Row>
              <Row k="Signed out everywhere">{p.sessionsValidFrom ? when(p.sessionsValidFrom) : 'Never'}</Row>
              <MentorPick p={p} reload={load} me={me} />
              <Row k="Reminder emails">{p.settings.loopEmails ? 'On' : 'Off'}</Row>
              <Row k="Portfolio shared">{p.settings.portfolioPublic ? 'Yes' : 'No'}</Row>
            </ul>
          </Section>
          <Section title="Consent and parent" icon="shield">
            {p.consent ? (
              <ul className="pf-list">
                <Row k="Under 18">{p.consent.required ? 'Yes' : 'No'}</Row>
                <Row k="Consent">{p.consent.status || '—'}{p.consent.termsVersion ? ` · terms ${p.consent.termsVersion}` : ''}</Row>
                <Row k="Parent">{p.consent.guardian ? `${p.consent.guardian.name || ''} <${p.consent.guardian.email}>` : '—'}</Row>
                <Row k="Parent confirmed">{p.consent.guardian ? (p.consent.guardian.verified ? 'Yes' : 'Not yet') : '—'}</Row>
                <Row k="Share with school">{p.consent.shareWithSchool ? 'Yes' : 'No'}</Row>
              </ul>
            ) : <p className="pf-small pf-muted">No consent record.</p>}
          </Section>
          <Section title="Today’s AI" icon="sparkles"><AiLimit p={p} a={ai.allowance} reload={load} me={me} /></Section>
          <Section title="Career assessments" icon="clipboard">
            {d.assessments.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>None yet.</p> : <ul className="pf-list">{d.assessments.map(a => <li key={a.id}><span className="pf-grow">{a.engine === '4.0' ? 'Career assessment (v4)' : `Assessment (${a.engine})`}{a.track ? ` · ${a.track}` : ''}</span><span className="pf-small pf-muted">{a.completedAt ? `finished ${day(a.completedAt)}` : `started ${day(a.startedAt)}`}</span></li>)}</ul>}
          </Section>
        </div>
      )}

      {tab === 'ai' && (
        <div style={{ marginTop: 14 }}>
          <div className="pf-kpis">
            <Kpi label="Today" value={money(ai.today.usd)} sub={`${num(ai.today.calls)} call${ai.today.calls === 1 ? '' : 's'} · ${num(ai.today.inputTokens + ai.today.outputTokens)} tokens`} />
            <Kpi label="This month" value={money(ai.month.usd)} sub={`${num(ai.month.calls)} call${ai.month.calls === 1 ? '' : 's'} · ${num(ai.month.inputTokens + ai.month.outputTokens)} tokens`} />
            <Kpi label="All time" value={money(ai.allTime.usd)} sub={`${num(ai.allTime.calls)} call${ai.allTime.calls === 1 ? '' : 's'} · ${num(ai.allTime.inputTokens)} in · ${num(ai.allTime.outputTokens)} out`} />
            <Kpi label="Errors (all time)" value={num(ai.allTime.errors)} />
          </div>
          <div className="pf-grid g2" style={{ marginBottom: 14 }}>
            <Section title="Spend per day, last 30 days" icon="chart"><DayBars rows={ai.daily30} label="This account's AI spend per day" /></Section>
            <Section title="Today’s limit" icon="sparkles"><AiLimit p={p} a={ai.allowance} reload={load} me={me} /></Section>
          </div>
          <Section title="By task (all time)" icon="layers" style={{ marginBottom: 14 }}>
            {ai.byTask.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No AI use yet.</p> : (
              <div className="pf-tablewrap"><table className="pf-atable"><thead><tr><th>Task</th><th className="r">Calls</th><th className="r">Tokens in</th><th className="r">Tokens out</th><th className="r">Spend</th></tr></thead>
                <tbody>{ai.byTask.map(t => <tr key={t.task}><td>{t.task}</td><td className="r">{num(t.calls)}</td><td className="r">{num(t.inputTokens)}</td><td className="r">{num(t.outputTokens)}</td><td className="r"><b>{money(t.usd)}</b></td></tr>)}</tbody></table></div>
            )}
          </Section>
          <Section title="Recent AI calls" icon="clock">
            {ai.recent.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>None.</p> : (
              <div className="pf-tablewrap"><table className="pf-atable"><thead><tr><th>When</th><th>Task</th><th>Model</th><th className="r">In</th><th className="r">Out</th><th className="r">Spend</th><th className="r">Time</th><th>Result</th></tr></thead>
                <tbody>{ai.recent.map((c, k) => <tr key={k}><td>{when(c.at)}</td><td>{c.task}</td><td className="pf-small">{c.model}</td><td className="r">{num(c.inputTokens)}</td><td className="r">{num(c.outputTokens)}</td><td className="r">{money(c.usd)}</td><td className="r pf-small">{c.ms ? `${(c.ms / 1000).toFixed(1)}s` : ''}</td><td>{c.ok ? <Pill tone="leaf">ok</Pill> : <Pill tone="coral">{c.code || 'error'}</Pill>}</td></tr>)}</tbody></table></div>
            )}
          </Section>
        </div>
      )}

      {tab === 'loop' && (
        <div style={{ marginTop: 14 }}>
          {!l.summary ? <Card><p className="pf-muted" style={{ margin: 0 }}>No active weekly plan{l.goals ? ` (${l.goals} earlier goal${l.goals > 1 ? 's' : ''})` : ''}.</p></Card> : (
            <>
              <div className="pf-kpis">
                <Kpi label="Goal" value={l.summary.goal.title} sub={l.summary.goal.endPoint} />
                <Kpi label="Level" value={`${l.summary.goal.level.number} of ${l.summary.goal.level.total}`} sub={l.summary.goal.level.title} />
                <Kpi label="Week" value={l.summary.week ? l.summary.week.number : '—'} sub={`last active ${ago(l.summary.lastActive)}`} />
                <Kpi label="Practice sets · portfolio" value={`${num(l.practiceSets)} · ${num(l.portfolio)}`} />
              </div>
              <Section title="Weeks" icon="calendar" style={{ marginBottom: 14 }}>
                <div className="pf-tablewrap"><table className="pf-atable"><thead><tr><th>Week</th><th>Started</th><th>Pace</th><th className="r">Steps done</th><th className="r">Quiz</th><th>Work</th><th>Made by</th></tr></thead>
                  <tbody>{l.weeks.map(w => <tr key={w.number}><td>{w.number}{w.levelUp ? <Pill tone="leaf">level-up</Pill> : null}</td><td>{day(w.start)}</td><td>{w.pace}</td><td className="r">{w.done}/{w.steps}</td><td className="r">{w.quiz === null ? '—' : `${Math.round(w.quiz * 100)}%`}</td><td>{w.work && BAND[w.work] ? <Pill tone={BAND[w.work][0]}>{BAND[w.work][1]}</Pill> : '—'}</td><td className="pf-small">{w.source === 'model' ? 'AI agents' : 'simple plan'}</td></tr>)}</tbody></table></div>
              </Section>
              <div className="pf-grid g2">
                <Section title="How the plan adapted" icon="repeat">{l.summary.adaptations.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Not yet.</p> : <ul className="pf-list">{l.summary.adaptations.map(a => <li key={a.week}><span className="pf-grow"><b>After week {a.week}</b> · {a.pace}<br /><span className="pf-small">{a.summary}</span></span></li>)}</ul>}</Section>
                <Section title="Flagged as not fair" icon="alert">{l.summary.flagged.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing flagged.</p> : <ul className="pf-list">{l.summary.flagged.map(f => <li key={f.id}><span className="pf-grow">{f.target === 'judgement' ? `Week ${f.weekNumber} feedback` : 'Practice'}{f.note ? `: “${f.note}”` : ''}<br /><span className="pf-small pf-muted">{f.reply ? `Replied: ${f.reply.text}` : 'Waiting for a reply'}</span></span><Pill tone={f.status === 'open' ? 'coral' : 'leaf'}>{f.status}</Pill></li>)}</ul>}</Section>
                <Section title="Reminder emails sent" icon="mail">{l.nudges.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>None.</p> : <ul className="pf-list">{l.nudges.map((n, k) => <li key={k}><span className="pf-grow">{n.kind}</span><span className="pf-small pf-muted">{when(n.at)}</span></li>)}</ul>}</Section>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div style={{ marginTop: 14 }}>
          <Card><CardHead title="What admins did to this account" icon="file" /><AuditRows entries={d.audit} /></Card>
        </div>
      )}
    </>
  );
}
