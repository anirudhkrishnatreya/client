import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageSkeleton } from '../platform/live/loop/Loader';
import { adminApi, errOf, money, num, when } from './adminApi';
import { Kpi, CapBar, DayBars, UsageTable, Section } from './common';

/** AI spend and tokens over a period: by day, by task, by model, by account, and recent errors. */
export default function AiUsage() {
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { setD(null); adminApi.ai(days).then(r => setD(r.data)).catch(e => setErr(errOf(e))); }, [days]);
  if (err) return <p role="alert">{err}</p>;
  if (!d) return <PageSkeleton label="Loading AI usage" />;
  const t = d.totals;
  return (
    <>
      <div className="pf-filters">
        <label className="pf-small" htmlFor="ai-days">Period</label>
        <select id="ai-days" className="pf-select" value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
      </div>
      <div className="pf-kpis">
        <Kpi label="Spend" value={money(t.usd)} sub={`${num(t.calls)} call${t.calls === 1 ? '' : 's'}`} />
        <Kpi label="Tokens" value={num(t.inputTokens + t.outputTokens)} sub={`${num(t.inputTokens)} in · ${num(t.outputTokens)} out`} />
        <Kpi label="Average per call" value={t.calls ? money(t.usd / t.calls) : '—'} sub={t.calls ? `${num(Math.round((t.inputTokens + t.outputTokens) / t.calls))} tokens` : ''} />
        <Kpi label="Errors" value={num(t.errors)} sub={t.calls ? `${((t.errors / t.calls) * 100).toFixed(1)}% of calls` : ''} />
        <Kpi label="Daily cap" value={money(d.caps.dailyUsd)} sub={`monthly ${money(d.caps.monthlyUsd)} · ${d.caps.studentDailyCalls} calls a student a day`}><CapBar used={(d.daily[d.daily.length - 1] || {}).usd || 0} cap={d.caps.dailyUsd} label="Today against the daily cap" /></Kpi>
      </div>
      <Section title="Spend per day" icon="chart" style={{ marginBottom: 18 }}>
        <DayBars rows={d.daily} label={`AI spend per day for the last ${days} days`} height={140} />
        <div className="pf-row pf-between pf-small pf-muted" style={{ marginTop: 6 }}><span>{d.daily[0] && d.daily[0].day}</span><span>{d.daily.length && d.daily[d.daily.length - 1].day}</span></div>
      </Section>
      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Section title="By task" icon="layers"><UsageTable rows={d.byTask} first={r => r.key} firstLabel="Task" /></Section>
        <Section title="By model" icon="brain"><UsageTable rows={d.byModel} first={r => r.key} firstLabel="Model" /></Section>
      </div>
      <Section title="By account" icon="users" style={{ marginBottom: 18 }}><UsageTable rows={d.byStudent} first={r => (r.email ? `${r.name} · ${r.email}` : r.name)} firstLabel="Account" link /></Section>
      <Section title="Recent errors" icon="alert">
        {d.errors.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No errors in this period.</p> : (
          <div className="pf-tablewrap"><table className="pf-atable"><thead><tr><th>When</th><th>Task</th><th>Model</th><th>Error</th><th>Account</th></tr></thead>
            <tbody>{d.errors.map((e, k) => <tr key={k}><td>{when(e.at)}</td><td>{e.task}</td><td>{e.model}</td><td>{e.code || '—'}</td><td>{e.userId ? <Link to={`/admin/users/${e.userId}`}>Open</Link> : '—'}</td></tr>)}</tbody></table></div>
        )}
      </Section>
    </>
  );
}
