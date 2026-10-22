import { Icon } from '../../ui/kit';

/** "5:30 am": when today's AI comes back, in the student's own time. */
export const resetTime = iso => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).replace(/\s?(AM|PM)$/i, m => ` ${m.trim().toLowerCase()}`);

/** True when no AI action can start right now: today's share is used up, or AI is paused for everyone. */
export const aiOut = ai => Boolean(ai && !ai.unlimited && (ai.left === 0 || ai.paused));

/**
 * How much of today's AI the student has used, like the usage meter in AI chat apps. Hidden for accounts with no limit.
 * Blue while there is plenty, amber from three quarters, red when it is used up; always says when it comes back.
 */
export function AiMeter({ ai }) {
  if (!ai || ai.unlimited) return null;
  const pct = ai.paused ? 100 : ai.limit ? Math.min(100, Math.round((ai.used / ai.limit) * 100)) : 100;
  const out = aiOut(ai);
  const at = resetTime(ai.resetsAt);
  const label = ai.paused ? `AI is resting until ${at}` : out ? `Today’s AI is used up · back at ${at}` : `${pct}% of today’s AI used`;
  const hint = `Resets at ${at}. Planning a week uses the most; a chat message or a check uses a little. Everything you have already planned keeps working.`;
  return (
    <div className={`pf-aimeter${out ? ' out' : pct >= 75 ? ' low' : ''}`} role="meter" aria-label="Today’s AI use" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={label} title={hint}>
      <Icon name="sparkles" size={14} />
      <span className="pf-aimeter-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
      <span className="pf-aimeter-text">{label}</span>
    </div>
  );
}

/** Shown on the page when AI is used up: what still works, and when the rest comes back. */
export function AiOutNote({ ai }) {
  if (!aiOut(ai)) return null;
  return (
    <div className="pf-note" role="status" style={{ marginBottom: 12 }}>
      <b>{ai.paused ? 'AI is resting for a while.' : 'You have used today’s AI.'}</b> Your plan still works: watch, practise and mark steps done as usual. Planning, practice questions and feedback come back at {resetTime(ai.resetsAt)}.
    </div>
  );
}
