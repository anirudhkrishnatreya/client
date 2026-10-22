// Calls to the learning-loop API (/api/v2). Each returns the axios response ({ data }).
import { useCallback, useEffect, useState } from 'react';
import api from '../../../api';

export const loopApi = {
  careers: () => api.get('/v2/loop/careers'),
  roadmap: slug => api.get(`/v2/loop/careers/${encodeURIComponent(slug)}`),
  state: () => api.get('/v2/me/loop'),
  setGoal: body => api.put('/v2/me/loop/goal', body),
  setSchedule: body => api.put('/v2/me/loop/schedule', body),
  replan: () => api.post('/v2/me/loop/week/replan'),
  done: (unitId, body = {}) => api.post(`/v2/me/loop/units/${encodeURIComponent(unitId)}/done`, body),
  skip: (unitId, skipReason) => api.post(`/v2/me/loop/units/${encodeURIComponent(unitId)}/skip`, { skipReason }),
  undo: unitId => api.delete(`/v2/me/loop/units/${encodeURIComponent(unitId)}`)
};

export const codeOf = err => (err && err.response && err.response.data && (err.response.data.code || err.response.data.error)) || null;
export const detailsOf = err => (err && err.response && err.response.data && err.response.data.details) || {};
export function messageFor(err) {
  const c = codeOf(err);
  if (c === 'LOOP_DISABLED') return 'Weekly plans are not open yet. They are coming soon.';
  if (c === 'VALIDATION_FAILED') return Object.values(detailsOf(err))[0] || 'Please check what you entered.';
  if (c === 'NO_GOAL') return 'Set your goal first.';
  if (c === 'RATE_LIMITED') return 'Too many changes at once. Please wait a moment.';
  return 'Something went wrong. Please try again.';
}

/** The student's loop state, plus `act(fn)`: run a change and take the fresh state the server sends back. */
export function useLoop() {
  const [s, setS] = useState({ loop: null, loading: true, closed: false, error: null });
  const load = useCallback(() => loopApi.state()
    .then(({ data }) => setS({ loop: data.loop, loading: false, closed: false, error: null }))
    .catch(e => setS({ loop: null, loading: false, closed: codeOf(e) === 'LOOP_DISABLED', error: e })), []);
  useEffect(() => { load(); }, [load]);
  const act = useCallback(async fn => { const { data } = await fn(); setS(x => ({ ...x, loop: data.loop })); return data.loop; }, []);
  return { ...s, act, reload: load };
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TYPE_LABEL = { learn: 'Learn', practise: 'Practise', make: 'Make', check: 'Check' };
export const TYPE_TONE = { learn: '', practise: 'gold', make: 'leaf', check: 'grey' };
export const fmtMinutes = m => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
export const fmtDay = iso => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const VERDICT = {
  fits: { tone: 'leaf', text: 'Your goal fits your time.' },
  tight: { tone: 'gold', text: 'Your goal fits, but only just. A little more time each week, or a later date, would make it comfortable.' },
  'no-fit': { tone: 'coral', text: 'Your goal does not fit your time yet. Add free time, choose a later date, or aim for an earlier stage first.' },
  'no-time': { tone: 'coral', text: 'You have no free time in your schedule yet, so nothing can be planned.' }
};
