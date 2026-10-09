import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingV2 from './LandingV2';

vi.mock('../api', () => ({ default: { get: () => Promise.resolve({ data: { user: { id: 'u', role: 'student' } } }), post: () => Promise.resolve({}) } }));

const page = () => render(<MemoryRouter><AuthProvider><LandingV2 /></AuthProvider></MemoryRouter>);
beforeEach(() => { localStorage.clear(); vi.stubGlobal('matchMedia', q => ({ matches: /min-width: 1024px/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })); });
afterEach(() => vi.unstubAllGlobals());

describe('landing page v2', () => {
  it('leads with the promise and a clear first step', () => {
    page();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Turn your goals into weekly progress.');
    const cta = screen.getByRole('link', { name: /Take the career assessment/ });
    expect(cta.getAttribute('href')).toMatch(/register/);
    screen.getAllByRole('link', { name: 'Log in' }).forEach(l => expect(l).toHaveAttribute('href', '/login'));
  });
  it('has the sections a visitor needs, in order, each reachable from the nav', () => {
    const { container } = page();
    const ids = ['why', 'how', 'who', 'ai', 'safety', 'faq'].map(id => container.querySelector(`#${id}`));
    ids.forEach(el => expect(el).not.toBeNull());
    for (let i = 1; i < ids.length; i++) expect(ids[i - 1].compareDocumentPosition(ids[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const label of ['How it works', 'Who it’s for', 'Mentors + AI', 'Safety', 'FAQ']) expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument();
  });
  it('labels every product preview as an example, so none can be mistaken for real student data', () => {
    const { container } = page();
    const previews = container.querySelectorAll('.v2-fc, .v2-pv');
    expect(previews.length).toBeGreaterThanOrEqual(4);
    previews.forEach(p => expect(p.querySelector('.v2-eg')).not.toBeNull());
  });
  it('makes no price, statistic or testimonial claims that have not been confirmed', () => {
    const { container } = page();
    const text = container.textContent;
    expect(text).not.toMatch(/\$|US\$|₹|per month|\/month/i);
    expect(text).not.toMatch(/\d+%|\b\d{2,}\+? (students|schools|mentors)\b/i);
    expect(text).toMatch(/Pricing is still being finalised/);
  });
  it('switches the role tabs and shows that role\'s content', async () => {
    const user = userEvent.setup();
    page();
    expect(screen.getByRole('tab', { name: 'Students', selected: true })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Parents' }));
    expect(screen.getByRole('tab', { name: 'Parents', selected: true })).toBeInTheDocument();
    expect(screen.getByText(/Stay in the loop without having to ask/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Schools' }));
    expect(screen.getByText(/at least 10 students/)).toBeInTheDocument();
  });
  it('opens and closes FAQ answers with the keyboard-friendly button', async () => {
    const user = userEvent.setup();
    page();
    const q = screen.getByRole('button', { name: /Who sees my results/ });
    expect(q).toHaveAttribute('aria-expanded', 'false');
    await user.click(q); expect(q).toHaveAttribute('aria-expanded', 'true');
    await user.click(q); expect(q).toHaveAttribute('aria-expanded', 'false');
  });
  it('says AI insights are still being rolled out', () => {
    page();
    expect(screen.getByText(/AI insights are being rolled out step by step/)).toBeInTheDocument();
  });
  it('shows "My dashboard" instead of sign-up buttons to someone who is signed in', async () => {
    localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify({ id: 'u', role: 'student' }));
    page();
    expect((await screen.findAllByRole('link', { name: 'My dashboard' })).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Get started' })).toBeNull();
  });
});
