import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { V4_ENABLED } from '../v4/config';
import Icon from '../platform/ui/Icon';
import { payApi, fmtDate, rememberChoice } from '../pay/payApi';
import PriceBoard, { planLength } from '../pay/PriceBoard';
import { Reveal, Tag, Circled } from './ExtraSections';

const SIGNUP = V4_ENABLED ? '/v4/register' : '/register';

/**
 * Plans and prices, on the home page. Prices come from the server, so the struck-through price shows only while the offer is real.
 * Choosing leads a signed-in student to My plan with that plan ready; anyone else creates an account first, and the choice is kept.
 */
export default function PricingSection() {
  const { isLoggedIn } = useAuth();
  const [cat, setCat] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { payApi.catalog().then(r => (r.data && Array.isArray(r.data.products) ? setCat(r.data) : setFailed(true))).catch(() => setFailed(true)); }, []);

  const label = p => (p.kind === 'plan' ? `Choose ${planLength(p.months)}` : 'Get the assessment');
  const cta = (p, className) => (isLoggedIn
    ? <Link to={`/platform/student/billing?buy=${p.id}`} className={className}>{label(p)}<Icon name="chevronRight" size={18} /></Link>
    : <Link to={SIGNUP} className={className} onClick={() => rememberChoice(p.id)}>{label(p)}<Icon name="chevronRight" size={18} /></Link>);

  return (
    <section id="pricing" className="lpx lpx-pricing" aria-label="Plans and prices">
      <Reveal className="lpx-head">
        <Tag icon="bolt">PLANS AND PRICES</Tag>
        <h2>Start with clarity.<br />A <Circled>mentor</Circled> all the way.</h2>
        <p>Take the Career Assessment on its own, or choose a plan: weekly plans built around your real week, practice from what you learn, and a one-to-one mentor session every week.</p>
        {cat && cat.offerEndsAt && <span className="lpx-note"><Icon name="flag" size={15} />Launch offer: these prices until {fmtDate(cat.offerEndsAt)}</span>}
      </Reveal>
      {failed && <p className="lpx-pricing-msg" role="status">We could not load the prices just now. Please refresh the page.</p>}
      {!cat && !failed && <div className="lpx-pricing-wait" role="status" aria-label="Loading prices" />}
      {cat && (
        <Reveal>
          <PriceBoard
            products={cat.products}
            cta={cta}
            gstRegistered={cat.gst.registered}
            footnote={(
              <p className="lpx-pricing-foot">
                <Icon name="cap" size={16} />Got a code from your school? {isLoggedIn ? <>Open <Link to="/platform/student/billing">My plan</Link> and enter it.</> : <><Link to="/login">Log in</Link> and enter it under My plan.</>} There is nothing to pay.
              </p>
            )}
          />
        </Reveal>
      )}
    </section>
  );
}
