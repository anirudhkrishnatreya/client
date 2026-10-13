import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

const cx = (...a) => a.filter(Boolean).join(' ');
const f = n => Number(n.toFixed(1));

export const Card = ({ children, className = '', flush, ai, ...rest }) => <section className={cx('pf-card', flush && 'flush', ai && 'pf-ai', className)} {...rest}>{children}</section>;

export function CardHead({ title, action, to, onAction, icon }) {
  return (
    <div className="pf-card-h">
      {icon && <Icon name={icon} size={20} className="pf-faint" />}<h3>{title}</h3>
      {action && (to ? <Link className="act" to={to}>{action}<Icon name="chevronRight" size={15} /></Link> : <button type="button" className="act" onClick={onAction}>{action}<Icon name="chevronRight" size={15} /></button>)}
    </div>
  );
}

export const Pill = ({ children, tone = '', icon }) => <span className={cx('pf-pill', tone)}>{icon && <Icon name={icon} size={13} />}{children}</span>;

const AV = ['#0f3ee4', '#4C8C6B', '#D9654A', '#6F8FC0', '#8A5A07', '#7A4E9E'];
export function Avatar({ name = '?', size = 40 }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const color = AV[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AV.length];
  return <span className="pf-avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: color }} aria-hidden="true">{initials}</span>;
}

export function Progress({ value, tone = '', label }) {
  const v = Math.max(0, Math.min(100, value));
  return <div className={cx('pf-progress', tone)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ width: `${v}%` }} /></div>;
}

export function Stat({ value, label, delta, up = true, icon, hint }) {
  return (
    <Card>
      <div className="pf-row" style={{ alignItems: 'flex-start' }}>
        <div className="pf-stat pf-grow"><span className="l">{label}</span><span className="v pf-num">{value}</span>{delta && <span className={cx('d', up ? 'up' : 'down')}>{delta}</span>}{hint && <span className="pf-small pf-faint">{hint}</span>}</div>
        {icon && <span className="pf-pill" style={{ width: 38, height: 38, borderRadius: 12, justifyContent: 'center', padding: 0 }}><Icon name={icon} size={19} /></span>}
      </div>
    </Card>
  );
}

/** A progress ring with a number in the middle. */
export function Ring({ value, size = 96, stroke = 10, color = '#0f3ee4', ink = '#0f3ee4', label, sub }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value)) / 100 * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }} role="img" aria-label={label || `${Math.round(value)} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDEFF5" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${f(v)} ${f(c)}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1.05 }}>
        <div><b style={{ fontFamily: "'Syne', sans-serif", fontSize: size * 0.27, color: ink, fontWeight: 600 }}>{Math.round(value)}<small style={{ fontSize: size * 0.14 }}>%</small></b>{sub && <div style={{ fontSize: 11, color: ink, opacity: .65 }}>{sub}</div>}</div>
      </div>
    </div>
  );
}

/** A small line chart. */
export function Spark({ data, height = 56, width = 220, color = '#0f3ee4', fill = true, label }) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data), span = max - min || 1, pad = 4;
  const pts = data.map((v, i) => [pad + (width - pad * 2) * (data.length === 1 ? 0.5 : i / (data.length - 1)), pad + (height - pad * 2) * (1 - (v - min) / span)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={label || 'trend'}>
      {fill && <path d={`${line} L${f(last[0])} ${height} L${f(pts[0][0])} ${height} Z`} fill={color} opacity=".09" />}
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={f(last[0])} cy={f(last[1])} r="4" fill="#fff" stroke={color} strokeWidth="2.4" />
    </svg>
  );
}

/** Vertical bars, one per label. */
export function Bars({ data, height = 150, color = '#0f3ee4', max, unit = '', highlight }) {
  const top = max || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, paddingTop: 8 }} role="img" aria-label={data.map(d => `${d.label} ${d.value}${unit}`).join(', ')}>
      {data.map(d => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <span className="pf-small pf-num" style={{ fontWeight: 600, color: 'var(--ink2)' }}>{d.value ? d.value : ''}</span>
          <div style={{ width: '100%', maxWidth: 36, height: `${Math.max(4, (d.value / top) * 100)}%`, borderRadius: 10, background: d.label === highlight ? 'linear-gradient(180deg,#FFD27D,#F2A93B)' : color, opacity: d.label === highlight ? 1 : 0.9 }} />
          <span className="pf-small pf-faint">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** A radar of skills: current level against target. Values 0 to 100. */
export function Radar({ data, size = 280 }) {
  const c = size / 2, R = size / 2 - 44, n = data.length;
  const pt = (i, r) => { const a = (-90 + (360 / n) * i) * Math.PI / 180; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  const poly = k => data.map((d, i) => pt(i, R * (d[k] / 100)).map(f).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={data.map(d => `${d.skill} ${d.now} of target ${d.target}`).join(', ')}>
      {[0.25, 0.5, 0.75, 1].map(k => <polygon key={k} points={data.map((_, i) => pt(i, R * k).map(f).join(',')).join(' ')} fill="none" stroke="#E6E9F0" />)}
      {data.map((d, i) => { const [x, y] = pt(i, R); return <line key={d.skill} x1={c} y1={c} x2={f(x)} y2={f(y)} stroke="#EEF0F5" />; })}
      <polygon points={poly('target')} fill="rgba(242,169,59,.12)" stroke="#F2A93B" strokeWidth="1.6" strokeDasharray="4 4" />
      <polygon points={poly('now')} fill="rgba(15,62,228,.16)" stroke="#0f3ee4" strokeWidth="2.2" strokeLinejoin="round" />
      {data.map((d, i) => { const [x, y] = pt(i, R + 22); return <text key={d.skill} x={f(x)} y={f(y + 4)} textAnchor="middle" fontSize="11.5" fill="#3A4256" fontFamily="DM Sans, sans-serif">{d.skill}</text>; })}
    </svg>
  );
}

/** A contribution-style grid of study minutes: values in columns of 7 days. */
export function Heat({ values }) {
  const tone = v => (v === 0 ? '#EDEFF5' : v < 30 ? '#dbe3ff' : v < 60 ? '#a9bcff' : v < 90 ? '#5f7dff' : '#0f3ee4');
  return <div className="pf-heat" role="img" aria-label="study activity over the last weeks">{values.map((v, i) => <i key={i} style={{ background: tone(v) }} title={`${v} min`} />)}</div>;
}

export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div className="pf-tabs" role="tablist" aria-label={label}>
      {tabs.map(t => <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>{t.icon && <Icon name={t.icon} size={16} />}{t.label}{t.count != null && <span className="pf-pill grey" style={{ padding: '0 7px' }}>{t.count}</span>}</button>)}
    </div>
  );
}

export function Check({ on, onClick, label }) {
  return <button type="button" className={cx('pf-check', on && 'on')} onClick={onClick} aria-pressed={!!on} aria-label={label}>{on && <Icon name="check" size={14} stroke={3} />}</button>;
}

export function Empty({ icon = 'info', title, children }) {
  return <div className="pf-empty"><Icon name={icon} size={30} /><div style={{ fontWeight: 600, color: 'var(--ink2)' }}>{title}</div>{children && <div className="pf-small">{children}</div>}</div>;
}

export function Drawer({ open, title, onClose, children }) {
  useEffect(() => { if (!open) return undefined; const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="pf-drawer-scrim" onClick={onClose} />
      <aside className="pf-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header><h3>{title}</h3><button type="button" className="pf-iconbtn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></header>
        <div className="body">{children}</div>
      </aside>
    </>
  );
}

export function PageHead({ eyebrow, title, children, actions }) {
  return (
    <div className="pf-pagehead">
      <div className="pf-grow">{eyebrow && <div className="pf-eyebrow">{eyebrow}</div>}<h2>{title}</h2>{children && <p>{children}</p>}</div>
      {actions && <div className="pf-row pf-wrap">{actions}</div>}
    </div>
  );
}

export const Sample = () => <div className="pf-note" role="note"><b>Sample data.</b> This preview runs on made-up students so the layout can be judged. Nothing here is saved to a real account yet.</div>;
export { Icon, cx };
