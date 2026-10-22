import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageSkeleton } from '../platform/live/loop/Loader';
import { Bars } from '../platform/ui/kit';
import { adminApi, errOf, money, num } from './adminApi';
import { Kpi, CapBar, DayBars, UsageTable, AuditRows, Section } from './common';

/** Everything at a glance: people, activity, AI spend against the caps, the learning loop, and what admins did lately. */
export default function Overview() {
  const [o, setO] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { adminApi.overview().then(r => setO(r.data)).catch(e => setErr(errOf(e))); }, []);
  if (err) return <p role="alert">{err}</p>;
  if (!o) return <PageSkeleton label="Loading the overview" />;
  const { users: u, ai, loop: l, youtube: yt } = o;
  return (
    <>
      <div className="pf-kpis">
        <Kpi label="Accounts" value={num(u.total)} sub={`${num(u.new7)} new this week · ${num(u.byRole.student || 0)} students`} />
        <Kpi label="Active today" value={num(u.activeToday)} sub={`${num(u.active7)} this week · ${num(u.active30)} this month`} />
        <Kpi label="AI spend today" value={money(ai.today.usd)} sub={`of ${money(ai.caps.dailyUsd)} daily cap · ${num(ai.today.calls)} call${ai.today.calls === 1 ? '' : 's'}`}><CapBar used={ai.today.usd} cap={ai.caps.dailyUsd} label="Today's AI spend against the daily cap" /></Kpi>
        <Kpi label="AI spend this month" value={money(ai.month.usd)} sub={`of ${money(ai.caps.monthlyUsd)} monthly cap`}><CapBar used={ai.month.usd} cap={ai.caps.monthlyUsd} label="This month's AI spend against the monthly cap" /></Kpi>
        <Kpi label="Tokens today" value={num(ai.today.inputTokens + ai.today.outputTokens)} sub={`${num(ai.today.inputTokens)} in · ${num(ai.today.outputTokens)} out`} />
        <Kpi label="AI errors today" value={num(ai.today.errors)} sub={ai.enabled ? 'AI is on' : 'AI is switched off'} />
        <Kpi label="YouTube quota today" value={`${num(yt.unitsToday)}`} sub={yt.configured ? `of ${num(yt.dailyUnits)} units` : 'No YouTube key set'}><CapBar used={yt.unitsToday} cap={yt.dailyUnits} label="YouTube quota used today" /></Kpi>
        <Kpi label="All-time AI spend" value={money(ai.allTime.usd)} sub={`${num(ai.allTime.calls)} call${ai.allTime.calls === 1 ? '' : 's'}`} />
      </div>

      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Section title="AI spend, last 30 days" icon="sparkles" action={{ label: 'AI usage', to: '/admin/ai' }}>
          <DayBars rows={ai.daily30} label="AI spend per day for the last 30 days" />
          <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>{money(ai.month.usd)} this month · {num(ai.month.calls)} calls · {num(ai.month.inputTokens + ai.month.outputTokens)} tokens</p>
        </Section>
        <Section title="New accounts, last 14 days" icon="users" action={{ label: 'Accounts', to: '/admin/users' }}>
          <Bars data={u.signups.map(s => ({ label: s.day.slice(8), value: s.count }))} height={140} />
        </Section>
      </div>

      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Section title="Heaviest AI users, last 30 days" icon="chart">
          <UsageTable rows={ai.topStudents} first={r => r.name} firstLabel="Account" link />
        </Section>
        <Section title="Spend by task, this month" icon="layers">
          <UsageTable rows={ai.byTask} first={r => r.key} firstLabel="Task" />
        </Section>
      </div>

      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Section title="Learning loop" icon="target" action={{ label: 'Details', to: '/admin/loop' }}>
          <ul className="pf-list">
            <li><span className="pf-grow">Active plans</span><b>{num(l.activeGoals)}</b></li>
            <li><span className="pf-grow">Career chats started this week</span><b>{num(l.chats7)}</b></li>
            <li><span className="pf-grow">Weeks planned this week</span><b>{num(l.weeks7)}</b></li>
            <li><span className="pf-grow">Assessments finished this week</span><b>{num(l.assessed7)}</b></li>
            <li><span className="pf-grow">Practice sets made this week</span><b>{num(l.practice7)}</b></li>
            <li><span className="pf-grow">“Not fair” waiting for a reply</span><b>{num(l.openFeedback)}</b></li>
            <li><span className="pf-grow">Portfolio pieces</span><b>{num(l.portfolioItems)}</b></li>
          </ul>
        </Section>
        <Section title="Accounts that need a look" icon="alert">
          <ul className="pf-list">
            <li><span className="pf-grow">Paused</span><Link to="/admin/users?status=disabled">{num(u.disabled)}</Link></li>
            <li><span className="pf-grow">Email not confirmed</span><Link to="/admin/users?status=unverified">{num(u.unverified)}</Link></li>
            <li><span className="pf-grow">Waiting for a parent to confirm</span><Link to="/admin/users?status=waiting-for-parent">{num(u.pendingConsent)}</Link></li>
          </ul>
        </Section>
      </div>

      <Section title="Recent admin activity" icon="file" action={{ label: 'Audit log', to: '/admin/audit' }}><AuditRows entries={o.audit} compact /></Section>
    </>
  );
}
