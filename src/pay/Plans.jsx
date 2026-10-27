import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Pill } from '../platform/ui/kit';
import { Working } from '../platform/live/loop/Loader';
import { payApi, rupees, fmtDate, payError, loadRazorpay } from './payApi';
import './pay.css';

const CONFIRM_STEPS = ['Confirming your payment with the bank…', 'Opening your plan…'];

/** One product card: the price (with the regular price struck through only while the offer is real), what is inside, and the button. */
function Card({ p, quote, busy, canBuy, signedIn, onBuy }) {
  const price = quote ? quote.amount : p.amount;
  return (
    <article className={`pay-card${p.highlight ? ' best' : ''}`} aria-label={p.name}>
      {p.highlight && <span className="pay-flag">Most families choose this</span>}
      <h3>{p.name}</h3>
      <div className="pay-price">
        {p.regular && <s aria-label={`Regular price ${rupees(p.regular)}`}>{rupees(p.regular)}</s>}
        <b>{rupees(price)}</b>
        {p.offerOn && <Pill tone="leaf">{p.discountPercent}% off</Pill>}
      </div>
      {quote && quote.amount !== p.amount && <p className="pf-small" style={{ margin: '0 0 6px', color: 'var(--leaf)' }}>With {quote.couponLabel || 'your code'}: {rupees(p.amount - quote.amount)} less</p>}
      {p.perMonth && p.months > 1 && <p className="pf-small pf-muted" style={{ margin: '0 0 8px' }}>about {rupees(Math.round(p.perMonth / 100) * 100)} a month</p>}
      <ul className="pay-list">{p.includes.map(i => <li key={i}><Icon name="check" size={14} />{i}</li>)}</ul>
      {p.mentorSessions > 0 && <p className="pf-small" style={{ margin: '8px 0 0' }}><b>{p.mentorSessions} mentor sessions</b>, one every week</p>}
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        {!signedIn
          ? <Link className="pf-btn" style={{ width: '100%', justifyContent: 'center' }} to="/login">Sign in to buy</Link>
          : <button type="button" className={`pf-btn${p.highlight ? '' : ' ghost'}`} style={{ width: '100%', justifyContent: 'center' }} disabled={!canBuy || busy} onClick={() => onBuy(p)}>{busy ? 'Opening…' : p.kind === 'plan' ? 'Choose this plan' : 'Get the assessment'}</button>}
      </div>
    </article>
  );
}

/**
 * The price list and checkout. Prices come from the server. A code (discount or credit) is checked on the server and shown before paying.
 * After paying, it waits for confirmation: the page can be closed safely, because the payment is also confirmed by Razorpay's own message.
 */
export default function Plans({ signedIn, onPaid, billing }) {
  const [cat, setCat] = useState(null);
  const [err, setErr] = useState('');             // a payment problem: shown above the prices, which stay on screen
  const [loadErr, setLoadErr] = useState('');
  const [code, setCode] = useState('');
  const [quotes, setQuotes] = useState({});
  const [codeMsg, setCodeMsg] = useState('');
  const [busy, setBusy] = useState(null);
  const [phase, setPhase] = useState(null);        // null | 'confirming' | 'slow'
  const timer = useRef(null);
  useEffect(() => { payApi.catalog().then(r => setCat(r.data)).catch(() => setLoadErr('We could not load the prices. Please refresh.')); return () => clearTimeout(timer.current); }, []);
  // credit from a recent assessment shows in the prices of plans
  useEffect(() => {
    if (!signedIn || !cat || !billing || !billing.credit) return;
    Promise.all(cat.products.filter(p => p.kind === 'plan').map(p => payApi.quote(p.id, code.trim() || undefined).then(r => [p.id, r.data.quote]))).then(es => setQuotes(Object.fromEntries(es))).catch(() => {});
  }, [signedIn, cat, billing]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loadErr) return <p role="alert">{loadErr}</p>;
  if (!cat) return <p className="pf-muted" role="status">Loading prices…</p>;

  const apply = async e => {
    e.preventDefault(); setCodeMsg('');
    if (!code.trim()) { setQuotes({}); return; }
    try {
      const es = await Promise.all(cat.products.map(p => payApi.quote(p.id, code.trim()).then(r => [p.id, r.data.quote])));
      setQuotes(Object.fromEntries(es)); setCodeMsg('Code applied. The prices below include it.');
    } catch (x) { setQuotes({}); setCodeMsg(payError(x)); }
  };

  const confirm = async (orderId, r) => {
    setPhase('confirming');
    try {
      let status = (await payApi.verify(orderId, r)).data.status;
      for (let i = 0; i < 40 && status !== 'paid'; i += 1) { await new Promise(res => { timer.current = setTimeout(res, 3000); }); status = (await payApi.status(orderId)).data.status; }
      if (status === 'paid') { setPhase(null); setBusy(null); onPaid && onPaid(); } else setPhase('slow');
    } catch { setPhase('slow'); }
  };

  const buy = async p => {
    setErr(''); setBusy(p.id);
    try {
      const o = (await payApi.order(p.id, code.trim() || undefined)).data;
      if (o.free) { setBusy(null); onPaid && onPaid(); return; }
      const Razorpay = await loadRazorpay();
      const rz = new Razorpay({
        key: o.key, order_id: o.razorpayOrderId, amount: o.amount, currency: o.currency, name: 'iMenteo', description: p.name, prefill: o.prefill, theme: { color: '#0f3ee4' },
        handler: r => confirm(o.orderId, r),
        modal: { ondismiss: () => setBusy(b => (b === p.id ? null : b)) }
      });
      rz.on('payment.failed', () => setErr('That payment did not go through. You have not been charged. You can try again, or use another payment method.'));
      rz.open();
    } catch (x) { setBusy(null); setErr(x && x.message === 'checkout-script' ? 'We could not open the payment window. Please check your connection and try again.' : payError(x)); }
  };

  if (phase === 'confirming') return <div className="pay-wait"><Working title="Confirming your payment" steps={CONFIRM_STEPS} /><p className="pf-small pf-muted" style={{ marginTop: 12 }}>Please keep this page open for a moment. If you close it, your payment is still safe: we confirm it with the bank and email you a receipt.</p></div>;
  if (phase === 'slow') return <div className="pf-note" role="status"><b>We have your payment, and it is taking a little longer to confirm.</b> Your plan will open within a few minutes and we will email a receipt. You do not need to pay again. If it has not opened in 15 minutes, write to us and quote the time of payment.</div>;

  const ready = cat.checkoutReady;
  const assessment = cat.products.find(p => p.kind === 'assessment');
  const plans = cat.products.filter(p => p.kind === 'plan');
  return (
    <div>
      {cat.offerEndsAt && <p className="pay-offer"><Icon name="flag" size={15} /><span><b>Launch offer</b> until {fmtDate(cat.offerEndsAt)}. After that date the regular prices apply.</span></p>}
      {!ready && <div className="pf-note" role="note" style={{ marginBottom: 14 }}>Online payment is opening soon. You can look at the plans now.</div>}
      {signedIn && (
        <form className="pay-code" onSubmit={apply}>
          <label className="pf-sr" htmlFor="pay-code">Discount code</label>
          <input id="pay-code" className="pf-input" placeholder="Have a discount code?" value={code} onChange={e => setCode(e.target.value)} maxLength={30} autoComplete="off" />
          <button type="submit" className="pf-btn sm ghost">Apply</button>
          {codeMsg && <span className="pf-small" role="status">{codeMsg}</span>}
        </form>
      )}
      {billing && billing.credit && <p className="pf-note" role="note" style={{ margin: '0 0 14px' }}>Your assessment payment of {rupees(billing.credit.amount)} comes off your first plan, until {fmtDate(billing.credit.until)}.</p>}
      {err && <div className="pf-note" role="alert" style={{ marginBottom: 14, borderColor: 'var(--coral)' }}>{err}</div>}

      <h2 className="pay-h">Just the Career Assessment</h2>
      <div className="pay-grid one">{assessment && <Card p={assessment} quote={quotes[assessment.id]} busy={busy === assessment.id} canBuy={ready && !busy} signedIn={signedIn} onBuy={buy} />}</div>

      <h2 className="pay-h">iMenteo Plan: the whole journey, with a mentor every week</h2>
      <div className="pay-grid">{plans.map(p => <Card key={p.id} p={p} quote={quotes[p.id]} busy={busy === p.id} canBuy={ready && !busy} signedIn={signedIn} onBuy={buy} />)}</div>
      <p className="pf-small pf-muted" style={{ marginTop: 14 }}>{cat.gst.note} Pay by UPI, card, net banking or wallet. Refunds: within 7 days of buying, if you have not started the assessment or used the plan. See the <a href="#refunds">refund policy</a> below.</p>
    </div>
  );
}
