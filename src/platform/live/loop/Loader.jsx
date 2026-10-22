import { useEffect, useState } from 'react';

/** A small spinning ring with a dot in orbit. Decorative: the words next to it say what is happening. */
export const Orbit = ({ size = 44 }) => <span className="pf-orbit" style={{ width: size, height: size }} aria-hidden="true"><i /></span>;

/**
 * For work that takes a few seconds (the guide thinking, a plan being written, work being judged). Shows an orbit, what is
 * happening now (cycling through `steps`), a moving bar, and, if it is taking long, a reassuring line.
 */
export function Working({ title, steps = [], compact = false, hint = 'Still working. This can take a few more seconds.' }) {
  const [i, setI] = useState(0);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const cycle = steps.length > 1 ? setInterval(() => setI(x => (x + 1) % steps.length), 2400) : null;
    const wait = setTimeout(() => setSlow(true), 9000);
    return () => { if (cycle) clearInterval(cycle); clearTimeout(wait); };
  }, [steps.length]);
  return (
    <div className={`pf-working${compact ? ' compact' : ''}`} role="status" aria-live="polite">
      <Orbit size={compact ? 32 : 52} />
      <div className="pf-working-body">
        <b>{title}</b>
        {steps[i] && <div className="pf-working-step" key={i} aria-hidden="true">{steps[i]}</div>}
        {!compact && <div className="pf-bar" aria-hidden="true"><i /></div>}
        {slow && <small className="pf-muted">{hint}</small>}
      </div>
    </div>
  );
}

/** A grey shimmering block that stands in for content while it loads. */
export const Skeleton = ({ w = '100%', h = 14, r = 8, style }) => <span className="pf-skel" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;

const Card = ({ children, style }) => <div className="pf-card" style={style}>{children}</div>;

/** The shape of a page while it loads: a heading, then cards. Better than the word "Loading". */
export function PageSkeleton({ label = 'Loading', cards = 3 }) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <span className="pf-sr">{label}</span>
      <div style={{ marginBottom: 18 }}><Skeleton w={110} h={11} style={{ marginBottom: 12 }} /><Skeleton w="46%" h={30} r={10} style={{ marginBottom: 10 }} /><Skeleton w="70%" h={13} /></div>
      <div className="pf-grid g-main">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {Array.from({ length: cards }, (_, k) => (
            <Card key={k}><Skeleton w="32%" h={18} style={{ marginBottom: 14 }} /><Skeleton h={12} style={{ marginBottom: 9 }} /><Skeleton w="86%" h={12} style={{ marginBottom: 9 }} /><Skeleton w="58%" h={12} /></Card>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Card><Skeleton w="50%" h={18} style={{ marginBottom: 14 }} /><Skeleton h={12} style={{ marginBottom: 9 }} /><Skeleton w="70%" h={12} /></Card>
          <Card><Skeleton w="40%" h={18} style={{ marginBottom: 14 }} /><Skeleton h={10} r={99} /></Card>
        </div>
      </div>
    </div>
  );
}
