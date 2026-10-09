import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import V4Register, { ageFrom } from './V4Register';
import GuardianConsent from './GuardianConsent';
import V4Dashboard, { PdfCell } from './V4Dashboard';
import V4Results from './V4Results';

const apiErr = (status, code, extra = {}) => Object.assign(new Error(code), { response: { status, data: { code, error: code, ...extra } } });
const ok = data => Promise.resolve({ data });
const TODAY = new Date(Date.UTC(2026, 9, 9));

function mount(ui, { route = '/', path = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}><AuthProvider><Routes><Route path={path} element={ui} /><Route path="/v4" element={<div>DASHBOARD</div>} /><Route path="/login" element={<div>LOGIN</div>} /></Routes></AuthProvider></MemoryRouter>);
}
beforeEach(() => localStorage.clear());

describe('ageFrom', () => {
  it.each([['2013-06-01', 13], ['2008-10-10', 17], ['2008-10-09', 18], ['2000-01-01', 26], ['not a date', null], ['2010-02-31', null], ['', null]])('%s → %s', (dob, age) => expect(ageFrom(dob, TODAY)).toBe(age));
});

describe('V4Register', () => {
  const fill = async (user, over = {}) => {
    const v = { fullName: 'Asha Verma', email: 'asha@example.com', password: 'Passw0rdOK', dob: '2000-01-01', ...over };
    await user.type(screen.getByLabelText('Full name'), v.fullName);
    await user.type(screen.getByLabelText('Email'), v.email);
    await user.type(screen.getByLabelText('Password'), v.password);
    await user.type(screen.getByLabelText('Date of birth'), v.dob);
  };

  it('an adult sees no guardian section and registers with a grade; the account is saved and they go to the dashboard', async () => {
    const api = { register: vi.fn(() => ok({ token: 'TOKEN', user: { id: 'u1', fullName: 'Asha Verma', track: 'college' } })) };
    const user = userEvent.setup();
    mount(<V4Register api={api} today={TODAY} />);
    await fill(user);
    expect(screen.queryByText(/Your parent or guardian/)).toBeNull();
    await user.selectOptions(screen.getByLabelText('Your class or year'), 'ug2');
    await user.click(screen.getByLabelText(/I have read the summary/));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText('DASHBOARD');
    expect(api.register).toHaveBeenCalledWith({ fullName: 'Asha Verma', email: 'asha@example.com', password: 'Passw0rdOK', dateOfBirth: '2000-01-01', acceptTerms: true, grade: 'ug2' });
    expect(localStorage.getItem('im_user_token')).toBe('TOKEN');
  });

  it('a minor must give a guardian, and the guardian details are sent', async () => {
    const api = { register: vi.fn(() => ok({ token: 'T', user: { id: 'u', fullName: 'Kid', track: 'junior' } })) };
    const user = userEvent.setup();
    mount(<V4Register api={api} today={TODAY} />);
    await fill(user, { dob: '2013-06-01' });
    expect(screen.getByText('Your parent or guardian')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Your class or year'), '8');
    await user.type(screen.getByLabelText('Their name'), 'Meera Verma');
    await user.type(screen.getByLabelText('Their email'), 'meera@example.com');
    await user.click(screen.getByLabelText(/I have read the summary/));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText('DASHBOARD');
    expect(api.register.mock.calls[0][0].guardian).toEqual({ name: 'Meera Verma', email: 'meera@example.com', relationship: 'parent' });
    expect(api.register.mock.calls[0][0].grade).toBe('8');
  });

  it('a class code replaces the grade question, and the optional sharing choice appears for adults only', async () => {
    const api = { register: vi.fn(() => ok({ token: 'T', user: { id: 'u', fullName: 'A', track: 'senior' } })) };
    const user = userEvent.setup();
    mount(<V4Register api={api} today={TODAY} />);
    await fill(user, { dob: '2000-01-01' });
    expect(screen.queryByLabelText(/Let my school/)).toBeNull();
    await user.type(screen.getByLabelText(/Class code/), 'abcd2345');
    expect(screen.queryByLabelText('Your class or year')).toBeNull();
    await user.click(screen.getByLabelText(/Let my school/));
    await user.click(screen.getByLabelText(/I have read the summary/));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText('DASHBOARD');
    expect(api.register.mock.calls[0][0]).toMatchObject({ classCode: 'abcd2345', shareWithSchool: true });
    expect(api.register.mock.calls[0][0].grade).toBeUndefined();
  });

  it('shows the server\'s field errors next to the fields, and a friendly message for a used email', async () => {
    const api = { register: vi.fn().mockRejectedValueOnce(apiErr(400, 'VALIDATION_FAILED', { details: { password: ['At least 8 characters'], dateOfBirth: 'Enter your date of birth as YYYY-MM-DD' } })).mockRejectedValueOnce(apiErr(409, 'EMAIL_TAKEN')) };
    const user = userEvent.setup();
    mount(<V4Register api={api} today={TODAY} />);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText(/YYYY-MM-DD/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
    expect(localStorage.getItem('im_user_token')).toBeNull();
  });

  it('a network failure gives a general message and keeps what was typed', async () => {
    const api = { register: vi.fn(() => Promise.reject(new Error('Network Error'))) };
    const user = userEvent.setup();
    mount(<V4Register api={api} today={TODAY} />);
    await user.type(screen.getByLabelText('Full name'), 'Keep Me');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(/could not create your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Keep Me');
  });

  it('cookie-only mode (no token in the reply) still signs the student in', async () => {
    const api = { register: vi.fn(() => ok({ user: { id: 'u', fullName: 'Cookie Kid', track: 'senior' } })) };
    const user = userEvent.setup();
    mount(<V4Register api={api} today={TODAY} />);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText('DASHBOARD');
    expect(localStorage.getItem('im_user_token')).toBe('cookie');
  });

  it('the privacy summary says only what the system really does, and that the full terms are still coming', async () => {
    mount(<V4Register api={{}} today={TODAY} />);
    expect(screen.getByText(/The default is no/)).toBeInTheDocument();
    expect(screen.getByText(/full terms are being finalised/i)).toBeInTheDocument();
  });
});

describe('GuardianConsent', () => {
  const info = { student: { firstName: 'Riya' }, guardianName: 'Meera Verma', collects: ['name, email and date of birth', 'answers to the career questionnaire'] };
  const page = api => mount(<GuardianConsent api={api} />, { route: '/guardian-consent/tok123', path: '/guardian-consent/:token' });

  it('shows what is collected, the sharing choice (off by default), and cannot confirm until the guardian agrees', async () => {
    const api = { guardianLookup: vi.fn(() => ok(info)), guardianConfirm: vi.fn(() => ok({ status: 'granted' })) };
    const user = userEvent.setup();
    page(api);
    expect(await screen.findByText(/Please confirm for Riya/)).toBeInTheDocument();
    expect(screen.getByText('name, email and date of birth')).toBeInTheDocument();
    expect(screen.getByLabelText(/let Riya's school counsellor see/i)).not.toBeChecked();
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();
    await user.click(screen.getByLabelText(/I am Riya's parent or guardian/));
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(await screen.findByText(/can now take the assessment/)).toBeInTheDocument();
    expect(api.guardianConfirm).toHaveBeenCalledWith('tok123', { agree: true, shareWithSchool: false });
  });

  it('the guardian can opt in to sharing', async () => {
    const api = { guardianLookup: vi.fn(() => ok(info)), guardianConfirm: vi.fn(() => ok({})) };
    const user = userEvent.setup();
    page(api);
    await screen.findByText(/Please confirm for Riya/);
    await user.click(screen.getByLabelText(/let Riya's school counsellor see/i));
    await user.click(screen.getByLabelText(/I am Riya's parent or guardian/));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(api.guardianConfirm).toHaveBeenCalledWith('tok123', { agree: true, shareWithSchool: true }));
  });

  it('declining takes two clicks, so it cannot happen by accident', async () => {
    const api = { guardianLookup: vi.fn(() => ok(info)), guardianDecline: vi.fn(() => ok({})) };
    const user = userEvent.setup();
    page(api);
    await user.click(await screen.findByRole('button', { name: 'I do not agree' }));
    expect(api.guardianDecline).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Yes, I do not agree' }));
    expect(await screen.findByText(/will not be able to take the assessment/)).toBeInTheDocument();
    expect(api.guardianDecline).toHaveBeenCalledWith('tok123');
  });

  it('an expired or used link is explained', async () => {
    page({ guardianLookup: vi.fn(() => Promise.reject(apiErr(404, 'LINK_INVALID_OR_EXPIRED'))) });
    expect(await screen.findByText(/expired or was already used/)).toBeInTheDocument();
  });

  it('a link that expires while the page is open is handled at confirm time', async () => {
    const api = { guardianLookup: vi.fn(() => ok(info)), guardianConfirm: vi.fn(() => Promise.reject(apiErr(404, 'LINK_INVALID_OR_EXPIRED'))) };
    const user = userEvent.setup();
    page(api);
    await screen.findByText(/Please confirm for Riya/);
    await user.click(screen.getByLabelText(/I am Riya's parent or guardian/));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText(/expired or was already used/)).toBeInTheDocument();
  });

  it('shows no personal details beyond the first name', async () => {
    page({ guardianLookup: vi.fn(() => ok(info)) });
    await screen.findByText(/Please confirm for Riya/);
    expect(document.body.textContent).not.toMatch(/@|\d{4}-\d{2}-\d{2}/);
  });
});

describe('V4Dashboard', () => {
  const baseApi = (over = {}) => ({
    consent: vi.fn(() => ok({ consent: { required: false, status: 'not_required', shareWithSchool: false, guardianEmail: null } })),
    reports: vi.fn(() => ok({ reports: [] })), session: vi.fn(() => Promise.reject(apiErr(404, 'NO_ACTIVE_SESSION'))), ...over
  });
  const signedIn = (user = { id: 'u', fullName: 'Asha Verma', track: 'senior', grade: '11' }) => { localStorage.setItem('im_user_token', 'cookie'); localStorage.setItem('im_user', JSON.stringify(user)); };

  async function dash(api, user) {
    signedIn(user);
    const axiosApi = (await import('../../api')).default;
    vi.spyOn(axiosApi, 'get').mockImplementation(url => (url === '/auth/me' ? ok({ user: JSON.parse(localStorage.getItem('im_user')) }) : Promise.reject(new Error('unexpected ' + url))));
    return mount(<V4Dashboard api={api} today={TODAY} />, { route: '/v4', path: '/v4' });
  }

  it('lets a consented student start; says "Continue" when an attempt is open', async () => {
    await dash(baseApi());
    expect(await screen.findByRole('button', { name: 'Start your test' })).toBeEnabled();
  });
  it('continue vs start', async () => {
    await dash(baseApi({ session: vi.fn(() => ok({ blocks: [] })) }));
    expect(await screen.findByRole('button', { name: 'Continue your test' })).toBeEnabled();
  });

  it('while a guardian has not confirmed, the test is locked, the masked email is shown, and the link can be resent', async () => {
    const api = baseApi({ consent: vi.fn(() => ok({ consent: { required: true, status: 'pending', shareWithSchool: false, guardianEmail: 'm***@example.com' } })), resendConsent: vi.fn(() => ok({})) });
    const user = userEvent.setup();
    await dash(api);
    expect(await screen.findByText('m***@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start your test' })).toBeDisabled();
    expect(screen.getByText(/once your parent or guardian confirms/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send the link again' }));
    expect(api.resendConsent).toHaveBeenCalled();
    expect(await screen.findByText('We sent a new link.')).toBeInTheDocument();
  });

  it('a mistyped guardian email can be corrected', async () => {
    const api = baseApi({ consent: vi.fn(() => ok({ consent: { required: true, status: 'pending', shareWithSchool: false, guardianEmail: 'w***@example.com' } })), changeGuardian: vi.fn(() => ok({})) });
    const user = userEvent.setup();
    await dash(api);
    await user.click(await screen.findByRole('button', { name: 'Wrong email?' }));
    await user.type(screen.getByLabelText('Their name'), 'Right Name');
    await user.type(screen.getByLabelText('Their email'), 'right@example.com');
    await user.click(screen.getByRole('button', { name: 'Save and send' }));
    await waitFor(() => expect(api.changeGuardian).toHaveBeenCalledWith({ name: 'Right Name', email: 'right@example.com', relationship: 'parent' }));
  });

  it('a withdrawn account is told the assessment is switched off', async () => {
    await dash(baseApi({ consent: vi.fn(() => ok({ consent: { required: false, status: 'withdrawn' } })) }));
    expect(await screen.findByText(/withdrawn consent/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start your test' })).toBeDisabled();
  });

  it('an older account without a date of birth or track is asked for them before anything else', async () => {
    const api = baseApi({ consent: vi.fn(() => ok({ consent: { required: false, status: null } })), setProfile: vi.fn(() => ok({})), completeProfile: vi.fn(() => ok({})) });
    const user = userEvent.setup();
    await dash(api, { id: 'u', fullName: 'Old Account', track: null });
    await screen.findByText('A few details first');
    expect(screen.getByRole('button', { name: 'Start your test' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Your class or year'), '11');
    await user.type(screen.getByLabelText('Date of birth'), '2000-01-01');
    await user.click(screen.getByLabelText(/I have read the summary/));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.completeProfile).toHaveBeenCalledWith({ dateOfBirth: '2000-01-01', acceptTerms: true }));
    expect(api.setProfile).toHaveBeenCalledWith({ track: 'senior', grade: '11' });
  });

  it('joins a class with a code, and the card then shows the class; leaving brings the form back', async () => {
    const api = baseApi({ joinClass: vi.fn(() => ok({ cohort: { id: 'c1', name: 'Class 11-A' } })), leaveClass: vi.fn(() => ok({})) });
    const user = userEvent.setup();
    await dash(api);
    await user.type(await screen.findByLabelText(/Class code from your school/), 'ABCD2345');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    await waitFor(() => expect(api.joinClass).toHaveBeenCalledWith('ABCD2345'));
    expect(await screen.findByText('You are in a class at your school.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Class code from your school/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Leave class' }));
    expect(await screen.findByLabelText(/Class code from your school/)).toBeInTheDocument();
  });

  it('lists past results with their PDF state, and warns about an attempt that may not be reliable', async () => {
    const reports = [
      { assessmentId: 'a3', completedAt: '2026-10-01T10:00:00Z', hollandCode: 'IRA', validity: 'ok', provisional: true, pdf: { status: 'ready' } },
      { assessmentId: 'a2', completedAt: '2026-09-01T10:00:00Z', hollandCode: null, validity: 'invalid', provisional: true, pdf: { status: 'preparing' } },
      { assessmentId: 'a1', completedAt: '2026-08-01T10:00:00Z', hollandCode: 'SEC', validity: 'ok', provisional: true, pdf: { status: 'unavailable' } }
    ];
    await dash(baseApi({ reports: vi.fn(() => ok({ reports })) }));
    expect(await screen.findByText('IRA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByText('Preparing your PDF…')).toBeInTheDocument();
    expect(screen.getByText('PDF coming soon')).toBeInTheDocument();
    expect(screen.getByText(/Retaking is recommended/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View' })).toHaveLength(3);
  });

  it('an adult controls sharing; a minor sees the guardian\'s choice and cannot change it', async () => {
    const adult = baseApi({ setSharing: vi.fn(() => ok({})) });
    const user = userEvent.setup();
    await dash(adult);
    await user.click(await screen.findByLabelText(/Let my school's counsellor see/));
    expect(adult.setSharing).toHaveBeenCalledWith(true);
  });
  it('minor: sharing is read-only', async () => {
    await dash(baseApi({ consent: vi.fn(() => ok({ consent: { required: true, status: 'granted', shareWithSchool: false } })) }));
    expect(await screen.findByText(/decided by your parent or guardian/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Let my school's counsellor see/)).toBeNull();
  });

  it('withdrawing needs a second, explicit confirmation', async () => {
    const api = baseApi({ withdraw: vi.fn(() => ok({})) });
    const user = userEvent.setup();
    await dash(api);
    await user.click(await screen.findByRole('button', { name: /Withdraw and ask for my information/ }));
    expect(api.withdraw).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Yes, withdraw' }));
    expect(api.withdraw).toHaveBeenCalled();
  });

  it('if the page cannot load there is a message and a retry', async () => {
    const api = baseApi({ consent: vi.fn().mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue({ data: { consent: { required: false, status: 'not_required' } } }) });
    const user = userEvent.setup();
    await dash(api);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your page/);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Start your test' })).toBeInTheDocument();
  });
});

describe('PdfCell', () => {
  it('downloads the file through an authenticated request, not a bare link', async () => {
    const api = { pdf: vi.fn(() => ok(new Blob(['%PDF'], { type: 'application/pdf' }))) };
    URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();                    // jsdom cannot navigate
    const user = userEvent.setup();
    render(<PdfCell api={api} report={{ assessmentId: 'a1', pdf: { status: 'ready' } }} />);
    await user.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => expect(api.pdf).toHaveBeenCalledWith('a1'));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
  it('a failed download says so', async () => {
    const user = userEvent.setup();
    render(<PdfCell api={{ pdf: vi.fn(() => Promise.reject(new Error('x'))) }} report={{ assessmentId: 'a1', pdf: { status: 'ready' } }} />);
    await user.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Download failed/);
  });
});

describe('V4Results', () => {
  const scales = {
    'int.field.law': { label: 'Law & Legal Services', dimension: 'interest', scored: true, stanine: 8, pomp: 80, band: 'strong' },
    'apt.verbal': { label: 'Verbal Reasoning', dimension: 'aptitude', scored: true, stanine: 7, pomp: 70, band: 'strong' },
    'p.E': { label: 'Extraversion', dimension: 'personality', scored: true, stanine: 4, pomp: 50, band: 'moderate' }
  };
  const report = (over = {}) => ({ assessmentId: 'a1', track: 'senior', norm: { provisional: true }, validity: { flag: 'ok' }, scales, holland: { code: 'EAS' }, orientation: { dominant: 'people', secondary: 'ideas', undifferentiated: false },
    dominant: { interests: ['int.field.law'], aptitude: ['apt.verbal'], personality: [], ei: [] }, matches: { fields: [{ rank: 1, id: 'law', label: 'Law & Legal Services', overall: 81, components: { interest: { pct: 100 }, ei: { pct: 70 } } }], streams: [{ rank: 1, id: 'humanities', label: 'Humanities and Social Sciences', overall: 74, components: { interest: { pct: 90 } } }] }, ...over });
  const notReady = () => Promise.reject(apiErr(409, 'REPORT_NOT_READY'));
  const page = (api, fullReport = notReady) => mount(<V4Results api={{ fullReport, ...api }} />, { route: '/v4/results/a1', path: '/v4/results/:id' });

  it('shows the Holland code, orientation, strongest areas, bars with accessible labels, and matches; says scores are provisional', async () => {
    page({ report: vi.fn(() => ok({ report: report() })) });
    expect(await screen.findByText('EAS')).toBeInTheDocument();
    expect(screen.getByText('Enterprising · Artistic · Social')).toBeInTheDocument();
    expect(screen.getByText(/lean towards working with/)).toHaveTextContent('People');
    expect(screen.getByRole('img', { name: 'Verbal Reasoning: 7 out of 9, Strong' })).toBeInTheDocument();
    expect(screen.getByText(/provisional/i)).toBeInTheDocument();
    expect(screen.getByText('81% match')).toBeInTheDocument();
    expect(screen.getByText('Subject streams that may suit you')).toBeInTheDocument();
    expect(screen.getByText('emotional intelligence 70%', { exact: false })).toBeInTheDocument();
  });
  it('an invalid attempt shows no strengths or careers, only an explanation', async () => {
    page({ report: vi.fn(() => ok({ report: report({ validity: { flag: 'invalid' }, matches: { withheld: true } }) })) });
    expect(await screen.findByText(/may not show your real strengths/)).toBeInTheDocument();
    expect(screen.queryByText('EAS')).toBeNull();
    expect(screen.queryByText(/% match/)).toBeNull();
  });
  it('a flat interest profile is explained kindly instead of showing a code', async () => {
    page({ report: vi.fn(() => ok({ report: report({ holland: { code: null }, orientation: { undifferentiated: true } }) })) });
    expect(await screen.findByText(/spread fairly evenly/)).toBeInTheDocument();
    expect(screen.queryByText(/lean towards/)).toBeNull();
  });
  it('Junior results show areas to explore and never percentages', async () => {
    page({ report: vi.fn(() => ok({ report: report({ track: 'junior', matches: { explore: { areas: [{ id: 'science', family: 'Science and discovery' }], strengths: [], note: 'Areas to explore, not recommendations.' } } }) })) });
    expect(await screen.findByText('Science and discovery')).toBeInTheDocument();
    expect(screen.getByText(/not recommendations/)).toBeInTheDocument();
    expect(screen.queryByText(/% match/)).toBeNull();
  });
  it('someone else\'s or a missing report is "not found"', async () => {
    page({ report: vi.fn(() => Promise.reject(apiErr(403, 'FORBIDDEN'))) });
    expect(await screen.findByText('Results not found')).toBeInTheDocument();
  });
  it('while the wording is unfinished the plain scores appear with an explanation', async () => {
    page({ report: vi.fn(() => ok({ report: report() })) });
    expect(await screen.findByText(/full report is still being finished/)).toBeInTheDocument();
    expect(screen.getByText('EAS')).toBeInTheDocument();
  });
  it('a missing report is "not found" even when the finished report is asked for first', async () => {
    page({}, () => Promise.reject(apiErr(404, 'NOT_FOUND')));
    expect(await screen.findByText('Results not found')).toBeInTheDocument();
  });
  it('a server error is shown as an error, not as "not ready"', async () => {
    page({}, () => Promise.reject(apiErr(500, 'SERVER_ERROR')));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/);
  });
  it('a caution flag adds a gentle note', async () => {
    page({ report: vi.fn(() => ok({ report: report({ validity: { flag: 'caution' } }) })) });
    expect(await screen.findByText(/looked unusual/)).toBeInTheDocument();
  });
});

describe('V4Results: the finished report', () => {
  const plan = [{ title: 'Read widely', text: 'Mix your reading.' }];
  const doc = (over = {}) => ({ hash: 'abcdef1234567890', student: { name: 'Asha Rao', track: 'senior' }, status: { contentStatus: 'approved', complete: true },
    notices: [{ kind: 'provisional', text: 'Results are provisional.' }, { kind: 'guide', text: 'A guide, not a verdict.' }],
    sections: [
      { id: 'intro', title: 'About this report', blocks: [{ id: 'page.howToRead', text: 'Read the nine-step scale.' }] },
      { id: 'orientation', title: 'Work orientation', available: true, coordinates: { x: -0.3, y: -0.4 }, poles: [{ pole: 'ideas', label: 'Ideas', stanine: 8, meaning: 'Working with ideas means thinking.' }], dominant: { label: 'Ideas', text: 'You like ideas.' }, secondary: { label: 'People', text: 'You like people a bit.' } },
      { id: 'interests', title: 'Interests', holland: { available: true, code: 'IRA', types: ['R', 'I', 'A', 'S', 'E', 'C'].map((l, i) => ({ letter: l, label: l, stanine: 3 + i })), letters: [{ letter: 'I', label: 'Investigative', text: 'Likes to study.' }] }, scales: [{ id: 'int.field.law', label: 'Law', stanine: 8, band: 'strong', dominant: true, meaning: 'Interest in law.', analysis: 'You show a strong interest in law.' }], notScored: [] },
      { id: 'aptitude', title: 'Aptitude', scales: [{ id: 'apt.verbal', label: 'Verbal Reasoning', stanine: 3, band: 'developing', dominant: false, meaning: 'Verbal reasoning is words.', analysis: 'Reading may take effort.', plan }], notScored: [{ id: 'apt.spatial', label: 'Spatial Reasoning' }] },
      { id: 'matches', title: 'Fields that fit you', available: true, kind: 'fields', fields: [
        { rank: 1, id: 'law', label: 'Law & Legal Services', overall: 82, page: { summary: 'Law is about rules.', studyPaths: ['BA LLB'], exams: ['CLAT'], roles: ['Advocate'], sources: ['Consortium of NLUs'], lastReviewedAt: null }, gaps: [{ scale: 'apt.verbal', label: 'Verbal Reasoning', student: 3, need: 6, plan }] },
        { rank: 2, id: 'design', label: 'Design', overall: 70 }], streams: [] },
      { id: 'nextSteps', title: 'What to do next', blocks: [{ id: 'page.nextSteps', text: 'Talk to a counsellor.' }] }
    ], ...over });
  const full = d => mount(<V4Results api={{ fullReport: vi.fn(() => ok({ report: d })) }} />, { route: '/v4/results/a1', path: '/v4/results/:id' });

  it('lays out every section of the document, with the words exactly as the server sent them', async () => {
    full(doc());
    expect(await screen.findByText('Read the nine-step scale.')).toBeInTheDocument();
    expect(screen.getByText('You like ideas.')).toBeInTheDocument();
    expect(screen.getAllByText('IRA').length).toBeGreaterThan(0);                      // on the one-page summary and in the interests chapter
    expect(screen.getByText('You show a strong interest in law.')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Verbal Reasoning: 3 out of 9' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Read widely.').length).toBe(2);              // the plan, and again under the field's skill gap
    expect(screen.getByText('Law is about rules.')).toBeInTheDocument();
    expect(screen.getByText(/Not yet checked by a reviewer/)).toBeInTheDocument();
    expect(screen.getByText(/could not score Spatial Reasoning/)).toBeInTheDocument();
    expect(screen.getByText('Talk to a counsellor.')).toBeInTheDocument();
    expect(screen.getByText('Results are provisional.')).toBeInTheDocument();
  });
  it('fields beyond the detailed ones are listed in order', async () => {
    full(doc());
    expect((await screen.findAllByText('Design')).length).toBeGreaterThan(0);             // listed in the ranking, without a detail page
    expect(screen.getByText('The top few, up close')).toBeInTheDocument();
    expect(screen.getAllByText('Law & Legal Services').length).toBeGreaterThan(1);
  });
  it('draft wording is labelled', async () => {
    full(doc({ status: { contentStatus: 'draft', complete: true } }));
    expect(await screen.findByText(/Draft wording/)).toBeInTheDocument();
  });
  it('an invalid attempt shows the notice and next steps, nothing else', async () => {
    full(doc({ notices: [{ kind: 'invalid', text: 'This report may not describe you.' }], sections: [
      { id: 'intro', title: 'About this report', blocks: [{ id: 'page.howToRead', text: 'Intro.' }] },
      { id: 'nextSteps', title: 'What to do next', blocks: [{ id: 'page.nextSteps', text: 'Retake it.' }] }] }));
    expect(await screen.findByRole('alert')).toHaveTextContent('may not describe you');
    expect(screen.getByText('Retake it.')).toBeInTheDocument();
    expect(screen.queryByText(/% match/)).toBeNull();
  });
  it('a Junior document shows areas to explore', async () => {
    full(doc({ sections: [
      { id: 'intro', title: 'About this report', blocks: [{ id: 'page.howToRead', text: 'Intro.' }] },
      { id: 'matches', title: 'Things to explore', available: true, kind: 'explore', areas: [{ id: 'science', label: 'Science & Experiments', family: 'Science and discovery', text: 'Try a safe experiment.' }], strengths: [{ id: 'apt.logical', label: 'Logical Reasoning' }], note: 'Areas to explore, not recommendations.' },
      { id: 'nextSteps', title: 'What to do next', blocks: [{ id: 'page.nextSteps', text: 'Next.' }] }] }));
    expect(await screen.findByText('Try a safe experiment.')).toBeInTheDocument();
    expect(screen.getByText('Logical Reasoning')).toBeInTheDocument();
  });
});

describe('PdfCell: failed', () => {
  it('offers to try again, and then shows it is being prepared', async () => {
    const api = { requestPdf: vi.fn(() => ok({})) };
    const user = userEvent.setup();
    render(<PdfCell api={api} report={{ assessmentId: 'a1', pdf: { status: 'failed' } }} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(api.requestPdf).toHaveBeenCalledWith('a1'));
    expect(await screen.findByText(/Preparing your PDF/)).toBeInTheDocument();
  });
  it('says so when it cannot be restarted', async () => {
    const user = userEvent.setup();
    render(<PdfCell api={{ requestPdf: vi.fn(() => Promise.reject(new Error('x'))) }} report={{ assessmentId: 'a1', pdf: { status: 'failed' } }} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not restart/);
  });
});

describe('V4Results: parity features of the finished report', () => {
  const rich = () => ({ hash: 'abcdef1234567890', student: { name: 'Asha Rao', track: 'senior', school: 'Test School' }, status: { contentStatus: 'approved', complete: true }, notices: [],
    sections: [
      { id: 'intro', title: 'About this report', blocks: [{ id: 'page.howToRead', text: 'Intro text.' }] },
      { id: 'interests', title: 'What you are drawn to', about: 'Interests are the fields you enjoy.', holland: { available: false }, chart: [{ id: 'int.field.law', label: 'Law', stanine: 8, band: 'strong' }, { id: 'int.field.design', label: 'Design', stanine: 3, band: 'developing' }],
        scales: [{ id: 'int.field.law', label: 'Law', stanine: 8, band: 'strong', dominant: true, meaning: 'Interest in law.', analysis: 'You like law.' }], notScored: [] },
      { id: 'aptitude', title: 'What your mind does well', about: 'Aptitude is what your mind does well.', chart: [{ id: 'apt.creative', label: 'Creative Thinking', stanine: 7, band: 'strong' }],
        scales: [{ id: 'apt.creative', label: 'Creative Thinking', stanine: 7, band: 'strong', dominant: true, meaning: 'Creative thinking.', analysis: 'You link ideas.', plan: [{ title: 'Make something', text: 'Turn an idea into a thing.' }] }], notScored: [] },
      { id: 'matches', title: 'Where this could lead', available: true, kind: 'fields', fields: [
        { rank: 1, id: 'law', label: 'Law & Legal Services', overall: 82, parts: [{ key: 'orientation', label: 'Style', pct: 70 }, { key: 'interest', label: 'Interest', pct: 90 }, { key: 'ei', label: 'EQ', pct: 80 }], strengths: [{ scale: 'apt.verbal', label: 'Verbal Reasoning' }],
          page: { summary: 'Law is about rules.', studyPaths: ['BA LLB'], exams: ['CLAT'], roles: ['Advocate'], employers: ['Law firms'], trending: ['Intellectual property'], sources: ['Consortium of NLUs'], lastReviewedAt: null }, gaps: [] }] },
      { id: 'developmentPlan', title: 'Skills worth building first', about: 'Pick one or two skills and start this month.', items: [{ scale: 'ei.conflict', label: 'Conflict Management', student: 3, need: 6, fields: ['Law & Legal Services'], plan: [{ title: 'Breathe first', text: 'Take one slow breath before you reply.' }] }] },
      { id: 'nextSteps', title: 'Your next few steps', blocks: [{ id: 'page.nextSteps', text: 'Read this with someone.' }] },
      { id: 'talkItThrough', title: 'Talk it through', blocks: [{ id: 'page.talkItThrough', text: 'A report is a start.' }], school: 'Test School', contacts: [{ name: 'Ms Rao', email: 'rao@school.example' }] }
    ] });
  const show = () => mount(<V4Results api={{ fullReport: vi.fn(() => ok({ report: rich() })) }} />, { route: '/v4/results/a1', path: '/v4/results/:id' });

  it('shows the chapter introduction, standout tiles and a chart of every scale', async () => {
    show();
    expect(await screen.findByText('Aptitude is what your mind does well.')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Law 8 of 9, Design 3 of 9/ }).length).toBe(1);
    expect(document.querySelectorAll('.rp-tile .rp-icon').length).toBeGreaterThan(2);
  });
  it('career pages show the five-part breakdown, why it fits, where people work and what to explore', async () => {
    show();
    expect(await screen.findByText('How it adds up')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Style 70 percent, Interest 90 percent, EQ 80 percent/ })).toBeInTheDocument();
    expect(screen.getByText('Why it fits you')).toBeInTheDocument();
    expect(screen.getByText('Verbal Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Law firms')).toBeInTheDocument();
    expect(screen.getByText('Intellectual property')).toBeInTheDocument();
  });
  it('shows the school on the cover, the development plan and the counsellor contact', async () => {
    show();
    expect(await screen.findByText(/Test School/, { selector: '.meta' })).toBeInTheDocument();
    expect(screen.getByText('Pick one or two skills and start this month.')).toBeInTheDocument();
    expect(screen.getByText('Conflict Management')).toBeInTheDocument();
    expect(screen.getByText(/rao@school.example/)).toBeInTheDocument();
  });
});

