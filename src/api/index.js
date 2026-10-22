import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

// withCredentials lets the browser send the httpOnly session cookie when the server runs in cookie mode (COOKIE_AUTH); it is harmless otherwise
const api = axios.create({ baseURL: API_URL, withCredentials: true, headers: { 'Content-Type': 'application/json' } });

// ── Attach the token that matches the route: admin token for /admin/*, user token otherwise
const readCookie = name => (document.cookie.split('; ').find(c => c.startsWith(`${name}=`)) || '').split('=')[1];
api.interceptors.request.use(cfg => {
  // cookie mode: state-changing requests must echo the readable CSRF cookie in a header (double-submit protection)
  if (!/^(get|head|options)$/i.test(cfg.method || 'get')) { const csrf = readCookie('im_csrf'); if (csrf) cfg.headers['X-CSRF-Token'] = csrf; }
  if (cfg.headers.Authorization) return cfg;
  const isAdminRoute = (cfg.url || '').startsWith('/admin');
  const token = localStorage.getItem(isAdminRoute ? 'im_admin_token' : 'im_user_token');
  // 'cookie' is a marker meaning "the session lives in the httpOnly cookie": there is no token to send
  if (token && token !== 'cookie') cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Auto-logout on expired token
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('im_user_token');
      localStorage.removeItem('im_user');
      const redirectUrl = new URL(window.location.href);
      redirectUrl.hash = '/login';
      window.location.replace(redirectUrl.toString());
    }
    return Promise.reject(err);
  }
);

// ── Auth APIs
export const authRegister = (data)   => api.post('/auth/register', data);
export const authLogin    = (data)   => api.post('/auth/login',    data);
export const authMe       = ()       => api.get('/auth/me');
export const authLogout   = ()       => api.post('/auth/logout');
export const getDashboard = ()       => api.get('/auth/dashboard');
export const forgotPassword   = identifier => api.post('/auth/forgot-password', { identifier });
export const checkResetToken  = token       => api.get(`/auth/reset-password/${token}`);
export const resetPassword    = (token, password) => api.post(`/auth/reset-password/${token}`, { password });

// ── Assessment APIs
export const getQuestions        = ()     => api.get('/assessment/questions');
export const saveProgress        = (data) => api.post('/assessment/save-progress', data);
export const resumeProgress      = ()     => api.get('/assessment/resume');
export const submitAssessment    = (data) => api.post('/assessment/submit', data);
export const completeOnboarding  = (data) => api.post('/assessment/complete-onboarding', data);

// ── User report APIs
export const getUserReport    = ()     => api.get('/user/report');
export const getReportById    = (id)   => api.get(`/user/report/${id}`);
export const retakeAssessment = ()     => api.post('/user/retake');

// ── Admin APIs (unchanged)
export const adminLogin      = (data)   => api.post('/admin/login',     data);
export const adminGetUsers   = (params) => api.get('/admin/users',      { params });
export const adminGetUser    = (id)     => api.get(`/admin/user/${id}`);
export const adminSetUserAi  = (id, body) => api.post(`/admin/user/${id}/ai`, body);
export const adminGetStats   = ()       => api.get('/admin/stats');
export const adminLoopMetrics   = (days = 30) => api.get('/admin/loop/metrics', { params: { days } });
export const adminLoopAttention = ()          => api.get('/admin/loop/attention');
export const adminLoopReply     = (id, text)  => api.post(`/admin/loop/feedback/${id}/reply`, { text });
export const adminQualityGet   = ()          => api.get('/admin/loop/quality-pass');
export const adminQualityStart = ()          => api.post('/admin/loop/quality-pass', { confirm: true });
export const adminDeleteUser = (id)     => api.delete(`/admin/user/${id}`);

export default api;
