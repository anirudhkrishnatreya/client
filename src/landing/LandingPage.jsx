import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import { useMedia } from './useFit';
import WeeksSection from './WeeksSection';
import { GetStarted, Practice } from './LowerSections';
import { Why, Assessment, Who, AiSection, Safety, Faq, FinalCta, Footer } from './ExtraSections';
import StickyBar, { BAR_H } from './StickyBar';
import { TAGS } from './config';
import '@fontsource/syne/700.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/dm-sans/400.css';
import './landing.css';
import logo from '../assets/landing/logo.png';
import chevron from '../assets/landing/chevron.svg';
import hero1 from '../assets/landing/hero-1.png';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero3 from '../assets/landing/hero-3.png';
import hero4 from '../assets/landing/hero-4-shape.png';
import hero5 from '../assets/landing/hero-5.png';
import hero6 from '../assets/landing/hero-6-photo.png';
import hero7 from '../assets/landing/hero-7.png';

const goTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
const SIGNUP = V4_ENABLED ? '/v4/register' : '/register';
const toTop = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

function useAccount() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? { to: PLATFORM_ENABLED ? '/platform' : '/dashboard', label: 'My dashboard' } : { to: '/login', label: 'Log in' };
}

// one repeating group of five pills, in the design's own arrangement: [centre x, centre y, width, height, tilt, look]  (design units, group width 421)
const GROUP = [[141, 38, 133, 36, 25, 'out'], [250, 13, 139, 44, -4, 'solid'], [405, 11, 133, 36, -25, 'out'], [331, 74, 138, 38, 0, 'out'], [490, 78, 139, 36, 0, 'warm']];
const GROUP_W = 421;

/** Still (not moving) floating tags, scaled with the window so they always span it. */
function Chips() {
  const pills = [];
  for (let g = -1; g <= 5; g += 1) GROUP.forEach(([x, y, w, h, tilt, look], i) => {
    const warm = look === 'warm' ? (g % 2 === 0 ? 'sun' : 'coral') : look;
    pills.push(<span key={`${g}-${i}`} className={`lp-chip ${warm}`} style={{ left: `calc(var(--u) * ${x + g * GROUP_W})`, top: `calc(var(--u) * ${y + 62})`, minWidth: `calc(var(--u) * ${w})`, height: `calc(var(--u) * ${h})`, transform: `translate(-50%, -50%) rotate(${tilt}deg)` }}>{TAGS[(((g + 1) * 5 + i) % TAGS.length + TAGS.length) % TAGS.length]}</span>);
  });
  return <div className="lp-chips" aria-hidden="true">{pills}</div>;
}

/** Desktop hero. Laid out to fill the window (whatever its shape): the photo row spans the width, the headline scales with the
 *  smaller of its width and height, and the tags sit along the bottom. */
function HeroDesktop() {
  const acct = useAccount();
  return (
    <div className="lp-herof lp-herobg">
      <header className="lp-hnav">
        <img src={logo} alt="iMenteo" className="lp-hlogo" />
        <nav aria-label="Main" className="lp-hlinks">
          <a href="#top" className="lp-hpill" onClick={toTop}>Home</a>
          <button type="button" className="lp-hlink" onClick={() => goTo('how-it-works')}>How it works<img src={chevron} alt="" /></button>
          <button type="button" className="lp-hlink" onClick={() => goTo('get-started')}>AI mentor<img src={chevron} alt="" /></button>
          <button type="button" className="lp-hlink" onClick={() => goTo('about')}>About</button>
          <button type="button" className="lp-hlink" onClick={() => goTo('footer')}>Contact</button>
        </nav>
        <Link to={acct.to} className="lp-hlogin">{acct.label}</Link>
      </header>

      <div className="lp-hstrip" aria-hidden="true">
        <img src={hero1} alt="" className="p" />
        <img src={hero2} alt="" className="p shape a" />
        <img src={hero3} alt="" className="p" />
        <img src={hero4} alt="" className="p shape b" />
        <img src={hero5} alt="" className="p" />
        <div className="p leaf"><img src={hero6} alt="" /></div>
        <img src={hero7} alt="" className="p" />
      </div>

      <div className="lp-hbody">
        <h1 className="lp-hh1"><span className="l1">Your 24/7</span><span className="l2">AI mentor</span><span className="l3">for <i>what’s next</i></span></h1>
        <div className="lp-hside">
          <p>iMenteo is an AI mentor that learns what you are good at, plans your week and checks in on you every day. A real mentor is there for the big decisions.</p>
          <div className="lp-hcta">
            <Link to={acct.label === 'My dashboard' ? acct.to : SIGNUP} className="lp-btn lp-herobtn">{acct.label === 'My dashboard' ? 'Open my dashboard' : 'Take the career assessment'}</Link>
            <button type="button" className="lp-herolink" onClick={() => goTo('how-it-works')}>See how it works</button>
          </div>
        </div>
      </div>
      <Chips />
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
            <button type="button" onClick={() => { setOpen(false); goTo('how-it-works'); }}>How it works</button>
            <button type="button" onClick={() => { setOpen(false); goTo('get-started'); }}>AI mentor</button>
            <button type="button" onClick={() => { setOpen(false); goTo('about'); }}>About</button>
            <button type="button" onClick={() => { setOpen(false); goTo('footer'); }}>Contact</button>
            <Link to={acct.to} className="lp-login-m">{acct.label}</Link>
          </nav>
        )}
      </header>
      <div className="lp-strip" aria-hidden="true"><div className="lp-strip-in">{[...strip, ...strip].map(([src, cls], i) => <img key={i} src={src} alt="" className={`lp-sp ${cls}`} />)}</div></div>
      <h1 className="lp-mh1">YOUR 24/7<br />AI MENTOR<br />FOR <i>WHAT’S NEXT</i></h1>
      <p className="lp-mlede">iMenteo is an AI mentor that learns what you are good at, plans your week and checks in on you every day. A real mentor is there for the big decisions.</p>
      <div className="lp-mcta"><Link to={acct.signedIn ? acct.to : SIGNUP} className="lp-btn">{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}</Link><button type="button" className="lp-herolink" onClick={() => goTo('how-it-works')}>See how it works</button></div>
      <div className="lp-mtagrow" aria-hidden="true">{TAGS.map((t, i) => <span key={t} className={`lp-chip m c${i % 4}`} style={{ transform: `rotate(${[-4, 3, -2, 5][i % 4]}deg)` }}>{t}</span>)}</div>
    </div>
  );
}

export default function LandingPage() {
  const wide = useMedia('(min-width: 1024px)', true);
  return (
    <div className="lp" id="top">
      <StickyBar />
      {wide ? <HeroDesktop /> : <HeroMobile />}
      <Why />
      <WeeksSection offset={BAR_H} />
      <GetStarted />
      <Assessment />
      <Who />
      <Practice />
      <AiSection />
      <Safety />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}
