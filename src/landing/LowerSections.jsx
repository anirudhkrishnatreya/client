import { Link } from 'react-router-dom';
import { V4_ENABLED } from '../v4/config';
import Icon from '../platform/ui/Icon';
import PHOTO from './photos';
import { useMedia, useWidth } from './useFit';
import burstRed from '../assets/landing/burst-red.svg';
import woman from '../assets/landing/g-woman.png';
import laptopMan from '../assets/landing/g-laptop-man.png';
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
import ringWord from '../assets/landing/g-ring-10x.svg';
import arrow from '../assets/landing/g-arrow.svg';
import dot from '../assets/landing/g-dot.svg';
import curve from '../assets/landing/g-curve.svg';
import waves from '../assets/landing/p-waves.svg';
import clockBg from '../assets/landing/p-clock-bg.svg';
import upArrow from '../assets/landing/p-arrow.svg';

const at = (left, top, extra = {}) => ({ position: 'absolute', left, top, ...extra });
const signUp = V4_ENABLED ? '/v4/register' : '/register';
const MENTOR_CARDS = [
  [653, 830, 'user', 'Tell us about you', 'Your goals, your interests and where you need help.'],
  [653, 980, 'clipboard', 'Take the assessment', 'A few short sittings you can pause. Answers save as you go.'],
  [883, 870, 'users', 'Meet your AI mentor', 'It builds your plan from your results and your goals.'],
  [883, 1020, 'flag', 'Start your first week', 'Get clear tasks, with a real mentor checking in.']
];
const PROFILE_CARDS = [[737, 1620, 'calendar', 'Weekly plan'], [737, 1730, 'tasks', 'Daily tasks'], [973, 1620, 'chart', 'Progress reports'], [973, 1730, 'heart', 'Parent view']];
const TONES = ['#0f3ee4', '#d9654a', '#c98a14', '#3f8a64'];
const BULLETS = ['An AI mentor that knows your goals', 'A weekly plan that adjusts as you go', 'A real mentor for the big decisions', 'Progress your parents can follow'];

/** An example mentor-session card, drawn in code (the Figma picture of one named a real-looking person). */
function SessionExample({ style }) {
  return (
    <div className="lp-sess" style={style}>
      <span className="lp-sess-tag">Example</span>
      <div className="lp-sess-top"><span className="lp-sess-av">AI</span><div><b>Daily check-in</b><small>Today · 7:30 pm</small></div></div>
      <p>You finished 3 of 4 tasks. Want to move the maths revision to tomorrow?</p>
    </div>
  );
}

/** Scales a fixed-size design frame to the width of its container. */
function Fit({ w, h, className = '', children }) {
  const [ref, cw] = useWidth();
  const s = cw ? Math.min(cw / w, 1) : 1;           // never larger than the design
  return (
    <div ref={ref} className={`lp-fit ${className}`} style={{ height: h * s }}>
      <div className="lp-center" style={{ width: w * s, height: h * s }}>
        <div className="lp-stage" style={{ width: w, height: h, transform: `scale(${s})` }}>{children}</div>
      </div>
    </div>
  );
}

const Emoji = ({ x, y, bg, children, tone = '#0f3ee4' }) => (
  <div style={at(x, y, { width: 40, height: 40 })}><img src={bg} alt="" className="lp-ebg" /><span className="lp-e" style={{ color: tone }}><Icon name={children} size={22} stroke={2} /></span></div>
);

/** "Get started with your future here" (MacBook Air 6), 1280 x 1985. */
function GetStartedDesktop() {
  return (
    <Fit w={1280} h={1985} className="lp-s6">
      <img src={burstRed} alt="" aria-hidden="true" style={at(352, 26, { width: 120, height: 120 })} />
      <h2 className="lp-s6h" style={at(0, 68, { width: 1280 })}>Get Started on<br />Your Future</h2>
      <p className="lp-s6p" style={at(305, 174, { width: 610 })}>iMenteo is an AI mentor that learns what you are good at, plans your week and checks in on you every day. A real mentor is there for the big decisions.</p>
      <Link to={signUp} className="lp-btn" style={at(565, 243, { width: 150 })}>Start now</Link>

      {/* three tiles */}
      <div style={at(119, 322, { width: 315, height: 380, borderRadius: 20, background: 'rgba(15,129,228,.2)' })} />
      <div style={at(120, 322, { width: 314, height: 380, overflow: 'hidden' })}>
        <img src={blob} alt="" style={at(-12.46, 35, { width: 336.911, height: 362 })} />
        <img src={woman} alt="" style={at(-63, 91, { width: 432, height: 288, objectFit: 'cover' })} />
        <p className="lp-create" style={at(22, 33)}>Ask.<br />Plan. Do.</p>
        <img src={star} alt="" style={at(208, 10, { width: 101, height: 101 })} />
        <div style={at(46, 111, { width: 41, height: 41 })}><img src={emojiA} alt="" style={{ width: 41, height: 41 }} /></div>
        <span className="lp-e" style={at(46, 111, { width: 41, height: 38, color: '#0f3ee4' })}><Icon name="users" size={22} stroke={2} /></span>
      </div>
      <div style={at(454, 322, { width: 371, height: 180, borderRadius: 20, background: '#f1f1f1' })} />
      <div style={at(454, 522, { width: 371, height: 180, borderRadius: 20, background: '#f1f1f1', overflow: 'hidden' })}><img src={PHOTO.p6684552} alt="Students working on a project together" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }} /></div>
      <SessionExample style={at(470, 369, { width: 340, height: 133 })} />
      <div style={at(460, 340, { width: 41, height: 41 })}><img src={emojiB} alt="" style={{ width: 41, height: 41 }} /></div>
      <span className="lp-e" style={at(460, 340, { width: 41, height: 38, color: '#c98a14' })}><Icon name="star" size={22} stroke={2} /></span>
      <div style={at(847, 322, { width: 315, height: 380, borderRadius: 20, background: 'rgba(15,129,228,.2)', overflow: 'hidden' })}><img src={laptopMan} alt="A student working on a laptop" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /></div>

      {/* find your perfect mentor */}
      <div style={at(119, 761, { width: 1043, height: 426, borderRadius: 20, background: 'linear-gradient(to bottom, rgba(32,81,253,.2), rgba(32,81,253,.06))' })} />
      <div className="lp-tag" style={at(168, 810, { width: 200 })}><Icon name="sparkles" size={16} stroke={2.2} />FOR STUDENTS</div>
      <h2 className="lp-s6big" style={at(168, 879)}>Meet Your<br />AI Mentor<br />in <i>4 Steps</i></h2>
      <img src={ringMinutes} alt="" aria-hidden="true" style={at(212, 964.9, { width: 262, height: 137 })} />
      <Link to={signUp} className="lp-btn lp-btn-arrow" style={at(172, 1091, { width: 182 })}>Set up now<img src={arrow} alt="" style={{ width: 20, height: 14.7 }} /></Link>
      <div className="lp-dash" style={at(797, 813, { width: 192, height: 94, borderBottom: 0 })} />
      <div className="lp-dash" style={at(797, 963, { width: 192, height: 150, borderRight: 0 })} />
      {MENTOR_CARDS.map(([x, y, e, t, d], i) => (
        <div key={i}>
          <div className="lp-mcard" style={at(x, y, { width: 211, height: 113 })} />
          <Emoji x={x + 11} y={y - 22} bg={emojiC} tone={TONES[i % 4]}>{e}</Emoji>
          <p className="lp-mt1" style={at(x + 18, y + 18)}>{t}</p>
          <p className="lp-mt2" style={at(x + 18, y + 45, { width: 168 })}>{d}</p>
        </div>
      ))}

      {/* grow and learn */}
      <img src={portrait} alt="A student taking notes at a laptop" style={at(120, 1295, { width: 234, height: 456, borderRadius: 20, objectFit: 'cover' })} />
      <div style={at(374, 1295, { width: 267, height: 282, borderRadius: 20, background: '#f1f1f1', overflow: 'hidden' })}><img src={PHOTO.p8055086} alt="A family at the table while a child does homework" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} /></div>
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
      <div className="lp-tag shadow" style={at(730, 1287, { width: 200 })}><Icon name="sparkles" size={16} stroke={2.2} />FOR STUDENTS</div>
      <h2 className="lp-s6big" style={at(737, 1339)}>Grow &amp;<br />Learn <i>smarter</i></h2>
      <img src={ringWord} alt="" aria-hidden="true" style={at(868, 1376, { width: 215, height: 107 })} />
      <ul className="lp-bullets" style={at(737, 1481)}>
        {BULLETS.map(b => <li key={b}>{b}</li>)}
      </ul>
      {PROFILE_CARDS.map(([x, y, e, t], i) => (
        <div key={i}>
          <div className="lp-pcard" style={at(x, y + 0, { width: 211, height: 64 })} />
          <div style={at(x + 11, y - 22, { width: 40, height: 40 })}><img src={emojiD} alt="" className="lp-ebg2" /><span className="lp-e" style={{ color: TONES[i % 4] }}><Icon name={e} size={22} stroke={2} /></span></div>
          <p className="lp-mt3" style={at(x + 18, y + 18)}>{t}</p>
        </div>
      ))}
    </Fit>
  );
}

/** Phone and tablet version of the same section, reflowed into one column. */
function GetStartedMobile() {
  return (
    <div className="lp-m6">
      <div className="lp-m6head"><img src={burstRed} alt="" aria-hidden="true" className="lp-m6burst" /><h2>Get Started on Your Future</h2></div>
      <p className="lp-m6lead">iMenteo is an AI mentor that learns what you are good at, plans your week and checks in on you every day. A real mentor is there for the big decisions.</p>
      <Link to={signUp} className="lp-btn static">Start now</Link>
      <div className="lp-m6tiles">
        <div className="lp-m6tile blue"><img src={blob} alt="" className="blob" /><img src={woman} alt="" className="woman" /><p>Ask.<br />Plan. Do.</p><img src={star} alt="" className="star" /></div>
        <div className="lp-m6tile grey"><SessionExample style={{ position: 'relative', width: '86%', height: 'auto', padding: '16px 18px' }} /></div>
        <div className="lp-m6tile photo"><img src={laptopMan} alt="A student working on a laptop" /></div>
      </div>
      <div className="lp-m6panel">
        <span className="lp-tag static"><Icon name="sparkles" size={16} stroke={2.2} />FOR STUDENTS</span>
        <h2 className="lp-m6big">Meet Your AI Mentor in <i>4 Steps</i></h2>
        <Link to={signUp} className="lp-btn lp-btn-arrow static">Set up now<img src={arrow} alt="" style={{ width: 20, height: 14.7 }} /></Link>
        <div className="lp-m6cards">{MENTOR_CARDS.map(([, , e, t, d]) => <div key={t} className="lp-mcard"><span className="lp-m6e"><Icon name={e} size={16} stroke={2} /></span><b>{t}</b><p>{d}</p></div>)}</div>
      </div>
      <div className="lp-m6grow">
        <img src={portrait} alt="A student taking notes at a laptop" className="lp-m6portrait" />
        <span className="lp-tag static shadow"><Icon name="sparkles" size={16} stroke={2.2} />FOR STUDENTS</span>
        <h2 className="lp-m6big">Grow &amp; Learn <i>smarter</i></h2>
        <ul className="lp-bullets static">{BULLETS.map(b => <li key={b}>{b}</li>)}</ul>
        <div className="lp-m6profiles">{PROFILE_CARDS.map(([, , e, t]) => <div key={t} className="lp-pcard"><span className="lp-m6e"><Icon name={e} size={16} stroke={2} /></span>{t}</div>)}</div>
      </div>
    </div>
  );
}

/** "Schedule sessions and monetise your time" (MacBook Air 7), 1280 x 752. */
function PracticeDesktop() {
  const card = (x, cx, withArrow, emoji, title, text) => (
    <div key={x}>
      <div className="lp-pc" style={at(x, 315, { width: 354, height: 274 })} />
      <div style={at(x + 143, 290, { width: 60, height: 60 })}><img src={clockBg} alt="" style={{ position: 'absolute', left: -4, top: 0, width: 68, height: 68 }} /><span className="lp-e" style={{ inset: 0, color: '#0f3ee4' }}><Icon name={emoji} size={30} stroke={1.9} /></span></div>
      <p className="lp-pt" style={at(cx - 150, 365, { width: 300 })}>{title}</p>
      <div style={at(cx - 40, 397, { width: 80, height: 2, background: '#000' })} />
      <p className="lp-pd" style={at(cx - 128.5, 425, { width: 257 })}>{text}</p>
      <button type="button" className="lp-btn lp-btn-arrow" style={at(cx - 75, 505, { width: 150 })} onClick={() => { const el = document.getElementById('who'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Know more{withArrow && <img src={upArrow} alt="" style={{ width: 19.8, height: 13.3, transform: 'rotate(-40.91deg)' }} />}</button>
    </div>
  );
  return (
    <Fit w={1280} h={752} className="lp-s7">
      <div className="lp-s7card" style={at(119, 20, { width: 1043, height: 694 })} />
      <div style={at(123, 21, { width: 1039, height: 686, overflow: 'hidden' })}>
        <img src={waves} alt="" aria-hidden="true" style={at(-944.91, -270.11, { width: 1539.82, height: 1174.227 })} />
        <div className="lp-tag shadow wide" style={at(410, 31, { width: 220 })}><Icon name="calendar" size={16} stroke={2.2} />YOUR WEEK</div>
        <img src={burstRed} alt="" aria-hidden="true" style={at(771, 12, { width: 120, height: 120 })} />
        <h2 className="lp-s7h" style={at(0, 104, { width: 1034 })}>Plan Your Week &amp;<br />Make It Count</h2>
        <p className="lp-s6p" style={at(212, 223, { width: 610 })}>iMenteo is an AI mentor that learns what you are good at, plans your week and checks in on you every day. A real mentor is there for the big decisions.</p>
        <div style={at(0, 0)}>{card(147, 324.5, true, 'clock', 'Plan Your Week', 'Your mentor builds the week with you, and moves things around when life gets busy.')}{card(537, 714.5, false, 'file', 'Track Progress', 'Every session and task is logged with clear next steps, so nothing gets lost.')}</div>
      </div>
    </Fit>
  );
}

function PracticeMobile() {
  return (
    <div className="lp-m7">
      <span className="lp-tag static shadow"><Icon name="calendar" size={16} stroke={2.2} />YOUR WEEK</span>
      <h2>Plan Your Week &amp; Make It Count</h2>
      <p>iMenteo is an AI mentor that learns what you are good at, plans your week and checks in on you every day. A real mentor is there for the big decisions.</p>
      <div className="lp-m7cards">{[['clock', 'Plan Your Week', 'Your mentor builds the week with you, and moves things around when life gets busy.', true], ['file', 'Track Progress', 'Every session and task is logged with clear next steps, so nothing gets lost.', false]].map(([e, t, d, arrow]) => (
        <div key={t} className="lp-pc"><span className="lp-m7clock"><Icon name={e} size={26} stroke={1.9} /></span><h3>{t}</h3><i /><p>{d}</p><button type="button" className="lp-btn lp-btn-arrow static" onClick={() => { const el = document.getElementById('who'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Know more{arrow && <img src={upArrow} alt="" style={{ width: 19.8, height: 13.3, transform: 'rotate(-40.91deg)' }} />}</button></div>
      ))}</div>
    </div>
  );
}

export function GetStarted() { const wide = useMedia('(min-width: 1024px)', true); return <section id="get-started" aria-label="Get started" className="lp-lower">{wide ? <GetStartedDesktop /> : <GetStartedMobile />}</section>; }
export function Practice() { const wide = useMedia('(min-width: 1024px)', true); return <section id="practice" aria-label="Plan your week" className="lp-lower lp-lower7">{wide ? <PracticeDesktop /> : <PracticeMobile />}</section>; }
