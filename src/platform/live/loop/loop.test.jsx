import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';

const calls = [];
let routes = {};
vi.mock('../../../api', () => {
  const handle = method => (url, body) => {
    calls.push({ method, url, body });
    const key = `${method} ${url}`;
    if (!(key in routes)) return Promise.reject(Object.assign(new Error(`no route ${key}`), { response: { status: 404, data: { code: 'NOT_FOUND' } } }));
    const out = typeof routes[key] === 'function' ? routes[key](body) : routes[key];
    return Promise.resolve(out).then(v => (v instanceof Error ? Promise.reject(v) : { data: v }));
  };
  return { default: { get: handle('get'), post: handle('post'), put: handle('put'), patch: handle('patch'), delete: handle('delete') } };
});

let PlatformApp;
beforeAll(async () => { vi.stubEnv('VITE_LOOP', 'on'); PlatformApp = (await import('../../PlatformApp')).default; });

const fail = (status, code, details) => Object.assign(new Error(code), { response: { status, data: { code, error: code, details } } });
const signIn = () => { const user = { id: 's1', fullName: 'Asha Verma', role: 'student', grade: '10' }; localStorage.setItem('im_user_token', 'T'); localStorage.setItem('im_user', JSON.stringify(user)); routes['get /auth/me'] = { user }; };
const bundle = { success: true, me: { id: 's1', fullName: 'Asha Verma', grade: '10', track: 'senior', goal: null, joined: new Date().toISOString(), consent: 'granted', parent: 'linked' }, mentor: null, sessions: { next: null, upcoming: [], history: [] }, tasks: [], reports: [], assessment: { state: 'submitted' } };
const at = path => render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);

const profile = { freeMinutes: [45, 45, 45, 45, 45, 90, 90], restDay: null, exams: [], saved: false };
const PLAN = { careerTitle: 'Astronaut', startPoint: { summary: 'Class 10, curious about space.', level: 'Class 10' }, endPoint: { summary: 'A strong Physics base and readiness for the IIST route.', outcomes: ['Explain orbits'], horizonWeeks: 10 }, longPath: 'Then a degree and ISRO selection.', phases: [{ id: 'p1', title: 'Fundamentals', weeks: 2, outcome: 'o', topics: [{ id: 'p1t1', title: 'Gravity and orbits' }] }, { id: 'p2', title: 'Physics base', weeks: 3, outcome: 'o', topics: [{ id: 'p2t1', title: 'Newton’s laws' }] }], weeklyMinutes: 300, notes: ['Check the official ISRO website.'] };
const chatState = (messages, extra = {}) => ({ loop: { mode: 'chat', profile, today: '2026-10-22', intake: { status: 'chatting', messages, proposal: null, ...extra.intake }, currentGoal: null, ...extra.loop } });
const greeting = { role: 'assistant', text: 'Hi Asha! What do you want to become?', quickReplies: ['AI engineer', 'Astronaut'] };
const video = over => ({ videoId: 'dQw4w9WgXcQ', title: 'Gravity and orbits explained', channel: 'Great Teacher', minutes: 18, views: 500000, covers: 'Why things orbit.', why: 'Clear and the right level.', start: null, end: null, thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0', ...over });
const unit = (id, day, over = {}) => ({ id, title: `Unit ${id}`, type: 'learn', minutes: 30, goal: `Goal of ${id}`, evidence: `Evidence for ${id}`, search: `search ${id}`, searchUrl: `https://www.youtube.com/results?search_query=search%20${id}`, topic: 'Gravity and orbits', day, date: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'][day], reason: `Reason for ${id}.`, video: null, sequence: null, status: 'todo', resourceUrl: null, resourceTitle: null, rating: null, ...over });
const planState = (over = {}) => ({ loop: { mode: 'plan', profile: { ...profile, saved: true }, today: '2026-10-22',
  goal: { id: 'g1', title: 'Astronaut', startPoint: PLAN.startPoint, endPoint: PLAN.endPoint, longPath: PLAN.longPath, notes: PLAN.notes, targetDate: '2026-12-31', weekNumber: 1, pace: 'on-track', adaptations: [],
    phase: { number: 1, total: 4, title: 'Fundamentals', outcome: 'Core ideas of space science', finished: false },
    progress: { phaseIndex: 0, phases: 4, topicsTotal: 10, topicsDone: 1, mastered: 0 } },
  week: { weekStart: '2026-10-19', weekEnd: '2026-10-25', weekNumber: 1, mode: 'normal', pace: 'start', focus: 'Fundamentals: gravity', summary: '', source: 'model', notices: [], items: [unit('u1', 3), unit('u2', 3, { type: 'practise' }), unit('u3', 4)], capacityMinutes: 300, plannedMinutes: 90, doneMinutes: 0, todayIndex: 3, over: false, videos: false },
  assessment: { stage: 'locked', done: 0, need: 2 }, next: { canPlan: false, assessed: false, over: false, finished: false }, history: [], ...over } });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); calls.length = 0; routes = {}; signIn(); routes['get /v2/platform/student'] = bundle; });

describe('the career chat', () => {
  it('greets, takes a typed answer or a quick reply, and shows the guide’s next question', async () => {
    routes['get /v2/me/loop'] = chatState([greeting]);
    routes['post /v2/me/loop/chat'] = ({ text }) => chatState([greeting, { role: 'user', text }, { role: 'assistant', text: 'Lovely! Which class are you in?', quickReplies: ['Class 10', 'Class 12'] }]);
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText('Hi Asha! What do you want to become?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Astronaut' }));
    expect(await screen.findByText('Lovely! Which class are you in?')).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/me/loop/chat').body).toEqual({ text: 'Astronaut' });
    await user.type(screen.getByLabelText('Your message'), 'Class 10 science');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/me/loop/chat').pop().body).toEqual({ text: 'Class 10 science' }));
  });
  it('if the guide cannot answer, the message stays in the box to send again', async () => {
    routes['get /v2/me/loop'] = chatState([greeting]);
    routes['post /v2/me/loop/chat'] = fail(503, 'AI_UNAVAILABLE');
    const user = userEvent.setup();
    at('/platform/student/goal');
    await user.type(await screen.findByLabelText('Your message'), 'I want to be a pilot');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/send it again/);
    expect(screen.getByLabelText('Your message')).toHaveValue('I want to be a pilot');
  });
  it('shows the drafted plan (start point, end point, phases) and starts it', async () => {
    routes['get /v2/me/loop'] = chatState([greeting], { intake: { status: 'proposed', proposal: PLAN } });
    routes['post /v2/me/loop/chat/confirm'] = planState();
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText('Class 10, curious about space.')).toBeInTheDocument();
    expect(screen.getByText(/End point · about 10 weeks/)).toBeInTheDocument();
    expect(screen.queryByText('Fundamentals')).toBeNull();                                  // the phases are not shown
    expect(screen.getAllByText(/one week at a time/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Then a degree and ISRO selection/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start this plan' }));
    expect(await screen.findByText(/Your plan has started/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Astronaut' })).toBeInTheDocument();
    await waitFor(() => expect(calls.filter(c => c.url === '/v2/platform/student').length).toBeGreaterThan(1));
  });
  it('planning a new goal says the current one stays, and can be cancelled', async () => {
    routes['get /v2/me/loop'] = chatState([greeting], { loop: { currentGoal: { title: 'Astronaut' } } });
    routes['post /v2/me/loop/new-goal/cancel'] = planState();
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText(/stays until you start the new plan/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep my current goal' }));
    expect(await screen.findByRole('heading', { name: 'Astronaut' })).toBeInTheDocument();
  });
  it('says "coming soon" when the server has it off', async () => {
    routes['get /v2/me/loop'] = fail(404, 'LOOP_DISABLED');
    at('/platform/student/goal');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
  });
});

describe('my goal with a plan', () => {
  it('shows start and end points and the current phase only, and saves the real week', async () => {
    routes['get /v2/me/loop'] = planState();
    routes['put /v2/me/loop/schedule'] = planState();
    const user = userEvent.setup();
    at('/platform/student/goal');
    expect(await screen.findByText('On track')).toBeInTheDocument();
    expect(screen.getByText(/A strong Physics base/)).toBeInTheDocument();
    expect(screen.getByText(/phase 1 of 4: Fundamentals/)).toBeInTheDocument();
    expect(screen.queryByText(/Newton/)).toBeNull();
    await user.selectOptions(screen.getByLabelText('Monday'), '90');
    await user.click(screen.getByRole('button', { name: 'Save my week' }));
    expect(await screen.findByText(/It shapes next week/)).toBeInTheDocument();
    expect(calls.find(c => c.method === 'put').body.freeMinutes[0]).toBe(90);
  });
});

describe('the week', () => {
  it('shows this week only, by date with today highlighted, and a safe search link when there is no video', async () => {
    routes['get /v2/me/loop'] = planState();
    at('/platform/student/plan');
    expect(await screen.findByText(/Thursday, 22 Oct · today/)).toBeInTheDocument();
    expect(screen.getByText(/19 Oct to 25 Oct/)).toBeInTheDocument();
    expect(screen.getByText('Friday, 23 Oct')).toBeInTheDocument();
    const link = within(screen.getByRole('article', { name: 'Unit u1' })).getByRole('link', { name: /Find a free video/ });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/results?search_query=search%20u1');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('shows the chosen video with why it was chosen and what it covers; plays it here on request; and can swap it', async () => {
    const s = planState();
    s.loop.week.videos = true;
    s.loop.week.items[0] = unit('u1', 3, { video: video(), sequence: { index: 1, of: 2 } });
    routes['get /v2/me/loop'] = s;
    const swapped = JSON.parse(JSON.stringify(s)); swapped.loop.week.items[0].video = video({ videoId: 'aaaaaaaaaaa', title: 'A different lesson', embedUrl: 'https://www.youtube-nocookie.com/embed/aaaaaaaaaaa?rel=0' });
    routes['post /v2/me/loop/units/u1/video/another'] = swapped;
    const user = userEvent.setup();
    at('/platform/student/plan');
    const card = await screen.findByRole('article', { name: 'Unit u1' });
    expect(within(card).getByText('Gravity and orbits explained')).toBeInTheDocument();
    expect(within(card).getByText(/Great Teacher · 18 min/)).toBeInTheDocument();
    expect(within(card).getByText(/Why this one: Clear and the right level/)).toBeInTheDocument();
    expect(within(card).getByText(/Video 1 of 2 for this topic, one for each learning step/)).toBeInTheDocument();
    expect(within(card).queryByRole('link', { name: /Find a free video/ })).toBeNull();
    expect(within(card).getByRole('link', { name: 'Open on YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await user.click(within(card).getByRole('button', { name: /Play: Gravity and orbits explained/ }));
    expect(card.querySelector('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
    await user.click(within(card).getByRole('button', { name: 'Show me a different video' }));
    expect(await within(card).findByText('A different lesson')).toBeInTheDocument();
    expect(card.querySelector('iframe')).toBeNull();
  });
  it('a practise step has how-to help, a follow-along video, and links back to the lessons; a check step links back too', async () => {
    const s = planState();
    s.loop.week.items = [
      unit('u1', 3, { video: video(), sequence: { index: 1, of: 1 }, help: 'Pause and note three points.' }),
      unit('u2', 3, { type: 'practise', help: 'Start with the easy one, then try a harder one.', video: video({ videoId: 'bbbbbbbbbbb', title: 'Worked examples', role: 'practice', embedUrl: 'https://www.youtube-nocookie.com/embed/bbbbbbbbbbb?rel=0' }), rewatch: [{ videoId: 'dQw4w9WgXcQ', title: 'Gravity and orbits explained', watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }] }),
      unit('u3', 4, { type: 'check', help: 'Close the video and answer from memory.', rewatch: [{ videoId: 'dQw4w9WgXcQ', title: 'Gravity and orbits explained', watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }] })
    ];
    routes['get /v2/me/loop'] = s;
    at('/platform/student/plan');
    const practise = await screen.findByRole('article', { name: 'Unit u2' });
    expect(within(practise).getByText(/Start with the easy one/)).toBeInTheDocument();
    expect(within(practise).getByText('How to go about it:')).toBeInTheDocument();
    expect(within(practise).getByText('Follow along while you practise')).toBeInTheDocument();
    expect(within(practise).queryByText(/Video 1 of/)).toBeNull();
    expect(within(practise).getByRole('link', { name: 'Gravity and orbits explained' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const check = screen.getByRole('article', { name: 'Unit u3' });
    expect(within(check).getByText(/Close the video and answer from memory/)).toBeInTheDocument();
    expect(within(check).getByRole('link', { name: 'Gravity and orbits explained' })).toBeInTheDocument();
    expect(within(check).getByRole('link', { name: /Find a free video to help/ })).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Unit u1' })).getByText('Tip:')).toBeInTheDocument();
  });
  it('never plays a video from an address that is not YouTube\u2019s embed player', async () => {
    const s = planState();
    s.loop.week.items[0] = unit('u1', 3, { video: video({ embedUrl: 'https://evil.example/embed/dQw4w9WgXcQ' }) });
    routes['get /v2/me/loop'] = s;
    const user = userEvent.setup();
    at('/platform/student/plan');
    const card = await screen.findByRole('article', { name: 'Unit u1' });
    await user.click(within(card).getByRole('button', { name: /Play:/ }));
    expect(card.querySelector('iframe')).toBeNull();
  });
  it('marks done with a rating and skips with a reason', async () => {
    const s = planState();
    routes['get /v2/me/loop'] = s;
    routes['post /v2/me/loop/units/u1/done'] = { loop: { ...s.loop, week: { ...s.loop.week, doneMinutes: 30, items: s.loop.week.items.map(i => (i.id === 'u1' ? { ...i, status: 'done' } : i)) } } };
    routes['post /v2/me/loop/units/u2/skip'] = { loop: { ...s.loop, week: { ...s.loop.week, items: s.loop.week.items.map(i => (i.id === 'u2' ? { ...i, status: 'skipped' } : i)) } } };
    const user = userEvent.setup();
    at('/platform/student/plan');
    const c1 = await screen.findByRole('article', { name: 'Unit u1' });
    await user.click(within(c1).getByRole('button', { name: 'I have done this' }));
    await user.click(within(c1).getByRole('button', { name: '5 out of 5' }));
    await user.click(within(c1).getByRole('button', { name: 'Mark as done' }));
    expect(await within(c1).findByText('Done')).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/me/loop/units/u1/done').body).toEqual({ rating: 5 });
    const c2 = screen.getByRole('article', { name: 'Unit u2' });
    await user.click(within(c2).getByRole('button', { name: 'Skip' }));
    await user.selectOptions(within(c2).getByLabelText('Why skip it?'), 'covered-elsewhere');
    await user.click(within(c2).getByRole('button', { name: 'Skip it' }));
    expect(await within(c2).findByText('Skipped')).toBeInTheDocument();
  });
  it('after the first week it shows what changed and why', async () => {
    const s = planState();
    s.loop.week.weekNumber = 2; s.loop.week.summary = 'You did well, so next week moves a bit faster.';
    s.loop.goal.adaptations = [{ week: 1, pace: 'speed-up', summary: 'You did well, so next week moves a bit faster.', changes: ['Added a new topic: Reading a launch schedule.'] }];
    routes['get /v2/me/loop'] = s;
    at('/platform/student/plan');
    expect(await screen.findByText('What changed for this week')).toBeInTheDocument();
    expect(screen.getByText(/moves a bit faster/)).toBeInTheDocument();
    expect(screen.getByText('Added a new topic: Reading a launch schedule.')).toBeInTheDocument();
  });
  it('without a plan, points to the chat', async () => {
    routes['get /v2/me/loop'] = chatState([greeting]);
    at('/platform/student/plan');
    expect(await screen.findByText('Tell your guide what you want to become')).toBeInTheDocument();
  });
});

describe('the weekly assessment and the next week', () => {
  const quiz = [1, 2, 3].map(n => ({ id: `q${n}`, q: `Question ${n}?`, options: ['A', 'B', 'C', 'D'] }));
  const task = { prompt: 'Explain gravity to a younger student.', expects: 'About 100 words', rubric: ['Accuracy', 'Clarity', 'Own words'], submitted: false, judgement: null };
  it('locked, then ready, then the quiz, then the piece of work, then feedback; a loader shows while it works', async () => {
    const base = planState();
    routes['get /v2/me/loop'] = planState({ assessment: { stage: 'ready', done: 2, need: 2 } });
    routes['post /v2/me/loop/check'] = { loop: { ...base.loop, assessment: { stage: 'quiz', quiz: { status: 'open', questions: quiz }, task } } };
    routes['post /v2/me/loop/check/answers'] = { loop: { ...base.loop, assessment: { stage: 'work', quiz: { status: 'done', score: 2 / 3, questions: [] }, task } } };
    routes['post /v2/me/loop/check/work'] = { loop: { ...base.loop, next: { canPlan: true, assessed: true, over: false, finished: false }, assessment: { stage: 'done', quiz: { status: 'done', score: 2 / 3, questions: quiz.map((q, i) => ({ ...q, answer: 1, yourAnswer: i === 2 ? 0 : 1, correct: i !== 2, explanation: 'Because B.' })) }, task: { ...task, submitted: true, judgement: { status: 'judged', overall: 'getting-there', criteria: [{ name: 'Accuracy', band: 'strong', comment: 'Correct ideas.' }, { name: 'Clarity', band: 'getting-there', comment: 'A little long.' }, { name: 'Own words', band: 'getting-there', comment: 'Mostly yours.' }], feedback: 'Good start, tighten the middle.', nextStep: 'Add one example.' } } } } };
    const user = userEvent.setup();
    at('/platform/student/plan');
    await user.click(await screen.findByRole('button', { name: 'Start the assessment' }));
    expect(await screen.findByText(/Question 1\?/)).toBeInTheDocument();
    expect(screen.getByText(/Part 1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Answer every question' })).toBeDisabled();
    for (const [n, pick] of [[1, 'B'], [2, 'B'], [3, 'A']]) await user.click(within(screen.getByRole('group', { name: new RegExp(`Question ${n}`) })).getByLabelText(pick));
    await user.click(screen.getByRole('button', { name: 'Submit my answers' }));
    expect(calls.find(c => c.url === '/v2/me/loop/check/answers').body).toEqual({ answers: [1, 1, 0] });
    expect(await screen.findByText(/Part 2 of 2/)).toBeInTheDocument();
    expect(screen.getByText('Explain gravity to a younger student.')).toBeInTheDocument();
    expect(screen.getByText(/Accuracy, Clarity, Own words/)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Write a little more' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Your answer'), 'Gravity pulls things toward each other, like the Earth pulls the Moon.');
    await user.type(screen.getByLabelText(/A link to something you made/), 'https://github.com/asha/notes');
    await user.click(screen.getByRole('button', { name: 'Submit my work' }));
    expect(await screen.findByText('Good start, tighten the middle.')).toBeInTheDocument();
    expect(calls.find(c => c.url === '/v2/me/loop/check/work').body).toEqual({ text: 'Gravity pulls things toward each other, like the Earth pulls the Moon.', link: 'https://github.com/asha/notes' });
    expect(screen.getByText('Next step:')).toBeInTheDocument();
    expect(screen.getByText('Quiz: 67%')).toBeInTheDocument();
    expect(screen.getAllByText('Getting there').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Plan my next week' })).toBeInTheDocument();
  });
  it('shows a loader with progress messages while the AI prepares the assessment', async () => {
    routes['get /v2/me/loop'] = planState({ assessment: { stage: 'ready', done: 2, need: 2 } });
    let release; routes['post /v2/me/loop/check'] = () => new Promise(r => { release = r; });
    const user = userEvent.setup();
    at('/platform/student/plan');
    await user.click(await screen.findByRole('button', { name: 'Start the assessment' }));
    expect(await screen.findByText('Preparing your assessment')).toBeInTheDocument();
    expect(screen.getByText(/Writing questions on what you studied/)).toBeInTheDocument();
    expect(document.querySelector('.pf-orbit')).not.toBeNull();
    release(planState());
  });
  it('plans the next week with a loader, then shows the new week and what changed', async () => {
    const before = planState({ next: { canPlan: true, assessed: true, over: false, finished: false } });
    const after = planState();
    after.loop.week.weekNumber = 2; after.loop.week.summary = 'A strong week, so next week moves faster.';
    after.loop.goal.adaptations = [{ week: 1, pace: 'speed-up', summary: 'A strong week, so next week moves faster.', changes: [] }];
    routes['get /v2/me/loop'] = before;
    let release; routes['post /v2/me/loop/next-week'] = () => new Promise(r => { release = r; });
    const user = userEvent.setup();
    at('/platform/student/plan');
    await user.click(await screen.findByRole('button', { name: 'Plan my next week' }));
    expect(await screen.findByText('Planning your next week')).toBeInTheDocument();
    expect(screen.getByText(/Looking at how your week went/)).toBeInTheDocument();
    release(after);
    await waitFor(() => expect(screen.getByText('What changed for this week')).toBeInTheDocument());
    expect(screen.getByText(/Week 2 · Astronaut/)).toBeInTheDocument();
  });
  it('a failed attempt to plan the next week says why and keeps the button', async () => {
    routes['get /v2/me/loop'] = planState({ next: { canPlan: true, assessed: false, over: true, finished: false } });
    routes['post /v2/me/loop/next-week'] = fail(503, 'AI_UNAVAILABLE');
    const user = userEvent.setup();
    at('/platform/student/plan');
    expect(await screen.findByText(/This week has ended/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Plan my next week' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/send it again|could not answer/);
    expect(screen.getByRole('button', { name: 'Plan my next week' })).toBeInTheDocument();
  });
  it('unjudged work says it was saved and next week uses the rest', async () => {
    routes['get /v2/me/loop'] = planState({ next: { canPlan: true, assessed: true, over: false, finished: false }, assessment: { stage: 'done', quiz: { status: 'done', score: 1, questions: [] }, task: { ...task, submitted: true, judgement: { status: 'unjudged' } } } });
    at('/platform/student/plan');
    expect(await screen.findByText(/Your work is saved/)).toBeInTheDocument();
  });
});

describe('loading', () => {
  it('shows the shape of the page instead of the word "Loading"', async () => {
    let release; routes['get /v2/me/loop'] = () => new Promise(r => { release = r; });
    at('/platform/student/plan');
    expect(await screen.findByRole('status', { name: 'Loading your week' })).toBeInTheDocument();
    expect(document.querySelectorAll('.pf-skel').length).toBeGreaterThan(5);
    release(planState());
  });
});

describe('progress and overview', () => {
  it('progress shows start, end and where they are, how the plan adapted, and no phases ahead', async () => {
    const s = planState();
    s.loop.goal.adaptations = [{ week: 1, pace: 'slow-down', summary: 'A hard week, so next week slows down.', changes: ['Another look at: Gravity and orbits.'] }];
    s.loop.history = [{ weekNumber: 1, weekStart: '2026-10-19', focus: 'Fundamentals', completion: 0.6, quiz: 0.5, work: 'not-yet' }];
    routes['get /v2/me/loop'] = s;
    at('/platform/student/plan/roadmap');
    expect(await screen.findByText('How your plan has adapted')).toBeInTheDocument();
    expect(screen.getByText('A hard week, so next week slows down.')).toBeInTheDocument();
    expect(screen.getByText('Another look at: Gravity and orbits.')).toBeInTheDocument();
    expect(screen.getByText('Slower')).toBeInTheDocument();
    expect(screen.getByText(/60% finished · quiz 50%/)).toBeInTheDocument();
    expect(screen.getByText(/phase 1 of 4: Fundamentals/)).toBeInTheDocument();
    expect(screen.queryByText(/Newton|Vectors/)).toBeNull();
  });
  it('the overview shows today\u2019s steps, or invites the chat', async () => {
    routes['get /v2/me/loop'] = planState();
    const { unmount } = at('/platform/student');
    expect(await screen.findByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Unit u1')).toBeInTheDocument();
    expect(screen.getByText(/phase 1 of 4/)).toBeInTheDocument();
    unmount();
    routes['get /v2/me/loop'] = chatState([greeting]);
    at('/platform/student');
    expect(await screen.findByRole('link', { name: 'Start the chat' })).toBeInTheDocument();
  });
});
