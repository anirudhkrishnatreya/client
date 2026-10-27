import api from '../api';

// The admin console's calls. The admin token is attached by the shared client for any /admin path.
const c = p => `/admin/console${p}`;
export const adminApi = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  me: () => api.get(c('/me')),
  changePassword: (current, next) => api.post(c('/me/password'), { current, next }),
  overview: () => api.get(c('/overview')),
  ai: days => api.get(c('/ai'), { params: { days } }),
  users: params => api.get(c('/users'), { params }),
  user: id => api.get(c(`/users/${id}`)),
  disable: (id, reason) => api.post(c(`/users/${id}/disable`), { reason }),
  enable: id => api.post(c(`/users/${id}/enable`)),
  signOut: id => api.post(c(`/users/${id}/sign-out`)),
  resetPassword: (id, mode) => api.post(c(`/users/${id}/password`), { mode }),
  verifyEmail: id => api.post(c(`/users/${id}/verify-email`)),
  setAi: (id, body) => api.post(c(`/users/${id}/ai`), body),
  deleteUser: id => api.delete(`/admin/user/${id}`),
  mentors: () => api.get('/admin/mentors'),
  assignMentor: (studentId, mentorId) => api.put(`/admin/students/${studentId}/mentor`, { mentorId }),
  payments: () => api.get(c('/payments')),
  createCoupon: body => api.post(c('/coupons'), body),
  pauseCoupon: (id, paused) => api.post(c(`/coupons/${id}/pause`), { paused }),
  grant: (id, product, reason) => api.post(c(`/users/${id}/grant`), { product, reason }),
  revoke: (id, reason) => api.post(c(`/users/${id}/revoke`), { reason }),
  audit: params => api.get(c('/audit'), { params }),
  settings: () => api.get(c('/settings')),
  admins: () => api.get(c('/admins')),
  createAdmin: body => api.post(c('/admins'), body),
  updateAdmin: (id, body) => api.patch(c(`/admins/${id}`), body),
  signOutAdmin: id => api.post(c(`/admins/${id}/sign-out`))
};

export const errOf = e => {
  const d = (e && e.response && e.response.data) || {};
  if (d.details && typeof d.details === 'object') { const v = Object.values(d.details)[0]; if (v) return Array.isArray(v) ? v.join(', ') : String(v); }
  const known = { FORBIDDEN: 'Your admin role cannot do this.', NOT_ON_YOURSELF: 'You cannot change your own role or access here.', LAST_SUPERADMIN: 'There must always be at least one active superadmin.', ADMIN_EXISTS: 'An admin with this email or username already exists.', WRONG_PASSWORD: 'That is not your current password.', ADMIN_LOCKED: 'Too many wrong passwords. Try again in 15 minutes.' };
  return known[d.code] || d.error || 'Something went wrong. Please try again.';
};

export const money = n => (n === null || n === undefined ? '—' : n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
export const num = n => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-IN'));
export const when = d => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
export const day = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const ago = d => {
  if (!d) return 'never';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
};
export const storedAdmin = () => { try { return JSON.parse(localStorage.getItem('im_admin') || 'null'); } catch { return null; } };
export const ROLE = { superadmin: 'Superadmin', admin: 'Admin', viewer: 'Viewer' };
export const can = (admin, what) => {
  const r = admin && admin.role;
  if (what === 'act') return r === 'superadmin' || r === 'admin';
  if (what === 'manage') return r === 'superadmin';
  return Boolean(r);
};
