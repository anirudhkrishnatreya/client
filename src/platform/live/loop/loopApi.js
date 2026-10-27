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
  submitQuiz: answers => api.post('/v2/me/loop/check/answers', { answers }),
  submitWork: (text, link, photos = []) => api.post('/v2/me/loop/check/work', { text, ...(link ? { link } : {}), ...(photos.length ? { photos } : {}) }),
  portfolio: () => api.get('/v2/me/loop/portfolio'),
  addToPortfolio: checkId => api.post('/v2/me/loop/portfolio', { checkId }),
  removeFromPortfolio: id => api.delete(`/v2/me/loop/portfolio/${id}`),
  sharePortfolio: on => api.put('/v2/me/loop/portfolio/share', { public: on }),
  planNext: () => api.post('/v2/me/loop/next-week'),
  anotherVideo: id => api.post(`${unit(id)}/video/another`),
  makePractice: id => api.post(`${unit(id)}/practice`),
  feedback: (target, refId, fair, note = '') => api.post('/v2/me/loop/feedback', { target, refId, fair, note }),
  setEmails: on => api.put('/v2/me/loop/emails', { on })
};

export const codeOf = err => (err && err.response && err.response.data && (err.response.data.code || err.response.data.error)) || null;
export const detailsOf = err => (err && err.response && err.response.data && err.response.data.details) || {};
export function messageFor(err) {
  const c = codeOf(err);
  if (c === 'LOOP_DISABLED') return 'Goals and weekly plans are not open yet. They are coming soon.';
  if (c === 'AI_OFF') return 'The guide is switched off right now. Please try again later.';
  if (c === 'AI_DAILY_LIMIT') { const d = detailsOf(err); const at = d.resetsAt ? new Date(d.resetsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase() : 'tomorrow morning'; return `This needs a bit more of today’s AI than you have left. It comes back at ${at}.`; }
  if (c === 'PHOTO_NOT_ALLOWED') return detailsOf(err).photos || 'This photo cannot be used. Please photograph only your work.';
  if (c === 'NOT_EARNED') return 'Only work judged “Strong” or “Getting there”, or a passed level-up, can go in your portfolio.';
  if (c === 'PORTFOLIO_SHARE_MINOR') return 'Sharing a public link is not available for students under 18 yet.';
  if (c === 'PLAN_ENDED') return 'Your plan has ended, so this is read-only now. Renew your plan to keep planning.';
  if (c === 'PAYMENT_REQUIRED') return 'This is part of an iMenteo Plan. See My plan to get started.';
  if (c === 'AI_BUSY') return 'The guide has done a lot today and is resting. Please try again tomorrow.';
  if (c === 'AI_UNAVAILABLE') return 'The guide could not answer just now. Your message is safe: please send it again.';
  if (c === 'VALIDATION_FAILED') return Object.values(detailsOf(err))[0] || 'Please check what you entered.';
  if (c === 'CHECK_NOT_READY') return 'Finish a couple of this week’s steps first, then take the check.';
  if (c === 'RATE_LIMITED') return (err.response.data && err.response.data.error) || 'Too many at once. Please wait a moment.';
  return 'Something went wrong. Please try again.';
}

/** The student's loop state, plus `act(fn)`: run a change and take the fresh state the server sends back. */
export function useLoop() {
  const [s, setS] = useState({ loop: null, loading: true, closed: false, error: null, locked: null });
  const load = useCallback(() => loopApi.state()
    .then(({ data }) => setS({ loop: data.loop, loading: false, closed: false, error: null, locked: null }))
    // a plan that is needed (or has ended) is not an error: the page shows a calm "this is part of a plan" card
    .catch(e => setS({ loop: null, loading: false, closed: codeOf(e) === 'LOOP_DISABLED', error: e, locked: ['PAYMENT_REQUIRED', 'PLAN_ENDED'].includes(codeOf(e)) ? { product: e.response.data.product, state: e.response.data.state, endsAt: e.response.data.endsAt } : null })), []);
  useEffect(() => { load(); }, [load]);
  const act = useCallback(async fn => { const { data } = await fn(); setS(x => ({ ...x, loop: data.loop })); return data.loop; }, []);
  return { ...s, act, reload: load };
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TYPE_LABEL = { learn: 'Learn', practise: 'Practise', make: 'Make', check: 'Check' };
export const TYPE_TONE = { learn: '', practise: 'gold', make: 'leaf', check: 'grey' };
export const TOPIC = { new: ['Not started', 'grey'], covered: ['Covered', ''], weak: ['Needs another look', 'coral'], mastered: ['Mastered', 'leaf'] };
export const BAND = { strong: ['Strong', 'leaf'], 'getting-there': ['Getting there', 'gold'], 'not-yet': ['Not yet', 'coral'] };
export const PACE = { ahead: ['Ahead of plan', 'leaf'], 'on-track': ['On track', 'leaf'], behind: ['A little behind', 'gold'], finished: ['Plan complete', 'leaf'] };
export const fmtMinutes = m => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
export const fmtDay = iso => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShort = iso => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const weekdayOf = iso => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
export const pct = v => `${Math.round(v * 100)}%`;
