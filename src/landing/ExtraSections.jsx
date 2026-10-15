import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import Icon from '../platform/ui/Icon';
import { CONTACT_EMAIL, TAGS } from './config';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero4 from '../assets/landing/hero-4-shape.png';
import PHOTO from './photos';
import Shaped from './Shaped';
import logo from '../assets/landing/logo.png';
import burst from '../assets/landing/burst-red.svg';
import emojiBg from '../assets/landing/g-emoji-c.svg';
import ringWord from '../assets/landing/g-ring-10x.svg';
import waves from '../assets/landing/p-waves.svg';

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

const Tag = ({ children, icon, shadow = true }) => <span className={`lpx-tag${shadow ? ' shadow' : ''}`}>{icon && <Icon name={icon} size={16} stroke={2.2} />}{children}</span>;
/** A word circled by hand, as in the design. */
const Circled = ({ children }) => <i className="lpx-circ"><img src={ringWord} alt="" aria-hidden="true" />{children}</i>;
const TONES = ['#0f3ee4', '#d9654a', '#c98a14', '#3f8a64'];
const Emoji = ({ children, tone = 0 }) => <span className="lpx-emoji" aria-hidden="true"><img src={emojiBg} alt="" /><b style={{ color: TONES[tone % 4] }}><Icon name={children} size={22} stroke={2} /></b></span>;
const Example = () => <span className="lpx-eg">Example</span>;

/* ── Why iMenteo ───────────────────────────────────────── */
const WHY = [
  ['target', 'It starts where you are', 'A short assessment finds your level, your interests and your strengths. Nobody begins somewhere too easy or too hard.'],
  ['trend', 'It grows with you', 'Your path rises from the basics to advanced work as you improve. It speeds up when you are ready and slows down when you need time.'],
  ['users', 'It handles the rest', 'It picks what to study, gives you the resources, clears your doubts and keeps you on track. Real mentors and parents stay in the loop.']
];
const FACTS = [['Day 1', 'to your dream, charted'], ['480+', 'careers you can aim for'], ['5', 'things the assessment looks at'], ['Parent', 'view for every school student']];
export function Why() {
  return (
    <section id="about" className="lpx lpx-why" aria-label="Why iMenteo">
      <img src={burst} alt="" aria-hidden="true" className="lpx-burst" style={{ left: 'calc(50% - 360px)', top: 8 }} />
      <Reveal className="lpx-head"><Tag icon="bulb">WHY IMENTEO</Tag><h2>Not another app.<br />An <Circled>orbit</Circled> built just for you.</h2><p>Most students jump between videos, tuition and advice with no plan stitching it together. iMenteo is the one place that carries a student from their first step to their hardest challenge: one orbit, charted to them, not to a syllabus.</p></Reveal>
      <div className="lpx-cards3">{WHY.map(([e, t, d], i) => <Reveal key={t} className="lpx-card" delay={i * 90}><Emoji tone={i}>{e}</Emoji><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
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
          <Tag icon="target">THE CAREER ASSESSMENT</Tag>
          <h2 className="lpx-h">Find out what <Circled>fits</Circled> you.</h2>
          <p>Take it at your own pace, over a few sittings. It shows where you stand today and what suits you, and it becomes the starting point of your learning path.</p>
          <div className="lpx-chips">{DIMS.map(([c, t]) => <span key={t} className={`lpx-chip ${c}`}>{t}</span>)}</div>
          <p className="lpx-small">Three tracks, so the questions fit your age: <b>Class 6 to 9</b>, <b>Class 10 to 12</b> and <b>College</b>.</p>
          <Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn">{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}<Icon name="chevronRight" size={18} /></Link>
        </Reveal>
        <Reveal className="lpx-report" delay={120} aria-label="An example report">
          <Example />
          <div className="lpx-report-top"><span className="lpx-report-ico"><Icon name="file" size={26} stroke={1.8} /></span><div><b>Career Discovery Report</b><small>What your answers say about you</small></div></div>
          <ul className="lpx-bars">{BARS.map(([l, v]) => <li key={l}><span>{l}</span><div><i style={{ width: `${v}%` }} /></div></li>)}</ul>
          <div className="lpx-fields"><small>Top fields to explore</small><span>Computer Science</span><span>Engineering</span><span>Data &amp; Maths</span></div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── For everyone ──────────────────────────────────────── */
const ROLES = {
  students: { label: 'Students', icon: 'cap', title: 'Learn what you need, at your own pace.', points: ['Start from where you are, whatever your level.', 'Get resources picked for you, and a path that grows as you do.', 'Ask your doubts any time and get clear answers.', 'Aim at one dream and see how far you have come.'], cta: 'Start as a student', preview: 'student' },
  mentors: { label: 'Mentors', icon: 'users', title: 'Spend your time on the conversation, not the admin.', points: ['See your students, their reports and their tasks in one place.', 'Get AI-written summaries before you meet, and fix anything before it is shared.', 'Record notes, set action items and choose what parents can see.', 'Spot who needs you most this week.'], cta: 'Mentor sign-in', to: '/login', preview: 'mentor' },
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
      <Reveal className="lpx-head"><Tag icon="users">FOR EVERYONE</Tag><h2>Made for students, and for the people who care about them.</h2></Reveal>
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
  ['search', 'Grounded in real records', 'Insights come from tasks, session notes and check-ins that actually happened. Nothing is invented.'],
  ['layers', 'Facts and suggestions are kept apart', 'What happened is shown as fact. What the AI suggests is clearly marked as a suggestion.'],
  ['user', 'A mentor stays in charge', 'A mentor reviews what the AI writes. It never makes a big decision about a student on its own.'],
  ['edit', 'You can correct it', 'If a summary is wrong, it can be fixed, and private mentor notes stay private.']
];
export function AiSection() {
  return (
    <section id="ai" className="lpx lpx-panel blue" aria-label="Mentors and AI">
      <div className="lpx-panel-in">
        <Reveal className="lpx-panel-copy">
          <Tag icon="sparkles">AGENTIC AI</Tag>
          <h2 className="lpx-h">The platform does the legwork.<br /><Circled>People</Circled> make the calls.</h2>
          <p>Agentic AI plans your learning, finds the right material, answers doubts and follows up, at any hour. Real mentors and parents step in for the big decisions.</p>
          <span className="lpx-note"><Icon name="info" size={15} />AI insights are being rolled out step by step</span>
        </Reveal>
        <div className="lpx-rules">{RULES.map(([e, t, d], i) => <Reveal key={t} className="lpx-rule" delay={i * 80}><Emoji tone={i}>{e}</Emoji><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </div>
    </section>
  );
}

/* ── Safety ────────────────────────────────────────────── */
const SAFE = [
  ['users', 'A parent for every school student', 'Up to Class 12, we ask for a parent’s email at sign-up. They set their own password and get their own account.'],
  ['shield', 'Consent for under-18s', 'A parent confirms before a student under 18 begins. Consent can be withdrawn, and deletion of the data can be requested.'],
  ['eye', 'Schools see only what is shared', 'A school counsellor sees an individual report only if the parent agrees. The default is no.'],
  ['lock', 'Access by role', 'Students, mentors, parents and schools each see only what they should. A mentor sees only their own students.']
];
export function Safety() {
  return (
    <section id="safety" className="lpx lpx-safe" aria-label="Safety and privacy">
      <Reveal className="lpx-head"><Tag icon="shield">SAFE BY DESIGN</Tag><h2>Built for students, so<br />safety comes first.</h2><p>We collect only what is needed to guide a student, we do not sell it, and we do not use it for advertising.</p></Reveal>
      <div className="lpx-cards4">{SAFE.map(([e, t, d], i) => <Reveal key={t} className="lpx-card sm" delay={i * 70}><Emoji tone={i}>{e}</Emoji><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────── */
const FAQ = [
  ['What is iMenteo?', 'iMenteo charts the orbit from where you are to where you want to be. It finds your starting point, builds the course up, hands you what to study, answers your doubts, and tracks every step on the way.'],
  ['Does it really handle everything?', 'Your assessment, report, goal, tasks and starting library are there today. Learning paths, doubt answering and adaptive practice are rolling out in stages, so you may see parts of it before others.'],
  ['Who is it for?', 'Students from Class 6 to college. The assessment has three tracks: Class 6 to 9, Class 10 to 12 and college, so the questions fit the age.'],
  ['How long does the assessment take?', 'It takes a few sittings, depending on the track. You can pause and carry on later, and your answers are saved as you go.'],
  ['Why do you ask for a parent’s email?', 'Up to Class 12, a parent gets their own account so they can follow progress and reports. For under-18s, a parent’s consent is also needed before the student starts.'],
  ['Who sees my results?', 'You do. Your mentor and your parent can see your report and progress. Your school only sees an individual report if your parent agrees.'],
  ['Will AI replace teachers and mentors?', 'No. The platform handles the daily work of planning, practice and doubts. People guide the big decisions and review what the AI writes.'],
  ['How much does it cost?', 'Pricing is still being finalised. Take the assessment first and see how it works.']
];
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="lpx lpx-faq" aria-label="Questions">
      <Reveal className="lpx-head"><Tag icon="info">QUESTIONS</Tag><h2>Good questions, plain answers.</h2></Reveal>
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
        <img src={PHOTO.p5905709} alt="" aria-hidden="true" className="lpx-final-photo" />
        <h2>Start with the<br />career assessment.</h2>
        <p>Find your level and your fit. The platform builds your path from there.</p>
        <div className="lpx-ctas"><Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn white">{acct.signedIn ? 'Open my dashboard' : 'Get started'}<Icon name="chevronRight" size={18} /></Link>{!acct.signedIn && <Link to="/login" className="lpx-btn outline">I already have an account</Link>}</div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  const to = id => () => goSection(id);
  return (
    <footer id="footer" className="lpx-foot">
      <div className="lpx-foot-hero">
        <div className="lpx-foot-copy">
          <Tag icon="sparkles">YOUR ORBIT</Tag>
          <h2>One orbit.<br />Zero to<br /><i>dream</i>.</h2>
          <p>An assessment to find your level, a learning path built for your pace, and a platform that keeps you on track toward your dream. That is iMenteo.</p>
        </div>
        <div className="lpx-foot-art" aria-hidden="true">
          <Shaped photo={PHOTO.p16461275} mask={hero4} className="a" /><div className="b"><img src={PHOTO.p4126695} alt="" /></div><Shaped photo={PHOTO.p8199167} mask={hero2} className="c" position="center 30%" /><img src={PHOTO.p7972949} alt="" className="d" />
        </div>
      </div>

      <div className="lpx-foot-tags" aria-hidden="true">{TAGS.map((t, i) => <span key={t} className={`lp-chip m c${i % 4}`}>{t}</span>)}</div>

      <div className="lpx-foot-grid">
        <div className="lpx-foot-brand">
          <img src={logo} alt="iMenteo" className="lpx-foot-logo" />
          <p>An orbit charted fresh for every student, from the first step to the hardest one, at their own pace.</p>
          <ul className="lpx-trust"><li><Icon name="sparkles" size={15} />AI-powered</li><li><Icon name="users" size={15} />Real mentors</li><li><Icon name="cap" size={15} />Class 6 to college</li><li><Icon name="shield" size={15} />Privacy first</li></ul>
        </div>
        <nav aria-label="Explore"><b>Explore</b><button type="button" onClick={to('about')}>Why iMenteo</button><button type="button" onClick={to('how-it-works')}>How it works</button><button type="button" onClick={to('assessment')}>Career assessment</button><button type="button" onClick={to('safety')}>Safety</button><button type="button" onClick={to('faq')}>FAQ</button></nav>
        <nav aria-label="For you"><b>For you</b><button type="button" onClick={to('who')}>Students</button><button type="button" onClick={to('who')}>Mentors</button><button type="button" onClick={to('who')}>Parents</button><button type="button" onClick={to('who')}>Schools</button></nav>
        <nav aria-label="Account"><b>Account</b><Link to="/login">Log in</Link><Link to={SIGNUP}>Create an account</Link>
          {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <button type="button" onClick={to('faq')}>Questions? Read the FAQ</button>}</nav>
      </div>

      <div className="lpx-foot-bot">
        <span>© {new Date().getFullYear()} iMenteo. All rights reserved.</span>
        <span className="lpx-foot-note"><Icon name="lock" size={14} />We do not sell student data or use it for advertising.</span>
        <button type="button" className="lpx-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top<Icon name="chevronDown" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
      </div>
    </footer>
  );
}
