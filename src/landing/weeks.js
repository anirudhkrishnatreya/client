// What each week of the journey says, and what orbits with it. Week 1 is the Figma design; weeks 2 and 3 are drafted
// from what the platform really does (mentor matching, weekly plan, check-ins, progress reports) and are easy to edit here.
import card1 from '../assets/landing/card-1.png';
import card2 from '../assets/landing/card-2.png';
import blob1 from '../assets/landing/blob-1.png';
import hero1 from '../assets/landing/hero-1.png';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero3 from '../assets/landing/hero-3.png';
import hero4 from '../assets/landing/hero-4-shape.png';
import hero5 from '../assets/landing/hero-5.png';
import hero6 from '../assets/landing/hero-6-photo.png';
import hero7 from '../assets/landing/hero-7.png';
import iconSurvey from '../assets/landing/icon-survey.svg';
import iconGauge from '../assets/landing/icon-gauge.svg';
import iconReport from '../assets/landing/icon-report.svg';

/** Degrees the orbit turns between one week and the next. */
export const DELTA = 70;

// Simple outline icons for weeks 2 and 3, drawn to sit beside the week 1 icons (dark grey, thin line).
const draw = d => ({ d });
export const LINE_ICONS = {
  match: draw('M16 14a4 4 0 100-8 4 4 0 000 8zM6 28v-2a6 6 0 016-6h8a6 6 0 016 6v2M28 12a3.5 3.5 0 010 7M32 26v-1.5a5 5 0 00-3.5-4.8'),
  session: draw('M7 9h24a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V11a2 2 0 012-2zM5 15h28M12 6v5M26 6v5M14 23l3.5 3.5L25 19'),
  plan: draw('M6 8l8-3 10 3 8-3v25l-8 3-10-3-8 3V8zM14 5v25M24 8v25'),
  week: draw('M7 8h24a2 2 0 012 2v18a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2zM5 14h28M12 5v5M26 5v5M11 20h4M17 20h4M23 20h4M11 25h4M17 25h4'),
  check: draw('M12 5h14a2 2 0 012 2v24a2 2 0 01-2 2H12a2 2 0 01-2-2V7a2 2 0 012-2zM15 5v3h8V5M14 17l3 3 6-7M14 26h10'),
  growth: draw('M5 30h28M9 24l7-7 5 5 10-12M25 10h6v6')
};

export const WEEKS = [
  { n: 1, title: 'AI-Powered Career Fit', items: [
    { img: iconSurvey, title: 'Survey & Profile.', text: 'Tell us about you: background, strengths, goals.' },
    { img: iconGauge, title: 'Instant Assessment', text: 'Our AI model analyzes your profile against all career personas.' },
    { img: iconReport, title: 'Your Career Fit Report', text: 'Get your custom top-2 recommended paths, key strengths, and a high-level skills roadmap.' }
  ],
  emojis: ['😃', '🥰', '😻', '🤖', '💪', '🚀', '🥳'],
  art: { cardA: card1, captionA: 'Tell us about you: background, strengths, goals.', cardB: card2, captionB: 'Tell us about you: background, strengths, goals.', blob: blob1, blobSize: [174, 174], round: hero6 } },
  { n: 2, title: 'Meet Your Mentor', items: [
    { icon: 'match', title: 'Mentor Match.', text: 'We pair you with a mentor who fits your goals and the way you learn.' },
    { icon: 'session', title: 'Your First Session', text: 'Talk through your report together and set clear goals for the weeks ahead.' },
    { icon: 'plan', title: 'Your Action Plan', text: 'Leave with a simple, week-by-week plan you can start on right away.' }
  ],
  emojis: ['🤝', '🎯', '💬', '🙌', '⭐', '📅', '🧭'],
  art: { cardA: hero3, captionA: 'Matched with a mentor who gets your goals.', cardB: hero1, captionB: 'Your first session, booked and ready.', blob: hero4, blobSize: [190, 141], round: hero7 } },
  { n: 3, title: 'Learn, Track & Grow', items: [
    { icon: 'week', title: 'Your Weekly Plan.', text: 'Know what to study each day, and exactly which source to study it from.' },
    { icon: 'check', title: 'Check-ins & Feedback', text: 'Short assessments, marked fast, with tips on what to practise next.' },
    { icon: 'growth', title: 'Progress You Can See', text: 'You and your parents follow your growth through weekly reports and mentor notes.' }
  ],
  emojis: ['📈', '🏆', '📚', '🔥', '✅', '🎓', '🌟'],
  art: { cardA: hero5, captionA: 'A weekly plan made just for you.', cardB: hero3, captionB: 'Every check-in shapes your next week.', blob: hero2, blobSize: [158, 174], round: hero1 } }
];
