import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';

const calls = [];
let routes = {};
vi.mock('../../../api', () => {
  const handle = method => (url, body) => {
    calls.push({ method, url, body });
    const key = `${method} ${url}`;
    if (!(key in routes)) return Promise.reject(Object.assign(new Error(`no route ${key}`), { response: { status: 404, data: { code: 'NOT_FOUND' } } }));
    const out = typeof routes[key] === 'function' ? routes[key](body) : routes[key];
    return out instanceof Error ? Promise.reject(out) : Promise.resolve({ data: out });
  };
  return { default: { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') } };
});

let PlatformApp;
beforeAll(async () => { vi.stubEnv('VITE_LOOP', 'on'); PlatformApp = (await import('../../PlatformApp')).default; });

const fail = (status, code, details) => Object.assign(new Error(code), { response: { status, data: { code, error: code, details } } });
const signIn = () => { const user = { id: 's1', fullName: 'Asha Verma', role: 'student', grade: '10' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const bundle = { success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: null, sessions: { next: null, upcoming: [], history: [] }, tasks: [], reports: [], assessment: { state: 'submitted' } };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);

const profile = { freeMinutes: [45, 45, 45, 45, 45, 90, 90], restDay: null, exams: [], saved: false };
const PLAN = { careerTitle: 'Astronaut', startPoint: { summary: 'Class 10, curious about space.', level: 'Class 10' }, endPoint: { summary: 'A strong Physics base and readiness for the IIST route.', outcomes: ['Explain orbits'], horizonWeeks: 10 }, longPath: 'Then a degree and ISRO selection.', phases: [{ id: 'p1', title: 'Fundamentals', weeks: 2, outcome: 'o', topics: [{ id: 'p1t1', title: 'Gravity and orbits' }] }, { id: 'p2', title: 'Physics base', weeks: 3, outcome: 'o', topics: [{ id: 'p2t1', title: 'Newton’s laws' }] }], weeklyMinutes: 300, notes: ['Check the official ISRO website.'] };
const chatState = (messages, extra = {}) => ({ loop: { mode: 'chat', profile, today: '2026-10-22', intake: { status: 'chatting', messages, proposal: null, ...extra.intake }, currentGoal: null, ...extra.loop } });
const greeting = { role: 'assistant', text: 'Hi Asha! What do you want to become?', quickReplies: ['AI engineer', 'Astronaut'] };
const unit = (id, day, over = {}) => ({ id, title: `Unit ${id}`, type: 'learn', minutes: 30, goal: `Goal of ${id}`, evidence: `Evidence for ${id}`, search: `search ${id}`, searchUrl: `https://www.youtube.com/results?search_query=search%20${id}`, topic: 'Gravity and orbits', day, reason: `Reason for ${id}.`, status: 'todo', resourceUrl: null, resourceTitle: null, rating: null, ...over });
const planState = (over = {}) => ({ loop: { mode: 'plan', profile: { ...profile, saved: true }, today: '2026-10-22',
  goal: { id: 'g1', title: 'Astronaut', startPoint: PLAN.startPoint, endPoint: PLAN.endPoint, longPath: PLAN.longPath, notes: PLAN.notes, targetDate: '2026-12-31', weekNumber: 1, pace: 'on-track',
    phases: [{ id: 'p1', title: 'Fundamentals', outcome: 'Core ideas', weeks: 2, status: 'current', topics: [{ id: 'p1t1', title: 'Gravity and orbits', status: 'weak' }] }, { id: 'p2', title: 'Physics base', outcome: 'Mechanics', weeks: 3, status: 'upcoming', topics: [{ id: 'p2t1', title: 'Newton’s laws', status: 'new' }] }],
    progress: { phaseIndex: 0, phases: 2, topicsTotal: 2, topicsDone: 1, mastered: 0 } },
  week: { weekStart: '2026-10-19', weekNumber: 1, mode: 'normal', focus: 'Fundamentals: gravity', source: 'model', notices: [], items: [unit('u1', 3), unit('u2', 3, { type: 'practise' }), unit('u3', 4)], capacityMinutes: 300, plannedMinutes: 90, doneMinutes: 0, todayIndex: 3 },
  check: { status: 'locked', done: 0, need: 2 }, ...over } });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; signIn(); routes['get /v2/platform/student'] = bundle; });

describe('the career chat', () => {
  it('greets, takes a typed answer or a quick reply, and shows the guide’s next question', async () => {
    routes['get /v2/me/loop'] = chatState([greeting]);
    routes['post /v2/me/loop/chat'] = ({ text }) => chatState([greeting, { role: 'user', text }, { role: 'assistant', text: 'Lovely! Which class are you in?', quickReplies: ['Class 10', 'Class 12'] }]);
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText('Hi Asha! What do you want to become?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Astronaut' }));
    expect(await screen.findByText('Lovely! Which class are you in?')).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/me/loop/chat').body).toEqual({ text: 'Astronaut' });
    await user.type(screen.getByLabelText('Your message'), 'Class 10 science');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/me/loop/chat').pop().body).toEqual({ text: 'Class 10 science' }));
  });
  it('if the guide cannot answer, the message stays in the box to send again', async () => {
    routes['get /v2/me/loop'] = chatState([greeting]);
    routes['post /v2/me/loop/chat'] = fail(503, 'AI_UNAVAILABLE');
    const user = userEvent.setup();
    at('/platform/student/goal');
    await user.type(await screen.findByLabelText('Your message'), 'I want to be a pilot');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/send it again/);
    expect(screen.getByLabelText('Your message')).toHaveValue('I want to be a pilot');
  });
  it('shows the drafted plan (start point, end point, phases) and starts it', async () => {
    routes['get /v2/me/loop'] = chatState([greeting], { intake: { status: 'proposed', proposal: PLAN } });
    routes['post /v2/me/loop/chat/confirm'] = planState();
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText('Class 10, curious about space.')).toBeInTheDocument();
    expect(screen.getByText(/End point · about 10 weeks/)).toBeInTheDocument();
    expect(screen.getByText('Fundamentals')).toBeInTheDocument();
    expect(screen.getByText(/Then a degree and ISRO selection/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start this plan' }));
    expect(await screen.findByText(/Your plan has started/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Astronaut' })).toBeInTheDocument();
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/platform/student').length).toBeGreaterThan(1));
  });
  it('planning a new goal says the current one stays, and can be cancelled', async () => {
    routes['get /v2/me/loop'] = chatState([greeting], { loop: { currentGoal: { title: 'Astronaut' } } });
    routes['post /v2/me/loop/new-goal/cancel'] = planState();
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText(/stays until you start the new plan/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep my current goal' }));
    expect(await screen.findByRole('heading', { name: 'Astronaut' })).toBeInTheDocument();
  });
  it('says "coming soon" when the server has it off', async () => {
    routes['get /v2/me/loop'] = fail(404, 'LOOP_DISABLED');
    at('/platform/student/goal');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
  });
});

describe('my goal with a plan', () => {
  it('shows start and end points, pace, and saves the real week', async () => {
    routes['get /v2/me/loop'] = planState();
    routes['put /v2/me/loop/schedule'] = planState();
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText('On track')).toBeInTheDocument();
    expect(screen.getByText(/A strong Physics base/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Monday'), '90');
    await user.click(screen.getByRole('button', { name: 'Save my week' }));
    expect(await screen.findByText(/It shapes next week/)).toBeInTheDocument();
    expect(calls.find(c => c.method === 'put').body.freeMinutes[0]).toBe(90);
  });
});

describe('the week', () => {
  it('lays out the units by day, today highlighted, each with a safe search link', async () => {
    routes['get /v2/me/loop'] = planState();
    at('/platform/student/plan');
    expect(await screen.findByText('Thursday · today')).toBeInTheDocument();
    expect(screen.getByText(/Week 1 · Astronaut/)).toBeInTheDocument();
    const link = within(screen.getByRole('article', { name: 'Unit u1' })).getByRole('link', { name: /Find a free video/ });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/results?search_query=search%20u1');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('marks done with the link used and a rating, and skips with a reason', async () => {
    const s = planState();
    routes['get /v2/me/loop'] = s;
    routes['post /v2/me/loop/units/u1/done'] = { loop: { ...s.loop, week: { ...s.loop.week, doneMinutes: 30, items: s.loop.week.items.map(i => (i.id === 'u1' ? { ...i, status: 'done', resourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', resourceTitle: 'Orbits explained' } : i)) } } };
    routes['post /v2/me/loop/units/u2/skip'] = { loop: { ...s.loop, week: { ...s.loop.week, items: s.loop.week.items.map(i => (i.id === 'u2' ? { ...i, status: 'skipped' } : i)) } } };
    const user = userEvent.setup();
    at('/platform/student/plan');
    const c1 = await screen.findByRole('article', { name: 'Unit u1' });
    await user.click(within(c1).getByRole('button', { name: 'I have done this' }));
    await user.type(within(c1).getByLabelText(/Which video or page/), 'https://youtu.be/dQw4w9WgXcQ');
    await user.click(within(c1).getByRole('button', { name: '5 out of 5' }));
    await user.click(within(c1).getByRole('button', { name: 'Mark as done' }));
    expect(await within(c1).findByText('Orbits explained')).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/me/loop/units/u1/done').body).toEqual({ resourceUrl: 'https://youtu.be/dQw4w9WgXcQ', rating: 5 });
    const c2 = screen.getByRole('article', { name: 'Unit u2' });
    await user.click(within(c2).getByRole('button', { name: 'Skip' }));
    await user.selectOptions(within(c2).getByLabelText('Why skip it?'), 'covered-elsewhere');
    await user.click(within(c2).getByRole('button', { name: 'Skip it' }));
    expect(await within(c2).findByText('Skipped')).toBeInTheDocument();
  });
  it('the week check: locked, then ready, then 5 questions, then marked with explanations', async () => {
    const s = planState({ check: { status: 'ready', done: 2, need: 2 } });
    routes['get /v2/me/loop'] = s;
    const qs = [1, 2, 3].map(n => ({ id: `q${n}`, q: `Question ${n}?`, options: ['A', 'B', 'C', 'D'], topic: 'Gravity and orbits' }));
    routes['post /v2/me/loop/check'] = { loop: { ...s.loop, check: { status: 'open', questions: qs } } };
    routes['post /v2/me/loop/check/answers'] = { loop: { ...s.loop, check: { status: 'done', score: 2 / 3, questions: qs.map((q, i) => ({ ...q, answer: 1, yourAnswer: i === 2 ? 0 : 1, correct: i !== 2, explanation: 'Because B.' })) } } };
    const user = userEvent.setup();
    at('/platform/student/plan');
    await user.click(await screen.findByRole('button', { name: 'Start the check' }));
    expect(await screen.findByText(/Question 1\?/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Answer every question' })).toBeDisabled();
    for (const [n, pick] of [[1, 'B'], [2, 'B'], [3, 'A']]) await user.click(within(screen.getByRole('group', { name: new RegExp(`Question ${n}`) })).getByLabelText(pick));
    await user.click(screen.getByRole('button', { name: 'Submit my answers' }));
    expect(await screen.findByText(/67%/)).toBeInTheDocument();
    expect(screen.getByText(/Next week revises what you missed/)).toBeInTheDocument();
    expect(screen.getByText(/Because B\./)).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/me/loop/check/answers').body).toEqual({ answers: [1, 1, 0] });
  });
  it('a locked check says how many steps are needed', async () => {
    routes['get /v2/me/loop'] = planState();
    at('/platform/student/plan');
    expect(await screen.findByText(/Unlocks after you finish 2/)).toBeInTheDocument();
  });
  it('without a plan, points to the chat', async () => {
    routes['get /v2/me/loop'] = chatState([greeting]);
    at('/platform/student/plan');
    expect(await screen.findByText('Tell your guide what you want to become')).toBeInTheDocument();
  });
});

describe('journey and overview', () => {
  it('the journey shows every phase, where you are, and each topic’s status', async () => {
    routes['get /v2/me/loop'] = planState();
    at('/platform/student/plan/roadmap');
    expect(await screen.findByText('You are here')).toBeInTheDocument();
    expect(screen.getByText('Needs another look')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText(/Then a degree and ISRO selection/)).toBeInTheDocument();
  });
  it('the overview shows today’s steps, or invites the chat', async () => {
    routes['get /v2/me/loop'] = planState();
    const { unmount } = at('/platform/student');
    expect(await screen.findByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Unit u1')).toBeInTheDocument();
    unmount();
    routes['get /v2/me/loop'] = chatState([greeting]);
    at('/platform/student');
    expect(await screen.findByRole('link', { name: 'Start the chat' })).toBeInTheDocument();
  });
});
