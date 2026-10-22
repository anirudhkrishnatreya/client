// Calls to the learning-loop API (/api/v2). Each returns the axios response ({ data }); the server always answers with the
// student's whole loop state, so every change just replaces what is on screen.
import { useCallback, useEffect, useState } from 'react';
import api from '../../../api';

const unit = id => `/v2/me/loop/units/${encodeURIComponent(id)}`;
export const loopApi = {
  state: () => api.get('/v2/me/loop'),
  chat: text => api.post('/v2/me/loop/chat', { text }),
  confirm: () => api.post('/v2/me/loop/chat/confirm'),
  newGoal: () => api.post('/v2/me/loop/new-goal'),
  cancelNewGoal: () => api.post('/v2/me/loop/new-goal/cancel'),
  setSchedule: body => api.put('/v2/me/loop/schedule', body),
  replan: () => api.post('/v2/me/loop/week/replan'),
  done: (id, body = {}) => api.post(`${unit(id)}/done`, body),
  skip: (id, skipReason) => api.post(`${unit(id)}/skip`, { skipReason }),
  undo: id => api.delete(unit(id)),
  openCheck: () => api.post('/v2/me/loop/check'),
  submitCheck: answers => api.post('/v2/me/loop/check/answers', { answers })
};

export const codeOf = err => (err && err.response && err.response.data && (err.response.data.code || err.response.data.error)) || null;
export const detailsOf = err => (err && err.response && err.response.data && err.response.data.details) || {};
export function messageFor(err) {
  const c = codeOf(err);
  if (c === 'LOOP_DISABLED') return 'Goals and weekly plans are not open yet. They are coming soon.';
  if (c === 'AI_OFF') return 'The guide is switched off right now. Please try again later.';
  if (c === 'AI_BUSY') return 'The guide has done a lot today and is resting. Please try again tomorrow.';
  if (c === 'AI_UNAVAILABLE') return 'The guide could not answer just now. Your message is safe: please send it again.';
  if (c === 'VALIDATION_FAILED') return Object.values(detailsOf(err))[0] || 'Please check what you entered.';
  if (c === 'CHECK_NOT_READY') return 'Finish a couple of this week’s steps first, then take the check.';
  if (c === 'RATE_LIMITED') return (err.response.data && err.response.data.error) || 'Too many at once. Please wait a moment.';
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
export const TOPIC = { new: ['Not started', 'grey'], covered: ['Covered', ''], weak: ['Needs another look', 'coral'], mastered: ['Mastered', 'leaf'] };
export const PACE = { ahead: ['Ahead of plan', 'leaf'], 'on-track': ['On track', 'leaf'], behind: ['A little behind', 'gold'], finished: ['Plan complete', 'leaf'] };
export const fmtMinutes = m => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
export const fmtDay = iso => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
