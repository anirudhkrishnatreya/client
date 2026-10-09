import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import { useMedia, useWidth } from './useFit';
import WeeksSection from './WeeksSection';
import { GetStarted, Practice } from './LowerSections';
import '@fontsource/syne/700.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/dm-sans/400.css';
import './landing.css';
import logo from '../assets/landing/logo.png';
import chevron from '../assets/landing/chevron.svg';
import hashtags from '../assets/landing/hashtags.png';
import hero1 from '../assets/landing/hero-1.png';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero3 from '../assets/landing/hero-3.png';
import hero4 from '../assets/landing/hero-4-shape.png';
import hero5 from '../assets/landing/hero-5.png';
import hero6 from '../assets/landing/hero-6-photo.png';
import hero7 from '../assets/landing/hero-7.png';

const goTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
const SIGNUP = V4_ENABLED ? '/v4/register' : '/register';
const toEnd = e => { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); };
const toTop = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

function useAccount() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? { to: PLATFORM_ENABLED ? '/platform' : '/dashboard', label: 'My dashboard' } : { to: '/login', label: 'Login / Signup' };
}

/** A small down-arrow, drawn from the design's own arrow asset. */
const Caret = ({ x, y }) => <img src={chevron} alt="" aria-hidden="true" className="lp-caret" style={{ left: x - 2.09, top: y - 3.68 }} />;

/** Desktop hero: the 1280 x 832 frame, scaled to the window width. */
function HeroDesktop() {
  const [ref, w] = useWidth();
  const s = w ? w / 1280 : 1;
  const acct = useAccount();
  return (
    <div ref={ref} className="lp-fit lp-herobg" style={{ height: 832 * s }}>
      <div className="lp-stage" style={{ transform: `scale(${s})`, width: 1280, height: 832 }}>
        <img src={logo} alt="iMenteo" className="lp-logo" />
        <nav aria-label="Main">
          <a href="#top" className="lp-pill" onClick={toTop} style={{ left: 377, top: 22, width: 97 }}>Home</a>
          <button type="button" className="lp-navtxt" style={{ left: 492, top: 32, width: 60 }} onClick={() => goTo('how-it-works')}>Services</button><Caret x={559.5} y={42.5} />
          <button type="button" className="lp-navtxt" style={{ left: 603, top: 32, width: 60 }} onClick={() => goTo('get-started')}>Mentors</button><Caret x={670.5} y={42.5} />
          <button type="button" className="lp-navtxt" style={{ left: 714, top: 32, width: 67 }} onClick={() => goTo('practice')}>About Us</button>
          <button type="button" className="lp-navtxt" style={{ left: 824, top: 32, width: 80 }} onClick={toEnd}>Contact Us</button>
        </nav>
        <Link to={acct.to} className="lp-login" style={{ left: 1094, top: 22 }}>{acct.label}</Link>

        <img src={hero1} alt="" className="lp-photo" style={{ left: 19, top: 138 }} />
        <div className="lp-shape" style={{ left: 187, top: 125.65, width: 166.628, height: 180.703 }}><img src={hero2} alt="" style={{ width: 150.106, height: 165.922, transform: 'rotate(-6deg)' }} /></div>
        <img src={hero3} alt="" className="lp-photo" style={{ left: 362, top: 138 }} />
        <div className="lp-shape" style={{ left: 528.68, top: 126, width: 214.465, height: 171.865 }}><img src={hero4} alt="" style={{ width: 196.054, height: 146, transform: 'rotate(8deg)' }} /></div>
        <img src={hero5} alt="" className="lp-photo" style={{ left: 750, top: 138 }} />
        <div className="lp-shape" style={{ left: 913, top: 127.64, width: 180.711, height: 180.711 }}>
          <div className="lp-leaf" style={{ transform: 'rotate(-8deg)' }}><img src={hero6} alt="" /></div>
        </div>
        <img src={hero7} alt="" className="lp-photo" style={{ left: 1098, top: 138 }} />

        <h1 className="lp-h1">
          <span style={{ left: 90, top: 361 }}>GROW&nbsp; YOUR FUTURE</span>
          <span style={{ left: 193, top: 428 }}>&amp; SKILLS</span>
          <span style={{ left: 105, top: 496 }}>WITH <i>MENTORS</i></span>
        </h1>
        <p className="lp-lede" style={{ left: 727, top: 484, width: 423 }}>Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with the Guidance of Seasoned Mentors, Unleashing your Full Potential.</p>
        <Link to={acct.signedIn ? acct.to : SIGNUP} className="lp-btn lp-herobtn" style={{ left: 727, top: 566, width: 250 }}>{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}</Link>
        <button type="button" className="lp-herolink" style={{ left: 1004, top: 578 }} onClick={() => goTo('how-it-works')}>See how it works</button>
        <img src={hashtags} alt="" aria-hidden="true" className="lp-tags" />
      </div>
    </div>
  );
}

/** Phone and tablet hero: same pieces, laid out in a column. */
function HeroMobile() {
  const [open, setOpen] = useState(false);
  const acct = useAccount();
  const strip = [[hero1, 'photo'], [hero2, 'shape'], [hero3, 'photo'], [hero4, 'shape'], [hero5, 'photo'], [hero6, 'photo round'], [hero7, 'photo']];
  return (
    <div className="lp-mhero lp-herobg">
      <header className="lp-mnav">
        <img src={logo} alt="iMenteo" />
        <button type="button" className="lp-burger" aria-expanded={open} aria-controls="lp-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}><span /><span /><span /></button>
        {open && (
          <nav id="lp-menu" className="lp-menu" aria-label="Main">
            <a href="#top" onClick={e => { toTop(e); setOpen(false); }}>Home</a>
            <button type="button" onClick={() => { setOpen(false); goTo('how-it-works'); }}>Services</button>
            <button type="button" onClick={() => { setOpen(false); goTo('get-started'); }}>Mentors</button>
            <button type="button" onClick={() => { setOpen(false); goTo('practice'); }}>About Us</button>
            <button type="button" onClick={e => { setOpen(false); toEnd(e); }}>Contact Us</button>
            <Link to={acct.to} className="lp-login-m">{acct.label}</Link>
          </nav>
        )}
      </header>
      <div className="lp-strip" aria-hidden="true"><div className="lp-strip-in">{[...strip, ...strip].map(([src, cls], i) => <img key={i} src={src} alt="" className={`lp-sp ${cls}`} />)}</div></div>
      <h1 className="lp-mh1">GROW YOUR<br />FUTURE &amp; SKILLS<br />WITH <i>MENTORS</i></h1>
      <p className="lp-mlede">Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with the Guidance of Seasoned Mentors, Unleashing your Full Potential.</p>
      <div className="lp-mcta"><Link to={acct.signedIn ? acct.to : SIGNUP} className="lp-btn">{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}</Link><button type="button" className="lp-herolink" onClick={() => goTo('how-it-works')}>See how it works</button></div>
      <img src={hashtags} alt="" aria-hidden="true" className="lp-mtags" />
    </div>
  );
}

export default function LandingPage() {
  const wide = useMedia('(min-width: 1024px)', true);
  return (
    <div className="lp" id="top">
      {wide ? <HeroDesktop /> : <HeroMobile />}
      <WeeksSection />
      <GetStarted />
      <Practice />
    </div>
  );
}
