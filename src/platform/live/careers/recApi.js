// Calls to the career recommendation API (/api/v2). Each returns the axios response ({ data }).
import api from '../../../api';

export const rec = {
  meta: () => api.get('/v2/catalog/meta'),
  browse: params => api.get('/v2/catalog/occupations', { params }),
  occupation: idOrSlug => api.get(`/v2/catalog/occupations/${encodeURIComponent(idOrSlug)}`),
  recommendation: assessmentId => api.get(`/v2/recommendations/${assessmentId}`),
  check: (assessmentId, idOrSlug) => api.get(`/v2/recommendations/${assessmentId}/occupations/${encodeURIComponent(idOrSlug)}`),
  context: () => api.get('/v2/me/context'),
  saveContext: body => api.put('/v2/me/context', body),
  shortlist: () => api.get('/v2/me/shortlist'),
  save: (occupationId, note) => api.post('/v2/me/shortlist', { occupationId, ...(note ? { note } : {}) }),
  update: (occupationId, body) => api.patch(`/v2/me/shortlist/${encodeURIComponent(occupationId)}`, body),
  remove: occupationId => api.delete(`/v2/me/shortlist/${encodeURIComponent(occupationId)}`)
};

export const codeOf = err => (err && err.response && err.response.data && (err.response.data.code || err.response.data.error)) || null;
/** What a student reads when a call fails. V5_DISABLED means the server has not switched this feature on yet. */
export const messageFor = err => {
  const c = codeOf(err);
  if (c === 'V5_DISABLED') return 'Career suggestions are not open yet. They are coming soon.';
  if (c === 'SHORTLIST_FULL') return 'Your shortlist has 10 careers already. Drop one to add another.';
  if (c === 'JUNIOR_EXPLORE_ONLY') return 'For your age we suggest areas to explore rather than specific careers. You can still browse any career below.';
  if (c === 'WITHHELD') return 'Your last attempt may not show your real strengths, so we have not suggested careers. Retaking the test when rested is recommended.';
  if (c === 'NO_INTERESTS') return 'We need your interest results to suggest careers. Finish the career assessment first.';
  return 'Something went wrong. Please try again.';
};
