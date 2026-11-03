import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// The daily learning record, tasks from everyone with priorities, the learning library, the full situation plan, and the
// mentor's desk (task board, review, weekly summaries, the assistant). The server is a small scripted router.
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

const fail = (status, code, details) => Object.assign(new Error(code), { response: { status, data: { code, error: code, details } } });
const signIn = (role = 'student', extra = {}) => { const user = { id: role === 'student' ? 's1' : 'm1', fullName: role === 'mentor' ? 'Dr. Neha Kapoor' : 'Asha Verma', role, grade: '10', ...extra }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);
const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const task = (over = {}) => ({ id: 't1', title: 'Python loops set', subject: 'Python', due: day(1), status: 'todo', priority: 'high', by: 'Mentor', source: 'mentor', mine: false, notes: '', studentNote: '', feedback: null, ...over });
const bundle = (over = {}) => ({ success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: { next: null, upcoming: [], history: [] }, tasks: [task()], reports: [], assessment: { state: 'submitted' }, mentorNotes: [], ...over });

const TODAY = '2026-10-22';
const unit = (id, date, over = {}) => ({ id, title: `Unit ${id}`, type: 'learn', minutes: 30, goal: `Goal of ${id}`, evidence: 'x', search: 's', searchUrl: 'https://www.youtube.com/results?search_query=s', topic: 'Gravity', day: 0, date, reason: 'r', video: null, sequence: null, status: 'todo', resourceUrl: null, resourceTitle: null, rating: null, notes: null, ...over });
const loopState = (over = {}) => ({ loop: { mode: 'plan', profile: { freeMinutes: [60, 60, 60, 60, 60, 60, 60], restDay: null, exams: [], saved: true }, today: TODAY, ai: { used: 0, limit: 40, left: 40, unlimited: false, paused: false },
  goal: { id: 'g1', title: 'Astronaut', startPoint: { summary: 's', level: 'Class 10' }, endPoint: { summary: 'e' }, longPath: '', notes: [], weekNumber: 1, pace: 'on-track', adaptations: [], phase: { number: 1, total: 4, title: 'Fundamentals', outcome: 'o', finished: false, levelUp: null, levelUpDue: false }, progress: { phaseIndex: 0, phases: 4, topicsTotal: 4, topicsDone: 0, mastered: 0 } },
  week: { weekStart: '2026-10-19', weekEnd: '2026-10-25', weekNumber: 1, mode: 'normal', pace: 'start', focus: 'Gravity', summary: '', source: 'model', notices: [], items: [unit('u1', TODAY, { title: 'Watch: gravity' }), unit('u2', TODAY, { title: 'Try: gravity problems', type: 'practise', status: 'done' }), unit('u3', '2026-10-24', { title: 'Watch: orbits' })], capacityMinutes: 300, plannedMinutes: 90, doneMinutes: 30, todayIndex: 3, over: false, videos: false, logs: {}, ...over.week },
  assessment: { stage: 'ready', done: 2, need: 2 }, next: { canPlan: false }, history: [], ...over.loop } });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; });

describe('student: the Tasks page shows the plan’s steps and everyone’s tasks', () => {
  beforeEach(() => { signIn(); routes['get /v2/platform/student'] = bundle({ tasks: [task(), task({ id: 't2', title: 'Tidy your desk', source: 'parent', by: 'Parent', priority: 'low' }), task({ id: 't3', title: 'My own reading', source: 'student', by: 'You', mine: true, priority: 'medium' })] }); });

  it('lists today’s steps (done and not), later days, the assessment, and asks to log the day', async () => {
    routes['get /v2/me/loop'] = loopState();
    at('/platform/student/tasks');
    const plan = await screen.findByText(/From your weekly plan · week 1/);
    const card = plan.closest('.pf-card');
    expect(within(card).getByText('Watch: gravity')).toBeInTheDocument();
    expect(within(card).getByText('Try: gravity problems').closest('li')).toHaveClass('done');
    expect(within(card).getByText('Watch: orbits')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Log what you learned/ })).toHaveAttribute('href', `/platform/student/plan/day/${TODAY}`);
    expect(within(card).getByRole('link', { name: 'Take it' })).toHaveAttribute('href', '/platform/student/plan/assessment');
  });

  it('filters tasks by who set them, and shows where each came from', async () => {
    routes['get /v2/me/loop'] = loopState();
    const user = userEvent.setup();
    at('/platform/student/tasks');
    await screen.findByRole('button', { name: /Tidy your desk/ });
    await user.click(screen.getByRole('button', { name: 'From parent' }));
    expect(screen.getByRole('button', { name: /Tidy your desk/ })).toHaveTextContent('From your parent');
    expect(screen.queryByRole('button', { name: /Python loops set/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Mine' }));
    expect(screen.getByRole('button', { name: /My own reading/ })).toBeInTheDocument();
  });

  it('hands a task in to the mentor with a note, and shows the mentor’s feedback', async () => {
    routes['get /v2/me/loop'] = loopState();
    routes['get /v2/platform/student'] = bundle({ tasks: [task({ feedback: { text: 'Good start, add comments.', at: new Date().toISOString() } })] });
    routes['patch /v2/platform/tasks/t1'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/tasks');
    await user.click(await screen.findByRole('button', { name: /Python loops set/ }));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('Good start, add comments.')).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'With mentor' }));
    await user.type(within(drawer).getByLabelText(/A word for your mentor/), 'Done all ten.');
    await user.click(within(drawer).getByRole('button', { name: 'Send to my mentor' }));
    await waitFor(() => expect(calls.find(c => c.method === 'patch')).toMatchObject({ url: '/v2/platform/tasks/t1', body: { status: 'review', studentNote: 'Done all ten.' } }));
  });

  it('their own task can be re-prioritised and deleted', async () => {
    routes['get /v2/me/loop'] = loopState();
    routes['patch /v2/platform/tasks/t3'] = { success: true };
    routes['delete /v2/platform/tasks/t3'] = { success: true };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    at('/platform/student/tasks');
    await user.click(await screen.findByRole('button', { name: /My own reading/ }));
    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByRole('radio', { name: 'Low' }));
    await waitFor(() => expect(calls.find(c => c.method === 'patch').body).toEqual({ priority: 'low' }));
    await user.click(within(drawer).getByRole('button', { name: /Delete/ }));
    await waitFor(() => expect(calls.some(c => c.method === 'delete' && c.url === '/v2/platform/tasks/t3')).toBe(true));
  });
});

describe('student: a day of the plan', () => {
  beforeEach(() => { signIn(); routes['get /v2/platform/student'] = bundle(); });

  it('logs what was learned that day; the day then shows it with an edit button', async () => {
    routes['get /v2/me/loop'] = loopState();
    routes[`put /v2/me/loop/days/${TODAY}/log`] = b => loopState({ week: { logs: { [TODAY]: { ...b, at: new Date().toISOString() } } } });
    const user = userEvent.setup();
    at(`/platform/student/plan/day/${TODAY}`);
    await user.type(await screen.findByLabelText('What I learned'), 'Gravity pulls every mass towards every other mass.');
    await user.type(screen.getByLabelText(/What was hard/), 'The inverse square part');
    await user.click(screen.getByRole('button', { name: 'Good' }));
    await user.click(screen.getByRole('button', { name: 'Save my log' }));
    await waitFor(() => expect(calls.find(c => c.method === 'put').body).toEqual({ learned: 'Gravity pulls every mass towards every other mass.', hard: 'The inverse square part', confidence: 4 }));
    expect(await screen.findByText('Learning logged')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
  });

  it('takes notes on a lesson and makes revision notes, saying they come from the outline, not the video', async () => {
    const withNotes = notes => loopState({ week: { items: [unit('u1', TODAY, { title: 'Watch: gravity', notes })] } });
    routes['get /v2/me/loop'] = withNotes(null);
    routes['put /v2/me/loop/units/u1/notes'] = b => withNotes({ text: b.text, revision: null });
    routes['post /v2/me/loop/units/u1/revision'] = () => withNotes({ text: 'Mass attracts mass.', revision: { recap: 'Gravity is a pull between masses.', points: ['Every mass attracts', 'Weaker with distance'], terms: [{ term: 'Orbit', meaning: 'A curved path.' }], selfCheck: ['Why do planets orbit?'] } });
    const user = userEvent.setup();
    at(`/platform/student/plan/day/${TODAY}`);
    await user.click(await screen.findByRole('button', { name: /Take notes/ }));
    await user.type(screen.getByLabelText('My notes'), 'Mass attracts mass.');
    await user.click(screen.getByRole('button', { name: 'Save notes' }));
    await waitFor(() => expect(calls.find(c => c.method === 'put').body).toEqual({ text: 'Mass attracts mass.' }));
    await user.click(await screen.findByRole('button', { name: /Make revision notes/ }));
    expect(await screen.findByText('Gravity is a pull between masses.')).toBeInTheDocument();
    expect(screen.getByText('Orbit')).toBeInTheDocument();
    expect(screen.getByText(/not from the video itself/)).toBeInTheDocument();
  });

  it('a question in the week’s assessment says which day and video it comes from', async () => {
    routes['get /v2/me/loop'] = loopState({ loop: { assessment: { id: 'c1', stage: 'quiz', quiz: { status: 'open', questions: [{ id: 'q1', q: 'Why does the Moon orbit?', options: ['a', 'b', 'c', 'd'], from: { unitId: 'u1', title: 'Watch: gravity', date: '2026-10-20', video: 'Gravity explained' } }] }, task: null } } });
    at('/platform/student/plan/assessment');
    expect(await screen.findByText(/From Tuesday’s video: Gravity explained/)).toBeInTheDocument();
  });
});

describe('student: the learning library', () => {
  beforeEach(() => { signIn(); routes['get /v2/platform/student'] = bundle(); });
  const lib = { goal: { title: 'Astronaut', level: 'Fundamentals' },
    videos: [{ unitId: 'u1', step: 'Watch: gravity', type: 'learn', topic: 'Gravity', weekNumber: 1, date: TODAY, current: true, video: { videoId: 'dQw4w9WgXcQ', title: 'Gravity explained', channel: 'Great Teacher', minutes: 18, thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, status: 'done', rating: 4, hasNotes: true, hasRevision: false }],
    places: [{ id: 'p1', provider: 'Khan Academy', title: 'Gravity practice', url: 'https://www.khanacademy.org/x', login: false, what: 'Do set 1', topics: ['Gravity'] }],
    more: [],
    notes: [{ unitId: 'u1', title: 'Watch: gravity', date: TODAY, weekNumber: 1, goal: 'Astronaut', video: { title: 'Gravity explained', watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, text: 'Mass attracts mass, weaker with distance.', revision: null }, { unitId: 'u9', title: 'Watch: rockets', date: '2026-10-12', weekNumber: 0, goal: 'Astronaut', video: null, text: 'Thrust pushes back.', revision: null }] };

  it('shows lesson videos by week, searchable notes, and practice places', async () => {
    routes['get /v2/me/loop/library'] = { library: lib };
    const user = userEvent.setup();
    at('/platform/student/library');
    expect(await screen.findByText('Gravity explained')).toBeInTheDocument();
    expect(screen.getByText('Your notes')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /My notes/ }));
    await user.type(screen.getByLabelText('Search your notes'), 'thrust');
    expect(screen.getByText('Watch: rockets')).toBeInTheDocument();
    expect(screen.queryByText('Mass attracts mass, weaker with distance.')).toBeNull();
    await user.click(screen.getByRole('tab', { name: /Practice places/ }));
    expect(screen.getByRole('link', { name: /Khan Academy/ })).toHaveAttribute('href', 'https://www.khanacademy.org/x');
  });
});

describe('student: my situation drafts a full plan', () => {
  beforeEach(() => {
    signIn(); routes['get /v2/platform/student'] = bundle();
    routes['get /v2/me/context'] = { context: { budgetBand: null, exams: [], notInterested: [] } };
    routes['put /v2/me/context'] = b => ({ success: true, context: b });
    routes['get /v2/catalog/meta'] = { clusters: [{ id: 'computing_digital', label: 'Computing and digital' }] };
    routes['get /v2/me/situation'] = { situation: { about: { state: 'Rajasthan' }, draft: null } };
    routes['put /v2/me/situation'] = b => ({ success: true, situation: { about: b, draft: null } });
  });
  it('saves the situation first, then shows the plan stage by stage', async () => {
    routes['post /v2/me/situation/plan'] = { situation: { about: {}, draft: { summary: 'Your budget points to government colleges.', careers: ['Software Developers'], stages: [{ when: 'This month', focus: 'Explore', steps: ['Talk to your mentor'] }, { when: 'Class 11 and 12', focus: 'Prepare', steps: ['Take PCM'] }], exams: [{ name: 'JEE Main', forWhat: 'BTech', when: 'Class 12' }], money: ['Look for state scholarships'], backups: [{ title: 'Web Developers', why: 'Close skills' }], askMentor: ['Which colleges near me?'], at: new Date().toISOString() } } };
    const user = userEvent.setup();
    at('/platform/student/situation');
    expect(await screen.findByLabelText('State')).toHaveValue('Rajasthan');
    await user.click(screen.getByLabelText(/I will need a scholarship/));
    await user.click(screen.getByRole('button', { name: /Draft my full plan/ }));
    expect(await screen.findByText('Your budget points to government colleges.')).toBeInTheDocument();
    expect(screen.getByText('Class 11 and 12')).toBeInTheDocument();
    expect(screen.getByText('JEE Main')).toBeInTheDocument();
    const order = calls.filter(c => ['put', 'post'].includes(c.method)).map(c => c.url);
    expect(order).toEqual(['/v2/me/context', '/v2/me/situation', '/v2/me/situation/plan']);
    expect(calls.find(c => c.method === 'put' && c.url === '/v2/me/situation').body.needScholarship).toBe(true);
  });
  it('without a career to plan for, says how to add one', async () => {
    routes['post /v2/me/situation/plan'] = fail(409, 'NEED_CAREER');
    const user = userEvent.setup();
    at('/platform/student/situation');
    await user.click(await screen.findByRole('button', { name: /Draft my full plan/ }));
    expect(await screen.findByRole('link', { name: 'your shortlist' })).toBeInTheDocument();
  });
});

describe('mentor: the desk', () => {
  const row = (id, name, over = {}) => ({ id, name, grade: '10', track: 'senior', consent: 'granted', parent: 'linked', lastLoginAt: new Date().toISOString(), tasks: { total: 2, done: 1, open: 1, overdue: 0, review: 1 }, assessment: { state: 'submitted', completedAt: null, hollandCode: null }, ...over });
  beforeEach(() => { signIn('mentor'); routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor' }, students: [row('s1', 'Asha Verma'), row('s2', 'Aman Rao')], alerts: [], sessions: [] }; });

  it('reviews a handed-in task: approve with feedback', async () => {
    routes['get /v2/platform/mentor/tasks'] = { students: [{ id: 's1', name: 'Asha Verma', grade: '10' }], tasks: [{ ...task({ status: 'review', studentNote: 'All ten done.' }), studentId: 's1', studentName: 'Asha Verma' }] };
    routes['patch /v2/platform/tasks/t1'] = { success: true };
    const user = userEvent.setup();
    at('/platform/mentor/tasks');
    expect(await screen.findByText(/All ten done/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Feedback on Python loops set'), 'Clear and correct.');
    await user.click(screen.getByRole('button', { name: /Approve, mark done/ }));
    await waitFor(() => expect(calls.find(c => c.method === 'patch')).toMatchObject({ url: '/v2/platform/tasks/t1', body: { status: 'done', feedback: 'Clear and correct.' } }));
  });

  it('gives one task to everyone at once', async () => {
    routes['get /v2/platform/mentor/tasks'] = { students: [{ id: 's1', name: 'Asha Verma', grade: '10' }, { id: 's2', name: 'Aman Rao', grade: '10' }], tasks: [] };
    routes['post /v2/platform/mentor/tasks'] = b => ({ success: true, count: b.studentIds.length });
    const user = userEvent.setup();
    at('/platform/mentor/tasks');
    await user.click(await screen.findByRole('button', { name: /New task/ }));
    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByRole('button', { name: /Everyone/ }));
    await user.type(within(drawer).getByLabelText('Task'), 'Revise Newton’s laws');
    await user.click(within(drawer).getByRole('button', { name: 'Assign to 2 students' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post').body).toMatchObject({ studentIds: ['s1', 's2'], title: 'Revise Newton’s laws', priority: 'medium' }));
  });

  it('the assistant proposes; nothing happens until Confirm; a proposal it cannot do says why', async () => {
    routes['post /v2/platform/mentor/assistant'] = { reply: 'Here is what I suggest.', actions: [
      { id: 'a1', type: 'assign_task', students: [{ id: 's1', name: 'Asha Verma' }], title: 'Revise chapter 4', notes: '', subject: 'Science', due: day(3), priority: 'high' },
      { id: 'a2', type: 'add_note', students: [], text: 'x', shareWithParent: false, shareWithStudent: false, problem: 'Choose a student you mentor.' }] };
    routes['post /v2/platform/mentor/assistant/act'] = { success: true, done: 'Task "Revise chapter 4" given to Asha Verma.' };
    const user = userEvent.setup();
    at('/platform/mentor/assistant');
    await user.type(await screen.findByLabelText('Message the assistant'), 'Give Asha a revision task');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Here is what I suggest.')).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/platform/mentor/assistant').body.messages).toEqual([{ role: 'mentor', text: 'Give Asha a revision task' }]);
    expect(calls.some(c => c.url === '/v2/platform/mentor/assistant/act')).toBe(false);
    expect(screen.getByText(/Cannot do this as it stands: Choose a student you mentor/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Confirm/ })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Confirm/ }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/mentor/assistant/act').body.action).toMatchObject({ type: 'assign_task', studentIds: ['s1'], title: 'Revise chapter 4' }));
    expect(await screen.findByText(/given to Asha Verma/)).toBeInTheDocument();
  });

  it('a student’s daily log, and a weekly summary drafted, edited and shared', async () => {
    routes['get /v2/platform/mentor/students/s1'] = { student: row('s1', 'Asha Verma'), loop: null, logs: [{ date: TODAY, weekNumber: 1, learned: 'Orbits are falling sideways.', hard: 'distance', confidence: 2 }], situation: null, tasks: [], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [] };
    routes['get /v2/platform/mentor/students/s1/digest'] = { digest: { from: '2026-10-19', to: TODAY, plan: null, logs: [], tasks: { open: 1, overdue: 0, review: 0, doneThisWeek: [], overdueTitles: [] }, sessions: { last: null, next: null } } };
    routes['post /v2/platform/mentor/students/s1/summary/draft'] = { draft: { title: 'A steady week', text: 'You worked well this week and explained orbits clearly.', actions: ['Finish the practice'] } };
    routes['post /v2/platform/mentor/students/s1/notes'] = { success: true };
    const user = userEvent.setup();
    at('/platform/mentor/students?open=s1');
    const dialog = await screen.findByRole('dialog');
    await user.click(await within(dialog).findByRole('tab', { name: /Daily log/ }));
    expect(within(dialog).getByText('Orbits are falling sideways.')).toBeInTheDocument();
    expect(within(dialog).getByText('Shaky')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('tab', { name: 'This week' }));
    await user.click(await within(dialog).findByRole('button', { name: /Draft it for me/ }));
    const text = await within(dialog).findByLabelText(/Summary \(edit before saving\)/);
    expect(text.value).toMatch(/For next week:\n• Finish the practice/);
    await user.type(text, ' Proud of you.');
    await user.click(within(dialog).getByRole('button', { name: 'Save summary' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/mentor/students/s1/notes').body).toMatchObject({ kind: 'summary', title: 'A steady week', sharedWithStudent: true, sharedWithParent: true, text: expect.stringMatching(/Proud of you\.$/) }));
  });
});

describe('parent: sets a task with a priority', () => {
  it('posts it for the chosen child', async () => {
    signIn('parent', { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' });
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' }, children: [{ id: 's1', name: 'Asha Verma', grade: '10', tasks: { total: 0, done: 0, open: 0, overdue: 0 }, assessment: { state: 'not_started' } }] };
    routes['get /v2/platform/parent/children/s1'] = { child: { id: 's1', name: 'Asha Verma', grade: '10', assessment: { state: 'not_started' }, tasks: { total: 0, done: 0, open: 0, overdue: 0 } }, mentor: null, loop: null, tasks: [], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [] };
    routes['post /v2/platform/parent/children/s1/tasks'] = { success: true };
    const user = userEvent.setup();
    at('/platform/parent/tasks');
    await user.click(await screen.findByRole('button', { name: /Set a task for Asha/ }));
    await user.type(screen.getByLabelText(/What should they do/), 'Read for 20 minutes');
    await user.click(screen.getByRole('radio', { name: 'High' }));
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post')).toMatchObject({ url: '/v2/platform/parent/children/s1/tasks', body: { title: 'Read for 20 minutes', priority: 'high' } }));
  });
});
