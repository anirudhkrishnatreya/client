import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import Icon from '../platform/ui/Icon';
import WeeksSection from './WeeksSection';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './v2.css';
import logo from '../assets/landing/logo.png';
import burst from '../assets/landing/burst-red.svg';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero3 from '../assets/landing/hero-3.png';
import hero4 from '../assets/landing/hero-4-shape.png';
import hero6 from '../assets/landing/hero-6-photo.png';
import hero1 from '../assets/landing/hero-1.png';
import hero5 from '../assets/landing/hero-5.png';
import hero7 from '../assets/landing/hero-7.png';
import portrait from '../assets/landing/g-portrait.png';
import laptopMan from '../assets/landing/g-laptop-man.png';

const NAV_H = 68;
const SIGNUP = V4_ENABLED ? '/v4/register' : '/register';
const go = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

/** Fades a block in the first time it scrolls into view. Shows at once when there is no IntersectionObserver or motion is reduced. */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return undefined; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return ref;
}
const Reveal = ({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) => { const ref = useReveal(); return <Tag ref={ref} className={`v2-rv ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>; };

function useAccount() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? { to: PLATFORM_ENABLED ? '/platform' : '/dashboard', label: 'My dashboard', signedIn: true } : { to: '/login', label: 'Log in', signedIn: false };
}

function Nav() {
  const acct = useAccount();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => { const on = () => setSolid(window.scrollY > 8); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  const jump = id => () => { setOpen(false); go(id); };
  return (
    <header className={`v2-nav${solid ? ' solid' : ''}`} style={{ height: NAV_H }}>
      <div className="v2-nav-in">
        <a href="#top" className="v2-logo" aria-label="iMenteo, back to the top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setOpen(false); }}><img src={logo} alt="iMenteo" /></a>
        <nav className={`v2-links${open ? ' open' : ''}`} aria-label="Main">
          <button type="button" onClick={jump('how')}>How it works</button>
          <button type="button" onClick={jump('who')}>Who it’s for</button>
          <button type="button" onClick={jump('ai')}>Mentors + AI</button>
          <button type="button" onClick={jump('safety')}>Safety</button>
          <button type="button" onClick={jump('faq')}>FAQ</button>
          <span className="v2-links-cta">
            <Link to={acct.to} className="v2-btn ghost">{acct.label}</Link>
            {!acct.signedIn && <Link to={SIGNUP} className="v2-btn">Get started</Link>}
          </span>
        </nav>
        <span className="v2-nav-cta">
          <Link to={acct.to} className="v2-btn ghost sm">{acct.label}</Link>
          {!acct.signedIn && <Link to={SIGNUP} className="v2-btn sm">Get started</Link>}
        </span>
        <button type="button" className="v2-burger" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}><span /><span /><span /></button>
      </div>
    </header>
  );
}

/** Small product previews. They are drawn examples, labelled as such, not real student data. */
const Eg = () => <span className="v2-eg">Example</span>;
function SessionCard() {
  return (
    <div className="v2-fc v2-fc-session"><Eg />
      <div className="v2-fc-row"><span className="v2-ico blue"><Icon name="calendar" size={18} /></span><div><b>Weekly session</b><small>Thursday, 6:30 pm</small></div></div>
      <p>Review this week’s check-in and plan the next step.</p>
    </div>
  );
}
function ActionsCard() {
  return (
    <div className="v2-fc v2-fc-actions"><Eg />
      <b>Action items</b>
      <ul>
        <li className="done"><i><Icon name="check" size={12} stroke={3} /></i>Finish lecture 2</li>
        <li className="done"><i><Icon name="check" size={12} stroke={3} /></i>20 practice questions</li>
        <li><i />Write 5 lines on matrices</li>
      </ul>
    </div>
  );
}
function InsightCard() {
  return (
    <div className="v2-fc v2-fc-insight"><Eg />
      <div className="v2-fc-row"><span className="v2-ico gold"><Icon name="sparkles" size={18} /></span><div><b>Insight</b><small>Suggested · mentor reviews</small></div></div>
      <p>Scores are rising across three check-ins. A short extra practice block could help next.</p>
    </div>
  );
}

function Hero() {
  const acct = useAccount();
  return (
    <section className="v2-hero" style={{ paddingTop: NAV_H }}>
      <div className="v2-bgglow" aria-hidden="true" />
      <div className="v2-hero-in">
        <div className="v2-hero-copy">
          <span className="v2-eyebrow v2-rv in"><Icon name="sparkles" size={14} />Human mentors, AI-assisted</span>
          <h1 className="v2-h1">Turn your goals into <i>weekly progress.</i></h1>
          <p className="v2-lede">iMenteo pairs every student with a mentor, then keeps the journey personal: an assessment to understand you, weekly sessions to guide you, and clear progress for you and your parents.</p>
          <div className="v2-cta">
            <Link to={acct.signedIn ? acct.to : SIGNUP} className="v2-btn lg">{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}<Icon name="chevronRight" size={18} /></Link>
            <button type="button" className="v2-btn ghost lg" onClick={() => go('how')}>See how it works</button>
          </div>
          <ul className="v2-ticks" aria-label="Highlights">
            <li><Icon name="check" size={16} stroke={2.6} />For Class 6 to college</li>
            <li><Icon name="check" size={16} stroke={2.6} />Pause and continue any time</li>
            <li><Icon name="check" size={16} stroke={2.6} />Parent account for school students</li>
          </ul>
        </div>
        <div className="v2-collage" aria-hidden="true">
          <img src={burst} alt="" className="v2-c-burst" />
          <img src={hero4} alt="" className="v2-c-blob" />
          <div className="v2-c-leaf"><img src={hero6} alt="" /></div>
          <img src={hero3} alt="" className="v2-c-sq" />
          <img src={hero2} alt="" className="v2-c-shape" />
          <SessionCard /><ActionsCard /><InsightCard />
          <span className="v2-c-dot d1" /><span className="v2-c-dot d2" /><span className="v2-c-dot d3" />
          <span className="v2-c-emoji e1">🚀</span><span className="v2-c-emoji e2">🎯</span>
        </div>
      </div>
      <div className="v2-chips" aria-hidden="true">
        <div className="v2-chips-in">{[0, 1].map(k => ['#CareerClarity', '#WeeklyMentoring', '#Accountability', '#ParentVisibility', '#AIInsights', '#LearnWithPurpose'].map((t, i) => <span key={`${k}${t}`} className={`v2-chip c${i % 4}`}>{t}</span>))}</div>
      </div>
    </section>
  );
}

const FACTS = [['5', 'dimensions in the career assessment: interests, personality, abilities, emotional intelligence, values'], ['3', 'tracks: Class 6–9, Class 10–12 and college'], ['1:1', 'mentor for every student, with weekly sessions'], ['Weekly', 'sessions that end with clear action items']];

function Why() {
  const items = [
    { icon: 'clipboard', tone: 'blue', title: 'Know yourself', text: 'A structured career assessment maps your interests, personality, abilities, emotional intelligence and values, and turns them into a clear, readable report.' },
    { icon: 'users', tone: 'coral', title: 'Be guided by a person', text: 'Matched with a mentor on your goals and profile, with a person checking the fit. Weekly sessions keep the relationship steady, not one-off.' },
    { icon: 'trend', tone: 'gold', title: 'See real progress', text: 'Every session ends with action items. Students and parents can follow tasks, reports and mentor notes, so progress is visible, not guessed.' }
  ];
  return (
    <section className="v2-sec" id="why">
      <div className="v2-wrap">
        <Reveal className="v2-head"><span className="v2-kick">Why iMenteo</span><h2>Not just a list of mentors. A journey with a plan.</h2><p>Most students get advice once and then lose the thread. iMenteo is built around what happens between sessions: the tasks, the check-ins and the follow-through.</p></Reveal>
        <div className="v2-grid3">{items.map((it, i) => (
          <Reveal key={it.title} className="v2-card" delay={i * 90}>
            <span className={`v2-ico lg ${it.tone}`}><Icon name={it.icon} size={26} /></span>
            <h3>{it.title}</h3><p>{it.text}</p>
          </Reveal>))}</div>
        <Reveal className="v2-facts">{FACTS.map(([n, t]) => <div key={n}><b>{n}</b><span>{t}</span></div>)}</Reveal>
      </div>
    </section>
  );
}

const ROLES = {
  students: { label: 'Students', icon: 'cap', title: 'Know what you are good at, and what to do next.', points: ['Take the career assessment at your own pace and keep your report.', 'Meet your mentor every week and leave with clear action items.', 'Track tasks and progress on your own dashboard.', 'Set a goal, even a rough one, and let it shape your weeks.'],
    cta: 'Start as a student', preview: 'student' },
  mentors: { label: 'Mentors', icon: 'users', title: 'Spend your time on the conversation, not the admin.', points: ['See your assigned students, their reports and their tasks in one place.', 'See each student’s tasks, reports and notes before you meet.', 'Record notes, set action items and choose what parents can see.', 'Spot who needs you most this week.'],
    cta: 'Mentor sign-in', to: '/login', preview: 'mentor' },
  parents: { label: 'Parents', icon: 'heart', title: 'Stay in the loop without having to ask.', points: ['Your own parent account, linked from the email your child gives at sign-up.', 'See tasks, mentor session notes and career reports.', 'Confirm consent for under-18s before they begin.', 'Follow more than one child with the same login.'],
    cta: 'Parent sign-in', to: '/login', preview: 'parent' },
  schools: { label: 'Schools', icon: 'layers', title: 'See how a class is doing, with privacy kept first.', points: ['Join with a class code, so students land in the right group.', 'Counsellors see who has started and finished, class by class.', 'Individual reports are shared only when the parent (or an adult student) agrees.', 'Class summaries appear only once enough students have finished, so no one can be singled out.'],
    cta: 'School sign-in', to: '/login', preview: 'school' }
};

function Preview({ kind }) {
  if (kind === 'student') return (
    <div className="v2-pv"><Eg /><div className="v2-pv-h"><b>Your week</b><span className="v2-pill blue">3 tasks open</span></div>
      <ul className="v2-pv-list"><li><i className="done"><Icon name="check" size={12} stroke={3} /></i>Finish lecture 2 <em>Due tomorrow</em></li><li><i />Solve 20 vector questions <em>Sun</em></li><li><i />Write 5 lines on matrices <em>Mon</em></li></ul>
      <div className="v2-pv-bar"><span style={{ width: '34%' }} /></div><small>Goal progress</small></div>
  );
  if (kind === 'mentor') return (
    <div className="v2-pv"><Eg /><div className="v2-pv-h"><b>Your students</b><span className="v2-pill coral">1 needs you</span></div>
      <ul className="v2-pv-list roster"><li><span className="av a1">A</span>Student A<em className="ok">On track</em></li><li><span className="av a2">B</span>Student B<em className="warn">2 overdue</em></li><li><span className="av a3">C</span>Student C<em className="ok">Assessment done</em></li></ul></div>
  );
  if (kind === 'parent') return (
    <div className="v2-pv"><Eg /><div className="v2-pv-h"><b>This week in short</b></div>
      <ul className="v2-pv-list"><li><Icon name="check" size={16} />4 of 5 tasks finished</li><li><Icon name="calendar" size={16} />Next session on Thursday</li><li><Icon name="file" size={16} />Career report ready to read</li></ul></div>
  );
  return (
    <div className="v2-pv"><Eg /><div className="v2-pv-h"><b>Class overview</b><span className="v2-pill blue">Anonymous</span></div>
      <div className="v2-pv-bars"><span style={{ height: '46%' }} /><span style={{ height: '70%' }} /><span style={{ height: '58%' }} /><span style={{ height: '88%' }} /><span style={{ height: '64%' }} /></div><small>Summaries show once at least 10 students have finished.</small></div>
  );
}

function Who() {
  const [tab, setTab] = useState('students');
  const r = ROLES[tab];
  return (
    <section className="v2-sec alt" id="who">
      <div className="v2-wrap">
        <Reveal className="v2-head"><span className="v2-kick">Who it’s for</span><h2>One platform, four people who matter to a student’s progress.</h2></Reveal>
        <div className="v2-tabs" role="tablist" aria-label="Choose a role">
          {Object.entries(ROLES).map(([k, v]) => <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls="who-panel" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon name={v.icon} size={18} />{v.label}</button>)}
        </div>
        <div className="v2-panel" id="who-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} key={tab}>
          <div className="v2-panel-copy">
            <h3>{r.title}</h3>
            <ul className="v2-points">{r.points.map(p => <li key={p}><span><Icon name="check" size={14} stroke={3} /></span>{p}</li>)}</ul>
            <Link to={r.to || SIGNUP} className="v2-btn">{r.cta}<Icon name="chevronRight" size={18} /></Link>
          </div>
          <Preview kind={r.preview} />
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  const rules = [
    ['Grounded in real records', 'Insights come from tasks, session notes and check-ins that actually happened. Nothing is invented.'],
    ['Facts and suggestions are kept apart', 'What was recorded is shown as fact. What the AI suggests is clearly marked as a suggestion.'],
    ['A mentor stays in charge', 'AI-written summaries are reviewed by the mentor. It never decides anything about a student on its own.'],
    ['You can correct it', 'If a summary is wrong, it can be fixed, and private mentor notes stay private.']
  ];
  return (
    <section className="v2-sec" id="ai">
      <div className="v2-wrap v2-ai">
        <Reveal className="v2-ai-copy">
          <span className="v2-kick">Mentors + AI</span>
          <h2>AI helps. <i>People decide.</i></h2>
          <p>AI saves a mentor’s time on summaries and preparation, so sessions can be about the student. It is a helper, never a replacement for the person in the room.</p>
          <span className="v2-pill gold wide"><Icon name="info" size={14} />AI insights are being rolled out step by step</span>
        </Reveal>
        <div className="v2-ai-list">{rules.map(([t, d], i) => <Reveal key={t} className="v2-rule" delay={i * 80}><span className="v2-num">{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </div>
    </section>
  );
}

function Safety() {
  const items = [
    ['lock', 'A parent for every school student', 'Up to Class 12, we ask for a parent’s email at sign-up. They set their own password and get their own account.'],
    ['shield', 'Consent for under-18s', 'A parent confirms before a student under 18 begins. Consent can be withdrawn, and deletion of the data can be requested.'],
    ['eye', 'Schools see only what is shared', 'A school counsellor sees an individual report only if the parent agrees. The default is no.'],
    ['users', 'Access by role', 'Students, mentors, parents and schools each see only what they should. A mentor sees only their own students.']
  ];
  return (
    <section className="v2-sec alt" id="safety">
      <div className="v2-wrap">
        <Reveal className="v2-head"><span className="v2-kick">Safety and privacy</span><h2>Built for students, so safety comes first.</h2><p>We collect only what is needed to guide a student, we do not sell it, and we do not use it for advertising.</p></Reveal>
        <div className="v2-grid4">{items.map(([ic, t, d], i) => <Reveal key={t} className="v2-card flat" delay={i * 70}><span className="v2-ico blue"><Icon name={ic} size={22} /></span><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
      </div>
    </section>
  );
}

const FAQ = [
  ['What is iMenteo?', 'iMenteo is a mentoring platform for students. Each student takes a career assessment, is matched with a mentor, and meets them weekly. AI helps with summaries and progress, and a mentor reviews it.'],
  ['Who is it for?', 'Students from Class 6 to college. The assessment has three tracks: Class 6–9, Class 10–12 and college, so the questions fit the age.'],
  ['How long does the assessment take?', 'It takes a few sittings, depending on the track. You can pause and carry on later, and your answers are saved as you go.'],
  ['Why do you ask for a parent’s email?', 'Up to Class 12, a parent gets their own account so they can follow progress and reports. For under-18s, a parent’s consent is also needed before the student starts.'],
  ['Who sees my results?', 'You do. Your mentor and your parent can see your report and progress. Your school only sees an individual report if your parent agrees.'],
  ['Does AI replace the mentor?', 'No. A person guides every student. AI helps with summaries and preparation, and a mentor reviews what it writes.'],
  ['How much does it cost?', 'Pricing is still being finalised. Take the assessment first and see how it works.']
];
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="v2-sec" id="faq">
      <div className="v2-wrap narrow">
        <Reveal className="v2-head"><span className="v2-kick">Questions</span><h2>Good questions, plain answers.</h2></Reveal>
        <div className="v2-faq">{FAQ.map(([q, a], i) => (
          <div key={q} className={`v2-q${open === i ? ' open' : ''}`}>
            <h3><button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name="chevronDown" size={20} /></button></h3>
            <div id={`faq-${i}`} role="region" aria-label={q} className="v2-a"><p>{a}</p></div>
          </div>))}</div>
      </div>
    </section>
  );
}

function Final() {
  const acct = useAccount();
  return (
    <section className="v2-final">
      <Reveal className="v2-final-in">
        <img src={burst} alt="" aria-hidden="true" className="v2-final-burst" />
        <h2>Start with the career assessment.</h2>
        <p>Find out what fits you, then meet the mentor who can help you get there.</p>
        <div className="v2-cta c"><Link to={acct.signedIn ? acct.to : SIGNUP} className="v2-btn lg white">{acct.signedIn ? 'Open my dashboard' : 'Get started'}<Icon name="chevronRight" size={18} /></Link>{!acct.signedIn && <Link to="/login" className="v2-btn lg outline">I already have an account</Link>}</div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="v2-foot">
      <div className="v2-wrap v2-foot-in">
        <div><img src={logo} alt="iMenteo" className="v2-foot-logo" /><p>Human mentors, AI-assisted, for students who want to turn goals into progress.</p></div>
        <nav aria-label="Footer"><b>Explore</b><button type="button" onClick={() => go('how')}>How it works</button><button type="button" onClick={() => go('who')}>Who it’s for</button><button type="button" onClick={() => go('safety')}>Safety</button><button type="button" onClick={() => go('faq')}>FAQ</button></nav>
        <nav aria-label="Account"><b>Account</b><Link to="/login">Log in</Link><Link to={SIGNUP}>Create an account</Link></nav>
      </div>
      <div className="v2-wrap v2-foot-bot"><span>© {new Date().getFullYear()} iMenteo</span></div>
    </footer>
  );
}

export default function LandingV2() {
  return (
    <div className="v2" id="top">
      <Nav />
      <Hero />
      <Why />
      <div id="how" className="v2-how">
        <Reveal className="v2-head how-head"><span className="v2-kick">How it works</span><h2>Your first three weeks, step by step.</h2><p>Scroll to follow the journey.</p></Reveal>
        <WeeksSection offset={NAV_H} />
      </div>
      <Who />
      <AiSection />
      <Safety />
      <Faq />
      <Final />
      <Footer />
    </div>
  );
}
