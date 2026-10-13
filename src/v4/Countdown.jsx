import { useEffect, useRef, useState } from 'react';
import { formatRemaining } from './clock';

// Shows the time left in a timed block, counted against the SERVER's deadline. Calls onExpire exactly once.
// Screen readers are told at 5 minutes, 1 minute and 10 seconds (not every second, which would be unusable).
const ANNOUNCE_AT = [300, 60, 10];

export default function Countdown({ deadline, clock, onExpire }) {
  const [left, setLeft] = useState(() => clock.remainingMs(deadline));
  const expired = useRef(false);
  const announced = useRef(new Set());
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    expired.current = false;
    // a mark that has already passed when the block opens (e.g. 5 minutes, for a 90-second block) is never announced
    const startSecs = Math.ceil(clock.remainingMs(deadline) / 1000);
    announced.current = new Set(ANNOUNCE_AT.filter(m => startSecs <= m));
    const tick = () => {
      const ms = clock.remainingMs(deadline);
      setLeft(ms);
      const secs = Math.ceil(ms / 1000);
      for (const mark of ANNOUNCE_AT) if (secs <= mark && !announced.current.has(mark) && ms > 0) { announced.current.add(mark); setAnnouncement(`${formatRemaining(ms)} left`); }
      if (ms <= 0 && !expired.current) { expired.current = true; onExpire && onExpire(); }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, clock, onExpire]);

  if (deadline == null) return null;
  return (
    <>
      <span className={`v4-timer${left <= 60000 ? ' low' : ''}`} aria-hidden="true">⏱ {formatRemaining(left)}</span>
      <span className="sr-only" role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{announcement}</span>
    </>
  );
}
