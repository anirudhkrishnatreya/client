import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Markdown from './coach/Markdown';

// The AI coach page: starters from real data, chats about a step, replies with simple formatting, follow-ups, action cards the
// student confirms, the practice quiz, the daily limit, and the mentor's read-only view. The server is a small scripted router.
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

const Where = () => <span data-testid="where">{useLocation().pathname}{useLocation().search}</span>;
const signIn = (role = 'student') => { const user = { id: role === 'mentor' ? 'm1' : 's1', fullName: role === 'mentor' ? 'Dr. Neha Kapoor' : 'Asha Verma', role, grade: '10', email: 'x@example.com' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<><PlatformApp /><Where /></>} /></Routes></AuthProvider></MemoryRouter>);
const bundle = { success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: { next: null, upcoming: [], history: [], requested: [] }, tasks: [], reports: [], assessment: { state: 'submitted' }, mentorNotes: [], inbox: { unread: 0 }, mentorRequest: null };
const ALLOW = { limit: 20, used: 2, left: 18, reduced: false, paused: false, resetsAt: new Date().toISOString() };
const home = (over = {}) => ({ success: true, hasPlan: true, mentor: { firstName: 'Neha' }, allowance: ALLOW, chats: [],
  today: { date: '2026-11-04', steps: [{ id: 'u1', title: 'Watch: gravity', minutes: 30, status: 'todo', date: '2026-11-04', late: false }], due: [{ id: 't1', title: 'Essay on space', due: '2026-11-05', overdue: false, by: 'mentor' }], next: { id: 'x1', when: 'Thu, 5 Nov, 5:30 pm', topic: '' }, goal: 'Astronaut', freeToday: 60 },
  starters: [{ text: 'Explain “gravity” simply', focus: { kind: 'step', id: 'u1' } }, { text: 'I only have 30 minutes today. What should I do?' }], ...over });
const msg = (i, role, text, over = {}) => ({ i, role, text, kind: role === 'coach' ? 'explain' : null, at: new Date().toISOString(), actions: [], quiz: [], quizResult: null, followups: [], feedback: null, ...over });
const chat = (messages = [], over = {}) => ({ id: 'c1', title: 'New chat', focus: null, flagged: false, sharedAt: null, lastAt: new Date().toISOString(), kinds: [], messages, ...over });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; });

describe('student: the coach page', () => {
  beforeEach(() => { signIn(); routes['get /v2/platform/student'] = bundle; });

  it('a starter about a step opens a chat about it, and the reply shows with its formatting and follow-ups', async () => {
    let sent = 0;
    routes['get /v2/me/coach'] = () => home({ allowance: { ...ALLOW, used: 2 + sent, left: 18 - sent } });
    routes['post /v2/me/coach/chats'] = b => ({ success: true, chat: chat([], { focus: b.focus ? { ...b.focus, title: 'Watch: gravity' } : null }) });
    routes['post /v2/me/coach/chats/c1/messages'] = b => { sent += 1; return { success: true, allowance: { ...ALLOW, used: 2 + sent, left: 18 - sent }, chat: chat([msg(0, 'student', b.text), msg(1, 'coach', 'Gravity is a **pull** between masses.\n- Every mass pulls\n- Farther means weaker', { followups: ['Quiz me on gravity'] })]) }; };
    const user = userEvent.setup();
    at('/platform/student/coach');
    expect(await screen.findByText(/Neha, your mentor, can read your chats with the coach/)).toBeInTheDocument();
    expect(screen.getByText('Essay on space')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Explain “gravity” simply' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/chats').body).toEqual({ focus: { kind: 'step', id: 'u1' } }));
    expect(calls.find(c => c.url === '/v2/me/coach/chats/c1/messages').body).toEqual({ text: 'Explain “gravity” simply' });
    expect(await screen.findByText('pull', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText('Farther means weaker', { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText('17 of 20 left')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quiz me on gravity' }));
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/me/coach/chats/c1/messages').pop().body).toEqual({ text: 'Quiz me on gravity' }));
  });

  it('opened from a step (?step=…), it starts one chat about it with starters for that step', async () => {
    routes['get /v2/me/coach'] = home();
    routes['post /v2/me/coach/chats'] = { success: true, chat: chat([], { title: 'Watch: gravity', focus: { kind: 'step', id: 'u1', title: 'Watch: gravity' } }) };
    at('/platform/student/coach?step=u1');
    expect(await screen.findByText('Let’s work on “Watch: gravity”.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quiz me on this' })).toBeInTheDocument();
    expect(calls.filter(c => c.method === 'post' && c.url === '/v2/me/coach/chats')).toHaveLength(1);
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/platform/student/coach?chat=c1'));
  });

  it('a practice quiz is answered and checked, then the coach explains what was missed', async () => {
    const quiz = [{ q: 'What pulls the Moon?', options: ['Wind', 'Gravity', 'Magnets', 'Nothing'], answer: 1, why: 'Gravity pulls masses.' }, { q: 'Double the distance?', options: ['Twice', 'Half', 'A quarter', 'Same'], answer: 2, why: 'Inverse square.' }];
    routes['get /v2/me/coach'] = home();
    routes['get /v2/me/coach/chats/c1'] = { success: true, chat: chat([msg(0, 'student', 'Quiz me'), msg(1, 'coach', 'Two quick ones.', { kind: 'quiz', quiz })]) };
    routes['post /v2/me/coach/chats/c1/quiz'] = b => ({ success: true, chat: chat([msg(0, 'student', 'Quiz me'), msg(1, 'coach', 'Two quick ones.', { kind: 'quiz', quiz, quizResult: { score: 1, of: 2, answers: b.answers } })]) });
    routes['post /v2/me/coach/chats/c1/messages'] = { success: true, allowance: ALLOW, chat: chat([msg(0, 'student', 'x')]) };
    const user = userEvent.setup();
    at('/platform/student/coach?chat=c1');
    expect(await screen.findByText('What pulls the Moon?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check my answers' })).toBeDisabled();
    await user.click(screen.getByLabelText('Gravity'));
    await user.click(screen.getByLabelText('Twice'));
    await user.click(screen.getByRole('button', { name: 'Check my answers' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/chats/c1/quiz').body).toEqual({ index: 1, answers: [1, 0] }));
    expect(await screen.findByText('1 of 2 right')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Explain the ones I missed' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/chats/c1/messages').body).toEqual({ text: 'Explain the ones I got wrong' }));
  });

  it('action cards: a link to the step, a task added on tap, today\'s log edited before saving', async () => {
    const actions = [{ type: 'open_step', stepId: 'u1', title: 'Watch: gravity', date: '2026-11-04', done: false }, { type: 'add_task', title: 'Revise gravity', due: '2026-11-06', priority: 'high', done: false }, { type: 'log_day', text: 'I learned about orbits today.', date: '2026-11-04', done: false }];
    routes['get /v2/me/coach'] = home();
    routes['get /v2/me/coach/chats/c1'] = { success: true, chat: chat([msg(0, 'student', 'Plan my day'), msg(1, 'coach', 'Here is a plan.', { kind: 'plan', actions })]) };
    routes['post /v2/me/coach/chats/c1/act'] = b => ({ success: true, chat: chat([msg(0, 'student', 'Plan my day'), msg(1, 'coach', 'Here is a plan.', { kind: 'plan', actions: actions.map((a, k) => (k === b.action ? { ...a, done: true } : a)) })]) });
    const user = userEvent.setup();
    at('/platform/student/coach?chat=c1');
    expect(await screen.findByRole('link', { name: /Open “Watch: gravity”/ })).toHaveAttribute('href', '/platform/student/plan/day/2026-11-04');
    await user.click(screen.getByRole('button', { name: 'Add to my tasks' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/me/coach/chats/c1/act').body).toEqual({ index: 1, action: 1 }));
    expect(await screen.findByText('Added to your tasks: Revise gravity')).toBeInTheDocument();
    const log = screen.getByLabelText(/Today’s learning log/);
    await user.clear(log); await user.type(log, 'Orbits are falling sideways.');
    await user.click(screen.getByRole('button', { name: 'Save to today’s log' }));
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/me/coach/chats/c1/act').pop().body).toEqual({ index: 1, action: 2, text: 'Orbits are falling sideways.' }));
  });

  it('when today\'s messages are used up, the box says so; a refused send keeps what was typed', async () => {
    routes['get /v2/me/coach'] = home({ allowance: { ...ALLOW, used: 20, left: 0 } });
    at('/platform/student/coach');
    expect(await screen.findByPlaceholderText('No coach messages left today')).toBeDisabled();
    expect(screen.getByText('0 of 20 left')).toBeInTheDocument();
  });

  it('a send the server refuses shows why and keeps the text', async () => {
    routes['get /v2/me/coach'] = home();
    routes['post /v2/me/coach/chats'] = { success: true, chat: chat() };
    routes['post /v2/me/coach/chats/c1/messages'] = () => Object.assign(new Error('x'), { response: { status: 429, data: { code: 'COACH_LIMIT', details: { coach: 'You have used today’s 20 coach messages.' } } } });
    const user = userEvent.setup();
    at('/platform/student/coach');
    await user.type(await screen.findByLabelText('Ask the coach'), 'What is a vector?');
    await user.click(screen.getByRole('button', { name: 'Send to the coach' }));
    expect(await screen.findByText(/You have used today’s 20 coach messages/)).toBeInTheDocument();
    expect(screen.getByLabelText('Ask the coach')).toHaveValue('What is a vector?');
  });
});

describe('mentor: the AI coach tab', () => {
  it('reads the student\'s coach chats and sees a support alert', async () => {
    signIn('mentor');
    const row = { id: 's1', name: 'Asha Verma', grade: '10', track: 'senior', consent: 'granted', parent: 'linked', lastLoginAt: new Date().toISOString(), tasks: { total: 0, done: 0, open: 0, overdue: 0, review: 0 }, assessment: { state: 'submitted', completedAt: null } };
    routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor', mentorCode: 'K7M2QX', meetingUrl: 'https://meet.google.com/abc-defg-hij' }, students: [row], alerts: [], sessions: [], sessionRequests: [], requests: [], inbox: { unread: 0 }, board: [] };
    routes['get /v2/platform/mentor/students/s1'] = { student: row, tasks: [], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [], logs: [], situation: null };
    routes['get /v2/platform/mentor/students/s1/coach'] = { week: { chats: 1, replies: 2, kinds: { explain: 2 }, flagged: true }, chats: [chat([msg(0, 'student', 'Explain vectors'), msg(1, 'coach', 'A vector has **size** and direction.')], { title: 'Explain vectors', flagged: true })] };
    const user = userEvent.setup();
    at('/platform/mentor/students?open=s1&tab=coach');
    expect(await screen.findByText(/Asha may need support\./)).toBeInTheDocument();
    expect(screen.getByText(/mostly explaining 2/)).toBeInTheDocument();
    await user.click(screen.getByText('Explain vectors', { selector: 'b' }));
    expect(screen.getByText('size', { selector: 'b' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Ask the coach')).toBeNull();
  });
});

describe('the formatter', () => {
  it('shows bold, code and lists, and never turns model text into HTML', () => {
    const { container } = render(<Markdown text={'Use **this** and `x = 1`.\n\n1. First\n2. Second\n\n<img src=x onerror=alert(1)>'} />);
    expect(container.querySelector('b').textContent).toBe('this');
    expect(container.querySelector('code').textContent).toBe('x = 1');
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
