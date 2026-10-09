import { Link } from 'react-router-dom';
import { V4_ENABLED } from '../v4/config';
import { useMedia, useWidth } from './useFit';
import burstRed from '../assets/landing/burst-red.svg';
import woman from '../assets/landing/g-woman.png';
import laptopMan from '../assets/landing/g-laptop-man.png';
import sessionCard from '../assets/landing/g-session-card.png';
import portrait from '../assets/landing/g-portrait.png';
import orbitA from '../assets/landing/g-orbit-a.png';
import orbitB from '../assets/landing/g-orbit-b.png';
import avatar1 from '../assets/landing/g-avatar-1.png';
import avatar2 from '../assets/landing/g-avatar-2.png';
import blob from '../assets/landing/g-blob.svg';
import star from '../assets/landing/g-star.svg';
import emojiA from '../assets/landing/g-emoji-a.svg';
import emojiB from '../assets/landing/g-emoji-b.svg';
import emojiC from '../assets/landing/g-emoji-c.svg';
import emojiD from '../assets/landing/g-emoji-d.svg';
import ringMinutes from '../assets/landing/g-ring-minutes.svg';
import ring10x from '../assets/landing/g-ring-10x.svg';
import arrow from '../assets/landing/g-arrow.svg';
import dot from '../assets/landing/g-dot.svg';
import curve from '../assets/landing/g-curve.svg';
import waves from '../assets/landing/p-waves.svg';
import clockBg from '../assets/landing/p-clock-bg.svg';
import upArrow from '../assets/landing/p-arrow.svg';

const at = (left, top, extra = {}) => ({ position: 'absolute', left, top, ...extra });
const signUp = V4_ENABLED ? '/v4/register' : '/register';
const MENTOR_CARDS = [[653, 830], [653, 980], [883, 870], [883, 1020]];
const PROFILE_CARDS = [[737, 1620], [737, 1730], [973, 1620], [973, 1730]];

/** Scales a fixed-size design frame to the width of its container. */
function Fit({ w, h, className = '', children }) {
  const [ref, cw] = useWidth();
  const s = cw ? cw / w : 1;
  return (
    <div ref={ref} className={`lp-fit ${className}`} style={{ height: h * s }}>
      <div className="lp-stage" style={{ width: w, height: h, transform: `scale(${s})` }}>{children}</div>
    </div>
  );
}

const Emoji = ({ x, y, bg, children, size = 24 }) => (
  <div style={at(x, y, { width: 40, height: 40 })}><img src={bg} alt="" className="lp-ebg" /><span className="lp-e" style={{ fontSize: size }}>{children}</span></div>
);

/** "Get started with your future here" (MacBook Air 6), 1280 x 1985. */
function GetStartedDesktop() {
  return (
    <Fit w={1280} h={1985} className="lp-s6">
      <img src={burstRed} alt="" aria-hidden="true" style={at(352, 26, { width: 120, height: 120 })} />
      <h2 className="lp-s6h" style={at(0, 68, { width: 1280 })}>Get Started with your<br />Future Here</h2>
      <p className="lp-s6p" style={at(305, 174, { width: 610 })}>Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with the Guidance of Seasoned Mentors, Unleashing your Full Potential.</p>
      <Link to={signUp} className="lp-btn" style={at(565, 243, { width: 150 })}>Start with us</Link>

      {/* three tiles */}
      <div style={at(119, 322, { width: 315, height: 380, borderRadius: 20, background: 'rgba(15,129,228,.2)' })} />
      <div style={at(120, 322, { width: 314, height: 380, overflow: 'hidden' })}>
        <img src={blob} alt="" style={at(-12.46, 35, { width: 336.911, height: 362 })} />
        <img src={woman} alt="" style={at(-63, 91, { width: 432, height: 288, objectFit: 'cover' })} />
        <p className="lp-create" style={at(22, 33)}>Create and<br />Connect!</p>
        <img src={star} alt="" style={at(208, 10, { width: 101, height: 101 })} />
        <div style={at(46, 111, { width: 41, height: 41 })}><img src={emojiA} alt="" style={{ width: 41, height: 41 }} /></div>
        <span className="lp-e" style={at(51.97, 116.14, { fontSize: 26, transform: 'rotate(-9deg)' })}>😃</span>
      </div>
      <div style={at(454, 322, { width: 371, height: 180, borderRadius: 20, background: '#f1f1f1' })} />
      <div style={at(454, 522, { width: 371, height: 180, borderRadius: 20, background: '#f1f1f1' })} />
      <div style={at(470, 369, { width: 340, height: 133, overflow: 'hidden' })}><img src={sessionCard} alt="" style={{ position: 'absolute', left: 0, top: '-0.07%', width: '100%', height: '133.98%' }} /></div>
      <div style={at(460, 340, { width: 41, height: 41 })}><img src={emojiB} alt="" style={{ width: 41, height: 41 }} /></div>
      <span className="lp-e" style={at(465.97, 345.14, { fontSize: 26, transform: 'rotate(-9deg)' })}>🤩</span>
      <div style={at(847, 322, { width: 315, height: 380, borderRadius: 20, background: 'rgba(15,129,228,.2)', overflow: 'hidden' })}><img src={laptopMan} alt="A student working on a laptop" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /></div>

      {/* find your perfect mentor */}
      <div style={at(119, 761, { width: 1043, height: 426, borderRadius: 20, background: 'linear-gradient(to bottom, rgba(32,81,253,.2), rgba(32,81,253,.06))' })} />
      <div className="lp-tag" style={at(168, 810, { width: 200 })}>FOR DREAMERS 😎</div>
      <h2 className="lp-s6big" style={at(168, 879)}>Find Your<br />Perfect Mentor<br />Under <i>5 Minutes!</i></h2>
      <img src={ringMinutes} alt="" aria-hidden="true" style={at(291.97, 964.9, { width: 361.459, height: 137 })} />
      <Link to={signUp} className="lp-btn lp-btn-arrow" style={at(172, 1091, { width: 182 })}>Set up now<img src={arrow} alt="" style={{ width: 20, height: 14.7 }} /></Link>
      <div className="lp-dash" style={at(797, 813, { width: 192, height: 94, borderBottom: 0 })} />
      <div className="lp-dash" style={at(797, 963, { width: 192, height: 150, borderRight: 0 })} />
      {MENTOR_CARDS.map(([x, y], i) => (
        <div key={i}>
          <div className="lp-mcard" style={at(x, y, { width: 211, height: 113 })} />
          <Emoji x={x + 11} y={y - 22} bg={emojiC}>😃</Emoji>
          <p className="lp-mt1" style={at(x + 18, y + 18)}>Write a description</p>
          <p className="lp-mt2" style={at(x + 18, y + 45, { width: 168 })}>Embark on a Transformative Journey: Cultivate Your Talents your Full Potential.</p>
        </div>
      ))}

      {/* grow and learn 10x faster */}
      <img src={portrait} alt="A student taking notes at a laptop" style={at(120, 1295, { width: 234, height: 456, borderRadius: 20, objectFit: 'cover' })} />
      <div style={at(374, 1295, { width: 267, height: 282, borderRadius: 20, background: '#f1f1f1' })} />
      <img src={burstRed} alt="" aria-hidden="true" style={at(352, 1267, { width: 120, height: 120 })} />
      <div style={at(374, 1597, { width: 267, height: 154, overflow: 'hidden' })}>
        <div style={at(0, -1, { width: 267, height: 155, borderRadius: 20, background: 'rgba(32,81,253,.09)' })} />
        <img src={orbitA} alt="" style={at(17, 20, { width: 230, height: 230 })} />
        <img src={orbitB} alt="" style={at(49, 52, { width: 166, height: 166 })} />
        <img src={dot} alt="" style={at(39, 57, { width: 10, height: 10 })} />
        <img src={curve} alt="" style={at(267 * 0.4457, 154 * 0.2468, { width: 79, height: 66 })} />
        <img src={dot} alt="" style={at(232, 87, { width: 10, height: 10 })} />
        <img src={avatar1} alt="" style={at(176, 23, { width: 36, height: 36 })} />
        <img src={avatar2} alt="" style={at(64, 60, { width: 36, height: 36 })} />
        <div style={at(74, 114, { width: 119, height: 30, borderRadius: 5, background: '#fff' })} />
        <p className="lp-connect" style={at(81, 118)}>Let’s connect</p>
      </div>
      <div className="lp-tag shadow" style={at(730, 1287, { width: 200 })}>FOR DREAMERS 😎</div>
      <h2 className="lp-s6big" style={at(737, 1339)}>Grow &amp;<br />Learn <i>10x</i> faster</h2>
      <img src={ring10x} alt="" aria-hidden="true" style={at(872.96, 1376, { width: 135, height: 107 })} />
      <ul className="lp-bullets" style={at(737, 1481)}>
        <li>Get the best mentors from anywhere on the Globe</li><li>No more hassle in getting appointments</li><li>Have every question answered</li><li>Book meeting according to your need.</li>
      </ul>
      {PROFILE_CARDS.map(([x, y], i) => (
        <div key={i}>
          <div className="lp-pcard" style={at(x, y + 0, { width: 211, height: 64 })} />
          <div style={at(x + 11, y - 22, { width: 40, height: 40 })}><img src={emojiD} alt="" className="lp-ebg2" /><span className="lp-e" style={{ fontSize: 24 }}>😃</span></div>
          <p className="lp-mt3" style={at(x + 18, y + 18)}>View our mentor’s profile</p>
        </div>
      ))}
    </Fit>
  );
}

/** Phone and tablet version of the same section, reflowed into one column. */
function GetStartedMobile() {
  return (
    <div className="lp-m6">
      <div className="lp-m6head"><img src={burstRed} alt="" aria-hidden="true" className="lp-m6burst" /><h2>Get Started with your Future Here</h2></div>
      <p className="lp-m6lead">Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with the Guidance of Seasoned Mentors, Unleashing your Full Potential.</p>
      <Link to={signUp} className="lp-btn static">Start with us</Link>
      <div className="lp-m6tiles">
        <div className="lp-m6tile blue"><img src={blob} alt="" className="blob" /><img src={woman} alt="" className="woman" /><p>Create and<br />Connect!</p><img src={star} alt="" className="star" /></div>
        <div className="lp-m6tile grey"><img src={sessionCard} alt="A booked mentor session" /></div>
        <div className="lp-m6tile photo"><img src={laptopMan} alt="A student working on a laptop" /></div>
      </div>
      <div className="lp-m6panel">
        <span className="lp-tag static">FOR DREAMERS 😎</span>
        <h2 className="lp-m6big">Find Your Perfect Mentor Under <i>5 Minutes!</i></h2>
        <Link to={signUp} className="lp-btn lp-btn-arrow static">Set up now<img src={arrow} alt="" style={{ width: 20, height: 14.7 }} /></Link>
        <div className="lp-m6cards">{[0, 1, 2, 3].map(i => <div key={i} className="lp-mcard"><span className="lp-m6e">😃</span><b>Write a description</b><p>Embark on a Transformative Journey: Cultivate Your Talents your Full Potential.</p></div>)}</div>
      </div>
      <div className="lp-m6grow">
        <img src={portrait} alt="A student taking notes at a laptop" className="lp-m6portrait" />
        <span className="lp-tag static shadow">FOR DREAMERS 😎</span>
        <h2 className="lp-m6big">Grow &amp; Learn <i>10x</i> faster</h2>
        <ul className="lp-bullets static"><li>Get the best mentors from anywhere on the Globe</li><li>No more hassle in getting appointments</li><li>Have every question answered</li><li>Book meeting according to your need.</li></ul>
        <div className="lp-m6profiles">{[0, 1, 2, 3].map(i => <div key={i} className="lp-pcard"><span className="lp-m6e">😃</span>View our mentor’s profile</div>)}</div>
      </div>
    </div>
  );
}

/** "Schedule sessions and monetise your time" (MacBook Air 7), 1280 x 752. */
function PracticeDesktop() {
  const card = (x, cx, withArrow) => (
    <div key={x}>
      <div className="lp-pc" style={at(x, 315, { width: 354, height: 274 })} />
      <div style={at(x + 143, 290, { width: 60, height: 60 })}><img src={clockBg} alt="" style={{ position: 'absolute', left: -4, top: 0, width: 68, height: 68 }} /><span className="lp-e" style={{ inset: 0, fontSize: 32 }}>⏰</span></div>
      <p className="lp-pt" style={at(cx - 150, 365, { width: 300 })}>Schedule Sessions</p>
      <div style={at(cx - 40, 397, { width: 80, height: 2, background: '#000' })} />
      <p className="lp-pd" style={at(cx - 128.5, 425, { width: 257 })}>Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with.</p>
      <span className="lp-btn lp-btn-arrow static-pos" style={at(cx - 75, 505, { width: 150 })}>Know more{withArrow && <img src={upArrow} alt="" style={{ width: 19.8, height: 13.3, transform: 'rotate(-40.91deg)' }} />}</span>
    </div>
  );
  return (
    <Fit w={1280} h={752} className="lp-s7">
      <div className="lp-s7card" style={at(119, 20, { width: 1043, height: 694 })} />
      <div style={at(123, 21, { width: 1039, height: 686, overflow: 'hidden' })}>
        <img src={waves} alt="" aria-hidden="true" style={at(-944.91, -270.11, { width: 1539.82, height: 1174.227 })} />
        <div className="lp-tag shadow wide" style={at(410, 31, { width: 220 })}>PRACTICE ADVICE 😎</div>
        <img src={burstRed} alt="" aria-hidden="true" style={at(771, 12, { width: 120, height: 120 })} />
        <h2 className="lp-s7h" style={at(0, 104, { width: 1034 })}>Schedule Sessions &amp;<br />Monetise your time</h2>
        <p className="lp-s6p" style={at(212, 223, { width: 610 })}>Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with the Guidance of Seasoned Mentors, Unleashing your Full Potential.</p>
        <div style={at(0, 0)}>{card(147, 324.5, true)}{card(537, 714.5, false)}</div>
      </div>
    </Fit>
  );
}

function PracticeMobile() {
  return (
    <div className="lp-m7">
      <span className="lp-tag static shadow">PRACTICE ADVICE 😎</span>
      <h2>Schedule Sessions &amp; Monetise your time</h2>
      <p>Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with the Guidance of Seasoned Mentors, Unleashing your Full Potential.</p>
      <div className="lp-m7cards">{[0, 1].map(i => (
        <div key={i} className="lp-pc"><span className="lp-m7clock">⏰</span><h3>Schedule Sessions</h3><i /><p>Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons with.</p><span className="lp-btn lp-btn-arrow static">Know more{i === 0 && <img src={upArrow} alt="" style={{ width: 19.8, height: 13.3, transform: 'rotate(-40.91deg)' }} />}</span></div>
      ))}</div>
    </div>
  );
}

export function GetStarted() { const wide = useMedia('(min-width: 1024px)', true); return <section id="get-started" aria-label="Get started" className="lp-lower">{wide ? <GetStartedDesktop /> : <GetStartedMobile />}</section>; }
export function Practice() { const wide = useMedia('(min-width: 1024px)', true); return <section id="practice" aria-label="Schedule sessions" className="lp-lower lp-lower7">{wide ? <PracticeDesktop /> : <PracticeMobile />}</section>; }
