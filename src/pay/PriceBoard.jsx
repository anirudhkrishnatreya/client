import { useState } from 'react';
import Icon from '../platform/ui/Icon';
import { rupees } from './payApi';
import './priceboard.css';

export const planLength = m => (m === 1 ? '1 month' : `${m} months`);

/** How much less a longer plan costs than paying month by month at today's monthly price, in whole percent (null if under 5%). */
export function savingVsMonthly(plans, p) {
  const one = plans.find(x => x.months === 1);
  if (!one || !p || p.months <= 1) return null;
  const pct = Math.round((1 - p.amount / (one.amount * p.months)) * 100);
  return pct >= 5 ? pct : null;
}

/** The price: the regular price struck through only while the offer is real, then what you pay. A code or credit shows its own line. */
function Price({ p, quote }) {
  const now = quote ? quote.amount : p.amount;
  return (
    <>
      <div className="pb-price">
        {p.regular && <s aria-label={`Regular price ${rupees(p.regular)}`}>{rupees(p.regular)}</s>}
        <b>{rupees(now)}</b>
        {p.offerOn && <span className="pb-off">{p.discountPercent}% off</span>}
      </div>
      {quote && quote.amount !== p.amount && <p className="pb-quote">With {quote.couponLabel || 'your credit'}: {rupees(p.amount - quote.amount)} less</p>}
    </>
  );
}

const List = ({ items, two }) => <ul className={`pb-list${two ? ' two' : ''}`}>{items.map(i => <li key={i}><span><Icon name="check" size={12} stroke={3} /></span>{i}</li>)}</ul>;

/**
 * Plans and prices, the same on the home page and in My plan: one plan card with a length switch (1, 3, 6 or 12 months), and the
 * Career Assessment on its own. `cta(product, className)` draws the button, so each place decides what choosing does.
 */
export default function PriceBoard({ products, quotes = {}, initial, cta, gstRegistered = false, footnote }) {
  const plans = products.filter(p => p.kind === 'plan').sort((a, b) => a.months - b.months);
  const assessment = products.find(p => p.kind === 'assessment');
  const first = plans.find(p => p.id === initial) || plans.find(p => p.highlight) || plans[0];
  const [sel, setSel] = useState(first && first.id);
  const p = plans.find(x => x.id === sel) || first;
  const save = savingVsMonthly(plans, p);
  const rest = p ? p.includes.filter(i => !/Career Assessment/.test(i)) : [];
  return (
    <div className="pb">
      <div className="pb-grid">
        {p && (
          <article className="pb-plan" aria-label="iMenteo Plan">
            <span className="pb-kicker">iMenteo Plan</span>
            <h3 className="pb-title">The whole journey, with a mentor every week</h3>
            <div className="pb-seg" role="group" aria-label="Plan length">
              {plans.map(x => {
                const s = savingVsMonthly(plans, x);
                return (
                  <button key={x.id} type="button" aria-pressed={x.id === p.id} className={x.id === p.id ? 'on' : ''} onClick={() => setSel(x.id)}>
                    <b>{planLength(x.months)}</b><small>{x.highlight ? 'Most chosen' : s ? `Save ${s}%` : 'Try it'}</small>
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              <Price p={p} quote={quotes[p.id]} />
              <p className="pb-sub">
                {p.months > 1 ? <>About <b>{rupees(Math.round(p.perMonth / 100) * 100)}</b> a month · </> : null}
                <b>{p.mentorSessions}</b> one-to-one mentor sessions{save ? <> · {save}% less than month by month</> : null}
              </p>
              {p.includesAssessment && <span className="pb-incl"><Icon name="sparkles" size={14} />Career Assessment and report included</span>}
            </div>
            <List items={rest} two />
            <div className="pb-cta">{cta(p, 'pb-btn light')}<span>One payment for {planLength(p.months)}. Nothing renews on its own.</span></div>
          </article>
        )}
        {assessment && (
          <article className="pb-one" aria-label={assessment.name}>
            <span className="pb-kicker">Just the assessment</span>
            <h3 className="pb-title">{assessment.name}</h3>
            <Price p={assessment} quote={quotes[assessment.id]} />
            <p className="pb-sub">One time. Yours to keep, with a copy for a parent.</p>
            <List items={assessment.includes} />
            <div className="pb-cta">{cta(assessment, 'pb-btn')}</div>
          </article>
        )}
      </div>
      <ul className="pb-trust">
        <li><Icon name="bolt" size={15} />UPI, cards, net banking and wallets</li>
        <li><Icon name="shield" size={15} />Refund within 7 days if unused</li>
        <li><Icon name="check" size={15} />{gstRegistered ? 'Prices include GST' : 'No GST added: the price you see is the price you pay'}</li>
      </ul>
      {footnote}
    </div>
  );
}
