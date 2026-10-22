import { useState } from 'react';
import { Card, Icon } from '../../ui/kit';
import { loopApi, messageFor } from './loopApi';
import { Working } from './Loader';

const NEXT_STEPS = ['Looking at how your week went…', 'Adjusting the plan to your pace…', 'The Week Planner is writing next week…', 'A Week Critic is checking it…', 'Scouts are finding videos and practice…'];
/** After the assessment: review the week and plan the next, with a loader while it works. */
export function NextWeek({ next, act, off }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (busy) return <Card ai><Working title="Planning your next week" steps={NEXT_STEPS} /></Card>;
  return (
    <Card ai>
      <span className="tag"><Icon name="sparkles" size={14} />Ready for the next week</span>
      <p style={{ margin: '8px 0 10px' }}>{next.assessed ? 'Your assessment is done. Your plan will now adapt to how this week went: faster, steadier, or with some revision.' : 'This week has ended. AI help is switched off right now, so your next week is planned simply from your topics.'}</p>
      <button type="button" className="pf-btn" disabled={off} onClick={async () => { setBusy(true); setErr(''); try { await act(() => loopApi.planNext()); } catch (e) { setErr(messageFor(e)); setBusy(false); } }}>Plan my next week</button>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', marginTop: 8 }}>{err}</p>}
    </Card>
  );
}

