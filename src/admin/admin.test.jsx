import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const calls = [];
let routes = {};
vi.mock('../api', () => {
  const handle = method => (url, body, cfg) => {
    calls.push({ method, url, body: method === 'get' ? undefined : body, params: method === 'get' ? (body && body.params) : undefined });
    const key = `${method} ${url}`;
    if (!(key in routes)) return Promise.reject(Object.assign(new Error(`no route ${key}`), { response: { status: 404, data: { code: 'NOT_FOUND' } } }));
    const out = typeof routes[key] === 'function' ? routes[key](body) : routes[key];
    return Promise.resolve(out).then(v => (v instanceof Error ? Promise.reject(v) : { data: v }));
  };
  const api = { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') };
  return { default: api, API_URL: '/api', adminLoopMetrics: () => api.get('/admin/loop/metrics'), adminLoopAttention: () => api.get('/admin/loop/attention'), adminLoopReply: (id, text) => api.post(`/admin/loop/feedback/${id}/reply`, { text }), adminQualityGet: () => api.get('/admin/loop/quality-pass'), adminQualityStart: () => api.post('/admin/loop/quality-pass', { confirm: true }) };
});
import AdminSignIn from './AdminSignIn';
import AdminShell from './AdminShell';
import Overview from './Overview';
import Users from './Users';
import UserDetail from './UserDetail';
import Admins from './Admins';
import Payments from './Payments';
import Settings from './Settings';

const fail = (status, data) => Object.assign(new Error('x'), { response: { status, data } });
const at = path => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/admin/login" element={<AdminSignIn />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="admins" element={<Admins />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  </MemoryRouter>
);
const meAs = role => { routes['get /admin/console/me'] = { admin: { id: 'a1', username: 'anirudh', email: 'a@imenteo.com', role } }; localStorage.setItem('im_admin_token', 'T'); localStorage.setItem('im_admin', JSON.stringify({ role })); };

const totals = (usd, calls, extra = {}) => ({ usd, calls, inputTokens: calls * 1000, outputTokens: calls * 200, errors: 0, ...extra });
const OVERVIEW = {
  users: { total: 120, byRole: { student: 100, mentor: 5, parent: 15 }, new7: 12, new30: 40, activeToday: 9, active7: 50, active30: 90, disabled: 2, unverified: 3, pendingConsent: 4, signups: Array.from({ length: 14 }, (_, k) => ({ day: `2026-10-${String(10 + k).padStart(2, '0')}`, count: k % 3 })) },
  ai: { enabled: true, caps: { dailyUsd: 0.5, monthlyUsd: 4, studentDailyCalls: 40 }, today: totals(0.41, 120, { errors: 2 }), month: totals(2.1, 900), allTime: totals(2.6, 1100), daily30: Array.from({ length: 30 }, (_, k) => ({ day: `d${k}`, usd: k / 100, calls: k, tokens: k * 100 })),
    byTask: [{ key: 'week.draft', ...totals(0.8, 300) }], byModel: [], topStudents: [{ id: 'u1', name: 'Asha Verma', email: 'asha@example.com', ...totals(0.3, 80) }] },
  youtube: { configured: true, unitsToday: 4200, dailyUnits: 9000 },
  loop: { activeGoals: 30, chats7: 10, weeks7: 25, assessed7: 18, practice7: 40, openFeedback: 1, portfolioItems: 6 },
  audit: [{ id: 'e1', at: '2026-10-23T10:00:00Z', admin: 'a@imenteo.com', action: 'user.disable', target: { type: 'user', id: 'u9', label: 'Ravi <r@example.com>' }, details: { reason: 'shared account' } }]
};
const PROFILE = { id: 'u1', name: 'Asha Verma', username: 'asha', email: 'asha@example.com', phone: null, role: 'student', track: 'senior', grade: '10', status: 'active', isVerified: true, createdAt: '2026-10-01', lastLoginAt: '2026-10-23', access: { disabled: false, disabledAt: null, reason: '' }, sessionsValidFrom: null, consent: { required: true, status: 'granted', termsVersion: '2026-10-v2', guardian: { name: 'Meera', email: 'meera@example.com', verified: true }, shareWithSchool: false }, mentor: null, settings: { loopEmails: true, portfolioPublic: false, ownAiLimit: null } };
const DETAIL = { profile: PROFILE, ai: { allowance: { limit: 40, used: 12, left: 28, unlimited: false, resetsAt: '2026-10-24T00:00:00Z', paused: false }, today: totals(0.01, 12), month: totals(0.2, 150), allTime: totals(0.31, 210, { errors: 1 }), byTask: [{ task: 'week.draft', ...totals(0.1, 40) }], daily30: [], recent: [{ at: '2026-10-23T09:00:00Z', task: 'submission.judge', model: 'gpt-4o-mini', inputTokens: 1400, outputTokens: 300, usd: 0.0004, ok: true, code: null, ms: 2300 }] }, loop: { goals: 1, summary: null, practiceSets: 0, portfolio: 0, weeks: [], nudges: [] }, assessments: [], audit: [] };

beforeEach(() => { calls.length = 0; routes = {}; localStorage.clear(); });

describe('admin sign-in', () => {
  it('says how many tries are left, explains a lock, and signs in to the overview', async () => {
    const user = userEvent.setup();
    routes['post /admin/login'] = fail(401, { error: 'Invalid credentials', attemptsLeft: 3 });
    at('/admin/login');
    await user.type(screen.getByLabelText('Email'), 'a@imenteo.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password. 3 tries left before a 15-minute lock.');
    routes['post /admin/login'] = fail(423, { code: 'ADMIN_LOCKED' });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('locked for 15 minutes');
    routes['post /admin/login'] = { token: 'TOKEN', admin: { username: 'anirudh', role: 'superadmin' } };
    meAs('superadmin'); routes['get /admin/console/overview'] = OVERVIEW;
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Active today')).toBeInTheDocument();
    expect(localStorage.getItem('im_admin_token')).toBe('TOKEN');
  });
});

describe('the overview', () => {
  it('shows people, AI spend against the caps, tokens, the quota, the loop and recent admin actions', async () => {
    meAs('superadmin'); routes['get /admin/console/overview'] = OVERVIEW;
    at('/admin');
    expect(await screen.findByText('$0.41')).toBeInTheDocument();
    expect(screen.getByText(/of \$0\.50 daily cap · 120 calls/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: "Today's AI spend against the daily cap" })).toHaveAttribute('aria-valuenow', '82');
    expect(screen.getByText('1,44,000')).toBeInTheDocument();                                   // tokens today, Indian grouping
    expect(screen.getByRole('link', { name: 'Asha Verma' })).toHaveAttribute('href', '/admin/users/u1');
    expect(screen.getByText('Paused an account')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/admin/users?status=disabled');
  });
  it('a viewer’s menu has no Admins or Schools', async () => {
    meAs('viewer'); routes['get /admin/console/overview'] = OVERVIEW;
    at('/admin');
    await screen.findByText('Active today');
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Accounts')).toBeInTheDocument();
    expect(within(nav).queryByText('Admins')).toBeNull();
    expect(within(nav).queryByText('Schools')).toBeNull();
  });
});

describe('accounts', () => {
  it('lists accounts with their AI spend, and filters and sorts through the address', async () => {
    meAs('admin');
    routes['get /admin/console/users'] = { page: 1, limit: 25, total: 1, pages: 1, users: [{ id: 'u1', name: 'Asha Verma', email: 'asha@example.com', role: 'student', grade: '10', status: 'disabled', createdAt: '2026-10-01', lastLoginAt: null, ai: { usd30: 0.31, calls30: 210, tokens30: 252000, callsToday: 12, ownLimit: -1 }, goal: { title: 'Architect', level: 2, levels: 5 } }] };
    const user = userEvent.setup();
    at('/admin/users');
    expect(await screen.findByText('Asha Verma')).toBeInTheDocument();
    const row = screen.getByText('Asha Verma').closest('tr');
    expect(within(row).getByText('Paused')).toBeInTheDocument();
    expect(within(row).getByText('$0.31')).toBeInTheDocument();
    expect(screen.getByText('no limit')).toBeInTheDocument();
    expect(screen.getByText('Architect · L2/5')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Sort'), 'aiSpend');
    await waitFor(() => expect(calls.filter(c => c.url === '/admin/console/users').pop().params).toMatchObject({ sort: 'aiSpend', page: 1 }));
  });
  it('pausing needs a reason; a temporary password is shown once; deleting needs DELETE typed', async () => {
    meAs('superadmin');
    routes['get /admin/console/users/u1'] = DETAIL;
    routes['post /admin/console/users/u1/disable'] = { success: true };
    routes['post /admin/console/users/u1/password'] = ({ mode }) => (mode === 'temporary' ? { success: true, temporaryPassword: 'Tmp4Pass9word' } : { success: true, sentTo: 'asha@example.com' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    at('/admin/users/u1');
    await user.click(await screen.findByRole('button', { name: 'Pause account' }));
    const pause = screen.getAllByRole('button', { name: 'Pause account' }).pop();
    expect(pause).toBeDisabled();
    await user.type(screen.getByLabelText(/Why\?/), 'Shared with a friend');
    await user.click(pause);
    await waitFor(() => expect(calls.find(c => c.url === '/admin/console/users/u1/disable').body).toEqual({ reason: 'Shared with a friend' }));
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    await user.click(screen.getByRole('button', { name: 'Email them a reset link' }));
    expect(await screen.findByText('A reset link was emailed to asha@example.com.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    await user.click(screen.getByRole('button', { name: 'Set a temporary password' }));
    expect(await screen.findByText('Tmp4Pass9word')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('Tmp4Pass9word')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    const del = screen.getByRole('button', { name: 'Delete permanently' });
    expect(del).toBeDisabled();
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(del).toBeEnabled();
  });
  it('the AI tab shows spend, tokens and each recent call; a viewer sees no actions', async () => {
    meAs('viewer');
    routes['get /admin/console/users/u1'] = DETAIL;
    const user = userEvent.setup();
    at('/admin/users/u1');
    expect(await screen.findByText('Your role can look but not change accounts.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause account' })).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'AI usage' }));
    expect(screen.getByText('submission.judge')).toBeInTheDocument();
    expect(screen.getByText('1,400')).toBeInTheDocument();
    expect(screen.getByText(/210 calls · 2,10,000 in · 42,000 out/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset today’s limit' })).toBeNull();
  });
});

describe('payments', () => {
  const OV = {
    setup: { razorpay: true, webhook: false, gatingOn: false, gst: false }, offerEndsAt: '2027-01-31T18:29:59.000Z',
    revenue: { today: { paise: 279800, orders: 2 }, month: { paise: 1099700, orders: 6 }, all: { paise: 1099700, orders: 6 } }, failed24: 1, pending: 2, plansActive: { 'plan-1m': 3, 'plan-6m': 1 },
    orders: [{ id: 'o1', userId: 'u1', name: 'Asha Verma', email: 'asha@example.com', productId: 'plan-1m', amount: 139900, status: 'paid', source: 'checkout', couponCode: 'LAUNCH25', receiptNo: 'IM-2026-000001', at: '2026-10-23T10:00:00Z', paidAt: '2026-10-23T10:01:00Z' }],
    coupons: [{ id: 'c1', code: 'GREENFIELD20', label: 'Greenfield pilot', type: 'seat', value: 0, products: [], grantProduct: 'plan-3m', uses: 7, maxUses: 20, validTo: null, paused: false }]
  };
  it('shows revenue and plans, what is not ready to go live, orders, and the school codes; a code can be created and paused', async () => {
    meAs('superadmin');
    routes['get /admin/console/payments'] = OV;
    routes['post /admin/console/coupons'] = { coupon: { id: 'c2', code: 'SCHOOL-TWO' } };
    routes['post /admin/console/coupons/c1/pause'] = { success: true };
    const user = userEvent.setup();
    at('/admin/payments');
    expect(await screen.findByText('₹2,798')).toBeInTheDocument();
    expect(screen.getByText('3 × Plan, 1 month · 1 × Plan, 6 months')).toBeInTheDocument();
    const setup = screen.getByText('Webhook secret set').closest('li');
    expect(within(setup).getByText('Not yet')).toBeInTheDocument();
    expect(within(screen.getByText('Razorpay keys set').closest('li')).getByText('On')).toBeInTheDocument();
    expect(screen.getByText('Unlocks Plan, 3 months')).toBeInTheDocument();
    expect(screen.getByText('7 of 20')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Asha Verma' })).toHaveAttribute('href', '/admin/users/u1');
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(calls.find(c => c.url === '/admin/console/coupons/c1/pause').body).toEqual({ paused: true }));
    await user.type(screen.getByLabelText('Code'), 'school-two');
    await user.click(screen.getByRole('button', { name: 'Create code' }));
    await waitFor(() => expect(calls.find(c => c.url === '/admin/console/coupons').body).toMatchObject({ code: 'school-two', type: 'seat', grantProduct: 'plan-3m', maxUses: 20 }));
  });
  it('a viewer sees the numbers but no way to create or pause codes', async () => {
    meAs('viewer');
    routes['get /admin/console/payments'] = OV;
    at('/admin/payments');
    await screen.findByText('Recent orders');
    expect(screen.queryByRole('button', { name: 'Create code' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
  });
});

describe('admins and your password', () => {
  it('adding an admin shows their temporary password once; a role change is saved', async () => {
    meAs('superadmin');
    routes['get /admin/console/admins'] = { admins: [{ id: 'a2', username: 'neha', email: 'neha@imenteo.com', role: 'viewer', isActive: true, lastLogin: null, locked: false, createdBy: 'a@imenteo.com' }] };
    routes['post /admin/console/admins'] = { admin: { id: 'a3', email: 'ravi@imenteo.com' }, temporaryPassword: 'Xy7TempPassWord1' };
    routes['patch /admin/console/admins/a2'] = { admin: {} };
    const user = userEvent.setup();
    at('/admin/admins');
    await user.selectOptions(await screen.findByLabelText('Role of neha@imenteo.com'), 'admin');
    await waitFor(() => expect(calls.find(c => c.method === 'patch').body).toEqual({ role: 'admin' }));
    await user.type(screen.getByLabelText('Email'), 'ravi@imenteo.com');
    await user.type(screen.getByLabelText('Username'), 'ravi');
    await user.click(screen.getByRole('button', { name: 'Add admin' }));
    expect(await screen.findByText('Xy7TempPassWord1')).toBeInTheDocument();
    expect(calls.find(c => c.method === 'post' && c.url === '/admin/console/admins').body).toEqual({ email: 'ravi@imenteo.com', username: 'ravi', role: 'viewer', password: undefined });
  });
  it('changing your password checks the two match, then keeps you signed in with the new session', async () => {
    meAs('viewer');
    routes['get /admin/console/settings'] = { switches: { LLM_ENABLED: true, LEARNING_LOOP: true, LOOP_NUDGES: false, PARENT_DIGEST: false, PDF_REPORTS: false, REC_ENGINE: 'v5' }, ai: { caps: { dailyUsd: 0.5, monthlyUsd: 4, studentDailyCalls: 40 }, alertEmail: false, providers: { openai: true, anthropic: false }, models: { openai: { small: 'gpt-4o-mini', large: 'gpt-4.1-mini' } } }, services: { email: true, mailFrom: 'iMenteo', youtube: true, youtubeDailyUnits: 9000 }, runtime: { node: 'v20', uptimeSeconds: 7200, commit: 'abc1234', adminSessionHours: '12h' } };
    routes['post /admin/console/me/password'] = { token: 'NEW' };
    const user = userEvent.setup();
    at('/admin/settings');
    expect(await screen.findByText('gpt-4o-mini · gpt-4.1-mini')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Current password'), 'OldPassword123');
    await user.type(screen.getByLabelText('New password'), 'NewPassword1234');
    await user.type(screen.getByLabelText('New password again'), 'Different12345');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('The two new passwords do not match.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('New password again'));
    await user.type(screen.getByLabelText('New password again'), 'NewPassword1234');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText(/Password changed/)).toBeInTheDocument();
    expect(localStorage.getItem('im_admin_token')).toBe('NEW');
  });
});
