// Student-facing names and instructions for each block, plus the paging rules. Plain data so it is easy to review and translate.
export const BLOCK_TITLES = {
  interests: 'Your interests', 'about-you-1': 'About you (part 1)', 'about-you-2': 'About you (part 2)', 'work-values': 'What matters to you at work', situations: 'Real-life situations',
  'apt-verbal': 'Words and meaning', 'apt-numerical': 'Numbers', 'apt-logical': 'Reasoning and logic', 'apt-abstract': 'Patterns and shapes', 'apt-spatial': 'Space and shapes in your mind',
  'apt-language': 'Language and grammar', 'apt-mechanical': 'How things work', 'apt-perceptual': 'Quick checking'
};

export const INSTRUCTIONS = {
  likert: {
    interests: 'For each activity, choose how much you would like to do it. There are no right or wrong answers.',
    'work-values': 'For each statement, choose how important it is to you in a job. There are no right or wrong answers.',
    default: 'Read each statement and choose how much you agree with it. There are no right or wrong answers. Answer honestly: this helps you most.'
  },
  mcq: 'Choose the best answer. Each question has one correct answer. If you are stuck, you can skip a question. You cannot go back. The clock keeps running if you leave this page.',
  sjt: 'Each situation has four possible responses. Choose the one you think would work best.',
  speeded: 'Work quickly and carefully. Decide if the two codes are exactly the same. Answer as many as you can before time runs out.'
};

export const LIKERT_PAGE_SIZE = 10;
export const isTimed = payload => Boolean(payload && payload.timeLimitSeconds);
export const oneAtATime = format => format !== 'likert';

export function instructionFor(block) {
  if (block.format === 'likert') return INSTRUCTIONS.likert[block.id] || INSTRUCTIONS.likert.default;
  return INSTRUCTIONS[block.format];
}

/** Items of a Likert block on a given page. */
export const pageItems = (items, page, size = LIKERT_PAGE_SIZE) => items.slice(page * size, page * size + size);
export const pageCount = (items, size = LIKERT_PAGE_SIZE) => Math.max(1, Math.ceil(items.length / size));
/** Index of the first unanswered item, or -1. */
export const firstOpen = (items, answers) => items.findIndex(i => answers[i.id] === undefined);
