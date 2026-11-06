import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import F from './__fixtures__/observe.json';

// The observatory, the mentor's command centre, the school console (dashboard, study-plan import and assignment, roster
// import) and the student's own "What my mentor sees". The fixtures are real server responses captured from a local run
// (in-memory database, scripted AI), so the screens are tested against the shapes the server actually sends.
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
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; });

const ASHA = F.profile.profile.header.id;
const OS = `/v2/platform/observe/students/${ASHA}`;

describe('mentor: the command centre and the observatory', () => {
  beforeEach(() => {
    signIn({ id: 'm1', fullName: 'Dr. Neha Kapoor', role: 'mentor' });
    routes['get /v2/platform/mentor'] = { me: { id: 'm1', fullName: 'Dr. Neha Kapoor' }, students: [], alerts: [], sessions: [] };
    routes['get /v2/platform/observe/caseload'] = F.caseload;
    routes['get /v2/platform/observe/escalations'] = F.escalations;
    routes[`get ${OS}`] = F.profile;
    routes[`get ${OS}/week`] = F.week;
    routes['get /v2/platform/observe/interventions'] = F.interventions;
  });

  it('shows who needs the mentor today and a card for every student, each opening their observatory', async () => {
    at('/platform/mentor/command');
    expect(await screen.findByText('Who needs you today')).toBeInTheDocument();
    const links = await screen.findAllByRole('link', { name: 'Open observatory' });
    expect(links).toHaveLength(F.caseload.cards.length);
    expect(links.map(l => l.getAttribute('href'))).toContain(`/platform/mentor/observe/${ASHA}`);
  });

  it('opens the 360 with the risk radar and the page titled Observatory', async () => {
    at(`/platform/mentor/observe/${ASHA}`);
    expect(await screen.findByRole('heading', { name: 'Asha Verma' })).toBeInTheDocument();
    expect(screen.getByText('Risk radar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Observatory' })).toBeInTheDocument();
  });

  it('in the planning studio, takes a step off the week and moves another, each through the checked change tools', async () => {
    routes[`post ${OS}/plan/apply`] = { success: true, change: { id: 'c1', lines: ['Done'] } };
    const user = userEvent.setup();
    at(`/platform/mentor/observe/${ASHA}?tab=plan`);
    const day = F.week.week.days.find(d => d.date > F.week.week.today && d.steps.some(s => s.status === 'todo'));
    const step = day.steps.find(s => s.status === 'todo');
    await user.click(await screen.findByRole('button', { name: `Take “${step.title}” off this week` }));
    await waitFor(() => expect(posted(`${OS}/plan/apply`)).toHaveLength(1));
    expect(posted(`${OS}/plan/apply`)[0].body).toEqual({ changes: [{ tool: 'remove_step', stepId: step.id }] });
    expect(await screen.findByText(/The student has been told/)).toBeInTheDocument();
    // moving works without drag and drop too (phones, keyboards)
    const to = F.week.week.days.find(d => d.date > day.date);
    await user.selectOptions(screen.getByRole('combobox', { name: `Move “${step.title}” to` }), to.date);
    await waitFor(() => expect(posted(`${OS}/plan/apply`)).toHaveLength(2));
    expect(posted(`${OS}/plan/apply`)[1].body).toEqual({ changes: [{ tool: 'move_step', stepId: step.id, date: to.date }] });
  });
});

describe('school: the console, the study-plan import and the roster import', () => {
  beforeEach(() => {
    signIn({ id: 'c1', fullName: 'Ms Kavya Rao', role: 'counsellor' });
    routes['get /v2/school/dashboard'] = F.dashboard;
    routes['get /v2/platform/observe/escalations'] = F.escalations;
    routes['get /v2/school/curricula'] = F.curricula;
    routes['get /v2/school/students'] = { success: true, students: [] };
  });

  it('lands on the school dashboard with its classes and study plans', async () => {
    at('/platform');
    expect(await screen.findByRole('heading', { name: 'Demo Public School' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '10-A' })).toBeInTheDocument();
    expect(screen.getAllByText('Class 10 · 2026–27').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Import a study plan/ })).toBeInTheDocument();
  });

  it('imports a study plan: preview (correctable), then save', async () => {
    routes['post /v2/school/curricula/preview'] = F.preview;
    routes['post /v2/school/curricula'] = { success: true, curriculum: { ...F.curricula.curricula[0], id: 'new1', name: 'Science extra' } };
    const user = userEvent.setup();
    at('/platform/school/curriculum?import=1');
    await user.type(await screen.findByLabelText('The study plan'), 'subject,topic\nBiology,Nutrition');
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText('Biology')).toBeInTheDocument();
    // a topic renamed in the preview is what gets saved
    const topic = screen.getByDisplayValue('Nutrition');
    await user.clear(topic); await user.type(topic, 'Nutrition in plants');
    await user.click(screen.getByRole('button', { name: 'Save this plan' }));
    await waitFor(() => expect(posted('/v2/school/curricula')).toHaveLength(1));
    const saved = posted('/v2/school/curricula')[0].body;
    expect(saved.curriculum.subjects.map(s => s.name)).toEqual(['Biology', 'English']);
    expect(saved.curriculum.subjects[0].units[0].topics[0].title).toBe('Nutrition in plants');
    expect(saved.weeklyMinutes).toBe(420);
  });

  it('assigns a plan to more classes', async () => {
    const c = F.curricula.curricula[0];
    const b = F.dashboard.dashboard.cohorts.find(k => k.name === '10-B');
    routes[`post /v2/school/curricula/${c.id}/assign`] = { success: true, students: 3, started: 2, kept: 1, already: 0 };
    const user = userEvent.setup();
    at('/platform/school/curriculum');
    await user.click(await screen.findByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: /^10-B/ }));
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    expect(await screen.findByText(/2 students started on this plan; 1 kept their own goal/)).toBeInTheDocument();
    expect(posted(`/v2/school/curricula/${c.id}/assign`)[0].body).toEqual({ cohortIds: [...c.cohortIds, b.id], replace: false });
  });

  it('imports students: checks the file row by row, then imports', async () => {
    routes['post /v2/school/roster/check'] = F.roster;
    routes['post /v2/school/roster/commit'] = { success: true, created: 1, updated: 0, classesCreated: [], skipped: [{ line: 3 }] };
    const user = userEvent.setup();
    at('/platform/school/students?import=1');
    const box = await screen.findByLabelText('Or paste it here');
    await user.click(box); await user.paste('name,email,class\nNisha Patel,nisha@example.com,10-A\nBad,nope,10-A');
    await user.click(screen.getByRole('button', { name: 'Check the file' }));
    expect(await screen.findByText('Nisha Patel')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Import 1 new, update 0' }));
    expect(await screen.findByText(/Created 1 and updated 0 students/)).toBeInTheDocument();
    expect(posted('/v2/school/roster/commit')[0].body).toEqual({ text: expect.stringContaining('Nisha Patel'), createClasses: true });
  });
});

describe('student: what my mentor sees, and reports shared with them', () => {
  const bundle = { success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: { id: 'm1', name: 'Dr. Neha Kapoor' }, sessions: { next: null, upcoming: [], history: [] }, tasks: [], reports: [], assessment: { state: 'not_started' }, mentorNotes: [] };
  beforeEach(() => { signIn({ id: 's1', fullName: 'Asha Verma', role: 'student', grade: '10' }); routes['get /v2/platform/student'] = bundle; });

  it('shows the same 360 as the mentor, who has looked, and offers a copy of their data', async () => {
    routes['get /v2/me/observe'] = F.mine;
    at('/platform/student/mentor-view');
    expect(await screen.findByRole('heading', { name: 'What my mentor sees' })).toBeInTheDocument();
    expect(await screen.findByText('Who has looked, in the last 30 days')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download my data/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /AI analyst/ })).not.toBeInTheDocument();
  });

  it('lists reports the mentor shared, each claim with the facts it rests on', async () => {
    routes['get /v2/platform/student/messages'] = { success: true, messages: [] };
    routes['get /v2/me/reports'] = { success: true, reports: [{ id: 'r1', kind: 'weekly', at: new Date().toISOString(), sharedAt: new Date().toISOString(), headline: 'A steady week', sharedWith: ['student'], facts: [{ key: 'F1', text: 'Finished 4 of 6 steps' }], sections: [{ key: 'well', title: 'Going well', items: [{ text: 'You finished most steps.', evidence: ['F1'] }] }] }] };
    const user = userEvent.setup();
    at('/platform/student/mentor');
    const card = (await screen.findByText('Reports from your mentor')).closest('section');
    await user.click(within(card).getByRole('button', { name: 'Read' }));
    expect(within(card).getByText('You finished most steps.')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'F1' }));
    expect(within(card).getByText('Finished 4 of 6 steps')).toBeInTheDocument();
  });
});
