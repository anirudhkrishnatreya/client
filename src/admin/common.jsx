import { Link } from 'react-router-dom';
import { Card, CardHead, Pill } from '../platform/ui/kit';
import { money, num, when } from './adminApi';

/** A headline number with a label and a small line under it. */
export const Kpi = ({ label, value, sub, children }) => <Card><div className="pf-kpi"><span className="l">{label}</span><span className="v">{value}</span>{sub && <span className="s">{sub}</span>}{children}</div></Card>;

/** How much of a cap is used: a bar that turns amber at 75% and red at 100%. */
export function CapBar({ used, cap, label }) {
  const pct = cap ? Math.min(100, (used / cap) * 100) : 0;
  return <div className={`pf-hbar${pct >= 100 ? ' bad' : pct >= 75 ? ' warn' : ''}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>;
}

export const STATUS = { active: ['leaf', 'Active'], disabled: ['coral', 'Paused'], unverified: ['gold', 'Email not confirmed'], 'waiting-for-parent': ['sky', 'Waiting for parent'] };
export const StatusPill = ({ status }) => { const s = STATUS[status] || ['grey', status]; return <Pill tone={s[0]}>{s[1]}</Pill>; };

/** A simple daily chart: one bar per day, the value on hover. */
export function DayBars({ rows, value = r => r.usd, fmt = money, label, height = 120 }) {
  const max = Math.max(...rows.map(value), 0) || 1;
  return (
    <div role="img" aria-label={label} style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {rows.map(r => <div key={r.day} title={`${r.day}: ${fmt(value(r))}`} style={{ flex: 1, minWidth: 3, height: `${Math.max(2, (value(r) / max) * 100)}%`, background: value(r) ? 'var(--indigo)' : 'var(--line)', borderRadius: 4, opacity: value(r) ? 0.85 : 1 }} />)}
    </div>
  );
}

/** A table of AI use by task, model or student. */
export function UsageTable({ rows, first, firstLabel, link }) {
  if (!rows.length) return <p className="pf-small pf-muted" style={{ margin: 0 }}>No AI use in this period.</p>;
  return (
    <div className="pf-tablewrap"><table className="pf-atable">
      <thead><tr><th>{firstLabel}</th><th className="r">Calls</th><th className="r">Tokens in</th><th className="r">Tokens out</th><th className="r">Errors</th><th className="r">Spend</th></tr></thead>
      <tbody>{rows.map((r, k) => (
        <tr key={k}><td>{link && r.id ? <Link to={`/admin/users/${r.id}`}>{first(r)}</Link> : first(r)}</td><td className="r">{num(r.calls)}</td><td className="r">{num(r.inputTokens)}</td><td className="r">{num(r.outputTokens)}</td><td className="r">{r.errors ? <Pill tone="coral">{r.errors}</Pill> : 0}</td><td className="r"><b>{money(r.usd)}</b></td></tr>
      ))}</tbody>
    </table></div>
  );
}

export const ACTIONS = {
  'admin.login': 'Signed in', 'admin.login.failed': 'Failed sign-in', 'admin.login.lockout': 'Locked after wrong passwords', 'admin.login.locked': 'Tried to sign in while locked',
  'admin.create': 'Added an admin', 'admin.update': 'Changed an admin', 'admin.sign-out': 'Signed an admin out everywhere', 'admin.password.change': 'Changed own password',
  'user.disable': 'Paused an account', 'user.enable': 'Restored an account', 'user.sign-out': 'Signed an account out everywhere', 'user.password.reset-email': 'Sent a password reset email',
  'user.password.temporary': 'Set a temporary password', 'user.verify-email': 'Confirmed an email by hand', 'user.ai-limit': 'Changed an AI limit', 'user.delete': 'Deleted an account', 'user.assign-mentor': 'Assigned a mentor',
  'mentor.create': 'Added a mentor', 'loop.feedback.reply': 'Replied to a “not fair”', 'loop.quality-pass.start': 'Started a quality check', 'org.create': 'Added a school', 'org.dpa': 'Recorded a DPA',
  'cohort.create': 'Added a class', 'cohort.status': 'Changed a class', 'counsellor.create': 'Added a counsellor'
};
const detailText = d => (d ? Object.entries(d).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ') : '');

/** Admin activity rows: when, who, what, to whom. */
export function AuditRows({ entries, compact }) {
  if (!entries.length) return <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing recorded yet.</p>;
  return (
    <div className="pf-tablewrap"><table className="pf-atable">
      <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>About</th>{!compact && <th>Details</th>}{!compact && <th>From</th>}</tr></thead>
      <tbody>{entries.map(e => (
        <tr key={e.id}>
          <td style={{ whiteSpace: 'nowrap' }}>{when(e.at)}</td><td>{e.admin || '—'}</td>
          <td>{/failed|lock/.test(e.action) ? <Pill tone="coral">{ACTIONS[e.action] || e.action}</Pill> : ACTIONS[e.action] || e.action}</td>
          <td>{e.target && e.target.type === 'user' && e.target.id ? <Link to={`/admin/users/${e.target.id}`}>{e.target.label || e.target.id}</Link> : (e.target && (e.target.label || e.target.id)) || '—'}</td>
          {!compact && <td className="pf-small">{detailText(e.details)}</td>}{!compact && <td className="pf-small pf-muted">{e.ip || ''}</td>}
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export const Section = ({ title, icon, action, children, style }) => <Card style={style}><CardHead title={title} icon={icon} action={action && action.label} to={action && action.to} />{children}</Card>;
