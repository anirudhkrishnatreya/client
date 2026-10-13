import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from './LandingPage';

vi.mock('../api', () => ({ default: { get: () => Promise.resolve({ data: { user: { id: 'u', role: 'student' } } }), post: () => Promise.resolve({}) } }));
const page = () => render(<MemoryRouter><AuthProvider><LandingPage /></AuthProvider></MemoryRouter>);
beforeEach(() => { localStorage.clear(); vi.stubGlobal('matchMedia', q => ({ matches: /min-width: 1024px/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })); });
afterEach(() => vi.unstubAllGlobals());

describe('the full landing page', () => {
  it('has every section an ed-tech visitor looks for, in a sensible order', () => {
    const { container } = page();
    const ids = ['about', 'how-it-works', 'get-started', 'assessment', 'who', 'practice', 'ai', 'safety', 'faq', 'footer'].map(id => container.querySelector(`#${id}`));
    ids.forEach((el, i) => expect(el, `section ${i}`).not.toBeNull());
    for (let i = 1; i < ids.length; i++) expect(ids[i - 1].compareDocumentPosition(ids[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('keeps the designed hero and its first step', () => {
    page();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/GROW\s+YOUR FUTURE.*SKILLS.*WITH MENTORS/s);
    expect(screen.getAllByRole('link', { name: /Take the career assessment/ })[0].getAttribute('href')).toMatch(/register/);
  });
  it('has a slim bar with a link to each main section, for after the first screen has scrolled away', () => {
    page();
    const bar = screen.getByRole('navigation', { name: 'Sections', hidden: true });
    expect(bar.closest('header')).toHaveAttribute('aria-hidden', 'true');          // hidden from assistive tech until it slides in
    for (const l of ['About', 'How it works', 'Mentors', 'Assessment', 'Who it’s for', 'FAQ']) expect(within(bar).getByRole('button', { name: l, hidden: true })).toBeInTheDocument();
  });
  it('labels every drawn product preview as an example', () => {
    const { container } = page();
    const previews = [...container.querySelectorAll('.lpx-report, .lpx-pv, .lp-sess')];
    expect(previews.length).toBeGreaterThanOrEqual(3);
    previews.forEach(p => expect(p.querySelector('.lpx-eg, .lp-sess-tag')).not.toBeNull());
  });
  it('makes no price, statistic, speed or testimonial claim that has not been confirmed', () => {
    const { container } = page();
    const text = container.textContent;
    expect(text).not.toMatch(/\$|US\$|₹|per month|\/month/i);
    expect(text).not.toMatch(/\d+%/);
    expect(text).not.toMatch(/10x|under 5 minutes|best mentors|monetise/i);
    expect(text).toMatch(/Pricing is still being finalised/);
  });
  it('has no leftover placeholder wording from the design', () => {
    const { container } = page();
    expect(container.textContent).not.toMatch(/Write a description|View our mentor|Lorem|PRACTICE ADVICE/i);
  });
  it('the role tabs switch and show that role\'s content', async () => {
    const user = userEvent.setup();
    page();
    await user.click(screen.getByRole('tab', { name: 'Parents' }));
    expect(screen.getByRole('tab', { name: 'Parents', selected: true })).toBeInTheDocument();
    expect(screen.getByText(/Stay in the loop without having to ask/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Schools' }));
    expect(screen.getByText(/at least 10 students/)).toBeInTheDocument();
  });
  it('FAQ answers open and close', async () => {
    const user = userEvent.setup();
    page();
    const q = screen.getByRole('button', { name: /Who sees my results/ });
    expect(q).toHaveAttribute('aria-expanded', 'false');
    await user.click(q); expect(q).toHaveAttribute('aria-expanded', 'true');
    await user.click(q); expect(q).toHaveAttribute('aria-expanded', 'false');
  });
  it('shows no contact address until one is configured', () => {
    const { container } = page();
    expect(container.querySelector('footer a[href^="mailto:"]')).toBeNull();
  });
  it('says AI insights are still being rolled out, and that a person stays in charge', () => {
    page();
    expect(screen.getByText(/AI insights are being rolled out step by step/)).toBeInTheDocument();
    expect(screen.getByText(/A mentor stays in charge/)).toBeInTheDocument();
  });
});
