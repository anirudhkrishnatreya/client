import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Coach HQ: the coach's word and today's game plan, the morning check-in and its proposed moves, the one-tap fix for missed
// steps, the command bar handing a request to the coach, change cards with Undo, focus mode, progress, and settings.
const calls = [];
let routes = {};
vi.mock('../../api', () => {
  const handle = method => (url, body) => {
    calls.push({ method, url, body });
    const key = `${method} ${url}`;
    if (!(key in routes)) return Promise.reject(Object.assign(new Error(`no route ${key}`), { response: { status: 404, data: { code: 'NOT_FOUND' } } }));
    const out = typeof routes[key] === 'function' ? routes[key](body) : routes[key];
    return Promise.resolve(out).then(v => (v instanceof Error ? Promise.reject(v) : { data: v }));
  };
  return { default: { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') }, API_URL: '/api' };
});
let PlatformApp;
beforeAll(async () => { vi.stubEnv('VITE_LOOP', 'on'); PlatformApp = (await import('../PlatformApp')).default; });
afterEach(() => vi.useRealTimers());

const Where = () => <span data-testid="where">{useLocation().pathname}{useLocation().search}</span>;
const signIn = () => { const user = { id: 's1', fullName: 'Asha Verma', role: 'student', grade: '10', email: 'x@example.com' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<><PlatformApp /><Where /></>} /></Routes></AuthProvider></MemoryRouter>);
const bundle = { success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: { next: null, upcoming: [], history: [], requested: [] }, tasks: [], reports: [], assessment: { state: 'submitted' }, mentorNotes: [], inbox: { unread: 0 }, mentorRequest: null };
const TODAY = '2026-11-04';
const PROFILE = { style: 'calm', language: 'auto', morningAt: '07:30', eveningAt: '20:30', quiet: { from: '22:00', to: '07:00' }, nudges: true, nudgesPerDay: 3, autoApply: true, memory: [] };
const hq = (over = {}) => ({ success: true, profile: PROFILE, focus: null, ritual: null,
  feed: [{ kind: 'change', id: 'ch1', source: 'chat', summary: '', lines: ['Move “Practise: orbits” from Wed 4 Nov to Sat 7 Nov'], at: new Date().toISOString(), undone: false }, { kind: 'nudge', id: 'n1', title: 'Good morning! 2 steps today (60 min).', text: 'Check in?', link: 'coach?ritual=morning', at: new Date().toISOString(), read: false }],
  today: { today: TODAY, word: 'Hi Asha. 2 things today, about 60 minutes. Start with “gravity” while you’re fresh.', missed: 1, hasPlan: true, prep: null, streak: { current: 3, best: 5 },
    plan: { available: 60, total: 85, items: [{ kind: 'step', id: 'u0', title: 'Watch: forces', minutes: 25, type: 'learn', status: 'todo', late: true, date: '2026-11-03', fits: true }, { kind: 'step', id: 'u1', title: 'Watch: gravity', minutes: 30, type: 'learn', status: 'todo', late: false, date: TODAY, fits: true }, { kind: 'step', id: 'u2', title: 'Practise: orbits', minutes: 30, type: 'practice', status: 'todo', late: false, date: TODAY, fits: false }] } }, ...over });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; signIn(); routes['get /v2/platform/student'] = bundle; });

describe('Coach HQ: Today', () => {
  it('shows the coach’s word, the streak, the game plan (with what can wait), the feed with Undo, and fixes missed steps in one tap', async () => {
    routes['get /v2/me/coach/hq'] = hq();
    routes['post /v2/me/coach/changes/ch1/undo'] = { success: true };
    routes['post /v2/me/coach/fix/missed'] = { success: true, change: { id: 'ch2', source: 'reflow', lines: ['Move “Watch: forces” from Tue 3 Nov to Thu 5 Nov'], undone: false } };
    routes['post /v2/me/coach/changes'] = { success: true, change: { id: 'ch3', lines: ['x'] } };
    const user = userEvent.setup();
    at('/platform/student/coach');
    expect(await screen.findByText(/Start with “gravity” while you’re fresh/)).toBeInTheDocument();
    expect(screen.getByText('day streak').closest('.pf-hero-stat')).toHaveTextContent('3');
    expect(screen.getByText('If there’s time')).toBeInTheDocument();
    expect(screen.getByText('From earlier')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(calls.some(c => c.url === '/v2/me/coach/changes/ch1/undo')).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Fit into my week' }));
    expect(await screen.findByText('Move “Watch: forces” from Tue 3 Nov to Thu 5 Nov')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Tomorrow' })[1]);
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/changes').body).toEqual({ changes: [{ tool: 'move_step', stepId: 'u1', date: '2026-11-05' }] }));
  });

  it('the morning check-in: energy and time, then the coach’s proposed moves applied on one tap', async () => {
    routes['get /v2/me/coach/hq'] = hq({ ritual: { kind: 'morning', existing: null, planned: 60, steps: [], usual: 60 } });
    routes['post /v2/me/coach/rituals/morning'] = b => ({ success: true, message: `Today has 60 minutes of steps and you have ${b.minutes}. I suggest moving 1 to later this week.`, checkIn: { id: 'ci1', kind: 'morning', proposal: { lines: ['Move “Practise: orbits” from Wed 4 Nov to Thu 5 Nov'] } } });
    routes['post /v2/me/coach/checkins/ci1/apply'] = { success: true, change: { id: 'ch9', lines: ['x'] } };
    const user = userEvent.setup();
    at('/platform/student/coach');
    const card = await screen.findByRole('region', { name: 'Morning check-in' });
    expect(within(card).getByRole('button', { name: 'Check in' })).toBeDisabled();
    await user.click(within(card).getByRole('radio', { name: /Low/ }));
    await user.click(within(card).getByRole('radio', { name: '30 min' }));
    await user.click(within(card).getByRole('button', { name: 'Check in' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/rituals/morning').body).toEqual({ energy: 2, minutes: 30, blockers: '' }));
    expect(await within(card).findByText(/you have 30/)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Move them' }));
    await waitFor(() => expect(calls.some(c => c.url === '/v2/me/coach/checkins/ci1/apply')).toBe(true));
  });

  it('the command bar hands the request to the coach, which acts on it', async () => {
    routes['get /v2/me/coach/hq'] = hq();
    routes['get /v2/me/coach'] = { success: true, hasPlan: true, mentor: { firstName: 'Neha' }, allowance: { limit: 20, used: 0, left: 20, reduced: false, paused: false }, chats: [], today: { steps: [], due: [], next: null }, starters: [] };
    routes['post /v2/me/coach/chats'] = { success: true, chat: { id: 'c1', title: 'New chat', focus: null, flagged: false, sharedAt: null, messages: [] } };
    routes['post /v2/me/coach/chats/c1/messages'] = b => ({ success: true, allowance: { limit: 20, used: 1, left: 19 }, chat: { id: 'c1', title: b.text, focus: null, flagged: false, sharedAt: null, messages: [
      { i: 0, role: 'student', text: b.text, actions: [], quiz: [], followups: [], proposal: null },
      { i: 1, role: 'coach', text: 'Done: I moved today’s two steps to Thursday and Friday.', kind: 'plan', actions: [], quiz: [], followups: [], proposal: { lines: ['Move “Watch: gravity” from Wed 4 Nov to Thu 5 Nov', 'Move “Practise: orbits” from Wed 4 Nov to Fri 6 Nov'], problems: [], changeId: 'ch5', auto: true, undone: false } }] } });
    routes['post /v2/me/coach/changes/ch5/undo'] = { success: true };
    routes['get /v2/me/coach/chats/c1'] = { success: true, chat: { id: 'c1', title: 'x', focus: null, flagged: false, sharedAt: null, messages: [] } };
    const user = userEvent.setup();
    at('/platform/student/coach');
    await user.type(await screen.findByLabelText('Tell your coach'), 'I’m sick today, move everything');
    await user.click(screen.getByRole('button', { name: /Go/ }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/chats/c1/messages').body).toEqual({ text: 'I’m sick today, move everything' }));
    expect(await screen.findByText('Done, as you asked')).toBeInTheDocument();
    expect(screen.getByText('Move “Practise: orbits” from Wed 4 Nov to Fri 6 Nov')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(calls.some(c => c.url === '/v2/me/coach/changes/ch5/undo')).toBe(true));
  });

  it('focus mode: starts on a step and, when finished, marks it done', async () => {
    routes['get /v2/me/coach/hq'] = hq();
    routes['post /v2/me/coach/focus'] = b => ({ success: true, focus: { id: 'f1', stepId: b.stepId, title: 'Watch: gravity', plannedMin: b.minutes, startedAt: new Date().toISOString(), endedAt: null } });
    routes['post /v2/me/coach/focus/f1/finish'] = b => ({ success: true, marked: b.outcome === 'done', session: { id: 'f1', minutes: 25, outcome: b.outcome } });
    const user = userEvent.setup();
    at('/platform/student/coach');
    await user.click((await screen.findAllByRole('button', { name: 'Focus' }))[1]);
    const dlg = await screen.findByRole('dialog', { name: 'Focus: Watch: gravity' });
    expect(within(dlg).getByRole('timer')).toHaveTextContent(/2[45]:\d\d/);
    await user.click(within(dlg).getByRole('button', { name: 'I’m done' }));
    await user.click(within(dlg).getByRole('radio', { name: '4' }));
    await user.click(within(dlg).getByRole('button', { name: /Yes, finished/ }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/focus/f1/finish').body).toEqual({ outcome: 'done', understood: 4 }));
    expect(await within(dlg).findByText(/marked done in your plan/)).toBeInTheDocument();
  });
});

describe('Coach HQ: Progress and Settings', () => {
  it('progress shows the streak, the coach’s read, the path with a forecast, and topics', async () => {
    routes['get /v2/me/coach/hq'] = hq();
    routes['get /v2/me/coach/progress'] = { success: true, streak: { current: 4, best: 9 }, week: { minutes: 140, focus: 50, steps: 5, daysActive: 5 },
      heat: Array.from({ length: 56 }, (_, k) => ({ date: `d${k}`, minutes: k % 3 ? 30 : 0 })), minutes: Array.from({ length: 14 }, (_, k) => ({ date: `2026-10-${String(22 + k).padStart(2, '0')}`, label: `Mon ${k + 1}`, planned: 60, done: 30, focus: 10 })),
      trajectory: { goal: 'Astronaut', phases: [{ title: 'Fundamentals', weeks: 2, state: 'done' }, { title: 'Physics base', weeks: 3, state: 'current' }], level: 2, levels: 2, weeksDone: 3, weeksTotal: 5, pace: 70, forecast: '2026-12-20', target: '2026-12-10', status: 'on-track', gapDays: 10 },
      mastery: [{ title: 'Newton’s laws', state: 'mastered' }, { title: 'Vectors', state: 'weak' }], quiz: [{ label: 'W1', value: 60 }, { label: 'W2', value: 75 }], energy: [], read: [{ icon: 'calendar', text: 'You finish 80% of weekend steps but only 30% on weekdays.' }] };
    const user = userEvent.setup();
    at('/platform/student/coach');
    await user.click(await screen.findByRole('tab', { name: /Progress/ }));
    expect(await screen.findByText('4 days')).toBeInTheDocument();
    expect(screen.getByText(/80% of weekend steps/)).toBeInTheDocument();
    expect(screen.getByText('On track')).toBeInTheDocument();
    expect(screen.getByText('Vectors')).toHaveClass('weak');
    expect(screen.getByText('W1 60% · W2 75%')).toBeInTheDocument();
  });

  it('settings: the coach’s style and what it remembers', async () => {
    routes['get /v2/me/coach/hq'] = hq();
    routes['get /v2/me/coach/profile'] = { success: true, profile: PROFILE };
    routes['put /v2/me/coach/profile'] = b => ({ success: true, profile: { ...PROFILE, ...b } });
    routes['post /v2/me/coach/memory'] = b => ({ success: true, profile: { ...PROFILE, memory: [{ id: 'm1', text: b.text, source: 'student' }] } });
    routes['delete /v2/me/coach/memory/m1'] = { success: true, profile: PROFILE };
    const user = userEvent.setup();
    at('/platform/student/coach?tab=settings');
    await user.click(await screen.findByRole('radio', { name: /Energetic/ }));
    await waitFor(() => expect(calls.find(c => c.method === 'put').body).toEqual({ style: 'energetic' }));
    await user.type(screen.getByLabelText('Something to remember'), 'I have tuition on Mondays');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('I have tuition on Mondays')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Forget “I have tuition on Mondays”' }));
    await waitFor(() => expect(screen.queryByText('I have tuition on Mondays')).toBeNull());
  });
});
