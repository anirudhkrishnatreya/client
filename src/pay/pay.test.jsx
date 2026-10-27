import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const calls = [];
let routes = {};
vi.mock('../api', () => {
  const handle = method => (url, body) => {
    calls.push({ method, url, body });
    const key = `${method} ${url}`;
    if (!(key in routes)) return Promise.reject(Object.assign(new Error(`no route ${key}`), { response: { status: 404, data: { code: 'NOT_FOUND' } } }));
    const out = typeof routes[key] === 'function' ? routes[key](body) : routes[key];
    return Promise.resolve(out).then(v => (v instanceof Error ? Promise.reject(v) : { data: v }));
  };
  return { default: { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') }, API_URL: '/api' };
});
import Plans from './Plans';
import Billing, { Receipt } from './Billing';
import Locked from './Locked';

const fail = (status, data) => Object.assign(new Error('x'), { response: { status, data } });
const PRODUCTS = [
  { id: 'assessment', kind: 'assessment', name: 'Career Assessment', months: 0, mentorSessions: 0, includesAssessment: true, highlight: false, amount: 59900, regular: 149900, offerOn: true, discountPercent: 60, perMonth: null, includes: ['Full report'] },
  { id: 'plan-1m', kind: 'plan', name: 'Plan, 1 month', months: 1, mentorSessions: 4, includesAssessment: false, highlight: false, amount: 139900, regular: 279900, offerOn: true, discountPercent: 50, perMonth: 139900, includes: ['Weekly plans'] },
  { id: 'plan-3m', kind: 'plan', name: 'Plan, 3 months', months: 3, mentorSessions: 13, includesAssessment: true, highlight: false, amount: 369900, regular: 739900, offerOn: true, discountPercent: 50, perMonth: 123300, includes: ['The Career Assessment and report', 'Weekly plans'] },
  { id: 'plan-6m', kind: 'plan', name: 'Plan, 6 months', months: 6, mentorSessions: 26, includesAssessment: true, highlight: true, amount: 699900, regular: 1399900, offerOn: true, discountPercent: 50, perMonth: 116650, includes: ['Weekly plans'] },
  { id: 'plan-12m', kind: 'plan', name: 'Plan, 12 months', months: 12, mentorSessions: 52, includesAssessment: true, highlight: false, amount: 1199900, regular: 2399800, offerMonth: null, offerOn: true, discountPercent: 50, perMonth: 99992, includes: ['Weekly plans'] }
];
const catalog = (over = {}) => ({ success: true, currency: 'INR', gst: { registered: false, note: 'The price you see is the price you pay. No GST is added.' }, offerEndsAt: '2027-01-31T18:29:59.000Z', products: PRODUCTS, checkoutReady: true, ...over });
const billing = (over = {}) => ({ access: { plan: { state: 'none', endsAt: null, daysLeft: 0 }, assessment: false }, entitlements: [], orders: [], credit: null, gst: { registered: false }, ...over });

let razor;
beforeEach(() => {
  calls.length = 0; routes = {};
  razor = { opened: [], handlers: {} };
  window.Razorpay = function Razorpay(opts) { razor.opened.push(opts); this.on = (ev, fn) => { razor.handlers[ev] = fn; }; this.open = () => { razor.opts = opts; }; };
  routes['get /v2/payments/catalog'] = catalog();
});
const show = (ui, path = '/') => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

const planCard = () => screen.findByRole('article', { name: 'iMenteo Plan' });
const pick = async (user, length) => { await user.click(screen.getByRole('button', { name: new RegExp(`^${length}`) })); return screen.getByRole('article', { name: 'iMenteo Plan' }); };

describe('the price list', () => {
  it('opens on the most chosen plan, with the regular price struck through while the offer is on, the monthly cost, sessions and savings', async () => {
    show(<Plans billing={billing()} />);
    const plan = await planCard();
    expect(screen.getByRole('button', { name: /^6 months/ })).toHaveAttribute('aria-pressed', 'true');
    expect(within(plan).getByLabelText('Regular price ₹13,999')).toBeInTheDocument();
    expect(within(plan).getByText('₹6,999')).toBeInTheDocument();
    expect(within(plan).getByText('50% off')).toBeInTheDocument();
    expect(plan).toHaveTextContent('About ₹1,167 a month · 26 one-to-one mentor sessions · 17% less than month by month');
    expect(within(plan).getByText('Career Assessment and report included')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^3 months.*Save 12%/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^12 months.*Save 29%/ })).toBeInTheDocument();
    expect(within(plan).getByRole('button', { name: 'Choose 6 months' })).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Career Assessment' })).getByText('60% off')).toBeInTheDocument();
    expect(screen.getByText(/Launch offer/).closest('p')).toHaveTextContent('31 January 2027');
    expect(screen.getByText(/No GST added/)).toBeInTheDocument();
  });
  it('switching the length changes the price, sessions and what is included', async () => {
    const user = userEvent.setup();
    show(<Plans billing={billing()} />);
    await planCard();
    const plan = await pick(user, '1 month');
    expect(within(plan).getByText('₹1,399')).toBeInTheDocument();
    expect(within(plan).getByLabelText('Regular price ₹2,799')).toBeInTheDocument();
    expect(plan).toHaveTextContent('4 one-to-one mentor sessions');
    expect(plan).not.toHaveTextContent(/a month ·|less than month by month/);
    expect(within(plan).queryByText('Career Assessment and report included')).toBeNull();
    expect(within(plan).getByRole('button', { name: 'Choose 1 month' })).toBeInTheDocument();
  });
  it('a plan chosen on the home page is the one shown', async () => {
    show(<Plans billing={billing()} initial="plan-12m" />);
    await planCard();
    expect(screen.getByRole('button', { name: /^12 months/ })).toHaveAttribute('aria-pressed', 'true');
    expect(within(await planCard()).getByText('₹11,999')).toBeInTheDocument();
  });
  it('after the offer there is no struck-through price and no offer line', async () => {
    routes['get /v2/payments/catalog'] = catalog({ offerEndsAt: null, products: PRODUCTS.map(p => ({ ...p, amount: p.regular, regular: null, offerOn: false, discountPercent: 0 })) });
    const user = userEvent.setup();
    show(<Plans billing={billing()} />);
    await planCard();
    const plan = await pick(user, '1 month');
    expect(within(plan).getByText('₹2,799')).toBeInTheDocument();
    expect(within(plan).queryByText(/% off/)).toBeNull();
    expect(screen.queryByText(/Launch offer/)).toBeNull();
  });
  it('before payment is open it says so and the buttons are off', async () => {
    routes['get /v2/payments/catalog'] = catalog({ checkoutReady: false });
    show(<Plans billing={billing()} />);
    expect(await screen.findByText(/Online payment is opening soon/)).toBeInTheDocument();
    for (const b of screen.getAllByRole('button', { name: /^Choose|Get the assessment/ })) expect(b).toBeDisabled();
  });
});

describe('paying', () => {
  it('opens Razorpay with the order the server made, then confirms with the server, then reports paid', async () => {
    routes['post /v2/payments/orders'] = { free: false, orderId: 'o1', razorpayOrderId: 'order_X', amount: 139900, currency: 'INR', key: 'rzp_test_1', prefill: { name: 'Asha', email: 'a@example.com' } };
    routes['post /v2/payments/orders/o1/verify'] = { status: 'paid' };
    const paid = vi.fn();
    const user = userEvent.setup();
    show(<Plans billing={billing()} onPaid={paid} />);
    await planCard();
    await user.click(within(await pick(user, '1 month')).getByRole('button', { name: 'Choose 1 month' }));
    await waitFor(() => expect(razor.opened).toHaveLength(1));
    expect(calls.find(c => c.url === '/v2/payments/orders').body).toEqual({ productId: 'plan-1m' });            // only the product: never a price
    expect(razor.opened[0]).toMatchObject({ key: 'rzp_test_1', order_id: 'order_X', amount: 139900, currency: 'INR', name: 'iMenteo', description: 'Plan, 1 month' });
    await razor.opened[0].handler({ razorpay_order_id: 'order_X', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' });
    await waitFor(() => expect(paid).toHaveBeenCalled());
    expect(calls.find(c => c.url === '/v2/payments/orders/o1/verify').body).toEqual({ razorpay_order_id: 'order_X', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' });
  });
  it('closing the payment window leaves everything as it was; a failed payment says nothing was charged', async () => {
    routes['post /v2/payments/orders'] = { free: false, orderId: 'o2', razorpayOrderId: 'order_Y', amount: 59900, currency: 'INR', key: 'k', prefill: {} };
    const user = userEvent.setup();
    show(<Plans billing={billing()} onPaid={vi.fn()} />);
    const card = await screen.findByRole('article', { name: 'Career Assessment' });
    await user.click(within(card).getByRole('button', { name: 'Get the assessment' }));
    await waitFor(() => expect(razor.opened).toHaveLength(1));
    razor.handlers['payment.failed']();
    expect(await screen.findByRole('alert')).toHaveTextContent(/did not go through\. You have not been charged/);
    razor.opened[0].modal.ondismiss();
    await waitFor(() => expect(within(card).getByRole('button', { name: 'Get the assessment' })).toBeEnabled());
  });
  it('if confirmation is slow, it says the payment is safe and not to pay again', async () => {
    routes['post /v2/payments/orders'] = { free: false, orderId: 'o3', razorpayOrderId: 'order_Z', amount: 699900, currency: 'INR', key: 'k', prefill: {} };
    routes['post /v2/payments/orders/o3/verify'] = fail(500, { code: 'X' });
    const user = userEvent.setup();
    show(<Plans billing={billing()} onPaid={vi.fn()} />);
    await user.click(within(await planCard()).getByRole('button', { name: 'Choose 6 months' }));
    await waitFor(() => expect(razor.opened).toHaveLength(1));
    await razor.opened[0].handler({ razorpay_order_id: 'order_Z', razorpay_payment_id: 'p', razorpay_signature: 's' });
    expect(await screen.findByText(/We have your payment/)).toBeInTheDocument();
    expect(screen.getByText(/You do not need to pay again/)).toBeInTheDocument();
  });
  it('an order the server cannot make says what happened and that nothing was charged', async () => {
    routes['post /v2/payments/orders'] = fail(502, { code: 'PAYMENT_PROVIDER_UNREACHABLE' });
    const user = userEvent.setup();
    show(<Plans billing={billing()} onPaid={vi.fn()} />);
    await user.click(within(await planCard()).getByRole('button', { name: 'Choose 6 months' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You have not been charged');
    expect(razor.opened).toHaveLength(0);
  });
  it('a code that covers everything finishes without opening Razorpay', async () => {
    routes['post /v2/payments/orders'] = { free: true, orderId: 'o4', quote: { amount: 0 } };
    const paid = vi.fn();
    const user = userEvent.setup();
    show(<Plans billing={billing()} onPaid={paid} />);
    await user.click(within(await planCard()).getByRole('button', { name: 'Choose 6 months' }));
    await waitFor(() => expect(paid).toHaveBeenCalled());
    expect(razor.opened).toHaveLength(0);
  });
});

describe('codes and credit', () => {
  it('a valid code is checked by the server and shown in the prices; the same code goes with the order; a bad one says why', async () => {
    routes['post /v2/payments/quote'] = ({ productId, coupon }) => (coupon === 'BAD' ? fail(400, { code: 'COUPON_INVALID', details: { code: 'This code has expired.' } }) : { quote: { productId, amount: Math.round(PRODUCTS.find(p => p.id === productId).amount * 0.75), couponLabel: 'Launch 25', listAmount: 0 } });
    routes['post /v2/payments/orders'] = { free: false, orderId: 'o5', razorpayOrderId: 'order_C', amount: 104925, currency: 'INR', key: 'k', prefill: {} };
    const user = userEvent.setup();
    show(<Plans billing={billing()} onPaid={vi.fn()} />);
    await planCard();
    await user.type(screen.getByLabelText('Discount code'), 'BAD');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('This code has expired.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Discount code'));
    await user.type(screen.getByLabelText('Discount code'), 'LAUNCH25');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText(/Code applied/)).toBeInTheDocument();
    const month = await pick(user, '1 month');
    expect(within(month).getByText('₹1,049.25')).toBeInTheDocument();
    expect(within(month).getByText(/With Launch 25: ₹349.75 less/)).toBeInTheDocument();
    await user.click(within(month).getByRole('button', { name: 'Choose 1 month' }));
    await waitFor(() => expect(calls.find(c => c.url === '/v2/payments/orders')).toBeTruthy());
    expect(calls.find(c => c.url === '/v2/payments/orders').body).toEqual({ productId: 'plan-1m', coupon: 'LAUNCH25' });
  });
  it('credit from a recent assessment is shown and applied to the plan prices', async () => {
    routes['post /v2/payments/quote'] = ({ productId }) => ({ quote: { productId, amount: PRODUCTS.find(p => p.id === productId).amount - 59900, couponLabel: null } });
    const user = userEvent.setup();
    show(<Plans billing={billing({ credit: { amount: 59900, until: '2026-11-20T00:00:00Z' } })} onPaid={vi.fn()} />);
    expect(await screen.findByText(/Your assessment payment of ₹599 comes off your first plan, until 20 November 2026/)).toBeInTheDocument();
    await planCard();
    expect(await within(await pick(user, '1 month')).findByText('₹800')).toBeInTheDocument();
  });
});

describe('My plan', () => {
  it('shows an active plan with its end date, receipts, and takes a school code', async () => {
    const end = new Date(Date.now() + 40 * 86400000).toISOString();
    routes['get /v2/payments/me'] = { billing: billing({ access: { plan: { state: 'active', endsAt: end, daysLeft: 40 }, assessment: true }, orders: [{ id: 'o9', name: 'Plan, 3 months', amount: 369900, receiptNo: 'IM-2026-000007', paidAt: '2026-10-10T00:00:00Z', source: 'checkout' }, { id: 'o8', name: 'Plan, 1 month', amount: 0, paidAt: '2026-09-10T00:00:00Z', source: 'school-code' }] }) };
    routes['post /v2/payments/redeem'] = ({ code }) => (code === 'GOOD-CODE' ? { product: 'plan-3m', label: 'Greenfield School' } : fail(400, { code: 'COUPON_INVALID', details: { code: 'All seats on this code are taken.' } }));
    const user = userEvent.setup();
    show(<Billing />);
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/40 days left/)).toBeInTheDocument();
    expect(screen.getByText('Yours')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'IM-2026-000007' })).toHaveAttribute('href', '/receipt/o9');
    expect(screen.getByText('Plan, 1 month (school code)')).toBeInTheDocument();
    await user.type(screen.getByLabelText('School code'), 'full-code');
    await user.click(screen.getByRole('button', { name: 'Use code' }));
    expect(await screen.findByText('All seats on this code are taken.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('School code'));
    await user.type(screen.getByLabelText('School code'), 'GOOD-CODE');
    await user.click(screen.getByRole('button', { name: 'Use code' }));
    expect(await screen.findByText('Done. Greenfield School has opened your plan.')).toBeInTheDocument();
  });
  it('an ended plan says it is read-only and how to renew; with no plan it says how to start', async () => {
    routes['get /v2/payments/me'] = { billing: billing({ access: { plan: { state: 'grace', endsAt: '2026-10-25T00:00:00Z', daysLeft: 0 }, assessment: false } }) };
    const { unmount } = show(<Billing />);
    expect(await screen.findByText('Ended: read-only for 3 days')).toBeInTheDocument();
    expect(screen.getByText(/Renew below to plan new weeks/)).toBeInTheDocument();
    unmount();
    routes['get /v2/payments/me'] = { billing: billing() };
    show(<Billing />);
    expect(await screen.findByText('No plan yet')).toBeInTheDocument();
    expect(screen.getByText('Not bought yet')).toBeInTheDocument();
  });
  it('a receipt shows the payer, what was paid for, any code or credit, and that no GST is charged', async () => {
    routes['get /v2/payments/orders/o9/receipt'] = { receipt: { receiptNo: 'IM-2026-000007', paidAt: '2026-10-10T00:00:00Z', name: 'Plan, 1 month', listAmount: 139900, couponCode: 'LAUNCH25', couponOff: 34975, creditOff: 0, amount: 104925, method: 'upi', gstRegistered: false, payer: { name: 'Asha Verma', email: 'a@example.com' } }, business: { name: 'iMenteo', email: 'help@imenteo.com' } };
    const { Routes, Route } = await import('react-router-dom');
    render(<MemoryRouter initialEntries={['/receipt/o9']}><Routes><Route path="/receipt/:id" element={<Receipt />} /></Routes></MemoryRouter>);
    expect(await screen.findByText('IM-2026-000007')).toBeInTheDocument();
    expect(screen.getByText('Asha Verma · a@example.com')).toBeInTheDocument();
    expect(screen.getByText('− ₹349.75')).toBeInTheDocument();
    expect(screen.getByText('₹1,049.25')).toBeInTheDocument();
    expect(screen.getByText(/No GST is charged on this payment/)).toBeInTheDocument();
    expect(screen.getByText('UPI')).toBeInTheDocument();
  });
});

describe('a feature that needs a plan', () => {
  it('explains what it is and leads to the plans, for a new buyer, an ended plan and the assessment', () => {
    const { unmount } = show(<Locked product="plan" state="none" />);
    expect(screen.getByText('This is part of an iMenteo Plan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See plans and prices' })).toHaveAttribute('href', '/platform/student/billing');
    unmount();
    const ended = show(<Locked product="plan" state="expired" endsAt="2026-10-25T00:00:00Z" />);
    expect(screen.getByText('Your plan has ended')).toBeInTheDocument();
    expect(screen.getByText(/ended on 25 October 2026\. Everything you made is still here/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Renew my plan' })).toBeInTheDocument();
    ended.unmount();
    show(<Locked product="assessment" />);
    expect(screen.getByText(/included in the 3, 6 and 12-month plans/)).toBeInTheDocument();
  });
});
