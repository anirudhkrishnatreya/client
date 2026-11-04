import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Live updates (a fake stream stands in for the server's), the bell, and sessions as real meetings: answer-by times, offered times,
// moving, the Join button, free times to pick from, the mentor's link and hours, and what a parent sees.
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

class FakeStream {
  constructor(url) { this.url = url; this.listeners = {}; FakeStream.all.push(this); }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  close() { this.closed = true; }
  emit(type, data) { (this.listeners[type] || []).forEach(fn => fn({ data: JSON.stringify(data) })); }
}
FakeStream.all = [];

const Where = () => <span data-testid="where">{useLocation().pathname}{useLocation().search}</span>;
const signIn = (role = 'student') => { const user = { id: role === 'mentor' ? 'm1' : role === 'parent' ? 'p1' : 's1', fullName: role === 'mentor' ? 'Dr. Neha Kapoor' : role === 'parent' ? 'Meera Verma' : 'Asha Verma', role, grade: '10', email: 'x@example.com' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<><PlatformApp /><Where /></>} /></Routes></AuthProvider></MemoryRouter>);
const H = 3600000;
const NOSESSIONS = { next: null, upcoming: [], history: [], requested: [], writeup: [], closed: [], declined: [] };
const sess = (over = {}) => { const start = over.start || new Date(Date.now() + 26 * H).toISOString(); const end = new Date(Date.parse(start) + 45 * 60000).toISOString();
  return { id: 'x1', studentId: 's1', mentorId: 'm1', start, end, durationMin: 45, date: start.slice(0, 10), time: '17:30', timeTbd: false, when: 'Thu, 6 Nov, 5:30 pm', status: 'scheduled', phase: 'upcoming', topic: '', note: '', requestedBy: 'mentor',
    answerBy: null, askedStart: null, change: null, closed: null, missedBy: null, meetingUrl: null, hasLink: false, joinFrom: new Date(Date.parse(start) - 600000).toISOString(), joinUntil: new Date(Date.parse(end) + 900000).toISOString(),
    agenda: [], timeline: [], summary: '', actions: [], tasksCreated: false, ...over }; };
const bundle = (over = {}) => ({ success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: NOSESSIONS, tasks: [], reports: [], assessment: { state: 'submitted' }, mentorNotes: [], inbox: { unread: 0 }, mentorRequest: null, ...over });
const msg = (id, from, text) => ({ id, from, text, at: new Date().toISOString(), read: false, ref: null });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; FakeStream.all = []; });
afterEach(() => vi.unstubAllGlobals());

describe('live updates', () => {
  it('a reply appears without a refresh, and the page reloads when a session changes', async () => {
    vi.stubGlobal('EventSource', FakeStream);
    signIn();
    let home = 0, messages = [msg('1', 'student', 'Can we talk?')];
    routes['post /v2/live/ticket'] = { ticket: 'TICKET1' };
    routes['get /v2/platform/student'] = () => { home += 1; return bundle(); };
    routes['get /v2/platform/student/messages'] = () => ({ messages });
    at('/platform/student/mentor');
    expect(await screen.findByText('Can we talk?')).toBeInTheDocument();
    await waitFor(() => expect(FakeStream.all).toHaveLength(1));
    const stream = FakeStream.all[0];
    expect(stream.url).toBe('/api/v2/live?ticket=TICKET1');
    act(() => stream.emit('ready', {}));
    messages = [...messages, msg('2', 'mentor', 'Yes, Saturday at 5?')];
    act(() => stream.emit('message.new', { studentId: 's1', message: messages[1] }));
    expect(await screen.findByText('Yes, Saturday at 5?')).toBeInTheDocument();
    const before = home;
    act(() => stream.emit('session.changed', { id: 'x1', status: 'scheduled' }));
    await waitFor(() => expect(home).toBeGreaterThan(before));
  });

  it('no stream in this browser: nothing breaks, and no ticket is asked for', async () => {
    signIn();
    routes['get /v2/platform/student'] = bundle();
    routes['get /v2/platform/student/messages'] = { messages: [] };
    at('/platform/student/mentor');
    expect(await screen.findByText(/Ask Dr\. Neha Kapoor anything|Ask Neha anything/)).toBeInTheDocument();
    expect(calls.some(c => c.url === '/v2/live/ticket')).toBe(false);
  });
});

describe('the bell', () => {
  it('lists what happened; an item opens its page; mark all read; emails can be turned off', async () => {
    signIn('mentor');
    routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor', mentorCode: 'K7M2QX', meetingUrl: 'https://meet.google.com/abc-defg-hij' }, students: [], alerts: [], sessions: [], sessionRequests: [], requests: [], inbox: { unread: 0 }, board: [] };
    routes['get /v2/platform/notifications'] = { notifications: [
      { id: 'n1', kind: 'session', title: 'Asha Verma asked for a session', text: 'Thu, 6 Nov, 5:30 pm', link: 'sessions?session=x1', at: new Date().toISOString(), read: false },
      { id: 'n2', kind: 'message', title: 'New message from Aman Rao', text: 'Can we move it?', link: 'messages?student=s2', at: new Date(Date.now() - 2 * H).toISOString(), read: true }], unread: 1, emails: true };
    routes['post /v2/platform/notifications/read'] = { success: true, notifications: [], unread: 0 };
    routes['put /v2/platform/me/emails'] = { success: true, emails: false };
    const user = userEvent.setup();
    at('/platform/mentor');
    const bell = await screen.findByRole('button', { name: 'Notifications, 1 new' });
    await user.click(bell);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('Can we move it?')).toBeInTheDocument();
    await user.click(within(menu).getByLabelText('Email me about messages and sessions'));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/me/emails').body).toEqual({ on: false }));
    await user.click(within(menu).getByRole('menuitem', { name: /asked for a session/ }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/platform/mentor/sessions?session=x1'));
    expect(calls.find(c => c.url === '/v2/platform/notifications/read').body).toEqual({ ids: ['n1'] });
  });
});

describe('student: sessions as real meetings', () => {
  beforeEach(() => { signIn(); routes['get /v2/platform/student/messages'] = { messages: [] }; });

  it('a time the mentor offered: accept it; a request shows when the mentor must answer by', async () => {
    const offered = sess({ id: 'p1', status: 'proposed', phase: null, askedStart: new Date(Date.now() + 20 * H).toISOString(), answerBy: new Date(Date.now() + 24 * H).toISOString() });
    const waiting = sess({ id: 'r1', status: 'requested', phase: null, start: new Date(Date.now() + 50 * H).toISOString(), answerBy: new Date(Date.now() + 48 * H).toISOString() });
    routes['get /v2/platform/student'] = bundle({ sessions: { ...NOSESSIONS, requested: [offered, waiting] } });
    routes['post /v2/platform/sessions/p1/respond'] = { success: true };
    routes['post /v2/platform/sessions/r1/withdraw'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/mentor');
    expect(await screen.findByText('New time offered')).toBeInTheDocument();
    expect(screen.getByText(/Your mentor answers by/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept this time' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/p1/respond').body).toEqual({ accept: true }));
    await user.click(screen.getAllByRole('button', { name: 'Withdraw' })[1]);
    await waitFor(() => expect(calls.some(c => c.url === '/v2/platform/sessions/r1/withdraw')).toBe(true));
  });

  it('Join opens 10 minutes before; a move the mentor asked for can be accepted; cancelling needs a reason', async () => {
    const soon = sess({ id: 'j1', phase: 'live', start: new Date(Date.now() + 5 * 60000).toISOString(), meetingUrl: 'https://meet.google.com/abc-defg-hij', hasLink: true });
    const later = sess({ id: 'j2', start: new Date(Date.now() + 50 * H).toISOString(), meetingUrl: 'https://meet.google.com/abc-defg-hij', hasLink: true,
      change: { start: new Date(Date.now() + 52 * H).toISOString(), durationMin: 45, by: 'mentor', note: 'Clash with a class', answerBy: new Date(Date.now() + 40 * H).toISOString(), when: 'Sat, 8 Nov, 7:30 pm' } });
    routes['get /v2/platform/student'] = bundle({ sessions: { ...NOSESSIONS, next: soon, upcoming: [soon, later] } });
    routes['post /v2/platform/sessions/j2/respond'] = { success: true };
    routes['post /v2/platform/sessions/j1/cancel'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/mentor');
    const joins = await screen.findAllByRole('link', { name: /Join now/ });                       // the banner at the top, and the card
    expect(joins).toHaveLength(2);
    joins.forEach(j => expect(j).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij'));
    expect(screen.getByText(/Your session with Neha starts at/)).toBeInTheDocument();
    expect(screen.getByText('Join opens 10 min before')).toBeInTheDocument();
    expect(screen.getByText(/asked to move this to/)).toHaveTextContent('Clash with a class');
    await user.click(screen.getByRole('button', { name: 'Accept the new time' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/j2/respond').body).toEqual({ accept: true }));
    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);
    expect(screen.getByText(/late cancellation/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel the session' })).toBeDisabled();
    await user.type(screen.getByLabelText('Why are you cancelling?'), 'I am unwell');
    await user.click(screen.getByRole('button', { name: 'Cancel the session' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/j1/cancel').body).toEqual({ reason: 'I am unwell' }));
  });

  it('with the mentor\'s hours set, picks one of the free times', async () => {
    routes['get /v2/platform/student'] = bundle();
    const start = new Date(Date.now() + 30 * H).toISOString();
    routes['get /v2/platform/student/slots'] = { hoursSet: true, length: 30, autoConfirm: true, days: [{ date: start.slice(0, 10), label: 'Fri, 7 Nov', times: [{ start, time: '17:00' }] }] };
    routes['post /v2/platform/student/sessions'] = { success: true, session: sess({ status: 'scheduled' }) };
    const user = userEvent.setup();
    at('/platform/student/mentor');
    await user.click((await screen.findAllByRole('button', { name: /Ask for a session/ }))[0]);
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText('Fri, 7 Nov')).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Book this time' })).toBeDisabled();
    await user.click(within(drawer).getAllByRole('button', { pressed: false })[0]);
    await user.click(within(drawer).getByRole('button', { name: 'Book this time' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/student/sessions').body).toMatchObject({ start, durationMin: 30 }));
    expect(await screen.findByText(/Booked\. It is in your sessions/)).toBeInTheDocument();
  });
});

describe('mentor: requests, link and hours', () => {
  beforeEach(() => signIn('mentor'));
  const row = { id: 's1', name: 'Asha Verma', grade: '10', track: 'senior', consent: 'granted', parent: 'linked', lastLoginAt: new Date().toISOString(), tasks: { total: 0, done: 0, open: 0, overdue: 0, review: 0 }, assessment: { state: 'submitted', completedAt: null } };
  const home = over => ({ me: { id: 'm1', fullName: 'Dr. Neha Kapoor', mentorCode: 'K7M2QX', meetingUrl: '' }, students: [row], alerts: [], sessions: [], sessionRequests: [], requests: [], inbox: { unread: 0 }, board: [], ...over });

  it('offers another time for a request, and is reminded to add a meeting link', async () => {
    routes['get /v2/platform/mentor'] = home({ sessionRequests: [sess({ id: 'q1', status: 'requested', phase: null, requestedBy: 'student', answerBy: new Date(Date.now() + 20 * H).toISOString() })] });
    routes['post /v2/platform/sessions/q1/propose'] = { success: true };
    const user = userEvent.setup();
    at('/platform/mentor/sessions');
    expect(await screen.findByText(/Add your meeting link\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Offer another time' }));
    fireEvent.change(within(screen.getByRole('button', { name: 'Offer this time' }).closest('form')).getByLabelText('Time'), { target: { value: '18:00' } });
    await user.click(screen.getByRole('button', { name: 'Offer this time' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/platform/sessions/q1/propose').body).toMatchObject({ time: '18:00', durationMin: 45 }));
    expect(await screen.findByText('New time sent to Asha Verma.')).toBeInTheDocument();
  });

  it('saves the meeting link and weekly free hours', async () => {
    routes['get /v2/platform/mentor'] = home();
    routes['get /v2/platform/mentor/settings'] = { settings: { meetingUrl: '', availability: [], away: [], length: 45, autoConfirm: false } };
    routes['put /v2/platform/mentor/settings'] = { success: true, settings: {} };
    const user = userEvent.setup();
    at('/platform/mentor/sessions');
    await user.click(await screen.findByRole('button', { name: /Meeting link and hours/ }));
    const drawer = await screen.findByRole('dialog');
    await user.type(await within(drawer).findByLabelText('Your meeting link'), 'https://meet.google.com/abc-defg-hij');
    await user.click(within(drawer).getByRole('button', { name: /Add hours/ }));
    await user.click(within(drawer).getByLabelText(/Confirm a booking in these hours straight away/));
    await user.click(within(drawer).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(calls.find(c => c.method === 'put').body).toEqual({ meetingUrl: 'https://meet.google.com/abc-defg-hij', availability: [{ day: 1, from: '17:00', to: '19:00' }], away: [], length: 45, autoConfirm: true }));
  });
});

describe('parent: sessions', () => {
  it('sees when and the status, never a join link', async () => {
    signIn('parent');
    const next = sess({ status: 'scheduled', phase: 'soon', hasLink: true, meetingUrl: null, start: new Date(Date.now() + 5 * 60000).toISOString() });
    routes['get /v2/platform/parent'] = { me: { id: 'p1', fullName: 'Meera Verma', email: 'x@example.com' }, children: [{ id: 's1', name: 'Asha Verma', grade: '10', tasks: { total: 0, done: 0, open: 0, overdue: 0 }, assessment: { state: 'submitted' } }] };
    routes['get /v2/platform/parent/children/s1'] = { child: { id: 's1', name: 'Asha Verma', grade: '10', assessment: { state: 'submitted' }, tasks: {} }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, loop: null, tasks: [], sessions: { ...NOSESSIONS, next, upcoming: [next] }, notes: [], reports: [], messages: [] };
    at('/platform/parent/mentor');
    expect(await screen.findByText('Starting soon')).toBeInTheDocument();
    expect(screen.getByText(/Joined online with the link the mentor shares/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Join/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });
});
