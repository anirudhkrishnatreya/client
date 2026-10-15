import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

const apiErr = (status, code, extra = {}) => Object.assign(new Error(code), { response: { status, data: { code, error: code, ...extra } } });
const ok = data => Promise.resolve({ data });

function mount(ui, { route = '/', path = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/forgot-password" element={<div>FORGOT PAGE</div>} />
          <Route path="/v4" element={<div>DASHBOARD</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());
vi.mock('../v4/config', () => ({ V4_ENABLED: true }));
vi.mock('../platform/config', () => ({ PLATFORM_ENABLED: false }));

describe('ForgotPassword', () => {
  it('always shows the same "check your email" screen, whether or not the account exists', async () => {
    const api = vi.fn(() => ok({ success: true }));
    const user = userEvent.setup();
    mount(<ForgotPassword api={api} />);
    await user.type(screen.getByLabelText('Email or username'), 'asha@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('asha@example.com');
  });

  it('shows the same screen even if the request fails, so the endpoint cannot be used to find accounts', async () => {
    const api = vi.fn(() => Promise.reject(new Error('network')));
    const user = userEvent.setup();
    mount(<ForgotPassword api={api} />);
    await user.type(screen.getByLabelText('Email or username'), 'nobody@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
  });

  it('requires something to be typed first', async () => {
    const api = vi.fn(() => ok({ success: true }));
    const user = userEvent.setup();
    mount(<ForgotPassword api={api} />);
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(/enter your email or username/i)).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });
});

describe('ResetPassword', () => {
  const page = (check, reset) => mount(<ResetPassword check={check} reset={reset} />, { route: '/reset-password/tok123', path: '/reset-password/:token' });

  it('resets the password, signs the student in, and moves on to their dashboard', async () => {
    const check = vi.fn(() => ok({ valid: true }));
    const reset = vi.fn(() => ok({ token: 'T', user: { id: 'u1', fullName: 'Asha', role: 'student', track: 'senior' } }));
    const user = userEvent.setup();
    page(check, reset);
    expect(await screen.findByText('Choose a new password')).toBeInTheDocument();
    expect(check).toHaveBeenCalledWith('tok123');
    await user.type(screen.getByLabelText('New password'), 'NewPassw0rd');
    await user.type(screen.getByLabelText('Repeat the password'), 'NewPassw0rd');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText('Password updated')).toBeInTheDocument();
    expect(reset).toHaveBeenCalledWith('tok123', 'NewPassw0rd');
    expect(localStorage.getItem('im_user_token')).toBe('T');
    await screen.findByText('DASHBOARD', {}, { timeout: 2000 });
  });

  it('refuses mismatched passwords before calling the server', async () => {
    const check = vi.fn(() => ok({ valid: true }));
    const reset = vi.fn();
    const user = userEvent.setup();
    page(check, reset);
    await screen.findByText('Choose a new password');
    await user.type(screen.getByLabelText('New password'), 'NewPassw0rd');
    await user.type(screen.getByLabelText('Repeat the password'), 'Different1');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText(/do not match/)).toBeInTheDocument();
    expect(reset).not.toHaveBeenCalled();
  });

  it('an expired or already-used link is explained up front, before any password is typed', async () => {
    const check = vi.fn(() => Promise.reject(apiErr(404, 'LINK_INVALID_OR_EXPIRED')));
    page(check, vi.fn());
    expect(await screen.findByText(/expired or was already used/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new one' })).toHaveAttribute('href', expect.stringContaining('forgot-password'));
  });

  it('a link that expires between loading the page and submitting is handled at submit time too', async () => {
    const check = vi.fn(() => ok({ valid: true }));
    const reset = vi.fn(() => Promise.reject(apiErr(404, 'LINK_INVALID_OR_EXPIRED')));
    const user = userEvent.setup();
    page(check, reset);
    await screen.findByText('Choose a new password');
    await user.type(screen.getByLabelText('New password'), 'NewPassw0rd');
    await user.type(screen.getByLabelText('Repeat the password'), 'NewPassw0rd');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText(/expired or was already used/)).toBeInTheDocument();
  });

  it('relays a weak-password message from the server', async () => {
    const check = vi.fn(() => ok({ valid: true }));
    const reset = vi.fn(() => Promise.reject(apiErr(400, 'VALIDATION_FAILED', { details: ['At least one number'] })));
    const user = userEvent.setup();
    page(check, reset);
    await screen.findByText('Choose a new password');
    await user.type(screen.getByLabelText('New password'), 'NewPassword');
    await user.type(screen.getByLabelText('Repeat the password'), 'NewPassword');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText(/at least one number/i)).toBeInTheDocument();
  });
});
