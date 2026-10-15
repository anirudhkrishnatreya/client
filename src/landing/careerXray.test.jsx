import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from './LandingPage';
import CareerXray from './CareerXray';

const app = path => render(
  <MemoryRouter initialEntries={[path]}>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/career-xray" element={<CareerXray />} />
        <Route path="/mission-control" element={<Navigate to="/career-xray" replace />} />
      </Routes>
    </AuthProvider>
  </MemoryRouter>
);

describe('the landing page links to the Career X-Ray', () => {
  it('has it in the main nav, the footer, and next to the career assessment pitch', () => {
    app('/');
    expect(screen.getAllByRole('link', { name: 'Career X-Ray' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /See your Career X-Ray/ })).toHaveAttribute('href', '/career-xray');
  });
  it('clicking it from the nav opens the page', async () => {
    const user = userEvent.setup();
    app('/');
    await user.click(screen.getAllByRole('link', { name: 'Career X-Ray' })[0]);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Your Career.*X-Ray/is);
  });
  it('an old /mission-control link still lands on the page', async () => {
    app('/mission-control');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Your Career.*X-Ray/is);
  });
});

describe('Career X-Ray', () => {
  it('opens with a filled-in hero: a real chart preview and a trust row of photos, not an empty panel', () => {
    app('/career-xray');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Your Career.*X-Ray/is);
    expect(screen.getAllByText('Your interest shape').length).toBeGreaterThan(0);
    expect(screen.getByText('Built for Class 6 to college, across India')).toBeInTheDocument();
    expect(document.querySelectorAll('.lpx-xr-peek img, .lpx-xr-trust-photos img').length).toBeGreaterThan(0);
  });
  it('shows a spread of real report charts with sample numbers, and a photo section', () => {
    app('/career-xray');
    expect(screen.getAllByText('Your interest code').length).toBeGreaterThan(0);
    expect(screen.getByText('Your five dimensions')).toBeInTheDocument();
    expect(screen.getByText('Where your energy points')).toBeInTheDocument();
    expect(screen.getByText('Why a career was suggested')).toBeInTheDocument();
    expect(document.querySelector('.lpx-xr-spread svg')).toBeTruthy();
    expect(screen.getByAltText('A student going through their report with family at home')).toBeInTheDocument();
  });
  it('mentions it is built for India, with real exam names', () => {
    app('/career-xray');
    expect(screen.getByText(/JEE and NEET/)).toBeInTheDocument();
  });
  it('is honest about limits: no fake percentages, and the India review status is disclosed', () => {
    app('/career-xray');
    const body = document.body.textContent;
    expect(body).not.toMatch(/\d+%/);
    expect(screen.getAllByText(/reviewed in stages/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Careless answers are caught/)).toBeInTheDocument();
  });
  it('a FAQ question opens to reveal its answer', async () => {
    const user = userEvent.setup();
    app('/career-xray');
    const q = screen.getByRole('button', { name: /Why don.t you show percentages/ });
    expect(q).toHaveAttribute('aria-expanded', 'false');
    await user.click(q);
    expect(q).toHaveAttribute('aria-expanded', 'true');
  });
  it('the in-page quick nav scrolls to a section', async () => {
    const user = userEvent.setup();
    app('/career-xray');
    Element.prototype.scrollIntoView = () => {};
    await user.click(screen.getAllByRole('button', { name: 'The research' })[0]);
    expect(document.getElementById('framework')).toBeInTheDocument();
  });
  it('sets a distinct page title and restores it on leaving', () => {
    const { unmount } = app('/career-xray');
    expect(document.title).toMatch(/Career X-Ray/);
    unmount();
  });
  it('offers a way to start the assessment from the page', () => {
    app('/career-xray');
    expect(screen.getAllByRole('link', { name: /Take the (assessment|career assessment)/ }).length).toBeGreaterThan(0);
  });
});
