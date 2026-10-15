import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';

// The server is replaced by a small router (same approach as live.test.jsx).
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
beforeAll(async () => { vi.stubEnv('VITE_REC', 'on'); PlatformApp = (await import('../../PlatformApp')).default; });

const fail = (status, code, extra = {}) => Object.assign(new Error(code), { response: { status, data: { code, error: code, ...extra } } });
const signIn = () => { const user = { id: 's1', fullName: 'Asha Verma', role: 'student', grade: '11' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const student = reports => ({ success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '11', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: null, sessions: { next: null, upcoming: [], history: [] }, tasks: [], reports, assessment: { state: 'not_started' } });
const report = (over = {}) => ({ assessmentId: 'a1', track: 'senior', grade: '11', completedAt: '2026-01-05T10:00:00Z', hollandCode: 'IRA', provisional: false, pdf: { status: 'ready' }, ...over });
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /><Route path="/login" element={<div>LOGIN</div>} /></Routes></AuthProvider></MemoryRouter>);

const META = { clusters: [{ id: 'computing_digital', label: 'Computing and digital', summary: '', streams: [], memberCount: 30 }, { id: 'health_medicine', label: 'Health and medicine', summary: '', streams: [], memberCount: 40 }] };
const occ = (n, over = {}) => ({ id: `occ.${n}`, slug: `career-${n}`, title: `Career ${n}`, cluster: 'computing_digital', clusterLabel: 'Computing and digital', alsoIn: [], jobZone: 4, standIn: false, ...over });
const item = (n, over = {}) => ({ occupationId: `occ.${n}`, slug: `career-${n}`, title: `Career ${n}`, note: '', status: 'exploring', ...over });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; signIn(); routes['get /v2/platform/student'] = student([report()]); routes['get /v2/catalog/meta'] = META; routes['get /v2/me/shortlist'] = { shortlist: [], limit: 10 }; });

describe('the sidebar', () => {
  it('shows the careers section when the feature is on', async () => {
    routes['get /v2/catalog/occupations'] = { items: [], total: 0, nextCursor: null };
    at('/platform/student/explore');
    expect(await screen.findByRole('link', { name: /suggested for you/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my shortlist/i })).toBeInTheDocument();
  });
});

describe('explore', () => {
  it('lists careers, searches after a pause, filters, and pages with Show more', async () => {
    routes['get /v2/catalog/occupations'] = ({ params }) => (params.cursor ? { items: [occ(3)], total: 3, nextCursor: null } : params.q ? { items: [occ(9, { title: 'Pilot' })], total: 1, nextCursor: null } : { items: [occ(1), occ(2)], total: 3, nextCursor: 'MjQ' });
    const user = userEvent.setup();
    at('/platform/student/explore');
    expect(await screen.findByText('Career 1')).toBeInTheDocument();
    expect(screen.getByText('3 careers')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show more/i }));
    expect(await screen.findByText('Career 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show more/i })).toBeNull();

    await user.type(screen.getByLabelText('Search'), 'pilot');
    expect(await screen.findByText('Pilot')).toBeInTheDocument();
    expect(screen.queryByText('Career 1')).toBeNull();
    expect(calls.filter(c => c.url === '/v2/catalog/occupations').some(c => c.body.params.q === 'pilot')).toBe(true);

    await user.clear(screen.getByLabelText('Search'));
    await user.selectOptions(screen.getByLabelText('Area'), 'health_medicine');
    await waitFor(() => expect(calls.some(c => c.url === '/v2/catalog/occupations' && c.body.params.cluster === 'health_medicine')).toBe(true));
  });

  it('says so when nothing matches, and saves and removes a career from the list', async () => {
    routes['get /v2/catalog/occupations'] = { items: [occ(1)], total: 1, nextCursor: null };
    routes['post /v2/me/shortlist'] = { success: true, item: item(1) };
    routes['delete /v2/me/shortlist/occ.1'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/explore');
    await user.click(await screen.findByRole('button', { name: /save to my shortlist: career 1/i }));
    expect(await screen.findByRole('button', { name: /remove from my shortlist: career 1/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /remove from my shortlist: career 1/i }));
    expect(await screen.findByRole('button', { name: /save to my shortlist: career 1/i })).toBeInTheDocument();
  });

  it('shows "no careers match" for an empty search', async () => {
    routes['get /v2/catalog/occupations'] = { items: [], total: 0, nextCursor: null };
    at('/platform/student/explore');
    expect(await screen.findByText('No careers match')).toBeInTheDocument();
  });

  it('shows a calm "coming soon" when the server has the feature off', async () => {
    routes['get /v2/catalog/meta'] = fail(404, 'V5_DISABLED');
    routes['get /v2/catalog/occupations'] = fail(404, 'V5_DISABLED');
    at('/platform/student/explore');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('a career page', () => {
  const page = (over = {}) => ({ occupation: { ...occ(1, { title: 'Software Developers', slug: 'software-developers' }), description: 'Build software.', jobZoneText: 'A bachelor’s degree', alsoInLabels: [], notices: [{ key: 'unverified', text: 'The details of how to enter this career are a draft.' }], entry: { summary: 'Usually a B.Tech.', routes: [{ stream: 'science_pcm', degrees: ['B.Tech'], exams: ['JEE Main'] }], costBand: 'medium', registration: null, sources: [], reviewStatus: 'draft' }, attribution: 'Data from O*NET.', ...over } });
  it('shows how to get there, the draft notice, and how it fits the student, in words', async () => {
    routes['get /v2/catalog/occupations/software-developers'] = page();
    routes['get /v2/recommendations/a1/occupations/software-developers'] = { check: { available: true, band: 'strong', bandLabel: 'Strong fit', inYourTopAreas: true, readiness: { level: 'building', label: 'Building', text: 'You are on your way.', skillsToBuild: [{ scale: 'x', label: 'Programming' }] }, reasons: [{ key: 'interest.shape', text: 'The mix of things you enjoy closely resembles this work.' }], notes: [] } };
    at('/platform/student/explore/software-developers');
    expect(await screen.findByRole('heading', { name: 'Software Developers' })).toBeInTheDocument();
    expect(screen.getByText(/draft/)).toBeInTheDocument();
    expect(screen.getByText(/Science \(PCM\):/)).toBeInTheDocument();
    expect(await screen.findByText('Strong fit')).toBeInTheDocument();
    expect(screen.getByText(/closely resembles this work/)).toBeInTheDocument();
    expect(screen.getByText(/Skills to build: Programming/)).toBeInTheDocument();
    expect(screen.getByText(/O\*NET/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/%|percent/i);
  });
  it('still shows the career for a student who has no finished assessment (no fit section)', async () => {
    routes['get /v2/platform/student'] = student([]);
    routes['get /v2/catalog/occupations/software-developers'] = page();
    at('/platform/student/explore/software-developers');
    expect(await screen.findByRole('heading', { name: 'Software Developers' })).toBeInTheDocument();
    expect(screen.queryByText('How it fits you')).toBeNull();
    expect(calls.some(c => c.url.includes('/recommendations/'))).toBe(false);
  });
  it('explains a career that is outside the top areas without discouraging', async () => {
    routes['get /v2/catalog/occupations/software-developers'] = page();
    routes['get /v2/recommendations/a1/occupations/software-developers'] = { check: { available: true, band: 'explore', bandLabel: 'Worth exploring', inYourTopAreas: false, readiness: null, reasons: [], notes: [] } };
    at('/platform/student/explore/software-developers');
    expect(await screen.findByText(/does not mean you could not do it/)).toBeInTheDocument();
  });
  it('says plainly when a junior student cannot be checked', async () => {
    routes['get /v2/catalog/occupations/software-developers'] = page();
    routes['get /v2/recommendations/a1/occupations/software-developers'] = fail(409, 'JUNIOR_EXPLORE_ONLY');
    at('/platform/student/explore/software-developers');
    expect(await screen.findByText(/areas to explore rather than specific careers/)).toBeInTheDocument();
  });
  it('shows "not found" for an unknown career', async () => {
    at('/platform/student/explore/nope');
    expect(await screen.findByText('Career not found')).toBeInTheDocument();
  });
});

describe('suggested for you', () => {
  const occupation = (n, over = {}) => ({ id: `occ.${n}`, slug: `career-${n}`, title: `Career ${n}`, band: 'strong', bandLabel: 'Strong fit', readiness: null, reasons: [{ key: 'interest.shape', text: `Reason for ${n}` }], notes: [], ...over });
  const rec = (over = {}) => ({ recommendation: { available: true, track: 'senior', flat: false, profileSummary: { hollandCode: 'IRA' }, notes: [], clusters: [{ id: 'computing_digital', label: 'Computing and digital', band: 'strong', bandLabel: 'Strong fit', reasons: [], occupations: [occupation(1), occupation(2, { band: 'good', bandLabel: 'Good fit' })] }], stretch: [{ id: 'health_medicine', label: 'Health and medicine', band: 'good', bandLabel: 'Good fit', reasons: [], occupations: [occupation(3)] }], streams: [{ id: 'science_pcm', label: 'Science (PCM)', keepsOpen: [{ id: 'computing_digital', label: 'Computing and digital' }], closes: [] }], ...over } });
  it('shows areas, careers with reasons, a "worth a look" group and streams, with no numbers', async () => {
    routes['get /v2/recommendations/a1'] = rec();
    at('/platform/student/careers');
    expect(await screen.findByText('Computing and digital', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Reason for 1')).toBeInTheDocument();
    expect(screen.getByText('Also worth a look')).toBeInTheDocument();
    expect(screen.getByText('Science (PCM)')).toBeInTheDocument();
    expect(screen.getByText('IRA')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/%|percent|\bscore\b/i);
  });
  it('asks the student to take the assessment when they have none', async () => {
    routes['get /v2/platform/student'] = student([]);
    at('/platform/student/careers');
    expect(await screen.findByText('Finish the career assessment first')).toBeInTheDocument();
    expect(calls.some(c => c.url.includes('/recommendations/'))).toBe(false);
  });
  it('uses the newest assessment when there are several', async () => {
    routes['get /v2/platform/student'] = student([report({ assessmentId: 'old', completedAt: '2025-01-01T00:00:00Z' }), report({ assessmentId: 'new', completedAt: '2026-06-01T00:00:00Z' })]);
    routes['get /v2/recommendations/new'] = rec();
    at('/platform/student/careers');
    expect(await screen.findByText('Reason for 1')).toBeInTheDocument();
  });
  it.each([['JUNIOR_EXPLORE_ONLY', /areas to explore rather than specific careers/], ['WITHHELD', /may not show your real strengths/], ['NO_INTERESTS', /interest results/]])('explains %s in plain words and offers browsing', async (code, text) => {
    routes['get /v2/recommendations/a1'] = fail(409, code);
    at('/platform/student/careers');
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse careers instead/i })).toBeInTheDocument();
  });
  it('shows the flat-profile explanation instead of a list', async () => {
    routes['get /v2/recommendations/a1'] = { recommendation: { available: false, reason: 'flat-interests', note: { key: 'note.flat_interests', text: 'Your answers do not separate your interests much.' } } };
    at('/platform/student/careers');
    expect(await screen.findByText(/do not separate your interests/)).toBeInTheDocument();
  });
  it('lets the student save a suggested career', async () => {
    routes['get /v2/recommendations/a1'] = rec();
    routes['post /v2/me/shortlist'] = { success: true, item: item(1) };
    const user = userEvent.setup();
    at('/platform/student/careers');
    await user.click(await screen.findByRole('button', { name: /save to my shortlist: career 1/i }));
    expect(await screen.findByRole('button', { name: /remove from my shortlist: career 1/i })).toBeInTheDocument();
    expect(calls.find(c => c.method === 'post' && c.url === '/v2/me/shortlist').body).toEqual({ occupationId: 'occ.1' });
  });
});

describe('my shortlist', () => {
  it('shows an empty state with a way to find careers', async () => {
    at('/platform/student/shortlist');
    expect(await screen.findByText('Nothing saved yet')).toBeInTheDocument();
  });
  it('changes status, saves a note, removes a career, and only shows active ones', async () => {
    routes['get /v2/me/shortlist'] = { shortlist: [item(1, { note: 'Ask cousin' }), item(2, { status: 'dropped' })], limit: 10 };
    routes['patch /v2/me/shortlist/occ.1'] = b => ({ success: true, item: item(1, { note: 'Ask cousin', ...b }) });
    routes['delete /v2/me/shortlist/occ.1'] = { success: true };
    const user = userEvent.setup();
    at('/platform/student/shortlist');
    expect(await screen.findByText('Career 1')).toBeInTheDocument();
    expect(screen.queryByText('Career 2')).toBeNull();
    expect(screen.getByText('1 of 10 saved')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status of Career 1'), 'decided');
    await waitFor(() => expect(calls.find(c => c.method === 'patch').body).toEqual({ status: 'decided' }));

    const note = screen.getByLabelText('Note about Career 1');
    await user.clear(note); await user.type(note, 'Talk to Meera');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(calls.filter(c => c.method === 'patch').pop().body).toEqual({ note: 'Talk to Meera' }));

    await user.click(screen.getByRole('button', { name: 'Remove Career 1' }));
    expect(await screen.findByText('Nothing saved yet')).toBeInTheDocument();
  });
  it('says when the shortlist is full', async () => {
    routes['get /v2/catalog/occupations'] = { items: [occ(11)], total: 1, nextCursor: null };
    routes['post /v2/me/shortlist'] = fail(409, 'SHORTLIST_FULL', { limit: 10 });
    const user = userEvent.setup();
    at('/platform/student/explore');
    await user.click(await screen.findByRole('button', { name: /save to my shortlist: career 11/i }));
    expect(await screen.findByText(/10 careers already/)).toBeInTheDocument();
  });
});

describe('my situation', () => {
  it('loads what was saved, saves changes, keeps careers they excluded elsewhere, and confirms', async () => {
    routes['get /v2/me/context'] = { context: { budgetBand: 'low', exams: ['JEE Main'], notInterested: ['health_medicine', 'occ.29-1141.00'] } };
    routes['put /v2/me/context'] = b => ({ success: true, context: b });
    const user = userEvent.setup();
    at('/platform/student/situation');
    expect(await screen.findByLabelText('Cost of study')).toHaveValue('low');
    expect(screen.getByLabelText('Exams you are preparing for')).toHaveValue('JEE Main');
    expect(screen.getByRole('checkbox', { name: 'Health and medicine' })).toBeChecked();

    await user.clear(screen.getByLabelText('Exams you are preparing for'));
    await user.type(screen.getByLabelText('Exams you are preparing for'), 'NEET UG, neet ug, CLAT, ');
    await user.click(screen.getByRole('checkbox', { name: 'Computing and digital' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Your suggestions will use this/)).toBeInTheDocument();
    const sent = calls.find(c => c.method === 'put').body;
    expect(sent.budgetBand).toBe('low');
    expect(sent.exams).toEqual(['NEET UG', 'neet ug', 'CLAT']);
    expect(sent.notInterested.sort()).toEqual(['computing_digital', 'health_medicine', 'occ.29-1141.00']);
  });
  it('can be left empty: nothing is required', async () => {
    routes['get /v2/me/context'] = { context: { budgetBand: null, exams: [], notInterested: [] } };
    routes['put /v2/me/context'] = b => ({ success: true, context: b });
    const user = userEvent.setup();
    at('/platform/student/situation');
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Saved/)).toBeInTheDocument();
    expect(calls.find(c => c.method === 'put').body).toEqual({ budgetBand: null, exams: [], notInterested: [] });
  });
  it('shows a readable message when the server refuses the input', async () => {
    routes['get /v2/me/context'] = { context: { budgetBand: null, exams: [], notInterested: [] } };
    routes['put /v2/me/context'] = fail(400, 'VALIDATION_FAILED');
    const user = userEvent.setup();
    at('/platform/student/situation');
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/up to 10 exams/);
  });
  it('shows coming soon when the feature is off on the server', async () => {
    routes['get /v2/me/context'] = fail(404, 'V5_DISABLED');
    at('/platform/student/situation');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
  });
});
