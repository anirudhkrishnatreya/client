import { useEffect, useState } from 'react';
import { Avatar, Card, CardHead, Icon, Pill } from '../../ui/kit';

// Small pieces the observatory screens share.
export const RISK = { green: ['On track', 'leaf'], amber: ['Watch', 'gold'], red: ['Needs you', 'coral'] };
export const KIND_ICON = { step: 'check', log: 'book', checkin: 'sun', focus: 'clock', task: 'tasks', message: 'message', coach: 'sparkles', assessment: 'clipboard', change: 'repeat', session: 'users' };
export const ago = at => { if (!at) return 'never'; const m = Math.round((Date.now() - new Date(at).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`; };
export const when = at => new Date(at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export function RiskBadge({ risk, showReasons = false }) {
  const [label, tone] = RISK[risk.level] || RISK.green;
  return (
    <span className="pf-risk">
      <Pill tone={tone}><span className={`pf-risk-dot ${risk.level}`} aria-hidden="true" />{label}</Pill>
      {showReasons && <span className="pf-small pf-muted"> {risk.reasons.join(' · ')}</span>}
    </span>
  );
}

/** One claim and the facts behind it: tap a fact key to read what it rests on. */
export function Claim({ item, facts }) {
  const [open, setOpen] = useState(false);
  const used = (item.evidence || []).map(k => (facts || []).find(f => f.key === k)).filter(Boolean);
  return (
    <li className="pf-claim">
      <span>{item.text}</span>
      {used.length > 0 && <button type="button" className="pf-evkeys" aria-expanded={open} onClick={() => setOpen(o => !o)} title="What this is based on">{used.map(f => f.key).join(' · ')}</button>}
      {open && <ul className="pf-evlist">{used.map(f => <li key={f.key}><b>{f.key}</b> {f.text}</li>)}</ul>}
    </li>
  );
}

export function Sections({ sections, facts }) {
  return (
    <div className="pf-sections">{sections.map(s => (
      <div key={s.key} className={`pf-section ${s.key}`}>
        <h4>{s.title}</h4>
        {s.items.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing the data can back up here.</p> : <ul>{s.items.map((i, k) => <Claim key={k} item={i} facts={facts} />)}</ul>}
      </div>))}</div>
  );
}

/** Reports a mentor chose to share (with the student, or with the parent): read-only, each claim with what it rests on. */
export function SharedReports({ load, who, empty }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => { let on = true; load().then(r => on && setList(r.reports)).catch(() => on && setList([])); return () => { on = false; }; }, [load]);
  if (!list || (!list.length && !empty)) return null;
  return (
    <Card><CardHead title={`Reports from ${who}`} icon="file" />
      {list.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>{empty}</p> :
        <ul className="pf-list">{list.map(r => <li key={r.id} style={{ display: 'block' }}>
          <div className="pf-row pf-wrap" style={{ gap: 6 }}><span className="pf-grow"><b>{r.headline}</b><br /><span className="pf-small pf-muted">{r.kind === 'parent' ? 'Monthly report' : r.kind === 'brief' ? 'Summary' : 'Weekly report'} · {when(r.sharedAt || r.at)}</span></span>
            <button type="button" className="pf-btn sm ghost" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? 'Close' : 'Read'}</button></div>
          {open === r.id && <div className="pf-o-report"><Sections sections={r.sections} facts={r.facts} /></div>}
        </li>)}</ul>}
    </Card>
  );
}

export function Head360({ h, actions }) {
  return (
    <section className="pf-o-head">
      <Avatar name={h.name} size={64} />
      <div className="pf-grow" style={{ minWidth: 0 }}>
        <div className="pf-row pf-wrap" style={{ gap: 8 }}><h2 style={{ margin: 0, fontSize: 26 }}>{h.name}</h2><RiskBadge risk={h.risk} />{h.goalKind === 'curriculum' && <Pill tone="sky">School plan</Pill>}</div>
        <div className="pf-small pf-muted" style={{ marginTop: 4 }}>{[h.school && h.school.name, h.cohort, (h.education && h.education.label) || (h.grade && `Class ${h.grade}`), h.mentor && `Mentor: ${h.mentor}`].filter(Boolean).join(' · ')}</div>
        <div className="pf-o-facts">
          <span><Icon name="target" size={14} />{h.goal || 'No goal yet'}{h.level ? ` · ${h.level}` : ''}</span>
          <span><Icon name="flame" size={14} />{h.streak.current}-day streak</span>
          <span><Icon name="clock" size={14} />Last active {h.lastActive ? (h.lastActive.daysAgo === 0 ? 'today' : `${h.lastActive.daysAgo} days ago`) : 'never'}</span>
          {h.energy !== null && <span><Icon name="bolt" size={14} />Energy {h.energy}/5</span>}
          <span><Icon name="users" size={14} />{h.nextSession ? `Next session ${h.nextSession.when}` : 'No session booked'}</span>
          <span><Icon name="heart" size={14} />Parent {h.parent === 'linked' ? 'linked' : h.parent === 'invited' ? 'invited' : 'not added'}</span>
        </div>
      </div>
      {h.school && h.school.logoUrl && <img src={h.school.logoUrl} alt={h.school.name} className="pf-o-logo" />}
      {actions && <div className="pf-row pf-wrap" style={{ gap: 6 }}>{actions}</div>}
    </section>
  );
}
