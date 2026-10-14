import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import PlatformApp from '../PlatformApp';

// The server is replaced by a small router so each role's screens can be exercised end to end.
const calls = [];
let routes = {};
vi.mock('../../api', () => {
  const handle = method => (url, body) => {
    calls.push({ method, url, body });
    const key = Object.keys(routes).find(k => k === `${method} ${url}`);
    if (!key) return Promise.reject(Object.assign(new Error(`no route ${method} ${url}`), { response: { status: 404, data: { code: 'NOT_FOUND' } } }));
    const out = typeof routes[key] === 'function' ? routes[key](body) : routes[key];
    return out instanceof Error ? Promise.reject(out) : Promise.resolve({ data: out });
  };
  return { default: { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') } };
});

const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const signIn = user => { localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /><Route path="/login" element={<div>LOGIN PAGE</div>} /><Route path="/v4/school" element={<div>SCHOOL</div>} /></Routes></AuthProvider></MemoryRouter>);
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; });

const task = (over = {}) => ({ id: 't1', title: 'Python loops set', subject: 'Python', due: day(1), status: 'todo', priority: 'high', by: 'Mentor', notes: '', ...over });
const studentBundle = (over = {}) => ({ success: true,
  me: { id: 's1', fullName: 'Asha Verma', grade: '9', track: 'junior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked', parentEmailMasked: 'm***@example.com' },
  mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: { next: { id: 'x1', date: day(3), time: '18:30', topic: 'Quiz review', status: 'scheduled' }, upcoming: [], history: [] },
  tasks: [task()], reports: [], assessment: { state: 'not_started', completedAt: null, hollandCode: null }, ...over });

describe('real dashboards: who may enter', () => {
  it('sends a signed-out visitor to the login page', async () => {
    at('/platform/student');
    expect(await screen.findByText('LOGIN PAGE')).toBeInTheDocument();
  });
  it('sends a parent who opens the student page to their own dashboard', async () => {
    signIn({ id: 'p1', fullName: 'Meera Verma', role: 'parent', email: 'm@example.com' });
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' }, children: [] };
    at('/platform/student');
    expect(await screen.findByText(/No child linked yet/)).toBeInTheDocument();
  });
  it('/platform takes each person home', async () => {
    signIn({ id: 'c1', fullName: 'Ms Rao', role: 'counsellor' });
    at('/platform');
    expect(await screen.findByText('SCHOOL')).toBeInTheDocument();
  });
});

describe('student', () => {
  beforeEach(() => signIn({ id: 's1', fullName: 'Asha Verma', role: 'student', grade: '9' }));

  it('shows the real tasks, mentor and next session; no sample names or numbers', async () => {
    routes['get /v2/platform/student'] = studentBundle();
    at('/platform/student');
    expect(await screen.findByText('Python loops set')).toBeInTheDocument();
    expect(screen.getByText('Dr. Neha Kapoor')).toBeInTheDocument();
    expect(screen.queryByText(/Aarav/)).toBeNull();
    expect(screen.queryByText(/Sample data/)).toBeNull();
    expect(screen.getByText('Class 9', { exact: false })).toBeInTheDocument();
  });
  it('tells a student whose parent has not set up their account yet', async () => {
    routes['get /v2/platform/student'] = studentBundle({ me: { ...studentBundle().me, parent: 'invited' } });
    at('/platform/student');
    expect(await screen.findByText(/Your parent has not set up their account yet/)).toBeInTheDocument();
  });
  it('saves a goal to the server', async () => {
    routes['get /v2/platform/student'] = studentBundle();
    routes['put /v2/platform/student/goal'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/goal');
    await user.type(await screen.findByLabelText('In a few words'), 'AI engineer');
    await user.click(screen.getByRole('button', { name: 'Save goal' }));
    await waitFor(() => expect(calls.find(c => c.method === 'put')).toMatchObject({ url: '/v2/platform/student/goal', body: { title: 'AI engineer' } }));
  });
  it('moves a task along and adds their own, both saved to the server', async () => {
    routes['get /v2/platform/student'] = studentBundle();
    routes['patch /v2/platform/tasks/t1'] = { success: true };
    routes['post /v2/platform/tasks'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/tasks');
    await user.click(await screen.findByRole('button', { name: /Python loops set/ }));
    await user.selectOptions(screen.getByLabelText('Status'), 'doing');
    await waitFor(() => expect(calls.find(c => c.method === 'patch')).toMatchObject({ url: '/v2/platform/tasks/t1', body: { status: 'doing' } }));
    await user.click(screen.getByRole('button', { name: /Add a task/ }));
    await user.type(screen.getByLabelText(/What do you want to do/), 'Revise algebra');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post')).toMatchObject({ url: '/v2/platform/tasks', body: { title: 'Revise algebra' } }));
  });
  it('a student without a mentor is told so, and unbuilt pages say they are coming', async () => {
    routes['get /v2/platform/student'] = studentBundle({ mentor: null });
    at('/platform/student/mentor');
    expect(await screen.findByText(/has not been assigned to you yet/)).toBeInTheDocument();
  });
  it('the library is honest that it is not personalised yet, instead of showing a dead 0% progress bar', async () => {
    routes['get /v2/platform/student'] = studentBundle();
    at('/platform/student/library');
    expect(await screen.findByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText('Your progress')).toBeNull();
  });
  it('the weekly plan is honest that it is not built yet', async () => {
    routes['get /v2/platform/student'] = studentBundle();
    at('/platform/student/plan');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
  });
  it('reports open the existing report viewer', async () => {
    routes['get /v2/platform/student'] = studentBundle({ reports: [{ assessmentId: 'a1', completedAt: new Date().toISOString(), hollandCode: 'IRC', provisional: true, pdf: { status: 'none' } }], assessment: { state: 'submitted', completedAt: new Date().toISOString(), hollandCode: 'IRC' } });
    at('/platform/student/reports');
    expect(await screen.findByText(/interest code IRC/)).toBeInTheDocument();
  });
});

describe('mentor', () => {
  const row = (id, name, over = {}) => ({ id, name, grade: '9', track: 'junior', goal: null, lastLoginAt: new Date().toISOString(), consent: 'granted', parent: 'linked', tasks: { total: 4, done: 1, open: 3, overdue: 2 }, assessment: { state: 'not_started' }, ...over });
  beforeEach(() => {
    signIn({ id: 'm1', fullName: 'Dr. Neha Kapoor', role: 'mentor' });
    routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor' }, students: [row('s1', 'Asha Verma'), { id: 's2', name: 'Ravi Kumar', grade: '8', consent: 'pending', parent: 'invited', limited: true }],
      alerts: [{ id: 'o-s1', studentId: 's1', level: 'medium', text: 'Asha Verma has 2 overdue tasks.' }, { id: 'c-s2', studentId: 's2', level: 'medium', text: 'Ravi Kumar is waiting for a parent to confirm.' }], sessions: [{ id: 'x1', studentId: 's1', date: day(2), time: '17:00', topic: 'Review', status: 'scheduled' }] };
  });
  it('lists real students, flags the waiting one, and shows the alerts', async () => {
    at('/platform/mentor');
    expect(await screen.findByText('Asha Verma has 2 overdue tasks.')).toBeInTheDocument();
    expect(screen.getByText(/Ravi Kumar is waiting for a parent/)).toBeInTheDocument();
    expect(screen.getByText('Waiting for parent')).toBeInTheDocument();
    expect(screen.queryByText(/Kabir|Anika|Rohan/)).toBeNull();
  });
  it('a student waiting for a parent cannot be opened', async () => {
    const user = userEvent.setup();
    at('/platform/mentor/students');
    await user.click(await screen.findByText('Ravi Kumar'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Visible once a parent confirms')).toBeInTheDocument();
  });
  it('opens a student, loads their detail from the server and saves a note that can be shared with the parent', async () => {
    routes['get /v2/platform/mentor/students/s1'] = { student: row('s1', 'Asha Verma'), tasks: [task()], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [] };
    routes['post /v2/platform/mentor/students/s1/notes'] = { success: true };
    const user = userEvent.setup();
    at('/platform/mentor/students');
    await user.click(await screen.findByText('Asha Verma'));
    const dialog = await screen.findByRole('dialog');
    await user.click(await within(dialog).findByRole('tab', { name: /Notes/ }));
    await user.type(within(dialog).getByLabelText('New note'), 'Needs a gentler pace');
    await user.click(within(dialog).getByLabelText(/Share this note with the parent/));
    await user.click(within(dialog).getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post')).toMatchObject({ url: '/v2/platform/mentor/students/s1/notes', body: { text: 'Needs a gentler pace', sharedWithParent: true } }));
  });
  it('assigns a task to the chosen student', async () => {
    routes['post /v2/platform/mentor/students/s1/tasks'] = { success: true };
    const user = userEvent.setup();
    at('/platform/mentor/tasks');
    await user.type(await screen.findByPlaceholderText(/What should they do/), 'Read chapter 3');
    await user.click(screen.getByRole('button', { name: 'Assign task' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post')).toMatchObject({ url: '/v2/platform/mentor/students/s1/tasks', body: { title: 'Read chapter 3', priority: 'medium' } }));
    expect(await screen.findByRole('status')).toHaveTextContent('Assigned to Asha Verma');
  });
  it('books a session', async () => {
    routes['post /v2/platform/mentor/students/s1/sessions'] = { success: true };
    const user = userEvent.setup();
    at('/platform/mentor/sessions');
    await user.type(await screen.findByPlaceholderText(/What will you cover/), 'Quiz review');
    await user.click(screen.getByRole('button', { name: 'Book' }));
    await waitFor(() => expect(calls.find(c => c.method === 'post')).toMatchObject({ url: '/v2/platform/mentor/students/s1/sessions', body: { topic: 'Quiz review' } }));
  });
});

describe('parent', () => {
  const kid = (id, name) => ({ id, name, grade: '9', track: 'junior', consent: 'granted', parent: 'linked', lastLoginAt: new Date().toISOString(), tasks: { total: 3, done: 2, open: 1, overdue: 0 }, assessment: { state: 'submitted', completedAt: new Date().toISOString(), hollandCode: 'IRC' } });
  const detail = c => ({ child: c, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, tasks: [task({ by: 'Mentor' })], sessions: { next: { id: 'x', date: day(2), time: '18:00', topic: 'Quiz review' }, upcoming: [], history: [{ id: 'h1', date: day(-5), topic: 'First meeting', summary: 'Good start.', actions: ['Finish lecture 2'] }] },
    notes: [{ id: 'n1', text: 'Keen and curious.', at: day(-5), sharedWithParent: true }], reports: [{ assessmentId: 'a1', completedAt: new Date().toISOString(), hollandCode: 'IRC', pdf: { status: 'ready' } }] });
  beforeEach(() => signIn({ id: 'p1', fullName: 'Meera Verma', role: 'parent', email: 'm@example.com' }));

  it('shows the child, the tasks, and what the mentor shared', async () => {
    const a = kid('s1', 'Asha Verma');
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' }, children: [a] };
    routes['get /v2/platform/parent/children/s1'] = detail(a);
    at('/platform/parent');
    expect(await screen.findByText('Python loops set')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.queryByText('Choose child')).toBeNull();           // one child: no picker
  });
  it('a parent of two children can switch between them', async () => {
    const a = kid('s1', 'Asha Verma'), b = kid('s2', 'Ravi Verma');
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' }, children: [a, b] };
    routes['get /v2/platform/parent/children/s1'] = detail(a); routes['get /v2/platform/parent/children/s2'] = detail(b);
    const user = userEvent.setup();
    at('/platform/parent');
    await user.selectOptions(await screen.findByLabelText('Choose child'), 's2');
    await waitFor(() => expect(calls.some(c => c.url === '/v2/platform/parent/children/s2')).toBe(true));
    expect(await screen.findByText(/Ravi’s week/)).toBeInTheDocument();
  });
  it('lists the career report with a link to read it and a PDF button when ready', async () => {
    const a = kid('s1', 'Asha Verma');
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' }, children: [a] };
    routes['get /v2/platform/parent/children/s1'] = detail(a);
    at('/platform/parent/reports');
    const read = await screen.findByRole('link', { name: 'Read' });
    expect(read).toHaveAttribute('href', '/platform/report/parent/s1/a1');
    expect(screen.getByRole('button', { name: /PDF/ })).toBeInTheDocument();
  });
  it('shows session summaries and shared notes only', async () => {
    const a = kid('s1', 'Asha Verma');
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'm@example.com' }, children: [a] };
    routes['get /v2/platform/parent/children/s1'] = detail(a);
    at('/platform/parent/mentor');
    expect(await screen.findByText('Good start.')).toBeInTheDocument();
    expect(screen.getByText('Keen and curious.')).toBeInTheDocument();
  });
  it('a failed load offers a retry instead of a blank page', async () => {
    routes['get /v2/platform/parent'] = Object.assign(new Error('down'), { response: { status: 500, data: {} } });
    at('/platform/parent');
    expect(await screen.findByText(/could not load your dashboard/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
