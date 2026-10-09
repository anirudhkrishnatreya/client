import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import SchoolHome from './SchoolHome';
import SchoolClass from './SchoolClass';
import SchoolStudent from './SchoolStudent';
import AdminOrgs from './AdminOrgs';

const ok = data => Promise.resolve({ data });
const apiErr = (status, code, extra = {}) => Object.assign(new Error(code), { response: { status, data: { code, error: code, ...extra } } });
function mount(ui, { route, path }) {
  return render(<MemoryRouter initialEntries={[route]}><AuthProvider><Routes><Route path={path} element={ui} /><Route path="/admin/login" element={<div>ADMIN LOGIN</div>} /><Route path="/v4/school" element={<div>SCHOOL HOME</div>} /></Routes></AuthProvider></MemoryRouter>);
}
beforeEach(() => localStorage.clear());

describe('SchoolHome', () => {
  const cohorts = [
    { id: 'c1', name: 'Class 8-B', track: 'junior', grade: '8', code: 'ABCD2345', status: 'open', students: 31, submitted: 12 },
    { id: 'c2', name: 'Class 11 Science', track: 'senior', grade: '11', code: 'WXYZ6789', status: 'closed', students: 1, submitted: 0 }
  ];
  const page = api => mount(<SchoolHome api={api} />, { route: '/v4/school', path: '/v4/school' });

  it('lists the organization\'s classes with their join codes and how many have finished', async () => {
    page({ cohorts: vi.fn(() => ok({ cohorts })) });
    expect(await screen.findByText('Class 8-B')).toBeInTheDocument();
    expect(screen.getByText('ABCD2345')).toBeInTheDocument();
    expect(screen.getByText(/31 students · 12 finished/)).toBeInTheDocument();
    expect(screen.getByText(/1 student · 0 finished · closed to new students/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open class' })[0]).toHaveAttribute('href', '/v4/school/c1');
  });
  it('explains an empty list', async () => {
    page({ cohorts: vi.fn(() => ok({ cohorts: [] })) });
    expect(await screen.findByText(/No classes yet/)).toBeInTheDocument();
  });
  it('a student who lands here is told it is for counsellors', async () => {
    page({ cohorts: vi.fn(() => Promise.reject(apiErr(403, 'COUNSELLOR_ONLY'))) });
    expect(await screen.findByText(/for school counsellors/)).toBeInTheDocument();
  });
  it('a failure offers a retry', async () => {
    const api = { cohorts: vi.fn().mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue({ data: { cohorts } }) };
    const user = userEvent.setup();
    page(api);
    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Class 8-B')).toBeInTheDocument();
  });
});

describe('SchoolClass', () => {
  const progress = { cohort: { id: 'c1', name: 'Class 8-B', track: 'junior', grade: '8' }, students: [
    { id: 's1', name: 'Asha Rao', state: 'submitted', consent: 'granted', shared: true },
    { id: 's2', name: 'Bilal Khan', state: 'submitted', consent: 'not_required', shared: false },
    { id: 's3', name: 'Chitra Nair', state: 'in_progress', consent: 'granted', shared: false },
    { id: 's4', name: 'Dev Patel', state: 'not_started', consent: 'pending', shared: false }
  ] };
  const page = api => mount(<SchoolClass api={api} />, { route: '/v4/school/c1', path: '/v4/school/:cohortId' });

  it('shows who has finished, consent status, and a report link only where sharing was agreed — and no scores', async () => {
    page({ progress: vi.fn(() => ok(progress)), summary: vi.fn(() => ok({ summary: { suppressed: true, reason: 'Summaries need at least 10 completed attempts.' } })) });
    expect(await screen.findByText('2 of 4 finished.', { exact: false })).toBeInTheDocument();
    const rows = Object.fromEntries(screen.getAllByRole('row').slice(1).map(r => [within(r).getAllByRole('cell')[0].textContent, r]));
    expect(rows['Asha Rao']).toHaveTextContent('Finished');
    expect(within(rows['Asha Rao']).getByRole('link', { name: 'View report' })).toHaveAttribute('href', '/v4/school/c1/student/s1');
    expect(rows['Bilal Khan']).toHaveTextContent('Not shared');
    expect(within(rows['Bilal Khan']).queryByRole('link')).toBeNull();
    expect(rows['Chitra Nair']).toHaveTextContent('In progress');
    expect(rows['Chitra Nair']).not.toHaveTextContent(/View report|Not shared/);
    expect(rows['Dev Patel']).toHaveTextContent('Waiting for guardian');
    expect(document.body.textContent).not.toMatch(/stanine|holland|pomp/i);
  });

  it('a class with fewer than 10 finished shows why there is no summary', async () => {
    page({ progress: vi.fn(() => ok(progress)), summary: vi.fn(() => ok({ summary: { suppressed: true, reason: 'Summaries need at least 10 completed attempts.' } })) });
    expect(await screen.findByText(/at least 10 completed attempts/)).toBeInTheDocument();
    expect(screen.getByText(/could identify one person/)).toBeInTheDocument();
  });

  it('with enough students it shows averages with accessible labels, how many were left out, and the top fields', async () => {
    const summary = { suppressed: false, n: 12, excludedInvalid: 2, norm: { provisional: true },
      scales: { 'apt.verbal': { label: 'Verbal Reasoning', dimension: 'aptitude', n: 12, meanStanine: 6.5 }, 'p.E': { label: 'Extraversion', dimension: 'personality', n: 12, meanStanine: 4.25 } },
      dominantInterests: {}, firstHollandLetter: {}, topThreeFieldMatches: { education: 7, law: 3 }, validity: {} };
    page({ progress: vi.fn(() => ok(progress)), summary: vi.fn(() => ok({ summary })) });
    expect(await screen.findByText(/Based on 12 students \(2 attempts left out/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Verbal Reasoning: average 6.5 out of 9' })).toBeInTheDocument();
    expect(screen.getByText('education: 7 students')).toBeInTheDocument();
    expect(screen.getByText(/Provisional scores/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Asha Rao.*stanine/);
  });

  it('an empty class and a class from another school', async () => {
    page({ progress: vi.fn(() => ok({ ...progress, students: [] })), summary: vi.fn(() => ok({ summary: { suppressed: true, reason: 'r' } })) });
    expect(await screen.findByText('No students have joined yet.')).toBeInTheDocument();
  });
  it('another school\'s class is "not found"', async () => {
    page({ progress: vi.fn(() => Promise.reject(apiErr(404, 'NOT_FOUND'))), summary: vi.fn(() => Promise.reject(apiErr(404, 'NOT_FOUND'))) });
    expect(await screen.findByText('Class not found')).toBeInTheDocument();
  });
});

describe('SchoolStudent', () => {
  const report = { assessmentId: 'a1', track: 'senior', norm: { provisional: true }, validity: { flag: 'ok' }, scales: {}, holland: { code: 'IRA' }, orientation: { dominant: 'ideas', secondary: 'things', undifferentiated: false }, dominant: {}, matches: { fields: [{ rank: 1, id: 'law', label: 'Law & Legal Services', overall: 70, components: { interest: { pct: 90 } } }], streams: [] } };
  const page = api => mount(<SchoolStudent api={api} />, { route: '/v4/school/c1/student/s1', path: '/v4/school/:cohortId/student/:studentId' });

  it('shows the report in the third person, with a reminder that it was shared on purpose', async () => {
    page({ studentReport: vi.fn(() => ok({ student: { id: 's1', name: 'Asha Rao' }, report })) });
    expect(await screen.findByText('Results for Asha Rao')).toBeInTheDocument();
    expect(screen.getByText(/Shown because the student agreed to share/)).toBeInTheDocument();
    expect(screen.getByText('Their interests in a word')).toBeInTheDocument();
    expect(screen.getByText(/They lean/)).toBeInTheDocument();
    expect(screen.queryByText(/Your interests/)).toBeNull();
    expect(screen.getByText('Career fields that may suit them')).toBeInTheDocument();
    expect(screen.queryByText(/may suit you/)).toBeNull();
  });
  it('NOT_SHARED, NO_RESULT and not-found each get their own plain message', async () => {
    for (const [code, text] of [['NOT_SHARED', /has not agreed to share/], ['NO_RESULT', /has not finished/], ['NOT_FOUND', /could not find that student/]]) {
      const { unmount } = page({ studentReport: vi.fn(() => Promise.reject(apiErr(code === 'NOT_SHARED' ? 403 : 404, code))) });
      expect(await screen.findByText(text)).toBeInTheDocument();
      unmount();
    }
  });
});

describe('AdminOrgs', () => {
  const org = (over = {}) => ({ _id: 'o1', name: 'DPS Test School', type: 'school', board: 'CBSE', city: 'Delhi', dpa: { version: null, signedAt: null }, ...over });
  const mk = (over = {}) => ({
    list: vi.fn(() => ok({ organizations: [org()] })), deletionRequests: vi.fn(() => ok({ requests: [] })), create: vi.fn(() => ok({})),
    recordDpa: vi.fn(() => ok({})), cohorts: vi.fn(() => ok({ cohorts: [] })), counsellors: vi.fn(() => ok({ counsellors: [] })), createCohort: vi.fn(() => ok({})),
    setCohortStatus: vi.fn(() => ok({})), createCounsellor: vi.fn(() => ok({})), deleteUser: vi.fn(() => ok({})), ...over
  });
  const page = api => mount(<AdminOrgs api={api} />, { route: '/admin/orgs', path: '/admin/orgs' });

  it('adds an organization (the button waits for a name)', async () => {
    const api = mk(); const user = userEvent.setup(); page(api);
    expect(await screen.findByText('DPS Test School')).toBeInTheDocument();
    const add = screen.getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), 'Hill View College');
    await user.selectOptions(screen.getByLabelText('Type'), 'college');
    await user.click(add);
    await waitFor(() => expect(api.create).toHaveBeenCalledWith({ name: 'Hill View College', type: 'college', board: '', city: '' }));
    expect(await screen.findByText('Organization added.')).toBeInTheDocument();
  });

  it('a class cannot be created until the agreement is recorded, and recording it is a visible step', async () => {
    const api = mk({ createCohort: vi.fn(() => Promise.reject(apiErr(409, 'DPA_REQUIRED'))) });
    const user = userEvent.setup(); page(api);
    await user.click(await screen.findByRole('button', { name: 'Manage' }));
    expect(screen.getByText(/Required before any class can be created/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Class name'), 'Class 8-B');
    await user.click(screen.getByRole('button', { name: 'Create class' }));
    expect(await screen.findByText('Record the data-processing agreement first.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Agreement version'), '2026-v1');
    await user.click(screen.getByRole('button', { name: 'Record' }));
    await waitFor(() => expect(api.recordDpa).toHaveBeenCalledWith('o1', '2026-v1'));
  });

  it('with the agreement on file it shows its version and date; classes show their codes and can be closed', async () => {
    const api = mk({
      list: vi.fn(() => ok({ organizations: [org({ dpa: { version: '2026-v1', signedAt: '2026-09-01T00:00:00Z' } })] })),
      cohorts: vi.fn(() => ok({ cohorts: [{ _id: 'k1', name: 'Class 8-B', track: 'junior', grade: '8', code: 'ABCD2345', status: 'open' }] }))
    });
    const user = userEvent.setup(); page(api);
    await user.click(await screen.findByRole('button', { name: 'Manage' }));
    expect(await screen.findByText(/Version 2026-v1, recorded/)).toBeInTheDocument();
    expect(screen.getByLabelText('Class code ABCD2345')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close to new students' }));
    await waitFor(() => expect(api.setCohortStatus).toHaveBeenCalledWith('k1', 'closed'));
  });

  it('the grade choices follow the track, and the class is created with them', async () => {
    const api = mk({ list: vi.fn(() => ok({ organizations: [org({ dpa: { version: 'v', signedAt: '2026-09-01' } })] })) });
    const user = userEvent.setup(); page(api);
    await user.click(await screen.findByRole('button', { name: 'Manage' }));
    await user.selectOptions(screen.getByLabelText('Track'), 'senior');
    expect(within(screen.getByLabelText('Grade')).getAllByRole('option').map(o => o.value)).toEqual(['10', '11', '12']);
    await user.selectOptions(screen.getByLabelText('Grade'), '11');
    await user.type(screen.getByLabelText('Class name'), 'Class 11 Science');
    await user.click(screen.getByRole('button', { name: 'Create class' }));
    await waitFor(() => expect(api.createCohort).toHaveBeenCalledWith('o1', { name: 'Class 11 Science', track: 'senior', grade: '11' }));
    expect(await screen.findByText(/Share its code with the students/)).toBeInTheDocument();
  });

  it('lists counsellors and adds one; the email-taken error is explained', async () => {
    const api = mk({ counsellors: vi.fn(() => ok({ counsellors: [{ id: 'u1', fullName: 'Ms Rao', email: 'rao@school.example' }] })), createCounsellor: vi.fn(() => Promise.reject(apiErr(409, 'EMAIL_TAKEN'))) });
    const user = userEvent.setup(); page(api);
    await user.click(await screen.findByRole('button', { name: 'Manage' }));
    expect(await screen.findByText('rao@school.example')).toBeInTheDocument();
    const add = screen.getByRole('button', { name: 'Add counsellor' });
    expect(add).toBeDisabled();
    await user.type(screen.getByLabelText('Name', { selector: 'input[id^="cf-"]' }), 'Mr Singh');
    await user.type(screen.getByLabelText('Email', { selector: 'input[id^="ce-"]' }), 'rao@school.example');
    await user.type(screen.getByLabelText('Temporary password'), 'Passw0rdOK');
    await user.click(add);
    expect(await screen.findByText('That email already has an account.')).toBeInTheDocument();
  });

  it('deleting an account from the queue takes a second, explicit confirmation', async () => {
    const api = mk({ deletionRequests: vi.fn(() => ok({ requests: [{ id: 'u9', name: 'Kid One', email: 'kid@example.com', requestedAt: '2026-10-01T00:00:00Z', consentStatus: 'withdrawn' }] })) });
    const user = userEvent.setup(); page(api);
    await user.click(await screen.findByRole('button', { name: 'Delete account…' }));
    expect(api.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByText(/permanently removes the account and every result/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(api.deleteUser).toHaveBeenCalledWith('u9'));
  });

  it('shows "None waiting" for an empty queue; an expired admin session goes to the admin sign-in; a non-superadmin is told', async () => {
    page(mk());
    expect(await screen.findByText('None waiting.')).toBeInTheDocument();
  });
  it('expired admin session', async () => {
    localStorage.setItem('im_admin_token', 'old');
    page(mk({ list: vi.fn(() => Promise.reject(apiErr(401, 'TOKEN_EXPIRED'))) }));
    expect(await screen.findByText('ADMIN LOGIN')).toBeInTheDocument();
    expect(localStorage.getItem('im_admin_token')).toBeNull();
  });
  it('a plain admin is told the page is superadmin only', async () => {
    page(mk({ list: vi.fn(() => Promise.reject(apiErr(403, 'Access forbidden'))) }));
    expect(await screen.findByText('Superadmin only')).toBeInTheDocument();
  });
});
