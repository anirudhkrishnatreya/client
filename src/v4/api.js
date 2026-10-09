// Calls to the v4 assessment API (/api/v2). Each returns the axios response ({ data }).
import api from '../api';

export const v2 = {
  register: body => api.post('/v2/auth/register', body),
  completeProfile: body => api.post('/v2/account/complete-profile', body),
  setProfile: body => api.put('/v2/profile', body),
  consent: () => api.get('/v2/consent'),
  resendConsent: () => api.post('/v2/consent/resend'),
  changeGuardian: body => api.put('/v2/consent/guardian', body),
  setSharing: shareWithSchool => api.put('/v2/consent/share', { shareWithSchool }),
  withdraw: () => api.post('/v2/consent/withdraw'),
  guardianLookup: token => api.get(`/v2/consent/guardian/${token}`),
  guardianConfirm: (token, body) => api.post(`/v2/consent/guardian/${token}/confirm`, body),
  guardianDecline: token => api.post(`/v2/consent/guardian/${token}/decline`),
  joinClass: code => api.post('/v2/cohort/join', { code }),
  leaveClass: () => api.post('/v2/cohort/leave'),

  start: () => api.post('/v2/assessment/start'),
  session: () => api.get('/v2/assessment/session'),
  startBlock: id => api.post(`/v2/assessment/block/${id}/start`),
  saveAnswers: (blockId, answers) => api.post('/v2/assessment/answers', { blockId, answers }),
  submitBlock: id => api.post(`/v2/assessment/block/${id}/submit`),
  submit: () => api.post('/v2/assessment/submit'),
  reports: () => api.get('/v2/reports'),
  report: id => api.get(`/v2/report/${id}`),
  pdf: id => api.get(`/v2/reports/${id}/pdf`, { responseType: 'blob' })     // available once the PDF worker exists (status 'ready')
};

/** The machine-readable code of an API error, e.g. 'CONSENT_REQUIRED'. */
export const errorCode = err => (err && err.response && err.response.data && (err.response.data.code || err.response.data.error)) || null;
