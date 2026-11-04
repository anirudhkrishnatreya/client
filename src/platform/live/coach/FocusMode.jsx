import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../ui/kit';
import { coachApi, errMessage } from '../liveApi';

const mmss = s => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

/**
 * Focus mode: the student works on one step or task with a calm timer. `session` is the running focus session (from the
 * server); at the end they say if they finished (a finished step or task is marked done) and how well they got it.
 */
export default function FocusMode({ session, onClose }) {
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(0);              // ms spent paused
  const [pauseAt, setPauseAt] = useState(null);
  const [ending, setEnding] = useState(false);
  const [understood, setUnderstood] = useState(null);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const chimed = useRef(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const elapsed = Math.floor(((pauseAt || now) - Date.parse(session.startedAt) - paused) / 1000);
  const total = session.plannedMin * 60;
  const left = total - elapsed;
  useEffect(() => { if (left <= 0 && !chimed.current) { chimed.current = true; setEnding(true); } }, [left]);
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const toggle = () => { if (pauseAt) { setPaused(p => p + (Date.now() - pauseAt)); setPauseAt(null); } else setPauseAt(Date.now()); };
  const finish = async outcome => {
    setErr('');
    try { setResult({ ...(await coachApi.focusFinish(session.id, { outcome, understood })), outcome }); }
    catch (x) { setErr(errMessage(x)); }
  };
  const r = 120, c = 2 * Math.PI * r;
  return (
    <div className="pf-focus" role="dialog" aria-modal="true" aria-label={`Focus: ${session.title}`}>
      <div className="pf-focus-in">
        <div className="pf-eyebrow" style={{ color: '#AFC2FF' }}>Focus mode</div>
        <h2>{session.title}</h2>
        {!result && <>
          <div className="pf-focus-ring">
            <svg width="280" height="280" viewBox="0 0 280 280" aria-hidden="true">
              <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
              <circle cx="140" cy="140" r={r} fill="none" stroke="#FFC56B" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 140 140)" />
            </svg>
            <div className="pf-focus-time" role="timer" aria-live="off">{left > 0 ? mmss(left) : `+${mmss(-left)}`}<small>{pauseAt ? 'Paused' : left > 0 ? 'left' : 'over time'}</small></div>
          </div>
          {!ending ? <div className="pf-row" style={{ gap: 10, justifyContent: 'center' }}>
            <button type="button" className="pf-btn ghost light" onClick={toggle}>{pauseAt ? 'Resume' : 'Pause'}</button>
            <button type="button" className="pf-btn gold" onClick={() => setEnding(true)}>I’m done</button>
          </div> : <div className="pf-focus-end">
            <p>{left <= 0 ? 'Time! ' : ''}Did you finish it?</p>
            <p className="pf-small" style={{ opacity: .8, margin: '0 0 6px' }}>How well did you get it?</p>
            <div className="pf-row" style={{ gap: 6, justifyContent: 'center' }} role="radiogroup" aria-label="How well">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={understood === n} className={`pf-choice light${understood === n ? ' on' : ''}`} onClick={() => setUnderstood(n)}>{n}</button>)}</div>
            <div className="pf-row pf-wrap" style={{ gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <button type="button" className="pf-btn gold" onClick={() => finish('done')}><Icon name="check" size={16} />Yes, finished</button>
              <button type="button" className="pf-btn ghost light" onClick={() => finish('partial')}>Partly</button>
              <button type="button" className="pf-btn ghost light" onClick={() => finish('stopped')}>Not this time</button>
            </div>
          </div>}
          {err && <p className="pf-small" role="alert" style={{ color: '#FFB4A2' }}>{err}</p>}
        </>}
        {result && <div className="pf-focus-end" role="status">
          <p style={{ fontSize: 22, margin: '10px 0' }}>{result.outcome === 'done' ? '🎉 Nicely done.' : 'Every minute counts.'}</p>
          <p>{result.session.minutes} minute{result.session.minutes === 1 ? '' : 's'} of focus{result.marked ? `, and it’s marked done in your plan.` : '.'}</p>
          <button type="button" className="pf-btn gold" onClick={() => onClose(true)}>Back to my day</button>
        </div>}
        {!result && <button type="button" className="pf-focus-x" aria-label="Leave focus mode (the timer keeps running)" onClick={() => onClose(false)}><Icon name="x" size={18} /></button>}
      </div>
    </div>
  );
}
