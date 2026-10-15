// What each week of the journey says, and what orbits with it. Week 1 is the Figma design; weeks 2 and 3 are drafted
// from what the platform really does (mentor matching, weekly plan, check-ins, progress reports) and are easy to edit here.
import card1 from '../assets/landing/card-1.png';
import card2 from '../assets/landing/card-2.png';
import blob1 from '../assets/landing/blob-1.png';
import PHOTO from './photos';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero4 from '../assets/landing/hero-4-shape.png';
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
  { n: 1, title: 'Start where you are', items: [
    { img: iconSurvey, title: 'Name your dream', text: 'Say what you want to become, even if it is only a rough idea.' },
    { img: iconGauge, title: 'Find your level', text: 'A short assessment shows what you know, what you enjoy and where to begin.' },
    { img: iconReport, title: 'Your career fit report', text: 'The paths that suit you best, your strengths, and the skills to build first.' }
  ],
  emojis: ['sparkles', 'target', 'heart', 'bulb', 'bolt', 'flag', 'award'],
  art: { cardA: card1, captionA: 'Tell us about you: background, strengths, goals.', cardB: card2, captionB: 'Tell us about you: background, strengths, goals.', blob: blob1, blobSize: [174, 174], round: PHOTO.p10638081 } },
  { n: 2, title: 'Learn at your pace', items: [
    { icon: 'match', title: 'A path made for you', text: 'Your goal becomes a step-by-step path, sized to the time you have.' },
    { icon: 'session', title: 'The right things to study', text: 'Lessons, practice and sources picked for your level, not a pile of links.' },
    { icon: 'plan', title: 'Doubts cleared, any hour', text: 'Stuck on something? Ask. You get a plain answer, and your plan adjusts.' }
  ],
  emojis: ['users', 'target', 'message', 'heart', 'star', 'calendar', 'flag'],
  art: { cardA: PHOTO.p8419640, captionA: 'A path made for your goal.', cardB: PHOTO.p4308097, captionB: 'Lessons picked for your level.', blobPhoto: PHOTO.p5306434, blobMask: hero4, blobSize: [190, 141], round: PHOTO.p6392977 } },
  { n: 3, title: 'Keep rising', items: [
    { icon: 'week', title: 'Levels that rise with you', text: 'As you master things, your path moves from the basics toward advanced work.' },
    { icon: 'check', title: 'Quizzes that find the gaps', text: 'Short checks show what to revisit, and the platform fixes your plan for you.' },
    { icon: 'growth', title: 'Progress everyone can see', text: 'You and your parents can follow how far you have come. Mentors step in for the big calls.' }
  ],
  emojis: ['trend', 'award', 'book', 'bolt', 'check', 'cap', 'star'],
  art: { cardA: PHOTO.p7683820, captionA: 'Gaps found early, fixed early.', cardB: PHOTO.p30858451, captionB: 'Progress that shows up week by week.', blobPhoto: PHOTO.p7129712, blobMask: hero2, blobSize: [158, 174], round: PHOTO.p21006242 } }
];
