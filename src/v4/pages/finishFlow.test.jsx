import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 's1', fullName: 'Asha Verma', role: 'student', track: 'senior' }, isLoggedIn: true, clearSession: () => {} }) }));
vi.mock('../Player', () => ({ default: ({ onFinished }) => <button onClick={() => onFinished('a1')}>finish</button> }));
vi.stubEnv('VITE_V4', 'on');

const { default: V4Assessment } = await import('./V4Assessment');
const { default: FinishedBanner } = await import('./FinishedBanner');
const { default: V4Results } = await import('./V4Results');

const Dash = () => <div><p>DASHBOARD</p><FinishedBanner /></div>;
const app = (api) => render(
  <MemoryRouter initialEntries={['/v4/test']}>
    <Routes>
      <Route path="/v4/test" element={<V4Assessment />} />
      <Route path="/v4" element={<Dash />} />
      <Route path="/platform/student/reports" element={<Dash />} />
      <Route path="/v4/results/:id" element={<V4Results api={api} />} />
    </Routes>
  </MemoryRouter>);

describe('finishing the test', () => {
  it('takes the student to their dashboard (not the report) and says what happened, with a link to the report', async () => {
    const user = userEvent.setup();
    app({});
    await user.click(screen.getByRole('button', { name: 'finish' }));
    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByText(/You have finished the test/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open my report' })).toHaveAttribute('href', '/v4/results/a1');
  });
  it('the banner is not shown when the dashboard is opened normally', () => {
    render(<MemoryRouter><FinishedBanner /></MemoryRouter>);
    expect(screen.queryByText(/You have finished the test/)).toBeNull();
  });
});

describe('the report page', () => {
  const full = { report: { cover: {}, status: { complete: true } } };
  it('always has a way back to the dashboard, even when the report is not found', async () => {
    const api = { fullReport: () => Promise.reject({ response: { data: { code: 'NOT_FOUND' } } }), report: () => Promise.reject({}) };
    render(<MemoryRouter initialEntries={['/v4/results/zz']}><Routes><Route path="/v4/results/:id" element={<V4Results api={api} />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole('link', { name: 'Back to your dashboard' })).toBeInTheDocument();
  });
  it('the header has a Dashboard button on every framed page', async () => {
    const api = { fullReport: () => Promise.reject({ response: { data: { code: 'NOT_FOUND' } } }), report: () => Promise.reject({}) };
    render(<MemoryRouter initialEntries={['/v4/results/zz']}><Routes><Route path="/v4/results/:id" element={<V4Results api={api} />} /></Routes></MemoryRouter>);
    expect((await screen.findAllByRole('link', { name: 'Dashboard' })).length).toBeGreaterThan(0);
  });
});
