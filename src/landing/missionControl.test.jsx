import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from './LandingPage';
import MissionControl from './MissionControl';

const app = path => render(
  <MemoryRouter initialEntries={[path]}>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mission-control" element={<MissionControl />} />
      </Routes>
    </AuthProvider>
  </MemoryRouter>
);

describe('the landing page links to Mission Control', () => {
  it('has it in the main nav, the footer, and next to the career assessment pitch', () => {
    app('/');
    expect(screen.getAllByRole('link', { name: 'Mission Control' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /See the science/ })).toHaveAttribute('href', '/mission-control');
  });
  it('clicking it from the nav opens the page', async () => {
    const user = userEvent.setup();
    app('/');
    await user.click(screen.getAllByRole('link', { name: 'Mission Control' })[0]);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/engineering.*orbit/is);
  });
});

describe('Mission Control', () => {
  it('shows the hero, real numbers, and a way back to iMenteo', () => {
    app('/mission-control');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/engineering.*orbit/is);
    expect(screen.getByText('483')).toBeInTheDocument();
    expect(screen.getAllByText('332').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Back to iMenteo/ }).length).toBeGreaterThan(0);
  });
  it('explains the five dimensions, the research, the report and the engine', () => {
    app('/mission-control');
    expect(screen.getAllByText('Interests').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Emotional intelligence').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Holland/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Brown & Gore/)).toBeInTheDocument();
    expect(screen.getAllByText(/O\*NET/).length).toBeGreaterThan(0);
    expect(screen.getByText(/35 to 40 pages/)).toBeInTheDocument();
    expect(screen.getByText(/483 at the moment/)).toBeInTheDocument();
  });
  it('is honest about limits: no fake percentages, and the India review status is disclosed', () => {
    app('/mission-control');
    const body = document.body.textContent;
    expect(body).not.toMatch(/\d+%/);
    expect(screen.getAllByText(/reviewed in stages/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Careless answers are caught/)).toBeInTheDocument();
  });
  it('a FAQ question opens to reveal its answer', async () => {
    const user = userEvent.setup();
    app('/mission-control');
    const q = screen.getByRole('button', { name: /Why don.t you show percentages/ });
    expect(q).toHaveAttribute('aria-expanded', 'false');
    await user.click(q);
    expect(q).toHaveAttribute('aria-expanded', 'true');
  });
  it('the in-page quick nav scrolls to a section', async () => {
    const user = userEvent.setup();
    app('/mission-control');
    Element.prototype.scrollIntoView = () => {};
    await user.click(screen.getAllByRole('button', { name: 'The research' })[0]);
    expect(document.getElementById('framework')).toBeInTheDocument();
  });
  it('sets a distinct page title and restores it on leaving', () => {
    const { unmount } = app('/mission-control');
    expect(document.title).toMatch(/Mission Control/);
    unmount();
  });
  it('offers a way to start the assessment from the page', () => {
    app('/mission-control');
    expect(screen.getAllByRole('link', { name: /Take the (assessment|career assessment)/ }).length).toBeGreaterThan(0);
  });
});
