import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AssessmentProvider } from '../context/AssessmentContext';
import Login from './Login';

const authLogin = vi.fn();
const resendVerification = vi.fn();
vi.mock('../api', () => ({ authLogin: (...a) => authLogin(...a) }));
vi.mock('../v4/api', () => ({ v2: { resendVerification: (...a) => resendVerification(...a) } }));
vi.mock('../platform/config', () => ({ PLATFORM_ENABLED: false }));
vi.mock('../v4/config', () => ({ V4_ENABLED: false }));

const apiErr = (status, code, extra = {}) => Object.assign(new Error(code), { response: { status, data: { code, error: code, ...extra } } });

function mount() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider><AssessmentProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/assessment" element={<div>ASSESSMENT</div>} />
        </Routes>
      </AssessmentProvider></AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => { localStorage.clear(); authLogin.mockReset(); resendVerification.mockReset(); });

describe('Login', () => {
  it('signs in and moves on when the account is verified', async () => {
    authLogin.mockResolvedValueOnce({ data: { token: 'T', user: { id: 'u1', fullName: 'Asha', assessmentCompleted: false, onboardingCompleted: true } } });
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByLabelText('Email or username'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'Passw0rdOK');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('ASSESSMENT');
  });

  it('an unverified account is explained, and offers to resend the confirmation email', async () => {
    authLogin.mockRejectedValueOnce(apiErr(403, 'NOT_VERIFIED'));
    resendVerification.mockResolvedValueOnce({ data: { success: true } });
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByLabelText('Email or username'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'Passw0rdOK');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/confirm your email address/i)).toBeInTheDocument();
    const resendBtn = screen.getByRole('button', { name: 'Resend the confirmation email' });
    await user.click(resendBtn);
    expect(resendVerification).toHaveBeenCalledWith('asha@example.com');
    expect(await screen.findByText(/we have sent a new link/i)).toBeInTheDocument();
  });

  it('wrong credentials show a plain error, with no resend offer', async () => {
    authLogin.mockRejectedValueOnce(apiErr(401, 'INVALID_CREDENTIALS', { error: 'Invalid credentials' }));
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByLabelText('Email or username'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend the confirmation email' })).toBeNull();
  });
});
