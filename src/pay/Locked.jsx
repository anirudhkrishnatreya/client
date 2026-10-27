import { Link } from 'react-router-dom';
import { Card, Empty } from '../platform/ui/kit';
import { fmtDate } from './payApi';

/** Shown in place of a paid feature: what it is, why it is closed, and the way in. Never a broken page. */
export default function Locked({ product, state, endsAt }) {
  const ended = state === 'grace' || state === 'expired';
  return (
    <Card>
      <Empty icon="lock" title={product === 'assessment' ? 'The Career Assessment is part of a purchase' : ended ? 'Your plan has ended' : 'This is part of an iMenteo Plan'}>
        {product === 'assessment'
          ? 'Take the full test and get your report, with career matches and the routes to them. It is a one-time purchase, and it is included in the 3, 6 and 12-month plans.'
          : ended
            ? `Your plan ended on ${fmtDate(endsAt)}. Everything you made is still here to look at. Renew to plan new weeks, and to keep your weekly mentor sessions.`
            : 'A plan gives you weekly plans built around your real week, practice made from what you learn, assessments that adapt your next week, and a mentor every week.'}
      </Empty>
      <p style={{ textAlign: 'center', margin: 0 }}><Link className="pf-btn" to="/platform/student/billing">{ended ? 'Renew my plan' : 'See plans and prices'}</Link></p>
    </Card>
  );
}
