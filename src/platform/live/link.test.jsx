import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Mentor and student working together: connecting by code, messages (the parent reads them), sessions asked for with an agenda,
// next steps turned into tasks, questions about a step, and the mentor's week board. The server is a small scripted router.
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
  return { default: { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') } };
});
let PlatformApp;
beforeAll(async () => { vi.stubEnv('VITE_LOOP', 'on'); PlatformApp = (await import('../PlatformApp')).default; });

const signIn = (role = 'student', extra = {}) => { const user = { id: role === 'mentor' ? 'm1' : role === 'parent' ? 'p1' : 's1', fullName: role === 'mentor' ? 'Dr. Neha Kapoor' : role === 'parent' ? 'Meera Verma' : 'Asha Verma', role, grade: '10', email: 'x@example.com', ...extra }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);
const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const NOSESSIONS = { next: null, upcoming: [], history: [], requested: [], declined: [] };
const bundle = (over = {}) => ({ success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: NOSESSIONS, tasks: [], reports: [], assessment: { state: 'submitted' }, mentorNotes: [], inbox: { unread: 0 }, mentorRequest: null, ...over });
const msg = (id, from, text, extra = {}) => ({ id, from, text, at: new Date().toISOString(), read: false, ref: null, ...extra });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; });

describe('student: connecting with a mentor', () => {
  it('enters the code their mentor gave them and then waits for the mentor to accept', async () => {
    signIn();
    let asked = false;
    routes['get /v2/platform/student'] = () => bundle({ mentor: null, mentorRequest: asked ? { id: 'r1', status: 'pending', mentor: { id: 'm1', name: 'Dr. Neha Kapoor' } } : null });
    routes['post /v2/platform/student/mentor-request'] = () => { asked = true; return { success: true }; };
    const user = userEvent.setup();
    at('/platform/student/mentor');
    await user.type(await screen.findByLabelText('Mentor code'), 'k7m2qx');
    await user.click(screen.getByRole('button', { name: 'Ask to connect' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post').body).toMatchObject({ code: 'K7M2QX' }));
    expect(await screen.findByText(/Waiting for Dr. Neha Kapoor to accept/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw the request' })).toBeInTheDocument();
  });
});

describe('student: working with their mentor', () => {
  beforeEach(() => signIn());

  it('reads and sends messages, and is told the parent can read them', async () => {
    routes['get /v2/platform/student'] = bundle({ inbox: { unread: 1 } });
    routes['get /v2/platform/student/messages'] = { messages: [msg('1', 'mentor', 'How is the orbit drawing going?')] };
    routes['post /v2/platform/student/messages'] = b => ({ success: true, message: msg('2', 'student', b.text) });
    const user = userEvent.setup();
    at('/platform/student/mentor');
    expect(await screen.findByText('How is the orbit drawing going?')).toBeInTheDocument();
    expect(screen.getByText(/Your parent can read them too/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Write a message'), 'Almost done, one question about arrows.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Almost done, one question about arrows.')).toBeInTheDocument();
    expect(calls.find(c => c.method === 'post').body).toEqual({ text: 'Almost done, one question about arrows.' });
  });

  it('adds a question to the next session, and asks for another session', async () => {
    routes['get /v2/platform/student'] = bundle({ sessions: { ...NOSESSIONS, next: { id: 'x1', date: day(3), time: '17:30', topic: 'Week review', status: 'scheduled', agenda: [{ text: 'Look at your quiz', by: 'mentor' }] } } });
    routes['get /v2/platform/student/messages'] = { messages: [] };
    routes['post /v2/platform/sessions/x1/agenda'] = { success: true };
    routes['post /v2/platform/student/sessions'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/mentor');
    expect(await screen.findByText('Look at your quiz')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Add something to talk about'), 'Why does the Moon not fall?');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/x1/agenda').body).toEqual({ text: 'Why does the Moon not fall?' }));
    await user.click(screen.getAllByRole('button', { name: /Ask for a session/ })[0]);
    const drawer = await screen.findByRole('dialog');
    await user.type(within(drawer).getByLabelText('What about?'), 'Stuck on vectors');
    await user.click(within(drawer).getByRole('button', { name: 'Send the request' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/student/sessions').body).toMatchObject({ topic: 'Stuck on vectors' }));
  });

  it('a session the mentor declined says why', async () => {
    routes['get /v2/platform/student'] = bundle({ sessions: { ...NOSESSIONS, declined: [{ id: 'x2', date: day(1), status: 'declined', note: 'I am away. Thursday works.', agenda: [] }] } });
    routes['get /v2/platform/student/messages'] = { messages: [] };
    at('/platform/student/mentor');
    expect(await screen.findByText(/I am away. Thursday works./)).toBeInTheDocument();
  });

  it('asks the mentor about a step of the plan, and sees the mentor’s tasks due that day', async () => {
    const TODAY = '2026-10-22';
    routes['get /v2/platform/student'] = bundle({ tasks: [{ id: 't1', title: 'Draw the orbit diagram', subject: 'Physics', due: TODAY, status: 'todo', priority: 'high', by: 'Mentor', source: 'mentor', mine: false }] });
    routes['get /v2/me/loop'] = { loop: { mode: 'plan', today: TODAY, ai: { used: 0, limit: 40, left: 40 }, profile: {}, goal: { title: 'Astronaut', phase: {}, progress: {} },
      week: { weekStart: '2026-10-19', weekNumber: 1, todayIndex: 3, logs: {}, items: [{ id: 'u1', title: 'Watch: gravity', type: 'learn', minutes: 30, goal: 'g', evidence: 'e', reason: 'r', date: TODAY, status: 'todo', video: null, searchUrl: 'https://www.youtube.com/results?search_query=x', notes: null }] }, assessment: { stage: 'locked', done: 0, need: 2 }, next: {} } };
    routes['post /v2/platform/student/messages'] = { success: true, message: msg('3', 'student', 'x') };
    const user = userEvent.setup();
    at(`/platform/student/plan/day/${TODAY}`);
    expect(await screen.findByText('Also due this day')).toBeInTheDocument();
    expect(screen.getByText('Draw the orbit diagram')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ask my mentor/ }));
    await user.type(screen.getByLabelText(/Your question for/), 'Which formula is this?');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/student/messages').body).toEqual({ text: 'Which formula is this?', ref: { kind: 'step', id: 'u1', title: 'Watch: gravity' } }));
    expect(await screen.findByText(/The reply will be under Mentor/)).toBeInTheDocument();
  });
});

describe('mentor: the week with each student', () => {
  const row = (id, name) => ({ id, name, grade: '10', track: 'senior', consent: 'granted', parent: 'linked', lastLoginAt: new Date().toISOString(), tasks: { total: 1, done: 0, open: 1, overdue: 0, review: 0 }, assessment: { state: 'submitted', completedAt: null } });
  const home = (over = {}) => ({ me: { id: 'm1', fullName: 'Dr. Neha Kapoor', mentorCode: 'K7M2QX' }, students: [row('s1', 'Asha Verma')], alerts: [], sessions: [], sessionRequests: [], requests: [], inbox: { unread: 2 },
    board: [{ studentId: 's1', name: 'Asha Verma', grade: '10', goal: 'Astronaut', plan: { weekNumber: 2, steps: 6, done: 3 }, daysLogged: 0, unread: 2, review: 0, overdue: 0, sessionRequests: 0, nextSession: null, metThisWeek: false, summarySent: false,
      next: [{ kind: 'reply', urgent: true, text: 'Reply to 2 messages' }, { kind: 'book', urgent: false, text: 'Book this week’s session' }] }], ...over });
  beforeEach(() => signIn('mentor'));

  it('the overview says the next step with each student, shows the code, and accepts a request', async () => {
    routes['get /v2/platform/mentor'] = home({ requests: [{ id: 'r1', student: { id: 's9', name: 'Ravi Kumar', grade: '9', goal: 'Pilot' }, note: 'I love planes', at: new Date().toISOString() }] });
    routes['post /v2/platform/mentor/requests/r1'] = { success: true, status: 'accepted' };
    const user = userEvent.setup();
    at('/platform/mentor');
    expect(await screen.findByRole('link', { name: 'Reply to 2 messages' })).toHaveAttribute('href', '/platform/mentor/messages?student=s1');
    expect(screen.getByRole('link', { name: 'Book this week’s session' })).toHaveAttribute('href', '/platform/mentor/sessions?student=s1');
    expect(screen.getByLabelText('Your mentor code')).toHaveTextContent('K7M2QX');
    expect(screen.getByText(/I love planes/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post').body).toEqual({ accept: true }));
  });

  it('messages: the inbox lists students, the thread opens and a reply is sent', async () => {
    routes['get /v2/platform/mentor'] = home();
    let opened = false;
    // once Asha's conversation is read, Aman's unread one moves to the top: it must not open (and be marked read) by itself
    routes['get /v2/platform/mentor/inbox'] = () => ({ inbox: opened ? [{ studentId: 's2', name: 'Aman Rao', grade: '10', unread: 1, last: null }, { studentId: 's1', name: 'Asha Verma', grade: '10', unread: 0, last: null }]
      : [{ studentId: 's1', name: 'Asha Verma', grade: '10', unread: 2, last: { text: 'Can we talk?', from: 'student', at: new Date().toISOString() } }, { studentId: 's2', name: 'Aman Rao', grade: '10', unread: 1, last: null }] });
    routes['get /v2/platform/mentor/students/s2/messages'] = { messages: [] };
    routes['get /v2/platform/mentor/students/s1/messages'] = () => { opened = true; return { messages: [msg('1', 'student', 'Can we talk?', { ref: { kind: 'step', id: 'u1', title: 'Watch: gravity' } })] }; };
    routes['post /v2/platform/mentor/students/s1/messages'] = b => ({ success: true, message: msg('2', 'mentor', b.text) });
    const user = userEvent.setup();
    at('/platform/mentor/messages');
    const log = await screen.findByText('Can we talk?', { selector: 'p' });
    expect(log.closest('.pf-bubble')).toHaveTextContent('About a step of the plan: Watch: gravity');
    expect(calls.filter(c => c.method === 'get' && /\/students\/.+\/messages$/.test(c.url)).every(c => c.url.includes('/s1/'))).toBe(true);   // only the chosen conversation is opened
    await user.type(screen.getByLabelText('Write a message'), 'Yes, Saturday at 5?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/mentor/students/s1/messages' && c.method === 'post').body).toEqual({ text: 'Yes, Saturday at 5?' }));
  });

  it('sessions: declines a request with a reason, and the write-up turns next steps into tasks', async () => {
    routes['get /v2/platform/mentor'] = home({ inbox: { unread: 0 },
      sessionRequests: [{ id: 'q1', studentId: 's1', date: day(2), time: null, topic: 'Vectors', note: '', status: 'requested', requestedBy: 'student', agenda: [{ text: 'What is a unit vector?', by: 'student' }] }],
      sessions: [{ id: 'x1', studentId: 's1', date: day(1), time: '17:00', topic: 'Review', status: 'scheduled', requestedBy: 'mentor', agenda: [] }] });
    routes['patch /v2/platform/sessions/q1'] = { success: true };
    routes['patch /v2/platform/sessions/x1'] = { success: true, tasksMade: 2 };
    const user = userEvent.setup();
    at('/platform/mentor/sessions');
    expect(await screen.findByText('What is a unit vector?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Decline' }));
    await user.type(screen.getByLabelText('Reason'), 'Away that day. Thursday?');
    await user.click(screen.getAllByRole('button', { name: 'Decline' }).pop());
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/q1').body).toEqual({ status: 'declined', note: 'Away that day. Thursday?' }));
    await user.click(screen.getByRole('button', { name: 'Write up' }));
    const drawer = await screen.findByRole('dialog');
    await user.type(within(drawer).getByLabelText('What happened'), 'We reviewed vectors.');
    await user.type(within(drawer).getByLabelText(/Next steps/), 'Do 5 vector problems\nRedo quiz question 3');
    await user.click(within(drawer).getByRole('button', { name: /Save and mark done/ }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/x1').body).toMatchObject({ status: 'done', actions: ['Do 5 vector problems', 'Redo quiz question 3'], createTasks: true }));
    expect(await screen.findByText(/2 next steps are now in Asha Verma’s tasks/)).toBeInTheDocument();
  });
});

describe('parent: reads the messages', () => {
  it('shows the conversation between the child and the mentor, read-only', async () => {
    signIn('parent');
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'x@example.com' }, children: [{ id: 's1', name: 'Asha Verma', grade: '10', tasks: { total: 0, done: 0, open: 0, overdue: 0 }, assessment: { state: 'submitted' } }] };
    routes['get /v2/platform/parent/children/s1'] = { child: { id: 's1', name: 'Asha Verma', grade: '10', assessment: { state: 'submitted' }, tasks: {} }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, loop: null, tasks: [], sessions: NOSESSIONS, notes: [], reports: [],
      messages: [msg('1', 'student', 'Can we talk about vectors?'), msg('2', 'mentor', 'Yes, on Saturday.')] };
    const user = userEvent.setup();
    at('/platform/parent/mentor');
    await user.click(await screen.findByText('Read the 2 messages'));
    expect(screen.getByText('Yes, on Saturday.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Write a message')).toBeNull();
  });
});
