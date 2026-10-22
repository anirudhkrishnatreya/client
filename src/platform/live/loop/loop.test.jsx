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
const signIn = () => { const user = { id: 's1', fullName: 'Asha Verma', role: 'student', grade: '11' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const bundle = { success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '11', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: null, sessions: { next: null, upcoming: [], history: [] }, tasks: [], reports: [], assessment: { state: 'submitted' } };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);

const STAGES = [{ id: 'explore', title: 'Explore', forWho: 'Class 6 to 9', aim: 'Try things.' }, { id: 'foundation', title: 'Foundation', forWho: 'Class 10 to 12', aim: 'Build the base.' }, { id: 'build', title: 'Build', forWho: 'College', aim: 'Real skills.' }, { id: 'prove', title: 'Prove', forWho: 'Final year', aim: 'Show it.' }];
const CAREERS = [{ slug: 'architect', title: 'Architect', summary: 'Design buildings.', reviewStatus: 'draft' }, { slug: 'doctor', title: 'Doctor', summary: 'Care for patients.', reviewStatus: 'draft' }];
const base = { careers: CAREERS, stages: STAGES, suggestedStage: 'foundation', today: '2026-10-22', profile: { freeMinutes: [60, 60, 60, 60, 60, 120, 120], restDay: null, exams: [], saved: false } };
const unit = (id, day, over = {}) => ({ id, title: `Unit ${id}`, type: 'learn', minutes: 30, goal: `Goal of ${id}`, evidence: `Evidence for ${id}`, search: `search ${id}`, searchUrl: `https://www.youtube.com/results?search_query=search%20${id}`, skill: { id: 'sk', title: 'Drawing basics' }, milestone: { id: 'm', title: 'M1' }, stage: { id: 'foundation', title: 'Foundation' }, status: 'todo', resourceUrl: null, resourceTitle: null, rating: null, day, date: '2026-10-22', reason: `Reason for ${id}.`, ...over });
const withGoal = (over = {}) => ({ ...base, profile: { ...base.profile, saved: true },
  goal: { id: 'g1', careerSlug: 'architect', startStage: 'foundation', targetStage: 'foundation', targetDate: '2027-08-01' },
  roadmap: { slug: 'architect', title: 'Architect', reviewStatus: 'draft', reviewNote: 'Drafted by AI. Not yet checked by a professional in this field.' },
  feasibility: { verdict: 'fits', weeksNeeded: 12, weeksAvailable: 40, weeklyMinutes: 400, minutesNeeded: 2700 },
  week: { weekStart: '2026-10-19', mode: 'normal', capacityMinutes: 400, plannedMinutes: 90, doneMinutes: 0, todayIndex: 3, notices: [], items: [unit('u1', 3), unit('u2', 3, { type: 'make' }), unit('u3', 4)] },
  lastWeek: null, progress: { total: 60, done: 0, stages: [{ id: 'foundation', title: 'Foundation', total: 60, done: 0 }], unitStatus: {} }, next: unit('u1', 3), ...over });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; signIn(); routes['get /v2/platform/student'] = bundle; });

describe('my goal', () => {
  it('sets up a goal and a real week in one go, sending the schedule then the goal', async () => {
    routes['get /v2/me/loop'] = { loop: { ...base, goal: null } };
    routes['put /v2/me/loop/schedule'] = { loop: { ...base, goal: null } };
    routes['put /v2/me/loop/goal'] = { loop: withGoal() };
    const user = userEvent.setup();
    at('/platform/student/goal');
    await user.click(await screen.findByRole('radio', { name: /Architect/ }));
    await user.selectOptions(screen.getByLabelText('Start from'), 'explore');
    await user.selectOptions(screen.getByLabelText('Monday'), '90');
    await user.selectOptions(screen.getByLabelText('Rest day'), '6');
    await user.click(screen.getByRole('button', { name: 'Add an exam' }));
    await user.type(screen.getByLabelText('Exam 1 name'), 'Half-yearly');
    await user.type(screen.getByLabelText('Exam 1 date'), '2026-12-10');
    await user.click(screen.getByRole('button', { name: 'Make my plan' }));
    expect(await screen.findByText(/Your goal fits your time/)).toBeInTheDocument();
    const puts = calls.filter(c => c.method === 'put');
    expect(puts.map(c => c.url)).toEqual(['/v2/me/loop/schedule', '/v2/me/loop/goal']);
    expect(puts[0].body).toEqual({ freeMinutes: [90, 60, 60, 60, 60, 120, 120], restDay: 6, exams: [{ title: 'Half-yearly', date: '2026-12-10' }] });
    expect(puts[1].body).toMatchObject({ careerSlug: 'architect', startStage: 'explore', targetStage: 'foundation' });
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/platform/student').length).toBeGreaterThan(1));      // the dashboard data refreshes
  });
  it('shows the server’s reason when something is not accepted', async () => {
    routes['get /v2/me/loop'] = { loop: { ...base, goal: null } };
    routes['put /v2/me/loop/schedule'] = { loop: base };
    routes['put /v2/me/loop/goal'] = fail(400, 'VALIDATION_FAILED', { targetDate: 'Choose a date in the future.' });
    const user = userEvent.setup();
    at('/platform/student/goal');
    await user.click(await screen.findByRole('radio', { name: /Doctor/ }));
    await user.click(screen.getByRole('button', { name: 'Make my plan' }));
    expect(await screen.findAllByText('Choose a date in the future.')).not.toHaveLength(0);
  });
  it('with a goal: shows it, whether it fits, the week, and an honest note that the roadmap is a draft', async () => {
    routes['get /v2/me/loop'] = { loop: withGoal({ feasibility: { verdict: 'no-fit', weeksNeeded: 50, weeksAvailable: 20 } }) };
    at('/platform/student/goal');
    expect(await screen.findByText('Architect')).toBeInTheDocument();
    expect(screen.getByText(/does not fit your time yet/)).toBeInTheDocument();
    expect(screen.getByText(/About 50 weeks of work; 20 weeks until your date/)).toBeInTheDocument();
    expect(screen.getByText(/Not yet checked by a professional/)).toBeInTheDocument();
  });
  it('says "coming soon" when the server has it off', async () => {
    routes['get /v2/me/loop'] = fail(404, 'LOOP_DISABLED');
    at('/platform/student/goal');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
  });
});

describe('weekly plan', () => {
  it('lays the week out by day, with reasons, today highlighted, and a real search link opened safely', async () => {
    routes['get /v2/me/loop'] = { loop: withGoal({ week: { ...withGoal().week, notices: [{ key: 'exam', text: 'Half-yearly on 2026-11-12: a much lighter week.' }] } }) };
    at('/platform/student/plan');
    expect(await screen.findByText('Thursday · today')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Reason for u1.')).toBeInTheDocument();
    expect(screen.getByText(/a much lighter week/)).toBeInTheDocument();
    const link = within(screen.getByRole('article', { name: 'Unit u1' })).getByRole('link', { name: /Find a free video/ });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/results?search_query=search%20u1');
    expect(link).toHaveAttribute('target', '_blank'); expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Goal of u1')).toBeInTheDocument();
    expect(screen.getByText('Evidence for u1')).toBeInTheDocument();
  });
  it('marks a unit done with the link they used and a rating, then can undo it', async () => {
    const state = withGoal();
    routes['get /v2/me/loop'] = { loop: state };
    routes['post /v2/me/loop/units/u1/done'] = { loop: { ...state, week: { ...state.week, doneMinutes: 30, items: state.week.items.map(i => (i.id === 'u1' ? { ...i, status: 'done', resourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', resourceTitle: 'Perspective drawing' } : i)) } } };
    routes['delete /v2/me/loop/units/u1'] = { loop: state };
    const user = userEvent.setup();
    at('/platform/student/plan');
    const card = await screen.findByRole('article', { name: 'Unit u1' });
    await user.click(within(card).getByRole('button', { name: 'I have done this' }));
    await user.type(within(card).getByLabelText(/Which video or page/), 'https://youtu.be/dQw4w9WgXcQ');
    await user.click(within(card).getByRole('button', { name: '4 out of 5' }));
    await user.click(within(card).getByRole('button', { name: 'Mark as done' }));
    expect(calls.find(c => c.url === '/v2/me/loop/units/u1/done').body).toEqual({ resourceUrl: 'https://youtu.be/dQw4w9WgXcQ', rating: 4 });
    expect(await within(card).findByText('Perspective drawing')).toBeInTheDocument();
    expect(screen.getByText(/30 min of 1 h 30 min done/)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(within(card).getByRole('button', { name: 'I have done this' })).toBeInTheDocument());
  });
  it('skips with a reason, and shows a server refusal (e.g. a video that does not exist)', async () => {
    const state = withGoal();
    routes['get /v2/me/loop'] = { loop: state };
    routes['post /v2/me/loop/units/u2/skip'] = { loop: { ...state, week: { ...state.week, items: state.week.items.map(i => (i.id === 'u2' ? { ...i, status: 'skipped' } : i)) } } };
    routes['post /v2/me/loop/units/u1/done'] = fail(400, 'VALIDATION_FAILED', { resourceUrl: 'We could not find that YouTube video. Check the link.' });
    const user = userEvent.setup();
    at('/platform/student/plan');
    const c2 = await screen.findByRole('article', { name: 'Unit u2' });
    await user.click(within(c2).getByRole('button', { name: 'Skip' }));
    await user.selectOptions(within(c2).getByLabelText('Why skip it?'), 'covered-elsewhere');
    await user.click(within(c2).getByRole('button', { name: 'Skip it' }));
    expect(calls.find(c => c.url === '/v2/me/loop/units/u2/skip').body).toEqual({ skipReason: 'covered-elsewhere' });
    expect(await within(c2).findByText('Skipped')).toBeInTheDocument();
    const c1 = screen.getByRole('article', { name: 'Unit u1' });
    await user.click(within(c1).getByRole('button', { name: 'I have done this' }));
    await user.type(within(c1).getByLabelText(/Which video or page/), 'https://youtu.be/AAAAAAAAAAA');
    await user.click(within(c1).getByRole('button', { name: 'Mark as done' }));
    expect(await within(c1).findByRole('alert')).toHaveTextContent('We could not find that YouTube video');
  });
  it('re-plans the rest of the week on request', async () => {
    routes['get /v2/me/loop'] = { loop: withGoal() };
    routes['post /v2/me/loop/week/replan'] = { loop: withGoal() };
    const user = userEvent.setup();
    at('/platform/student/plan');
    await user.click(await screen.findByRole('button', { name: 'Re-plan the rest of this week' }));
    expect(await screen.findByText('Planned again around your current schedule.')).toBeInTheDocument();
  });
  it('asks for a goal first when there is none', async () => {
    routes['get /v2/me/loop'] = { loop: { ...base, goal: null } };
    at('/platform/student/plan');
    expect(await screen.findByText('Set your goal first')).toBeInTheDocument();
  });
});

describe('roadmap', () => {
  it('shows every stage, the goal’s stages marked, and done steps ticked', async () => {
    routes['get /v2/me/loop'] = { loop: withGoal({ progress: { total: 2, done: 1, stages: [], unitStatus: { 'f-u1': 'done' } } }) };
    const st = (id, title) => ({ id, title, forWho: 'x', summary: `${title} summary`, milestones: [{ id: `${id}-m1`, title: `${title} milestone`, outcome: 'o', skills: [{ id: `${id}-s1`, title: `${title} skill`, why: 'w', units: [{ id: id === 'foundation' ? 'f-u1' : `${id}-u1`, title: `${title} first step`, type: 'learn', minutes: 20 }, { id: `${id}-u2`, title: `${title} second step`, type: 'make', minutes: 45 }] }] }] });
    routes['get /v2/loop/careers/architect'] = { roadmap: { title: 'Architect', summary: 'Design buildings.', reviewStatus: 'draft', reviewNote: 'Drafted by AI. Not yet checked.', stages: [st('explore', 'Explore'), st('foundation', 'Foundation'), st('build', 'Build'), st('prove', 'Prove')] } };
    at('/platform/student/plan/roadmap');
    expect(await screen.findByText('Foundation first step')).toBeInTheDocument();
    expect(screen.getByText('Your goal')).toBeInTheDocument();
    expect(screen.getAllByText('done')).toHaveLength(1);
    expect(screen.getByText(/Not yet checked/)).toBeInTheDocument();
  });
});

describe('overview', () => {
  it('shows today’s steps from the plan', async () => {
    routes['get /v2/me/loop'] = { loop: withGoal() };
    at('/platform/student');
    expect(await screen.findByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Unit u1')).toBeInTheDocument();
    expect(screen.queryByText('Unit u3')).toBeNull();
    expect(screen.getByText(/0 of 60 steps done towards Architect/)).toBeInTheDocument();
  });
  it('invites a student without a goal to set one', async () => {
    routes['get /v2/me/loop'] = { loop: { ...base, goal: null } };
    at('/platform/student');
    expect(await screen.findByText('Your weekly plan')).toBeInTheDocument();
  });
});
