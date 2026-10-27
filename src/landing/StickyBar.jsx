import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import { goSection } from './ExtraSections';
import { PAY_ENABLED } from '../pay/payApi';
import logo from '../assets/landing/logo.png';

export const BAR_H = 60;
const ITEMS = [['about', 'About'], ['how-it-works', 'How it works'], ['get-started', 'The platform'], ['assessment', 'Assessment'], ['who', 'Who it’s for'], ...(PAY_ENABLED ? [['pricing', 'Pricing']] : []), ['faq', 'FAQ']];
const IDS = ITEMS.map(([id]) => id);

/** The design's nav scrolls away with the first screen; this slim bar takes over once it has, with the section you are in highlighted. */
export default function StickyBar() {
  const { isLoggedIn } = useAuth();
  const [show, setShow] = useState(false);
  const [active, setActive] = useState('');
  useEffect(() => { const on = () => setShow(window.scrollY > 560); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const seen = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = '', top = 0; seen.forEach((r, id) => { if (r > top) { top = r; best = id; } });
      setActive(top > 0 ? best : '');
    }, { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.01, 0.1, 0.5, 1] });
    IDS.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  const signUp = V4_ENABLED ? '/v4/register' : '/register';
  return (
    <header className={`lp-bar${show ? ' show' : ''}`} style={{ height: BAR_H }} aria-hidden={!show}>
      <div className="lp-bar-in">
        <a href="#top" className="lp-bar-logo" tabIndex={show ? 0 : -1} aria-label="iMenteo, back to the top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><img src={logo} alt="iMenteo" /></a>
        <nav className="lp-bar-links" aria-label="Sections">
          {ITEMS.map(([id, label]) => <button key={id} type="button" tabIndex={show ? 0 : -1} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined} onClick={() => goSection(id)}>{label}</button>)}
        </nav>
        <span className="lp-bar-cta">
          <Link to={isLoggedIn ? (PLATFORM_ENABLED ? '/platform' : '/dashboard') : '/login'} tabIndex={show ? 0 : -1} className="lp-bar-ghost">{isLoggedIn ? 'My dashboard' : 'Log in'}</Link>
          {!isLoggedIn && <Link to={signUp} tabIndex={show ? 0 : -1} className="lp-bar-solid">Get started</Link>}
        </span>
      </div>
    </header>
  );
}
