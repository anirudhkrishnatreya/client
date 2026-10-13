import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import Icon from '../platform/ui/Icon';
import { CONTACT_EMAIL } from './config';
import logo from '../assets/landing/logo.png';
import burst from '../assets/landing/burst-red.svg';
import emojiBg from '../assets/landing/g-emoji-c.svg';
import ringWord from '../assets/landing/g-ring-10x.svg';
import waves from '../assets/landing/p-waves.svg';
import hero5 from '../assets/landing/hero-5.png';
import hero3 from '../assets/landing/hero-3.png';

const SIGNUP = V4_ENABLED ? '/v4/register' : '/register';
export const goSection = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

function useAccount() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? { to: PLATFORM_ENABLED ? '/platform' : '/dashboard', label: 'My dashboard', signedIn: true } : { to: '/login', label: 'Log in', signedIn: false };
}

/** Fades a block in once, the first time it scrolls into view. Shows at once if motion is reduced or unsupported. */
function Reveal({ className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return undefined; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`lpx-rv ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</div>;
}

const Tag = ({ children, shadow = true }) => <span className={`lpx-tag${shadow ? ' shadow' : ''}`}>{children}</span>;
/** A word circled by hand, as in the design. */
const Circled = ({ children }) => <i className="lpx-circ"><img src={ringWord} alt="" aria-hidden="true" />{children}</i>;
const Emoji = ({ children, size = 22 }) => <span className="lpx-emoji" aria-hidden="true"><img src={emojiBg} alt="" /><b style={{ fontSize: size }}>{children}</b></span>;
const Example = () => <span className="lpx-eg">Example</span>;

/* ── Why iMenteo ───────────────────────────────────────── */
const WHY = [
  ['🧭', 'Know yourself', 'A structured career assessment maps your interests, personality, abilities, emotional intelligence and values into a clear, readable report.'],
  ['🤝', 'Be guided by a person', 'Matched with a mentor on your goals and profile, with a person checking the fit. Weekly sessions keep the relationship steady, not one-off.'],
  ['📈', 'See real progress', 'Every session ends with action items. Students and parents can follow tasks, reports and mentor notes, so progress is visible, not guessed.']
];
const FACTS = [['5', 'dimensions in the career assessment'], ['3', 'tracks: Class 6–9, 10–12 and college'], ['Weekly', '1:1 sessions with clear action items'], ['+ Parent', 'view for every school student']];
export function Why() {
  return (
    <section id="about" className="lpx lpx-why" aria-label="Why iMenteo">
      <img src={burst} alt="" aria-hidden="true" className="lpx-burst" style={{ left: 'calc(50% - 360px)', top: 8 }} />
      <Reveal className="lpx-head"><Tag>WHY IMENTEO 💡</Tag><h2>Not just a list of mentors.<br />A <Circled>journey</Circled> with a plan.</h2><p>Most students get advice once and then lose the thread. iMenteo is built around what happens between sessions: the tasks, the check-ins and the follow-through.</p></Reveal>
      <div className="lpx-cards3">{WHY.map(([e, t, d], i) => <Reveal key={t} className="lpx-card" delay={i * 90}><Emoji size={24}>{e}</Emoji><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
      <Reveal className="lpx-facts">{FACTS.map(([n, t]) => <div key={n}><b>{n}</b><span>{t}</span></div>)}</Reveal>
    </section>
  );
}

/* ── The career assessment ─────────────────────────────── */
const DIMS = [['c0', 'Interests'], ['c1', 'Personality'], ['c2', 'Abilities'], ['c3', 'Emotional intelligence'], ['c4', 'Values (college)']];
const BARS = [['Interests', 72], ['Personality', 58], ['Abilities', 81], ['Emotional intelligence', 64]];
export function Assessment() {
  const acct = useAccount();
  return (
    <section id="assessment" className="lpx lpx-panel" aria-label="The career assessment">
      <div className="lpx-panel-in">
        <Reveal className="lpx-panel-copy">
          <Tag>THE CAREER ASSESSMENT 🎯</Tag>
          <h2 className="lpx-h">Find out what <Circled>fits</Circled> you.</h2>
          <p>Take the assessment at your own pace, over a few sittings. Your answers are saved as you go, and you get a readable report you can keep and talk through with your mentor and parents.</p>
          <div className="lpx-chips">{DIMS.map(([c, t]) => <span key={t} className={`lpx-chip ${c}`}>{t}</span>)}</div>
          <p className="lpx-small">Three tracks, so the questions fit your age: <b>Class 6–9</b>, <b>Class 10–12</b> and <b>College</b>.</p>
          <Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn">{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}<Icon name="chevronRight" size={18} /></Link>
        </Reveal>
        <Reveal className="lpx-report" delay={120} aria-label="An example report">
          <Example />
          <div className="lpx-report-top"><img src={hero5} alt="" /><div><b>Career Discovery Report</b><small>What your answers say about you</small></div></div>
          <ul className="lpx-bars">{BARS.map(([l, v]) => <li key={l}><span>{l}</span><div><i style={{ width: `${v}%` }} /></div></li>)}</ul>
          <div className="lpx-fields"><small>Top fields to explore</small><span>Computer Science</span><span>Engineering</span><span>Data &amp; Maths</span></div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── For everyone ──────────────────────────────────────── */
const ROLES = {
  students: { label: 'Students', icon: 'cap', title: 'Know what you are good at, and what to do next.', points: ['Take the career assessment at your own pace and keep your report.', 'Meet your mentor every week and leave with clear action items.', 'Track tasks and progress on your own dashboard.', 'Set a goal, even a rough one, and let it shape your weeks.'], cta: 'Start as a student', preview: 'student' },
  mentors: { label: 'Mentors', icon: 'users', title: 'Spend your time on the conversation, not the admin.', points: ['See your assigned students, their reports and their tasks in one place.', 'See each student’s tasks, reports and notes before you meet.', 'Record notes, set action items and choose what parents can see.', 'Spot who needs you most this week.'], cta: 'Mentor sign-in', to: '/login', preview: 'mentor' },
  parents: { label: 'Parents', icon: 'heart', title: 'Stay in the loop without having to ask.', points: ['Your own parent account, linked from the email your child gives at sign-up.', 'See tasks, mentor session notes and career reports.', 'Confirm consent for under-18s before they begin.', 'Follow more than one child with the same login.'], cta: 'Parent sign-in', to: '/login', preview: 'parent' },
  schools: { label: 'Schools', icon: 'layers', title: 'See how a class is doing, with privacy kept first.', points: ['Join with a class code, so students land in the right group.', 'Counsellors see who has started and finished, class by class.', 'Individual reports are shared only when the parent (or an adult student) agrees.', 'Class summaries appear only once enough students have finished, so no one can be singled out.'], cta: 'School sign-in', to: '/login', preview: 'school' }
};
function Preview({ kind }) {
  if (kind === 'student') return (
    <div className="lpx-pv"><Example /><div className="lpx-pv-h"><b>Your week</b><span className="lpx-pill">3 tasks open</span></div>
      <ul className="lpx-pv-list"><li><i className="done"><Icon name="check" size={12} stroke={3} /></i>Finish lecture 2 <em>Due tomorrow</em></li><li><i />Solve 20 vector questions <em>Sun</em></li><li><i />Write 5 lines on matrices <em>Mon</em></li></ul>
      <div className="lpx-pv-bar"><span style={{ width: '34%' }} /></div><small>Goal progress</small></div>
  );
  if (kind === 'mentor') return (
    <div className="lpx-pv"><Example /><div className="lpx-pv-h"><b>Your students</b><span className="lpx-pill coral">1 needs you</span></div>
      <ul className="lpx-pv-list"><li><span className="av a1">A</span>Student A<em className="ok">On track</em></li><li><span className="av a2">B</span>Student B<em className="warn">2 overdue</em></li><li><span className="av a3">C</span>Student C<em className="ok">Assessment done</em></li></ul></div>
  );
  if (kind === 'parent') return (
    <div className="lpx-pv"><Example /><div className="lpx-pv-h"><b>This week in short</b></div>
      <ul className="lpx-pv-list"><li><Icon name="check" size={16} />4 of 5 tasks finished</li><li><Icon name="calendar" size={16} />Next session on Thursday</li><li><Icon name="file" size={16} />Career report ready to read</li></ul></div>
  );
  return (
    <div className="lpx-pv"><Example /><div className="lpx-pv-h"><b>Class overview</b><span className="lpx-pill">Anonymous</span></div>
      <div className="lpx-pv-bars"><span style={{ height: '46%' }} /><span style={{ height: '70%' }} /><span style={{ height: '58%' }} /><span style={{ height: '88%' }} /><span style={{ height: '64%' }} /></div><small>Summaries show once at least 10 students have finished.</small></div>
  );
}
export function Who() {
  const [tab, setTab] = useState('students');
  const r = ROLES[tab];
  return (
    <section id="who" className="lpx" aria-label="Who it is for">
      <Reveal className="lpx-head"><Tag>FOR EVERYONE 🙌</Tag><h2>One platform, four people who matter to a student’s progress.</h2></Reveal>
      <div className="lpx-tabs" role="tablist" aria-label="Choose a role">
        {Object.entries(ROLES).map(([k, v]) => <button key={k} type="button" role="tab" id={`lpx-tab-${k}`} aria-selected={tab === k} aria-controls="lpx-who-panel" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon name={v.icon} size={18} />{v.label}</button>)}
      </div>
      <div className="lpx-rolepanel" id="lpx-who-panel" role="tabpanel" aria-labelledby={`lpx-tab-${tab}`} key={tab}>
        <div>
          <h3>{r.title}</h3>
          <ul className="lpx-points">{r.points.map(p => <li key={p}><span><Icon name="check" size={14} stroke={3} /></span>{p}</li>)}</ul>
          <Link to={r.to || SIGNUP} className="lpx-btn">{r.cta}<Icon name="chevronRight" size={18} /></Link>
        </div>
        <Preview kind={r.preview} />
      </div>
    </section>
  );
}

/* ── Mentors and AI ────────────────────────────────────── */
const RULES = [
  ['🔎', 'Grounded in real records', 'Insights come from tasks, session notes and check-ins that actually happened. Nothing is invented.'],
  ['⚖️', 'Facts and suggestions are kept apart', 'What was recorded is shown as fact. What the AI suggests is clearly marked as a suggestion.'],
  ['🧑‍🏫', 'A mentor stays in charge', 'AI-written summaries are reviewed by the mentor. It never decides anything about a student on its own.'],
  ['✏️', 'You can correct it', 'If a summary is wrong, it can be fixed, and private mentor notes stay private.']
];
export function AiSection() {
  return (
    <section id="ai" className="lpx lpx-panel blue" aria-label="Mentors and AI">
      <div className="lpx-panel-in">
        <Reveal className="lpx-panel-copy">
          <Tag>MENTORS + AI 🤖</Tag>
          <h2 className="lpx-h">AI helps.<br /><Circled>People</Circled> decide.</h2>
          <p>AI saves a mentor’s time on summaries and preparation, so sessions can be about the student. It is a helper, never a replacement for the person in the room.</p>
          <span className="lpx-note"><Icon name="info" size={15} />AI insights are being rolled out step by step</span>
        </Reveal>
        <div className="lpx-rules">{RULES.map(([e, t, d], i) => <Reveal key={t} className="lpx-rule" delay={i * 80}><Emoji>{e}</Emoji><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </div>
    </section>
  );
}

/* ── Safety ────────────────────────────────────────────── */
const SAFE = [
  ['👪', 'A parent for every school student', 'Up to Class 12, we ask for a parent’s email at sign-up. They set their own password and get their own account.'],
  ['🛡️', 'Consent for under-18s', 'A parent confirms before a student under 18 begins. Consent can be withdrawn, and deletion of the data can be requested.'],
  ['👁️', 'Schools see only what is shared', 'A school counsellor sees an individual report only if the parent agrees. The default is no.'],
  ['🔑', 'Access by role', 'Students, mentors, parents and schools each see only what they should. A mentor sees only their own students.']
];
export function Safety() {
  return (
    <section id="safety" className="lpx lpx-safe" aria-label="Safety and privacy">
      <Reveal className="lpx-head"><Tag>SAFE BY DESIGN 🛡️</Tag><h2>Built for students, so<br />safety comes first.</h2><p>We collect only what is needed to guide a student, we do not sell it, and we do not use it for advertising.</p></Reveal>
      <div className="lpx-cards4">{SAFE.map(([e, t, d], i) => <Reveal key={t} className="lpx-card sm" delay={i * 70}><Emoji>{e}</Emoji><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────── */
const FAQ = [
  ['What is iMenteo?', 'iMenteo is a mentoring platform for students. Each student takes a career assessment, is matched with a mentor, and meets them weekly. AI helps with summaries and progress, and a mentor reviews it.'],
  ['Who is it for?', 'Students from Class 6 to college. The assessment has three tracks: Class 6–9, Class 10–12 and college, so the questions fit the age.'],
  ['How long does the assessment take?', 'It takes a few sittings, depending on the track. You can pause and carry on later, and your answers are saved as you go.'],
  ['Why do you ask for a parent’s email?', 'Up to Class 12, a parent gets their own account so they can follow progress and reports. For under-18s, a parent’s consent is also needed before the student starts.'],
  ['Who sees my results?', 'You do. Your mentor and your parent can see your report and progress. Your school only sees an individual report if your parent agrees.'],
  ['Does AI replace the mentor?', 'No. A person guides every student. AI helps with summaries and preparation, and a mentor reviews what it writes.'],
  ['How much does it cost?', 'Pricing is still being finalised. Take the assessment first and see how it works.']
];
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="lpx lpx-faq" aria-label="Questions">
      <Reveal className="lpx-head"><Tag>QUESTIONS ❓</Tag><h2>Good questions, plain answers.</h2></Reveal>
      <div className="lpx-qs">{FAQ.map(([q, a], i) => (
        <div key={q} className={`lpx-q${open === i ? ' open' : ''}`}>
          <h3><button type="button" aria-expanded={open === i} aria-controls={`lpx-faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name="chevronDown" size={20} /></button></h3>
          <div id={`lpx-faq-${i}`} role="region" aria-label={q} className="lpx-a"><p>{a}</p></div>
        </div>))}</div>
    </section>
  );
}

/* ── Closing call to action and footer ─────────────────── */
export function FinalCta() {
  const acct = useAccount();
  return (
    <section className="lpx lpx-final" aria-label="Get started">
      <Reveal className="lpx-final-in">
        <img src={waves} alt="" aria-hidden="true" className="lpx-final-waves" />
        <img src={burst} alt="" aria-hidden="true" className="lpx-final-burst" />
        <img src={hero3} alt="" aria-hidden="true" className="lpx-final-photo" />
        <h2>Start with the<br />career assessment.</h2>
        <p>Find out what fits you, then meet the mentor who can help you get there.</p>
        <div className="lpx-ctas"><Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn white">{acct.signedIn ? 'Open my dashboard' : 'Get started'}<Icon name="chevronRight" size={18} /></Link>{!acct.signedIn && <Link to="/login" className="lpx-btn outline">I already have an account</Link>}</div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="footer" className="lpx-foot">
      <div className="lpx-foot-in">
        <div><img src={logo} alt="iMenteo" className="lpx-foot-logo" /><p>Human mentors, AI-assisted, for students who want to turn goals into progress.</p></div>
        <nav aria-label="Explore"><b>Explore</b><button type="button" onClick={() => goSection('how-it-works')}>How it works</button><button type="button" onClick={() => goSection('assessment')}>Career assessment</button><button type="button" onClick={() => goSection('who')}>Who it’s for</button><button type="button" onClick={() => goSection('safety')}>Safety</button><button type="button" onClick={() => goSection('faq')}>FAQ</button></nav>
        <nav aria-label="Account"><b>Account</b><Link to="/login">Log in</Link><Link to={SIGNUP}>Create an account</Link></nav>
        {CONTACT_EMAIL && <nav aria-label="Contact"><b>Contact</b><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></nav>}
      </div>
      <div className="lpx-foot-bot"><span>© {new Date().getFullYear()} iMenteo</span></div>
    </footer>
  );
}
