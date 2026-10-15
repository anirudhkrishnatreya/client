import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from './LandingPage';
import { applyWeek, weekAt } from './WeeksSection';
import { DELTA, WEEKS } from './weeks';

const page = () => render(<MemoryRouter><AuthProvider><LandingPage /></AuthProvider></MemoryRouter>);
const media = matches => vi.stubGlobal('matchMedia', q => ({ matches: matches(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
beforeEach(() => { localStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

describe('landing page (desktop)', () => {
  beforeEach(() => media(q => /min-width: 1024px/.test(q)));
  it('shows the headline, the nav and the sign-in link', () => {
    page();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/EVERY EXPERT.*STARTS AT ZERO.*WE BUILD THE CLIMB/is);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Log in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByAltText('iMenteo').length).toBeGreaterThan(0);
  });
  it('has every week\'s words on the page, so none depend on scrolling to be readable by assistive tools', () => {
    page();
    for (const w of WEEKS) { expect(screen.getByText(w.title)).toBeInTheDocument(); for (const it of w.items) expect(screen.getByText(it.title)).toBeInTheDocument(); }
  });
  it('the orbit is decoration: its images are hidden from assistive technology', () => {
    const { container } = page();
    expect(container.querySelectorAll('.lp-cl[aria-hidden="true"]')).toHaveLength(WEEKS.length);
  });
});

describe('landing page (phone)', () => {
  beforeEach(() => media(() => false));
  it('uses the menu button instead of the wide nav, and the menu opens', async () => {
    page();
    const btn = screen.getByRole('button', { name: 'Open menu' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    btn.click();
    expect((await screen.findAllByRole('link', { name: 'Log in' }))[0]).toHaveAttribute('href', '/login');
  });
});

describe('landing page (reduced motion)', () => {
  it('shows each week as its own still section instead of pinning the page', () => {
    media(q => /min-width: 1024px|prefers-reduced-motion/.test(q));
    const { container } = page();
    expect(container.querySelectorAll('.lp-pin.static')).toHaveLength(3);
    expect(container.querySelector('.lp-weeks').getAttribute('style') || '').not.toMatch(/vh/);
  });
});

describe('orbit maths', () => {
  it('rests on each week, moves smoothly between them, and never goes backwards', () => {
    expect(weekAt(0)).toBe(0); expect(weekAt(0.05)).toBe(0);
    expect(weekAt(0.5)).toBe(1); expect(weekAt(0.6)).toBe(1);
    expect(weekAt(0.95)).toBe(2); expect(weekAt(1)).toBe(2);
    let last = -1; for (let p = 0; p <= 1; p += 0.01) { const w = weekAt(p); expect(w).toBeGreaterThanOrEqual(last); last = w; }
  });
  it('turns the orbit by DELTA degrees per week and fades the other weeks out', () => {
    const el = document.createElement('div');
    applyWeek(el, 1);
    expect(el.style.getPropertyValue('--g')).toBe(String(DELTA));
    expect(el.style.getPropertyValue('--to1')).toBe('1'); expect(el.style.getPropertyValue('--to0')).toBe('0'); expect(Number(el.style.getPropertyValue('--co2'))).toBeLessThanOrEqual(0.01);   // kept just visible so it is already painted when it turns in
    applyWeek(el, 0.5);
    expect(Number(el.style.getPropertyValue('--to0'))).toBeLessThan(0.1);          // texts do not overlap mid-turn
  });
});
