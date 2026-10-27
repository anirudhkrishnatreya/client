import api from '../api';

// Buying: the public price list, checkout, and what a person has bought. Amounts are in paise; show them with `rupees`.
export const payApi = {
  catalog: () => api.get('/v2/payments/catalog'),
  me: () => api.get('/v2/payments/me'),
  quote: (productId, coupon) => api.post('/v2/payments/quote', { productId, coupon }),
  order: (productId, coupon) => api.post('/v2/payments/orders', { productId, ...(coupon ? { coupon } : {}) }),
  verify: (orderId, r) => api.post(`/v2/payments/orders/${orderId}/verify`, r),
  status: orderId => api.get(`/v2/payments/orders/${orderId}`),
  receipt: orderId => api.get(`/v2/payments/orders/${orderId}/receipt`),
  redeem: code => api.post('/v2/payments/redeem', { code })
};

export const PAY_ENABLED = import.meta.env.VITE_PAY === 'on';

// A plan chosen on the home page before signing in is kept for two days, so after sign-up or log-in the student lands on it.
const CHOICE = 'imenteo.choice';
export function rememberChoice(productId) { try { localStorage.setItem(CHOICE, JSON.stringify({ id: productId, at: Date.now() })); } catch { /* private window: they choose again */ } }
export function takeChoice() {
  try {
    const v = JSON.parse(localStorage.getItem(CHOICE) || 'null');
    localStorage.removeItem(CHOICE);
    return v && Date.now() - v.at < 2 * 86400000 && /^[a-z0-9-]{3,24}$/.test(v.id) ? v.id : null;
  } catch { return null; }
}

/** ₹1,399 or ₹2,799.50. */
export const rupees = paise => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

const CODES = {
  PRODUCT_NOT_FOUND: 'That product is not available.', PAYMENTS_NOT_CONFIGURED: 'Payments are not open yet. Please check back soon.',
  PAYMENT_PROVIDER_UNREACHABLE: 'We could not reach the payment service. You have not been charged. Please try again.',
  PAYMENT_PROVIDER_ERROR: 'The payment service had a problem. You have not been charged. Please try again.',
  PAYMENT_PROVIDER_REJECTED: 'The payment service could not start this payment. You have not been charged.',
  PAYMENT_SIGNATURE_INVALID: 'We could not confirm that payment. If money left your account, it will be matched automatically, or write to us.',
  RATE_LIMITED: 'Too many attempts. Please wait a little.', CODE_MISCONFIGURED: 'This code is not set up properly. Please contact us.'
};
export function payError(e) {
  const d = (e && e.response && e.response.data) || {};
  if (d.details && d.details.code) return d.details.code;
  if (d.details && typeof d.details === 'object') { const v = Object.values(d.details)[0]; if (v) return String(v); }
  return CODES[d.code] || (e && e.response ? d.error : null) || 'Something went wrong. You have not been charged. Please try again.';
}

let razorpayLoading = null;
/** Loads Razorpay's checkout script once (from Razorpay itself). */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!razorpayLoading) {
    razorpayLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.async = true;
      s.onload = () => resolve(window.Razorpay);
      s.onerror = () => { razorpayLoading = null; reject(new Error('checkout-script')); };
      document.head.appendChild(s);
    });
  }
  return razorpayLoading;
}
