import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Player from './Player';
import { fakeServer, likertBlock, mcqBlock, pairBlock, sjtBlock, apiError, networkError } from './testServer';

const FAST = { flushMs: 10, drainMs: 300, queueOptions: { backoff: [5, 10] } };
const setup = (blocks, opts = {}) => {
  const server = fakeServer({ blocks });
  const onFinished = vi.fn(), onBlocked = vi.fn();
  const view = render(<Player api={server.api} storage={localStorage} onFinished={onFinished} onBlocked={onBlocked} {...FAST} {...opts} />);
  return { server, onFinished, onBlocked, view, user: userEvent.setup() };
};
const names = server => server.st.calls.map(c => c[0]);
const answerPage = async (user, n, label = 'Agree') => { for (const el of screen.getAllByLabelText(label).slice(0, n)) await user.click(el); };

beforeEach(() => localStorage.clear());

describe('Player: a whole attempt', () => {
  it('walks every block in order, saves before closing each, and finishes', async () => {
    const { server, onFinished, user } = setup([likertBlock('interests', 12), mcqBlock('apt-verbal', 2), sjtBlock('situations', 1, { sessionId: 'S1' })].map((b, i) => (i === 2 ? { ...b, sessionId: 'S2' } : b)));
    expect(await screen.findByRole('heading', { name: 'Your interests' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start' }));

    // page 1 of 2: ten statements
    expect(await screen.findByText(/page 1 of 2/)).toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(10);
    await answerPage(user, 10);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText(/page 2 of 2/)).toBeInTheDocument();
    await answerPage(user, 2);
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));

    // aptitude block: new part, with a timer and one question at a time
    expect(await screen.findByText(/start of part 2/)).toBeInTheDocument();
    expect(screen.getByText(/timer starts when you press Start/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByText('Question apt-verbal 1')).toBeInTheDocument();
    await user.click(screen.getByLabelText('green'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Question apt-verbal 2')).toBeInTheDocument();
    await user.click(screen.getByLabelText('blue'));
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));

    // situational judgement
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await user.click(await screen.findByLabelText('two'));
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith('asmt1'));
    // each block's answers were saved BEFORE it was closed, and blocks were opened in order
    const calls = server.st.calls;
    const at = (name, id) => calls.findIndex(c => c[0] === name && (c[1] === id));
    expect(at('startBlock', 'interests')).toBeLessThan(at('submitBlock', 'interests'));
    const lastSaveOfInterests = calls.map((c, i) => (c[0] === 'saveAnswers' && c[1] === 'interests' ? i : -1)).filter(i => i >= 0).pop();
    expect(lastSaveOfInterests).toBeLessThan(at('submitBlock', 'interests'));
    expect(at('submitBlock', 'interests')).toBeLessThan(at('startBlock', 'apt-verbal'));
    expect(at('submitBlock', 'apt-verbal')).toBeLessThan(at('startBlock', 'situations'));
    expect(names(server).at(-1)).toBe('submit');
    expect(Object.keys(server.st.answers)).toHaveLength(12 + 2 + 1);
    expect(server.st.answers['apt-verbal-1']).toBe(1);              // option index, not text
    expect(server.st.answers['interests-1']).toBe(4);
  });

  it('the answer is sent with how long it took', async () => {
    const { server, user } = setup([likertBlock('interests', 3)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await answerPage(user, 3);
    const sentSoFar = () => server.st.calls.filter(c => c[0] === 'saveAnswers').flatMap(c => c[2]);
    await waitFor(() => expect(sentSoFar()).toHaveLength(3));
    const sent = sentSoFar();
    sent.forEach(a => { expect(Number.isFinite(a.rtMs)).toBe(true); expect(a.rtMs).toBeGreaterThanOrEqual(0); });
  });
});

describe('Player: Likert pages', () => {
  it('will not move on while a statement is unanswered, flags it, and makes no server call', async () => {
    const { server, user } = setup([likertBlock('interests', 12)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await answerPage(user, 9);
    const before = server.st.calls.length;
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/page 1 of 2/)).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose an answer');
    expect(server.st.calls.filter(c => c[0] === 'submitBlock')).toHaveLength(0);
    expect(server.st.calls.length).toBeGreaterThanOrEqual(before);
    await user.click(screen.getAllByLabelText('Agree')[9]);                       // answering clears the flag
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('shows the right labels for the block and counts progress', async () => {
    const { user } = setup([likertBlock('interests', 3, { responseScale: { id: 'interest', labels: ['Strongly dislike', 'Dislike', 'Not sure', 'Like', 'Strongly like'] } })]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    expect(screen.getAllByLabelText('Strongly like')).toHaveLength(3);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await user.click(screen.getAllByLabelText('Like')[0]);
    expect(Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });
});

describe('Player: resuming', () => {
  it('after a reload it goes straight back into the open block with the saved answers filled in', async () => {
    const server = fakeServer({ blocks: [likertBlock('interests', 12)] });
    await server.api.startBlock('interests');                                    // the student had started before
    await server.api.saveAnswers('interests', [1, 2, 3, 4, 5].map(i => ({ itemId: `interests-${i}`, value: 5 })));
    render(<Player api={server.api} storage={localStorage} {...FAST} />);
    expect(await screen.findByText(/page 1 of 2/)).toBeInTheDocument();           // no intro screen
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
    const checked = screen.getAllByLabelText('Strongly agree').filter(el => el.checked);
    expect(checked).toHaveLength(5);
  });
  it('answers still waiting to be sent from before the reload are merged in and sent', async () => {
    const server = fakeServer({ blocks: [likertBlock('interests', 12)] });
    await server.api.startBlock('interests');
    localStorage.setItem('im_v4_queue_sess1', JSON.stringify({ interests: { 'interests-1': { value: 2 }, 'interests-2': { value: 3 } } }));
    render(<Player api={server.api} storage={localStorage} {...FAST} />);
    await screen.findByText(/page 1 of 2/);
    expect(screen.getAllByLabelText('Disagree')[0]).toBeChecked();
    await waitFor(() => expect(server.st.answers['interests-1']).toBe(2));
    expect(server.st.answers['interests-2']).toBe(3);
  });
  it('a one-at-a-time block resumes at the first unanswered question', async () => {
    const server = fakeServer({ blocks: [mcqBlock('apt-verbal', 4)] });
    await server.api.startBlock('apt-verbal');
    await server.api.saveAnswers('apt-verbal', [{ itemId: 'apt-verbal-1', value: 0 }, { itemId: 'apt-verbal-2', value: 1 }]);
    render(<Player api={server.api} storage={localStorage} {...FAST} />);
    expect(await screen.findByText('Question apt-verbal 3')).toBeInTheDocument();
  });
  it('if every block is already closed it submits straight away', async () => {
    const server = fakeServer({ blocks: [likertBlock('interests', 1)] });
    await server.api.startBlock('interests'); await server.api.saveAnswers('interests', [{ itemId: 'interests-1', value: 3 }]); await server.api.submitBlock('interests');
    const onFinished = vi.fn();
    render(<Player api={server.api} storage={localStorage} onFinished={onFinished} {...FAST} />);
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith('asmt1'));
  });
});

describe('Player: timed blocks', () => {
  it('when the server deadline passes, answers are saved and the block is closed without the student pressing anything', async () => {
    const server = fakeServer({ blocks: [mcqBlock('apt-verbal', 3, { timeLimitSeconds: 1 }), likertBlock('after', 1)] });
    const user = userEvent.setup();
    render(<Player api={server.api} storage={localStorage} {...FAST} />);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await user.click(await screen.findByLabelText('green'));                      // answered one question, then the time runs out
    await waitFor(() => expect(names(server)).toContain('submitBlock'), { timeout: 3000 });
    expect(server.st.answers['apt-verbal-1']).toBe(1);                            // the answer was saved first
    const saved = names(server).lastIndexOf('saveAnswers'), closed = names(server).indexOf('submitBlock');
    expect(saved).toBeLessThan(closed);
    expect(await screen.findByRole('heading', { name: /after/ })).toBeInTheDocument();
  });
  it('the timer counts against the server clock, not the device clock', async () => {
    const server = fakeServer({ blocks: [mcqBlock('apt-verbal', 2, { timeLimitSeconds: 90 })] });
    const user = userEvent.setup();
    render(<Player api={server.api} storage={localStorage} {...FAST} />);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText('Question apt-verbal 1');
    expect(screen.getByText(/⏱ 1:(2\d|30)/)).toBeInTheDocument();
  });
  it('warns before the tab is closed during a timed block, but not during an untimed one', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const timed = setup([mcqBlock('apt-verbal', 2)]);
    await timed.user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText('Question apt-verbal 1');
    expect(add.mock.calls.some(c => c[0] === 'beforeunload')).toBe(true);
    add.mockRestore();
  });
});

describe('Player: one-at-a-time formats', () => {
  it('multiple choice can be skipped but not revisited; sjt cannot be skipped', async () => {
    const mcq = setup([mcqBlock('apt-verbal', 2)]);
    await mcq.user.click(await screen.findByRole('button', { name: 'Start' }));
    await mcq.user.click(await screen.findByRole('button', { name: 'Skip' }));
    expect(await screen.findByText('Question apt-verbal 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back|previous/i })).toBeNull();
    expect(mcq.server.st.answers['apt-verbal-1']).toBeUndefined();
  });
  it('a situation must be answered before moving on', async () => {
    const { user } = setup([sjtBlock('situations', 2)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    expect(screen.getByText('Situation 1')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose an answer');
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  });
  it('same/different advances on every answer and closes the block after the last', async () => {
    const { server, user } = setup([pairBlock('apt-perceptual', 3)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText(/1 of 3/);
    await user.click(screen.getByRole('radio', { name: 'Same' }));
    await screen.findByText(/2 of 3/);
    await user.click(screen.getByRole('radio', { name: 'Different' }));
    await screen.findByText(/3 of 3/);
    await user.click(screen.getByRole('radio', { name: 'Different' }));
    await waitFor(() => expect(names(server)).toContain('submitBlock'));
    expect(server.st.answers).toEqual({ 'apt-perceptual-1': 0, 'apt-perceptual-2': 1, 'apt-perceptual-3': 1 });
  });
});

describe('Player: when things go wrong', () => {
  it('offline at the end of a block: nothing is lost, the student is told, and "Try again" completes it', async () => {
    const { server, user } = setup([likertBlock('interests', 2), likertBlock('next', 1)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    server.st.failNext.saveAnswers = { times: 1000, make: networkError };
    await answerPage(user, 2);
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));
    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument();
    expect(names(server)).not.toContain('submitBlock');
    expect(JSON.parse(localStorage.getItem('im_v4_queue_sess1')).interests).toBeDefined();   // still safe on the device
    server.st.failNext.saveAnswers = null;                                                    // the connection returns
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: /next/ })).toBeInTheDocument();
    expect(server.st.answers['interests-1']).toBe(4);
    expect(localStorage.getItem('im_v4_queue_sess1')).toBeNull();
  });
  it('an expired sign-in at the end of a block says so and keeps the answers', async () => {
    const { server, user } = setup([likertBlock('interests', 1)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    server.st.failNext.saveAnswers = { times: 1000, make: () => apiError(401, 'TOKEN_EXPIRED') };
    await answerPage(user, 1);
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));
    expect(await screen.findByText(/sign-in has expired/i)).toBeInTheDocument();
    expect(localStorage.getItem('im_v4_queue_sess1')).not.toBeNull();
  });
  it('if the server says answers are missing, the student is taken back to them', async () => {
    const { server, user } = setup([sjtBlock('situations', 1)]);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await user.click(await screen.findByLabelText('one'));
    await waitFor(() => expect(server.st.answers['situations-1']).toBe(0));                   // saved...
    delete server.st.answers['situations-1'];                                                  // ...then the server refuses to count it
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));
    await waitFor(() => expect(names(server)).toContain('submitBlock'));
    // the screen trusted the server: the question is shown again, highlighted, with an explanation
    expect(await screen.findByText('Situation 1')).toBeInTheDocument();
    expect(await screen.findByText(/Some answers are missing/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose an answer');
    expect(screen.getByLabelText('one')).not.toBeChecked();
    await user.click(screen.getByLabelText('two'));                                           // answering again fixes it
    await user.click(screen.getByRole('button', { name: 'Finish this section' }));
    await waitFor(() => expect(server.st.closed.situations).toBe('submitted'));
  });
  it('a failed start shows a message and a working "Try again"', async () => {
    const server = fakeServer({ blocks: [likertBlock('interests', 1)] });
    server.st.failNext.start = { times: 1, make: networkError };
    const user = userEvent.setup();
    render(<Player api={server.api} storage={localStorage} {...FAST} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your test/i);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Your interests' })).toBeInTheDocument();
  });
  it.each(['CONSENT_REQUIRED', 'PROFILE_INCOMPLETE', 'TRACK_REQUIRED'])('%s explains what to do and tells the parent page', async code => {
    const server = fakeServer({ blocks: [likertBlock('interests', 1)] });
    server.st.failNext.start = { times: 1, make: () => apiError(403, code) };
    const onBlocked = vi.fn();
    render(<Player api={server.api} storage={localStorage} onBlocked={onBlocked} {...FAST} />);
    expect(await screen.findByRole('heading', { name: 'Before you start' })).toBeInTheDocument();
    expect(onBlocked).toHaveBeenCalledWith(code, expect.anything());
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '#/v4');
  });
  it('a block that closed while the student was away (out of order / closed) simply reloads the state', async () => {
    const { server, user } = setup([likertBlock('interests', 1), likertBlock('next', 1)]);
    await screen.findByRole('button', { name: 'Start' });
    server.st.failNext.startBlock = { times: 1, make: () => apiError(409, 'BLOCK_CLOSED') };
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('heading', { name: 'Your interests' })).toBeInTheDocument();
    expect(names(server).filter(n => n === 'start')).toHaveLength(2);
  });
  it('finishing: a failure shows "Try again", and BLOCKS_REMAINING reloads', async () => {
    const server = fakeServer({ blocks: [likertBlock('interests', 1)] });
    await server.api.startBlock('interests'); await server.api.saveAnswers('interests', [{ itemId: 'interests-1', value: 3 }]); await server.api.submitBlock('interests');
    server.st.failNext.submit = { times: 1, make: networkError };
    const onFinished = vi.fn();
    const user = userEvent.setup();
    render(<Player api={server.api} storage={localStorage} onFinished={onFinished} {...FAST} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not finish/i);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith('asmt1'));
  });
});

describe('Player: accessibility', () => {
  it('the section title is focused when a new screen appears, and progress is exposed to assistive technology', async () => {
    const { user } = setup([likertBlock('interests', 2)]);
    const heading = await screen.findByRole('heading', { name: 'Your interests' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByRole('progressbar', { name: 'Test progress' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  });
  it('the save status is announced politely', async () => {
    setup([likertBlock('interests', 1)]);
    await screen.findByRole('heading', { name: 'Your interests' });
    expect(within(document.body).getByText('All answers saved').closest('[role=status]')).toBeInTheDocument();
  });
});
