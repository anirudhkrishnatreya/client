import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

// ── Attach user OR admin token on every request
api.interceptors.request.use(cfg => {
  const userToken  = localStorage.getItem('im_user_token');
  const adminToken = localStorage.getItem('im_admin_token');
  if (userToken  && !cfg.headers.Authorization) cfg.headers.Authorization = `Bearer ${userToken}`;
  else if (adminToken && !cfg.headers.Authorization) cfg.headers.Authorization = `Bearer ${adminToken}`;
  return cfg;
});

// ── Auto-logout on expired token
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('im_user_token');
      localStorage.removeItem('im_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth APIs
export const authRegister = (data)   => api.post('/auth/register', data);
export const authLogin    = (data)   => api.post('/auth/login',    data);
export const authMe       = ()       => api.get('/auth/me');
export const getDashboard = ()       => api.get('/auth/dashboard');

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
export const adminGetStats   = ()       => api.get('/admin/stats');
export const adminDeleteUser = (id)     => api.delete(`/admin/user/${id}`);

export default api;
