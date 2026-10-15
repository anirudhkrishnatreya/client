// "Career X-Ray": the science page. Same aesthetic as the landing page (same fonts, colours and building blocks), reached
// from the main nav and the footer. The charts on this page are the real ones used in a student's own report (server/engine
// v4/report/charts.js has the matching geometry), filled with made-up sample numbers — never a real student's data.
// Every figure in the text is real, pulled from the live assessment and engine, not invented for marketing. Where something
// is still being reviewed (India entry guidance, provisional norms), this page says so.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';
import Icon from '../platform/ui/Icon';
import { Hexagon, BarChart, Compass, PartsBars, ScaleTrack, BandPill } from '../v4/charts';
import { Reveal, Tag, Circled, Emoji, Example } from './ExtraSections';
import { TAGS } from './config';
import PHOTO from './photos';
import logo from '../assets/landing/logo.png';
import './landing.css';
import '../v4/report.css';
import '@fontsource/syne/700.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/newsreader/400.css';

const SIGNUP = V4_ENABLED ? '/v4/register' : '/register';
const goSection = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

function useAccount() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? { to: PLATFORM_ENABLED ? '/platform' : '/dashboard', label: 'My dashboard', signedIn: true } : { to: '/login', label: 'Log in', signedIn: false };
}

// Sample numbers for the charts below. Made up to show the shape of a real report — not a real student's results.
const SAMPLE_TYPES = [['R', 'Realistic', 4], ['I', 'Investigative', 8], ['A', 'Artistic', 6], ['S', 'Social', 5], ['E', 'Enterprising', 3], ['C', 'Conventional', 5]].map(([letter, label, stanine]) => ({ letter, label, stanine }));
const SAMPLE_BARS = [['d1', 'Interests', 8], ['d2', 'Personality', 6], ['d3', 'Abilities', 7], ['d4', 'Emotional intelligence', 5]].map(([id, label, stanine]) => ({ id, label, stanine }));
const SAMPLE_PARTS = [['interest', 'Interests', 'strong', 'Strong'], ['values', 'Values', 'good', 'Good'], ['orientation', 'Work style', 'strong', 'Strong'], ['aptitude', 'Readiness', 'good', 'Good']].map(([key, label, band, bandLabel]) => ({ key, label, band, bandLabel }));

const QUICK = [['preview', 'See a report'], ['dimensions', 'The five dimensions'], ['framework', 'The research'], ['engine', 'The matching engine'], ['checks', 'Checks and balances'], ['faq', 'Questions']];

function Header() {
  const acct = useAccount();
  return (
    <header className="lp-bar show xr-bar">
      <div className="lp-bar-in">
        <Link to="/" className="lp-bar-logo" aria-label="iMenteo home"><img src={logo} alt="iMenteo" /></Link>
        <nav className="lp-bar-links" aria-label="Sections">
          {QUICK.map(([id, label]) => <button key={id} type="button" onClick={() => goSection(id)}>{label}</button>)}
        </nav>
        <span className="lp-bar-cta">
          <Link to={acct.to} className="lp-bar-ghost">{acct.signedIn ? acct.label : 'Log in'}</Link>
          {!acct.signedIn && <Link to={SIGNUP} className="lp-bar-solid">Get started</Link>}
        </span>
      </div>
    </header>
  );
}

const FACTS = [['5', 'dimensions behind every report'], ['332', 'questions, for a college-track student'], ['483', 'careers mapped, 16 broad fields'], ['35–40', 'pages in a Class 10+ report']];
const TRUST = [PHOTO.p6684552, PHOTO.p30858451, PHOTO.p10638081];

/** A tilted preview card for the hero: the real interest-hexagon chart, filled with made-up sample numbers. */
function HeroPreview() {
  return (
    <div className="lpx-xr-peek" aria-hidden="true">
      <Example />
      <div className="lpx-report-top"><span className="lpx-report-ico"><Icon name="target" size={24} stroke={1.8} /></span><div><b>Your interest shape</b><small>One chart from your own report</small></div></div>
      <Hexagon types={SAMPLE_TYPES} />
      <div style={{ display: 'flex', justifyContent: 'center' }}><BandPill band="strong" label="Strong fit: Investigative" /></div>
    </div>
  );
}

function Hero() {
  const acct = useAccount();
  return (
    <section className="lpx-xr-herowrap" aria-label="Career X-Ray">
      <div className="lpx-mc-hero lpx-xr-hero">
        <div>
          <Tag icon="sparkles">CAREER X-RAY</Tag>
          <h1>Your Career<br /><i>X-Ray</i>.</h1>
          <p>A clear, visual look inside your report: the graphs it draws, the research behind them, and exactly what they tell you about where you could go. Built first for students in India, with entrance exams, degree names and real costs in mind.</p>
          <div className="lpx-ctas">
            <Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn white">{acct.signedIn ? 'Open my dashboard' : 'Take the assessment'}<Icon name="chevronRight" size={18} /></Link>
            <button type="button" className="lpx-btn outline" onClick={() => goSection('preview')}>See a real chart</button>
          </div>
          <div className="lpx-xr-trust">
            <span className="lpx-xr-trust-photos">{TRUST.map((src, i) => <img key={i} src={src} alt="" />)}</span>
            <span>Built for Class 6 to college, across India</span>
          </div>
        </div>
        <HeroPreview />
      </div>
      <Reveal className="lpx-facts lpx-mc-facts">{FACTS.map(([n, t]) => <div key={n}><b>{n}</b><span>{t}</span></div>)}</Reveal>
      <div className="lpx-mc-quick" aria-hidden="true">{QUICK.map(([id, label]) => <button key={id} type="button" onClick={() => goSection(id)}>{label}</button>)}</div>
    </section>
  );
}

/* ── See a report ──────────────────────────────────────── */
function Preview() {
  const acct = useAccount();
  return (
    <div className="xr-band xr-band-cream"><section id="preview" className="lpx" aria-label="What your report looks like">
      <Reveal className="lpx-head"><Tag icon="file">SEE A REPORT</Tag><h2>What your report<br />actually looks <Circled>like</Circled>.</h2><p>These are the real charts your report uses, drawn here with made-up sample numbers so you can see the shape of the thing before you take it.</p></Reveal>
      <div className="lpx-xr-spread">
        <Reveal className="lpx-xr-page">
          <div className="lpx-report-top"><span className="lpx-report-ico"><Icon name="target" size={24} stroke={1.8} /></span><div><b>Your interest code</b><small>The Holland hexagon, six themes at once</small></div></div>
          <Hexagon types={SAMPLE_TYPES} />
          <ul className="lpx-bars">{SAMPLE_BARS.slice(0, 2).map(r => <li key={r.id}><span>{r.label}</span><ScaleTrack stanine={r.stanine} label={r.label} width={160} /></li>)}</ul>
        </Reveal>
        <Reveal className="lpx-xr-page" delay={90}>
          <div className="lpx-report-top"><span className="lpx-report-ico"><Icon name="chart" size={24} stroke={1.8} /></span><div><b>Your five dimensions</b><small>Every scale on a 1-to-9 track, never a percentage</small></div></div>
          <BarChart rows={SAMPLE_BARS} color="#F2A93B" width={420} />
        </Reveal>
        <Reveal className="lpx-xr-page" delay={160}>
          <div className="lpx-report-top"><span className="lpx-report-ico"><Icon name="trend" size={24} stroke={1.8} /></span><div><b>Where your energy points</b><small>People or data, ideas or things</small></div></div>
          <Compass x={-0.4} y={-0.5} />
        </Reveal>
        <Reveal className="lpx-xr-page" delay={230}>
          <div className="lpx-report-top"><span className="lpx-report-ico"><Icon name="layers" size={24} stroke={1.8} /></span><div><b>Why a career was suggested</b><small>How a single match adds up</small></div></div>
          <PartsBars parts={SAMPLE_PARTS} width={230} />
          <div style={{ marginTop: 10 }}><BandPill band="strong" label="Strong fit" /></div>
        </Reveal>
      </div>
      <Reveal className="lpx-xr-photo-row" delay={100}>
        <img src={PHOTO.p8055086} alt="A student going through their report with family at home" />
        <div><h3>Read it, download it, or get it by email</h3><p>Every student gets the full report on screen the moment they finish. It is also a PDF you can download or have emailed to you — to keep, print, or show a parent, a counsellor, or a mentor.</p>
          <Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn">{acct.signedIn ? 'Open my dashboard' : 'Take the career assessment'}<Icon name="chevronRight" size={18} /></Link>
        </div>
      </Reveal>
    </section></div>
  );
}

/* ── Five dimensions ───────────────────────────────────── */
const DIMENSIONS = [
  ['target', 'Interests', 'What kind of work actually holds your attention, mapped onto the Holland hexagon: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.'],
  ['users', 'Personality', 'The working style you bring to a room: how you plan, how you connect, how you handle pressure and change.'],
  ['bolt', 'Abilities', 'Where your reasoning is naturally strongest, read as a starting point to build from, never as a ceiling.'],
  ['heart', 'Emotional intelligence', 'How you read a room and manage yourself in it, which matters as much as technical skill in most careers.'],
  ['star', 'Values', 'What you need from a job to feel it was worth it: achievement, independence, recognition, relationships, support, conditions. Unlocks at college, when that trade-off starts to matter.']
];
function Dimensions() {
  return (
    <div className="xr-band xr-band-pink"><section id="dimensions" className="lpx" aria-label="The five dimensions">
      <Reveal className="lpx-head"><Tag icon="target">THE INSTRUMENT</Tag><h2>Five dimensions.<br />One honest <Circled>picture</Circled>.</h2><p>Most career quizzes ask what you like and stop there. iMenteo reads five, because none of them alone explains a person.</p></Reveal>
      <div className="lpx-cards5">{DIMENSIONS.map(([e, t, d], i) => <Reveal key={t} className="lpx-card sm" delay={i * 70}><Emoji tone={i}>{e}</Emoji><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
    </section></div>
  );
}

/* ── The research ──────────────────────────────────────── */
const FRAMEWORK = [
  ['target', 'Holland’s RIASEC framework', 'The six-letter language of career interests, in use since the 1970s and still the standard starting point for interest-based career theory.'],
  ['layers', 'The Brown & Gore C-index', 'A published method for comparing two interest codes by how closely their strongest themes agree, and in what order, not just whether they overlap.'],
  ['search', 'O*NET, the U.S. Department of Labor’s occupation database', 'A public, continually updated database covering the real demands and rewards of hundreds of occupations — our starting point for every career we map, adapted for India: entrance exams like JEE and NEET, Indian degree names, and cost bands you can actually plan around.'],
  ['shield', 'Work-values theory', 'What people consistently say they need from a job — achievement, relationships, independence and the rest — compared using the same statistical approach researchers use to compare profiles.']
];
function Framework() {
  return (
    <section id="framework" className="lpx lpx-panel" aria-label="The research behind it">
      <div className="lpx-panel-in">
        <Reveal className="lpx-panel-copy">
          <Tag icon="layers">BUILT ON REAL RESEARCH</Tag>
          <h2 className="lpx-h">We didn’t invent<br />the <Circled>science</Circled>.</h2>
          <p>We built an engine on top of frameworks career researchers have trusted for decades, then wrote plain-English rules for how they get used: suggest, never decide, and never show a number dressed up as certainty.</p>
        </Reveal>
        <div className="lpx-rules">{FRAMEWORK.map(([e, t, d], i) => <Reveal key={t} className="lpx-rule" delay={i * 80}><Emoji tone={i}>{e}</Emoji><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </div>
    </section>
  );
}

/* ── The matching engine ──────────────────────────────── */
const ENGINE = [
  ['layers', '483 careers, 16 broad fields', 'Built from O*NET and adapted for India: degrees, entrance exams and typical costs attached to each one, with a clear notice wherever that guidance is still being reviewed.'],
  ['target', 'A band and a reason, never a score', 'Every suggestion comes with a plain-English reason, built from what actually drove the match. We ban phrases like “you should become” or “not suitable” from the wording itself.'],
  ['trend', 'Readiness, not a gate', 'Where your abilities do not fully line up yet, the report says so as “building” or “a stretch”, with the specific skills to build — never as a reason to rule a career out.'],
  ['search', 'Check any of the 483, not just the top picks', 'Browse the full catalogue, search by name, filter by field, and save up to ten careers to a shortlist with your own notes.']
];
function Engine() {
  return (
    <section id="engine" className="lpx lpx-panel blue" aria-label="The matching engine">
      <div className="lpx-panel-in">
        <Reveal className="lpx-panel-copy">
          <Tag icon="sparkles">THE MATCHING ENGINE</Tag>
          <h2 className="lpx-h">Suggestions, never<br /><Circled>verdicts</Circled>.</h2>
          <p>The engine behind your orbit scores how closely your interests, values and working style line up with hundreds of real careers, then explains itself in words you would use with a friend.</p>
        </Reveal>
        <div className="lpx-rules">{ENGINE.map(([e, t, d], i) => <Reveal key={t} className="lpx-rule" delay={i * 80}><Emoji tone={i}>{e}</Emoji><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </div>
    </section>
  );
}

/* ── Checks and balances ──────────────────────────────── */
const CHECKS = [
  ['shield', 'Careless answers are caught', 'A few items check for patterns like answering everything the same way. An attempt flagged this way is never scored into a false match.'],
  ['info', 'Provisional norms are disclosed', 'Where we are still collecting the data needed to compare you accurately with others your age, your report says so, in the report itself.'],
  ['eye', 'A flat answer sheet cannot fake a strong fit', 'Built-in floors mean an undifferentiated profile is capped at “Good fit” at most — the system will not manufacture false confidence.'],
  ['lock', 'India guidance is reviewed in stages', 'Entry routes, exams and costs move from draft to reviewed over time. A career page always says which stage its guidance is at.']
];
function Checks() {
  return (
    <div className="xr-band xr-band-grey"><section id="checks" className="lpx lpx-safe" aria-label="Checks and balances">
      <Reveal className="lpx-head"><Tag icon="shield">CHECKS AND BALANCES</Tag><h2>Built to be honest,<br />even when that is less flattering.</h2><p>A system that only ever tells a student good news is not useful. These are the guardrails that keep ours from doing that.</p></Reveal>
      <div className="lpx-cards4">{CHECKS.map(([e, t, d], i) => <Reveal key={t} className="lpx-card sm" delay={i * 70}><Emoji tone={i}>{e}</Emoji><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
    </section></div>
  );
}

/* ── FAQ ───────────────────────────────────────────────── */
const FAQ = [
  ['Is this a real psychometric assessment?', 'It is built on established frameworks from career and organisational psychology — Holland’s RIASEC model, published interest-comparison methods and work-values research — scored by a consistent, auditable engine rather than a human’s best guess.'],
  ['What is a Holland Code?', 'A three-letter summary of your strongest interest themes, such as IRA for Investigative, Realistic and Artistic. It is the oldest and most widely used shorthand in career guidance, and your report shows yours in plain language.'],
  ['Why don’t you show percentages for careers?', 'A percentage implies more precision than any assessment like this can honestly claim. We show a band — Strong fit, Good fit or Worth exploring — and the specific reasons behind it instead.'],
  ['How many careers do you cover?', '483 at the moment: 480 drawn from O*NET and adapted for India, plus 3 India-specific additions not in the international database. They sit across 16 broad fields.'],
  ['Is the India-specific guidance reviewed?', 'It is being reviewed in stages. Until a career’s entry guidance is confirmed, its page says so plainly, and we ask you to check exams and eligibility on the official sites before deciding.'],
  ['Does the assessment ever say I am not good enough for something?', 'No. Where your abilities do not fully match a career yet, the report calls it “building” or “a stretch” and lists what to work on — the wording that would rule you out is explicitly banned from how we write results.']
];
function XrFaq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="lpx lpx-faq" aria-label="Questions about the science">
      <Reveal className="lpx-head"><Tag icon="info">QUESTIONS</Tag><h2>The science, in plain answers.</h2></Reveal>
      <div className="lpx-qs">{FAQ.map(([q, a], i) => (
        <div key={q} className={`lpx-q${open === i ? ' open' : ''}`}>
          <h3><button type="button" aria-expanded={open === i} aria-controls={`xr-faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name="chevronDown" size={20} /></button></h3>
          <div id={`xr-faq-${i}`} role="region" aria-label={q} className="lpx-a"><p>{a}</p></div>
        </div>))}</div>
    </section>
  );
}

function ClosingCta() {
  const acct = useAccount();
  return (
    <section id="start" className="lpx lpx-final" aria-label="Get started">
      <Reveal className="lpx-final-in">
        <h2>Your Career X-Ray is<br />one assessment away.</h2>
        <p>The assessment takes a few sittings, at your pace. Everything on this page is what you get at the end of it.</p>
        <div className="lpx-ctas"><Link to={acct.signedIn ? acct.to : SIGNUP} className="lpx-btn white">{acct.signedIn ? 'Open my dashboard' : 'Take the assessment'}<Icon name="chevronRight" size={18} /></Link><Link to="/" className="lpx-btn outline">Back to iMenteo</Link></div>
      </Reveal>
    </section>
  );
}

function XrFooter() {
  return (
    <footer className="lpx-foot" style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 44 }}>
        <div className="lpx-mc-foot-nav" aria-hidden="true">{QUICK.map(([id, label]) => <button key={id} type="button" onClick={() => goSection(id)}>{label}</button>)}</div>
        <div className="lpx-foot-tags" aria-hidden="true">{TAGS.map((t, i) => <span key={t} className={`lp-chip m c${i % 4}`}>{t}</span>)}</div>
        <div className="lpx-foot-bot" style={{ marginTop: 40 }}>
          <span>© {new Date().getFullYear()} iMenteo. All rights reserved.</span>
          <span className="lpx-foot-note"><Icon name="lock" size={14} />Nothing here is invented for marketing — every number is pulled from the live system.</span>
          <Link to="/" className="lpx-top">Back to iMenteo<Icon name="chevronRight" size={16} /></Link>
        </div>
      </div>
    </footer>
  );
}

export default function CareerXray() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'iMenteo | The Career X-Ray — see inside your report';
    return () => { document.title = prev; };
  }, []);
  return (
    <div className="lp xr-page" id="top">
      <Header />
      <Hero />
      <Preview />
      <Dimensions />
      <Framework />
      <Engine />
      <Checks />
      <XrFaq />
      <ClosingCta />
      <XrFooter />
    </div>
  );
}
