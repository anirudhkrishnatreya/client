import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHead, Empty, Icon, PageHead, Pill } from '../platform/ui/kit';
import { PageSkeleton } from '../platform/live/loop/Loader';
import { payApi, rupees, fmtDate, payError } from './payApi';
import Plans from './Plans';
import PayFaq from './PayFaq';

const STATE = { active: ['leaf', 'Active'], grace: ['gold', 'Ended: read-only for 3 days'], expired: ['coral', 'Ended'], none: ['grey', 'No plan yet'] };

/** The person's own view: what they have and until when, receipts, a school code, and the plans to buy or extend. */
function SchoolCode({ onDone }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async e => { e.preventDefault(); setBusy(true); setMsg(''); try { const r = await payApi.redeem(code.trim()); setMsg(`Done. ${r.data.label} has opened your plan.`); setCode(''); onDone(); } catch (x) { setMsg(payError(x)); } finally { setBusy(false); } };
  return (
    <Card>
      <CardHead title="I have a school code" icon="cap" />
      <p className="pf-small pf-muted" style={{ marginTop: 0 }}>If your school gave you a code, enter it here. No payment is needed.</p>
      <form className="pf-row pf-wrap" style={{ gap: 8 }} onSubmit={go}>
        <label className="pf-sr" htmlFor="school-code">School code</label>
        <input id="school-code" className="pf-input" style={{ maxWidth: 260 }} value={code} onChange={e => setCode(e.target.value)} placeholder="For example SCHOOL-1234" maxLength={30} autoComplete="off" />
        <button type="submit" className="pf-btn sm" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Use code'}</button>
      </form>
      {msg && <p className="pf-small" role="status" style={{ margin: '8px 0 0' }}>{msg}</p>}
    </Card>
  );
}

export default function Billing() {
  const [b, setB] = useState(null);
  const [err, setErr] = useState('');
  const [thanks, setThanks] = useState(false);
  const [params] = useSearchParams();
  const chosen = params.get('buy');                 // a plan chosen on the home page
  const load = () => payApi.me().then(r => setB(r.data.billing)).catch(() => setErr('We could not load your plan. Please refresh.'));
  useEffect(() => { load(); }, []);
  if (err) return <p role="alert">{err}</p>;
  if (!b) return <PageSkeleton label="Loading your plan" cards={2} />;
  const plan = b.access.plan, st = STATE[plan.state] || STATE.none;
  return (
    <>
      <PageHead eyebrow="My plan" title="Your plan and payments">What you have, until when, and your receipts.</PageHead>
      {thanks && <div className="pf-note" role="status" style={{ marginBottom: 14 }}><b>Thank you.</b> Your payment is confirmed and your receipt is on its way to your email.</div>}
      <div className="pf-grid g2" style={{ marginBottom: 18 }}>
        <Card>
          <CardHead title="iMenteo Plan" icon="target" />
          <div className="pf-row pf-wrap" style={{ gap: 8 }}><Pill tone={st[0]}>{st[1]}</Pill></div>
          {plan.state === 'active' && <p style={{ margin: '10px 0 0' }}>Active until <b>{fmtDate(plan.endsAt)}</b> <span className="pf-muted">({plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'} left)</span>.</p>}
          {(plan.state === 'grace' || plan.state === 'expired') && <p style={{ margin: '10px 0 0' }}>Ended on <b>{fmtDate(plan.endsAt)}</b>. You can still look at everything you made. Renew below to plan new weeks.</p>}
          {plan.state === 'none' && <p style={{ margin: '10px 0 0' }}>Choose a plan below to start your weekly plan, with a mentor every week.</p>}
          {plan.state === 'active' && <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>Buying again adds the new time to the end of this plan.</p>}
          {plan.state !== 'none' && <p style={{ margin: '12px 0 0' }}><Link className="pf-btn sm ghost" to="/platform/student/plan">Open my weekly plan</Link></p>}
        </Card>
        <Card>
          <CardHead title="Career Assessment" icon="clipboard" />
          <div className="pf-row pf-wrap" style={{ gap: 8 }}><Pill tone={b.access.assessment ? 'leaf' : 'grey'}>{b.access.assessment ? 'Yours' : 'Not bought yet'}</Pill></div>
          <p style={{ margin: '10px 0 0' }}>{b.access.assessment ? 'You can take the assessment and open your report any time.' : 'Take the full test and get your report with career matches. It is included in the 3, 6 and 12-month plans.'}</p>
        </Card>
      </div>
      <SchoolCode onDone={() => { setThanks(false); load(); }} />
      <div style={{ margin: '18px 0' }}><Plans billing={b} initial={chosen} onPaid={() => { setThanks(true); load(); }} /></div>
      <Card style={{ marginBottom: 18 }}>
        <CardHead title="Receipts" icon="file" />
        {b.orders.length === 0 ? <Empty icon="file" title="No payments yet">Your receipts will appear here.</Empty> : (
          <div className="pf-tablewrap"><table className="pf-atable">
            <thead><tr><th>Date</th><th>What</th><th className="r">Paid</th><th>Receipt</th></tr></thead>
            <tbody>{b.orders.map(o => (
              <tr key={o.id}><td>{fmtDate(o.paidAt)}</td><td>{o.name}{o.source === 'school-code' ? ' (school code)' : o.source === 'admin' ? ' (gift)' : ''}{o.couponCode ? <div className="pf-small pf-muted">Code {o.couponCode}</div> : null}</td><td className="r">{o.amount ? rupees(o.amount) : 'Free'}</td><td>{o.amount ? <Link to={`receipt/${o.id}`}>{o.receiptNo || 'View'}</Link> : '—'}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      <PayFaq />
    </>
  );
}

/** A receipt to print or save as PDF from the browser. */
export function Receipt() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { payApi.receipt(id).then(x => setR(x.data)).catch(() => setErr('We could not find that receipt.')); }, [id]);
  if (err) return <><p role="alert">{err}</p><Link to="/platform/student/billing">Back to my plan</Link></>;
  if (!r) return <PageSkeleton label="Loading the receipt" cards={1} />;
  const x = r.receipt;
  return (
    <>
      <p className="pf-small pf-noprint" style={{ marginBottom: 8 }}><Link to="/platform/student/billing">← My plan</Link></p>
      <Card className="pay-receipt">
        <div className="pf-row pf-between"><div><h2 style={{ fontSize: 22 }}>Payment receipt</h2><p className="pf-small pf-muted" style={{ margin: 0 }}>{r.business.name}{r.business.email ? ` · ${r.business.email}` : ''}</p></div><b>{x.receiptNo}</b></div>
        <ul className="pf-list" style={{ marginTop: 14 }}>
          <li><span className="pf-grow pf-muted">Date</span><span>{fmtDate(x.paidAt)}</span></li>
          <li><span className="pf-grow pf-muted">Paid by</span><span>{x.payer.name} · {x.payer.email}</span></li>
          <li><span className="pf-grow pf-muted">For</span><span>{x.name}</span></li>
          <li><span className="pf-grow pf-muted">Price</span><span>{rupees(x.listAmount)}</span></li>
          {x.couponOff > 0 && <li><span className="pf-grow pf-muted">Code {x.couponCode}</span><span>− {rupees(x.couponOff)}</span></li>}
          {x.creditOff > 0 && <li><span className="pf-grow pf-muted">Assessment credit</span><span>− {rupees(x.creditOff)}</span></li>}
          <li><span className="pf-grow"><b>Total paid</b></span><b>{rupees(x.amount)}</b></li>
          {x.method && <li><span className="pf-grow pf-muted">Method</span><span>{x.method.toUpperCase()}</span></li>}
        </ul>
        <p className="pf-small pf-muted" style={{ margin: '10px 0 0' }}>{x.gstRegistered ? 'Prices include GST.' : 'No GST is charged on this payment. This is a payment receipt, not a tax invoice.'}</p>
        <p className="pf-noprint" style={{ margin: '14px 0 0' }}><button type="button" className="pf-btn sm" onClick={() => window.print()}><Icon name="download" size={14} />Print or save as PDF</button></p>
      </Card>
    </>
  );
}
