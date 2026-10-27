import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Card, CardHead, Pill } from '../platform/ui/kit';
import { PageSkeleton } from '../platform/live/loop/Loader';
import { adminApi, errOf, num, when, day, can } from './adminApi';
import { Kpi, Section } from './common';

const inr = paise => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const PRODUCTS = [['assessment', 'Career Assessment'], ['plan-1m', 'Plan, 1 month'], ['plan-3m', 'Plan, 3 months'], ['plan-6m', 'Plan, 6 months'], ['plan-12m', 'Plan, 12 months']];
const NAME = Object.fromEntries(PRODUCTS);
const STATUS = { paid: ['leaf', 'Paid'], pending: ['gold', 'Waiting'], failed: ['coral', 'Failed'], expired: ['grey', 'Expired'] };

/** Whether payments are ready to go live: the things that must be set up before the first real payment. */
function Setup({ s }) {
  const rows = [['Razorpay keys set', s.razorpay, 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the host.'], ['Webhook secret set', s.webhook, 'Add RAZORPAY_WEBHOOK_SECRET and create the webhook in the Razorpay dashboard.'], ['Paid features locked behind a plan', s.gatingOn, 'Set PAYMENTS=on when you are ready for access to depend on payment. Until then everything stays open.'], ['GST', s.gst, s.gst ? 'Prices include GST.' : 'Not registered: no GST is added, and receipts say so. Ask your CA before this changes.']];
  return <ul className="pf-list">{rows.map(([k, ok, hint]) => <li key={k}><span className="pf-grow">{k}<div className="pf-small pf-muted">{hint}</div></span>{ok ? <Pill tone="leaf" icon="check">On</Pill> : <Pill tone="gold">Not yet</Pill>}</li>)}</ul>;
}

function NewCode({ onDone }) {
  const [f, setF] = useState({ code: '', label: '', type: 'seat', value: '', grantProduct: 'plan-3m', maxUses: '20', validTo: '' });
  const [msg, setMsg] = useState('');
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const go = async e => {
    e.preventDefault(); setMsg('');
    const body = { code: f.code, label: f.label, type: f.type, ...(f.validTo ? { validTo: f.validTo } : {}), ...(f.maxUses ? { maxUses: Number(f.maxUses) } : {}), ...(f.type === 'seat' ? { grantProduct: f.grantProduct } : { value: f.type === 'flat' ? Math.round(Number(f.value) * 100) : Number(f.value) }) };
    try { await adminApi.createCoupon(body); setMsg(`Created ${f.code.toUpperCase()}.`); setF(x => ({ ...x, code: '', label: '' })); onDone(); } catch (x) { setMsg(errOf(x)); }
  };
  return (
    <form onSubmit={go} className="pf-grid g2" style={{ gap: 12 }}>
      <div className="pf-field"><label className="pf-label" htmlFor="c-code">Code</label><input id="c-code" className="pf-input" value={f.code} onChange={set('code')} placeholder="GREENFIELD-20" required /></div>
      <div className="pf-field"><label className="pf-label" htmlFor="c-label">Name (for you)</label><input id="c-label" className="pf-input" value={f.label} onChange={set('label')} placeholder="Greenfield School pilot" /></div>
      <div className="pf-field"><label className="pf-label" htmlFor="c-type">Kind</label><select id="c-type" className="pf-select" value={f.type} onChange={set('type')}><option value="seat">School code (free access, limited seats)</option><option value="percent">Discount, percent off</option><option value="flat">Discount, rupees off</option></select></div>
      {f.type === 'seat'
        ? <div className="pf-field"><label className="pf-label" htmlFor="c-prod">Unlocks</label><select id="c-prod" className="pf-select" value={f.grantProduct} onChange={set('grantProduct')}>{PRODUCTS.filter(p => p[0] !== 'assessment').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        : <div className="pf-field"><label className="pf-label" htmlFor="c-val">{f.type === 'percent' ? 'Percent off' : 'Rupees off'}</label><input id="c-val" className="pf-input" type="number" min="1" value={f.value} onChange={set('value')} required /></div>}
      <div className="pf-field"><label className="pf-label" htmlFor="c-max">{f.type === 'seat' ? 'Seats' : 'Total uses (optional)'}</label><input id="c-max" className="pf-input" type="number" min="1" value={f.maxUses} onChange={set('maxUses')} /></div>
      <div className="pf-field"><label className="pf-label" htmlFor="c-to">Valid until (optional)</label><input id="c-to" className="pf-input" type="date" value={f.validTo} onChange={set('validTo')} /></div>
      <div><button type="submit" className="pf-btn sm" disabled={!f.code}>Create code</button>{msg && <span className="pf-small" role="status" style={{ marginLeft: 10 }}>{msg}</span>}</div>
    </form>
  );
}

/** Money and access: revenue and plans, whether payments are ready, every order, and the school and discount codes. */
export default function Payments() {
  const { me } = useOutletContext() || {};
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = () => adminApi.payments().then(r => setD(r.data)).catch(e => setErr(errOf(e)));
  useEffect(() => { load(); }, []);
  if (err) return <p role="alert">{err}</p>;
  if (!d) return <PageSkeleton label="Loading payments" />;
  const plans = Object.entries(d.plansActive);
  return (
    <>
      <div className="pf-kpis">
        <Kpi label="Revenue today" value={inr(d.revenue.today.paise)} sub={`${num(d.revenue.today.orders)} payments`} />
        <Kpi label="Revenue this month" value={inr(d.revenue.month.paise)} sub={`${num(d.revenue.month.orders)} payments`} />
        <Kpi label="All time" value={inr(d.revenue.all.paise)} sub={`${num(d.revenue.all.orders)} payments`} />
        <Kpi label="Active plans" value={num(plans.reduce((a, [, n]) => a + n, 0))} sub={plans.map(([k, n]) => `${n} × ${NAME[k] || k}`).join(' · ') || 'None yet'} />
        <Kpi label="Waiting or failed (24 h)" value={`${num(d.pending)} · ${num(d.failed24)}`} sub="payments started but not completed" />
      </div>
      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Section title="Ready to take payments?" icon="shield"><Setup s={d.setup} /></Section>
        <Section title="Launch offer" icon="flag"><p style={{ margin: 0 }}>{new Date(d.offerEndsAt) > new Date() ? <>The launch prices apply until <b>{day(d.offerEndsAt)}</b>. After that, the regular prices are charged and shown automatically.</> : <>The launch offer has ended. Regular prices apply.</>}</p><p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>The date is set with OFFER_ENDS_AT on the host.</p></Section>
      </div>

      <Section title="School and discount codes" icon="cap" style={{ marginBottom: 18 }}>
        {d.coupons.length === 0 ? <p className="pf-small pf-muted">No codes yet.</p> : (
          <div className="pf-tablewrap"><table className="pf-atable">
            <thead><tr><th>Code</th><th>What</th><th className="r">Used</th><th>Until</th><th /></tr></thead>
            <tbody>{d.coupons.map(c => (
              <tr key={c.id}><td><b>{c.code}</b><div className="pf-small pf-muted">{c.label}</div></td>
                <td>{c.type === 'seat' ? `Unlocks ${NAME[c.grantProduct] || c.grantProduct}` : c.type === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`}</td>
                <td className="r">{num(c.uses)}{c.maxUses ? ` of ${num(c.maxUses)}` : ''}</td><td>{c.validTo ? day(c.validTo) : '—'}</td>
                <td className="r">{c.paused ? <Pill tone="grey">Paused</Pill> : null} {can(me, 'act') && <button type="button" className="pf-btn sm ghost" onClick={() => adminApi.pauseCoupon(c.id, !c.paused).then(load).catch(e => setErr(errOf(e)))}>{c.paused ? 'Resume' : 'Pause'}</button>}</td></tr>
            ))}</tbody>
          </table></div>
        )}
        {can(me, 'act') && <div style={{ marginTop: 16 }}><h4 style={{ margin: '0 0 10px', fontSize: 15 }}>New code</h4><NewCode onDone={load} /></div>}
      </Section>

      <Card>
        <CardHead title="Recent orders" icon="file" />
        {d.orders.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No orders yet.</p> : (
          <div className="pf-tablewrap"><table className="pf-atable">
            <thead><tr><th>When</th><th>Account</th><th>What</th><th className="r">Amount</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>{d.orders.map(o => (
              <tr key={o.id}><td style={{ whiteSpace: 'nowrap' }}>{when(o.at)}</td><td><Link to={`/admin/users/${o.userId}`}>{o.name || o.email || 'Open'}</Link></td>
                <td>{NAME[o.productId] || o.productId}{o.source !== 'checkout' ? <span className="pf-small pf-muted"> · {o.source}</span> : null}{o.couponCode ? <div className="pf-small pf-muted">Code {o.couponCode}</div> : null}</td>
                <td className="r">{o.amount ? inr(o.amount) : 'Free'}</td><td><Pill tone={(STATUS[o.status] || ['grey'])[0]}>{(STATUS[o.status] || [0, o.status])[1]}</Pill></td><td className="pf-small">{o.receiptNo || '—'}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
