import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

/** From the "Stop these reminders" link in a weekly-plan email. No sign-in: the signed link is the proof. */
export default function Unsubscribe() {
  const [sp] = useSearchParams();
  const [state, setState] = useState('working');
  useEffect(() => {
    api.post('/v2/loop/unsubscribe', { u: sp.get('u'), t: sp.get('t') }).then(() => setState('done')).catch(() => setState('bad'));
  }, [sp]);
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#f5f6fa', fontFamily: 'inherit' }}>
      <div role="status" style={{ maxWidth: 440, width: '100%', background: '#fff', border: '1px solid #e6e9f0', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        {state === 'working' && <p>Turning off your reminders…</p>}
        {state === 'done' && <><h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Reminders turned off</h1><p style={{ color: '#667085', margin: '0 0 18px' }}>You will not get weekly-plan emails any more. You can turn them back on any time from My goal.</p><Link to="/platform/student/goal">Open My goal</Link></>}
        {state === 'bad' && <><h1 style={{ fontSize: 22, margin: '0 0 8px' }}>That link did not work</h1><p style={{ color: '#667085', margin: '0 0 18px' }}>Sign in and turn reminders off from My goal instead.</p><Link to="/login">Sign in</Link></>}
      </div>
    </main>
  );
}
