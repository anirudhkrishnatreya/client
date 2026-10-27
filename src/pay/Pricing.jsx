import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../platform/theme/platform.css';
import './pay.css';
import logo from '../assets/imenteo_logo.png';
import { useAuth } from '../context/AuthContext';
import { payApi } from './payApi';
import Plans from './Plans';
import PayFaq from './PayFaq';

/** The public price page: what you can buy, what each includes, and what it costs, before you sign in. */
export default function Pricing() {
  const { isLoggedIn } = useAuth();
  const [billing, setBilling] = useState(null);
  useEffect(() => { if (isLoggedIn) payApi.me().then(r => setBilling(r.data.billing)).catch(() => {}); }, [isLoggedIn]);
  return (
    <div className="pf">
      <header className="pay-top"><Link to="/" aria-label="iMenteo home"><img src={logo} alt="iMenteo" style={{ height: 28 }} /></Link><span className="pf-grow" /><Link className="pf-btn sm ghost" to={isLoggedIn ? '/platform' : '/login'}>{isLoggedIn ? 'My dashboard' : 'Log in'}</Link></header>
      <main className="pay-page">
        <p className="pf-eyebrow" style={{ color: 'var(--coral)' }}>Plans and prices</p>
        <h1 className="pay-title">Know where you are heading. Then get there, with a mentor beside you.</h1>
        <p className="pay-lead">Start with the Career Assessment, or go straight to a plan: weekly plans built around your real week, practice made from what you learn, and a one-to-one mentor session every week.</p>
        <Plans signedIn={isLoggedIn} billing={billing} onPaid={() => { window.location.hash = '/platform/student/billing'; }} />
        <PayFaq />
      </main>
    </div>
  );
}
