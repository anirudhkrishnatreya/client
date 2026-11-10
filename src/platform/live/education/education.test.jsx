import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import F from '../observe/__fixtures__/observe.json';

// Where the student is in their studies: the "About me" page, the question that appears when it needs checking, the mentor's and
// the school's correction, and the plan that is offered a rebuild. The server is a small scripted router.
const calls = [];
let routes = {};
vi.mock('../../../api', () => {
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
beforeAll(async () => { vi.stubEnv('VITE_LOOP', 'on'); PlatformApp = (await import('../../PlatformApp')).default; });

const signIn = user => { localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);
const posted = (url, method = 'post') => calls.filter(c => c.method === method && c.url === url);
const fail = (status, code, details) => Object.assign(new Error(code), { response: { status, data: { code, error: code, details } } });
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; });

const OPTIONS = {
  stages: [{ id: 'school.12', label: 'Class 12', group: 'School' }, { id: 'ug.2', label: 'College, year 2', group: 'College' }, { id: 'ug.3', label: 'College, year 3', group: 'College' }, { id: 'working', label: 'Working professional', group: 'Work' }],
  programmes: [{ id: 'btech', label: 'BTech / BE', level: 'ug', years: 4 }, { id: 'bsc', label: 'BSc', level: 'ug', years: 3 }, { id: 'mba', label: 'MBA / PGDM', level: 'pg', years: 2 }],
  streams: [{ id: 'science_pcm', label: 'Science (PCM)' }, { id: 'commerce', label: 'Commerce' }]
};
const education = (over = {}) => ({ stage: 'ug.2', label: 'College, year 2', phase: 'build', kind: 'ug', programme: 'btech', field: 'Computer Science', stream: null, status: 'stated', source: 'signup', confidence: 'high', stale: false, needs: [], conflicts: [], sources: [{ source: 'signup', stage: 'ug.2', at: '2026-09-01T00:00:00.000Z' }], ...over });
const view = (over = {}, extra = {}) => { const e = education(over); return { success: true, context: { education: e, intent: { switching: false }, needsConfirmation: e.needs.length > 0 }, log: [], options: OPTIONS, ...extra }; };
const student = { id: 's1', fullName: 'Meera Iyer', role: 'student', grade: 'ug2' };
const bundle = { success: true, me: { id: 's1', fullName: 'Meera Iyer', grade: 'ug2', track: 'college', education: { label: 'College, year 2' }, goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: null, sessions: { next: null, upcoming: [], history: [] }, tasks: [], reports: [], assessment: { state: 'not_started' }, mentorNotes: [] };

describe('About me', () => {
  beforeEach(() => { signIn(student); routes['get /v2/platform/student'] = bundle; });

  it('shows where they are, how sure we are, where each part came from, and what has changed', async () => {
    routes['get /v2/me/education'] = view({ status: 'confirmed', source: 'student', sources: [{ source: 'student', stage: 'ug.2', at: '2026-11-01T00:00:00.000Z' }, { source: 'signup', stage: 'ug.2', at: '2026-09-01T00:00:00.000Z' }] }, { log: [{ at: '2026-11-01T00:00:00.000Z', role: 'student', name: 'Meera Iyer', change: 'Class or year: College, year 2' }] });
    at('/platform/student/about');
    expect(await screen.findByRole('heading', { name: 'College, year 2' })).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Set by: you.')).toBeInTheDocument();
    expect(screen.getByText('When you signed up')).toBeInTheDocument();
    expect(screen.getByText(/Class or year: College, year 2/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yes, that is right' })).toBeNull();                 // nothing to confirm
  });

  it('"Yes, that is right" confirms what we have', async () => {
    routes['get /v2/me/education'] = view();
    routes['post /v2/me/education/confirm'] = view({ status: 'confirmed', source: 'student' });
    const user = userEvent.setup();
    at('/platform/student/about');
    await user.click(await screen.findByRole('button', { name: 'Yes, that is right' }));
    expect(await screen.findByText('Confirmed')).toBeInTheDocument();
    expect(posted('/v2/me/education/confirm')).toHaveLength(1);
  });

  it('changes only what they changed, and shows the server’s explanation when it cannot be saved', async () => {
    routes['get /v2/me/education'] = view();
    routes['put /v2/me/education'] = body => (body.stage === 'working' ? fail(400, 'VALIDATION_FAILED', { stage: 'We could not tell which year or class that is.' }) : view({ stage: 'ug.3', label: 'College, year 3', status: 'confirmed', source: 'student' }));
    const user = userEvent.setup();
    at('/platform/student/about');
    const select = await screen.findByLabelText('Class or year');
    await user.selectOptions(select, 'ug.3');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved. Your plans and suggestions now use this.')).toBeInTheDocument();
    expect(posted('/v2/me/education', 'put')[0].body).toEqual({ stage: 'ug.3' });
    expect(await screen.findByRole('heading', { name: 'College, year 3' })).toBeInTheDocument();
  });

  it('asks for the course only where it makes sense, and a school stream only in Class 11, 12 or a gap year', async () => {
    routes['get /v2/me/education'] = view();
    const user = userEvent.setup();
    at('/platform/student/about');
    const select = await screen.findByLabelText('Class or year');
    expect(screen.getByLabelText('Course')).toBeInTheDocument();
    expect(screen.queryByLabelText('Stream')).toBeNull();
    await user.selectOptions(select, 'school.12');
    expect(screen.queryByLabelText('Course')).toBeNull();
    expect(screen.getByLabelText('Stream')).toBeInTheDocument();
    await user.selectOptions(select, 'working');
    expect(screen.queryByLabelText('Stream')).toBeNull();
    expect(within(screen.getByLabelText('Course')).getByRole('option', { name: 'MBA / PGDM' })).toBeInTheDocument();   // all levels are offered after college
  });

  it('wanting to change course is a choice they can make, and say what they are thinking of', async () => {
    routes['get /v2/me/education'] = view();
    routes['put /v2/me/education'] = view();
    const user = userEvent.setup();
    at('/platform/student/about');
    await user.click(await screen.findByLabelText(/I want to change course or field/));
    await user.type(screen.getByLabelText('What are you thinking of?'), 'Medicine');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(posted('/v2/me/education', 'put')).toHaveLength(1));
    expect(posted('/v2/me/education', 'put')[0].body).toEqual({ switching: true, note: 'Medicine' });
  });
});

describe('the question that appears when something needs checking', () => {
  beforeEach(() => { signIn(student); routes['get /v2/platform/student'] = bundle; });

  it('stays out of the way when nothing needs checking', async () => {
    routes['get /v2/me/education'] = view();
    at('/platform/student');
    await waitFor(() => expect(calls.some(c => c.url === '/v2/me/education')).toBe(true));
    expect(screen.queryByRole('region', { name: 'Check your details' })).toBeNull();
  });

  it('two sources disagree: it asks which is right, in words, and one tap answers it', async () => {
    let now = view({ needs: ['conflict'], conflicts: [{ field: 'stage', winner: { stage: 'ug.2', source: 'signup' }, other: { stage: 'school.12', source: 'chat', at: '2026-11-02T00:00:00.000Z' } }] });
    routes['get /v2/me/education'] = () => now;
    routes['put /v2/me/education'] = () => { now = view({ stage: 'school.12', label: 'Class 12', status: 'confirmed', source: 'student' }); return now; };
    const user = userEvent.setup();
    at('/platform/student');
    const box = await screen.findByRole('region', { name: 'Check your details' });
    expect(within(box).getByText('Which is right: College, year 2 (from your sign-up) or Class 12 (from your guide)?')).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: 'Class 12' }));
    await waitFor(() => expect(posted('/v2/me/education', 'put')[0].body).toEqual({ stage: 'school.12' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Check your details' })).toBeNull());
  });

  it('a new academic year: "are you still in…?", and yes confirms', async () => {
    let now = view({ needs: ['stale'], stale: true });
    routes['get /v2/me/education'] = () => now;
    routes['post /v2/me/education/confirm'] = () => { now = view({ status: 'confirmed', source: 'student' }); return now; };
    const user = userEvent.setup();
    at('/platform/student');
    const box = await screen.findByRole('region', { name: 'Check your details' });
    expect(within(box).getByText('A new academic year has started. Are you still in College, year 2?')).toBeInTheDocument();
    expect(within(box).getByRole('link', { name: 'No, change it' })).toHaveAttribute('href', '/platform/student/about');
    await user.click(within(box).getByRole('button', { name: 'Yes, I am' }));
    await waitFor(() => expect(posted('/v2/me/education/confirm')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Check your details' })).toBeNull());
  });

  it('no stage on record: it asks, and "not now" hides it for the rest of the visit', async () => {
    routes['get /v2/me/education'] = view({ stage: null, label: null, status: 'unknown', source: null, needs: ['unknown'], sources: [] });
    const user = userEvent.setup();
    at('/platform/student');
    const box = await screen.findByRole('region', { name: 'Check your details' });
    expect(within(box).getByText('Which class or year are you in?')).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('region', { name: 'Check your details' })).toBeNull();
    expect(sessionStorage.getItem('pf-edu-snooze')).toBe('1');
  });
});

describe('the mentor’s and the school’s correction', () => {
  const profile = (as = 'mentor', over = {}) => ({ ...F.profile, profile: { ...F.profile.profile, as, header: { ...F.profile.profile.header, education: { stage: 'ug.2', label: 'College, year 2', status: 'stated', source: 'signup', sourceWord: 'sign-up', stale: false, needs: [], programme: 'BTech / BE', field: 'Computer Science', stream: null, switching: false, conflicts: [], ...over } } } });
  const ID = F.profile.profile.header.id;
  const OS = `/v2/platform/observe/students/${ID}`;
  beforeEach(() => {
    routes[`get ${OS}/education`] = view();
    routes[`get ${OS}/week`] = F.week;
    routes['get /v2/platform/observe/interventions'] = F.interventions;
  });

  it('a mentor sees what we know and corrects it; the student is told', async () => {
    signIn({ id: 'm1', fullName: 'Dr. Neha Kapoor', role: 'mentor' });
    routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor' }, students: [], alerts: [], sessions: [] };
    routes[`get ${OS}`] = profile();
    routes[`put ${OS}/education`] = view({ stage: 'ug.3', label: 'College, year 3', status: 'confirmed', source: 'mentor' });
    const user = userEvent.setup();
    at(`/platform/mentor/observe/${ID}`);
    const card = (await screen.findByText('Education')).closest('section');
    expect(within(card).getByText('College, year 2')).toBeInTheDocument();
    expect(within(card).getByText('From their profile')).toBeInTheDocument();
    expect(within(card).getByText(/BTech \/ BE · Computer Science Set by sign-up\./)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Correct this' }));
    expect(await screen.findByText(/The student is told, and can change it back/)).toBeInTheDocument();
    await user.selectOptions(await screen.findByLabelText('Class or year'), 'ug.3');
    await user.click(screen.getByRole('button', { name: 'Save and tell them' }));
    await waitFor(() => expect(posted(`${OS}/education`, 'put')).toHaveLength(1));
    expect(posted(`${OS}/education`, 'put')[0].body).toEqual({ stage: 'ug.3' });
  });

  it('what needs settling is listed, with who said what', async () => {
    signIn({ id: 'm1', fullName: 'Dr. Neha Kapoor', role: 'mentor' });
    routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor' }, students: [], alerts: [], sessions: [] };
    routes[`get ${OS}`] = profile('mentor', { needs: ['conflict', 'stale'], stale: true, conflicts: [{ field: 'stage', other: { label: 'Class 12', source: 'chat', sourceWord: 'the career chat' } }] });
    at(`/platform/mentor/observe/${ID}`);
    const card = (await screen.findByText('Education')).closest('section');
    expect(within(card).getByText('Sources disagree.')).toBeInTheDocument();
    expect(within(card).getByText('Out of date: a new academic year has started.')).toBeInTheDocument();
    expect(within(card).getByText('the career chat said Class 12.')).toBeInTheDocument();
  });

  it('school staff who are not the admin can look but not correct; the admin can', async () => {
    signIn({ id: 'c1', fullName: 'Ms Kavya Rao', role: 'counsellor' });
    routes['get /v2/school/dashboard'] = { dashboard: { school: { id: 'o1', name: 'Demo Public School', admin: false }, totals: { students: 0, consented: 0, withMentor: 0, active7: 0, red: 0, amber: 0, escalations: 0, mentors: 0 }, cohorts: [], mentors: [], curricula: [], ai: { todayUsd: 0, calls: 0, dailyUsd: null } } };
    routes[`get ${OS}`] = profile('school');
    const { unmount } = at(`/platform/school/observe/${ID}`);
    const card = (await screen.findByText('Education')).closest('section');
    expect(within(card).getByText('College, year 2')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: 'Correct this' })).toBeNull();
    unmount();
    routes['get /v2/school/dashboard'] = { dashboard: { school: { id: 'o1', name: 'Demo Public School', admin: true }, totals: { students: 0, consented: 0, withMentor: 0, active7: 0, red: 0, amber: 0, escalations: 0, mentors: 0 }, cohorts: [], mentors: [], curricula: [], ai: { todayUsd: 0, calls: 0, dailyUsd: null } } };
    at(`/platform/school/observe/${ID}`);
    const card2 = (await screen.findByText('Education')).closest('section');
    expect(await within(card2).findByRole('button', { name: 'Correct this' })).toBeInTheDocument();
  });
});
