import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

let signedIn = false;
let catalogReply;
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: signedIn }) }));
vi.mock('../api', () => ({ default: { get: url => (url === '/v2/payments/catalog' ? catalogReply() : Promise.reject(new Error(url))), post: () => Promise.resolve({ data: {} }) } }));
import PricingSection from './PricingSection';
import { takeChoice } from '../pay/payApi';

const P = (id, months, amount, regular, extra = {}) => ({ id, kind: months ? 'plan' : 'assessment', name: months ? `Plan, ${months} month${months > 1 ? 's' : ''}` : 'Career Assessment', months, mentorSessions: [0, 4, 0, 13, 0, 0, 26][months] || (months === 12 ? 52 : 0), includesAssessment: months >= 3 || !months, highlight: months === 6, amount, regular, offerOn: true, discountPercent: Math.round((1 - amount / regular) * 100), perMonth: months ? Math.round(amount / months) : null, includes: months ? ['Weekly plans built around your real week'] : ['Full report'], ...extra });
const CATALOG = { currency: 'INR', gst: { registered: false }, offerEndsAt: '2027-01-31T18:29:59.000Z', checkoutReady: true, products: [P('assessment', 0, 59900, 149900), P('plan-1m', 1, 139900, 279900), P('plan-3m', 3, 369900, 739900), P('plan-6m', 6, 699900, 1399900), P('plan-12m', 12, 1199900, 2399800)] };

beforeEach(() => { signedIn = false; localStorage.clear(); catalogReply = () => Promise.resolve({ data: CATALOG }); vi.stubGlobal('IntersectionObserver', undefined); });
const show = () => render(<MemoryRouter><PricingSection /></MemoryRouter>);

describe('plans and prices on the home page', () => {
  it('shows the offer, the plan with its length switch, and the assessment, in the home page section', async () => {
    show();
    const plan = await screen.findByRole('article', { name: 'iMenteo Plan' });
    expect(screen.getByRole('region', { name: 'Plans and prices' })).toHaveAttribute('id', 'pricing');
    expect(screen.getByText(/Launch offer: these prices until 31 January 2027/)).toBeInTheDocument();
    expect(within(plan).getByText('₹6,999')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Career Assessment' })).getByText('₹599')).toBeInTheDocument();
    expect(screen.getByText(/Got a code from your school/)).toBeInTheDocument();
  });
  it('signed out: choosing leads to sign-up and the choice is kept for after sign-in', async () => {
    const user = userEvent.setup();
    show();
    await screen.findByRole('article', { name: 'iMenteo Plan' });
    await user.click(screen.getByRole('button', { name: /^3 months/ }));
    const go = screen.getByRole('link', { name: 'Choose 3 months' });
    expect(go.getAttribute('href')).toMatch(/register/);
    go.addEventListener('click', e => e.preventDefault());
    await user.click(go);
    expect(takeChoice()).toBe('plan-3m');
    expect(takeChoice()).toBeNull();                     // used once
  });
  it('signed in: choosing opens My plan with that plan ready', async () => {
    signedIn = true;
    show();
    await screen.findByRole('article', { name: 'iMenteo Plan' });
    expect(screen.getByRole('link', { name: 'Choose 6 months' })).toHaveAttribute('href', '/platform/student/billing?buy=plan-6m');
    expect(screen.getByRole('link', { name: 'Get the assessment' })).toHaveAttribute('href', '/platform/student/billing?buy=assessment');
  });
  it('if the prices cannot load, it says so instead of breaking the page', async () => {
    catalogReply = () => Promise.reject(new Error('offline'));
    show();
    expect(await screen.findByText(/could not load the prices/)).toBeInTheDocument();
  });
});
