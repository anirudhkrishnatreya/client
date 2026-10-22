import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const sent = [];
let quality;
vi.mock('../api', () => ({
  adminGetUsers: () => Promise.resolve({ data: { data: [], pagination: { page: 1, pages: 1, total: 0 } } }),
  adminGetStats: () => Promise.resolve({ data: { stats: null } }),
  adminLoopMetrics: () => Promise.resolve({ data: { funnel: { chatsStarted: 10, plansStarted: 6, chatToPlan: 0.6 }, retention: { week2Return: 0.5, week2Eligible: 4, week4Reached: null, week4Eligible: 0 }, work: { stepsFinished: 0.72, finishedWeeks: 5, assessmentsDone: 4, practiceSetsMade: 3 }, levels: { levelUpAttempts: 2, levelUpPasses: 1, studentsPastLevel1: 1 }, fairness: { fairYes: 9, fairNo: 1, fairShare: 0.9, waitingForReply: 1 }, cost: { aiUsd: 0.12, activeStudents: 6, perActiveStudentUsd: 0.02 } } }),
  adminLoopAttention: () => Promise.resolve({ data: { alerts: [{ id: 'li-s1', studentId: 's1', level: 'high', text: 'Asha has done nothing on their weekly plan for 9 days.', hasMentor: false }], feedback: [{ id: 'f1', studentId: 's1', name: 'Asha', hasMentor: false, target: 'judgement', weekNumber: 2, note: 'Too harsh.' }] } }),
  adminLoopReply: (id, text) => { sent.push({ id, text }); return Promise.resolve({ data: { success: true } }); },
  adminQualityGet: () => Promise.resolve({ data: quality }),
  adminQualityStart: () => { sent.push({ quality: true }); return Promise.resolve({ data: { success: true } }); }
}));
import AdminDash from './AdminDash';

const show = () => render(<MemoryRouter><AdminDash /></MemoryRouter>);

describe('admin: the learning loop', () => {
  beforeEach(() => {
    sent.length = 0;
    quality = { maxUsd: 0.4, personas: ['AI engineer, college year 2', 'Cricketer, Class 9'], run: { id: 'r1', status: 'done', costUsd: 0.18, note: '', personas: [{ label: 'AI engineer, college year 2', journey: { outcome: 'revised', ruleIssuesAfter: [], run: { steps: [{ agent: 'journey-critic', verdict: 'revise', notes: ['level 2: too fast'] }] }, plan: { careerTitle: 'AI engineer', startPoint: { summary: 'Knows basic Python.' }, endPoint: { summary: 'Ships a small ML project.', horizonWeeks: 24 }, weeklyMinutes: 360, phases: [{ id: 'p1', title: 'Python for data', weeks: 4, topics: [{ title: 'NumPy', kind: 'skill' }], levelUp: { proof: 'Clean a real dataset.' } }] } }, week: { outcome: 'ok', minutes: 288, ruleIssuesAfter: [], units: [{ type: 'practise', minutes: 45, title: 'NumPy drills', topic: 'NumPy', goal: 'g', evidence: 'e', help: 'h', video: null, practice: [{ provider: 'GitHub (rougier)', title: '100 NumPy exercises', url: 'https://github.com/rougier/numpy-100', what: 'Do 1 to 10.' }] }] }, practice: { step: 'NumPy drills', run: { steps: [{ agent: 'practice-checker', notes: ['4 of 5 passed'] }] }, items: [{ kind: 'question', prompt: 'Make a 3x3 identity matrix.', answer: 'np.eye(3)' }] } }] } };
  });
  it('shows whether the loop works, who needs a person, and lets the team reply', async () => {
    const user = userEvent.setup();
    show();
    expect(await screen.findByText('Learning loop · last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Came back for week 2')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/done nothing on their weekly plan for 9 days/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Reply to Asha'), 'We looked again, you were right.');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(sent).toContainEqual({ id: 'f1', text: 'We looked again, you were right.' }));
  });
  it('the quality check asks before spending, and shows a readable report', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    show();
    const run = await screen.findByRole('button', { name: 'Run quality check' });
    expect(screen.getByText(/cost \$0\.18/)).toBeInTheDocument();
    await user.click(screen.getByText(/AI engineer, college year 2 · journey revised/));
    expect(screen.getByText(/Critic: revise · level 2: too fast/)).toBeInTheDocument();
    expect(screen.getByText(/Level-up: Clean a real dataset/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /100 NumPy exercises/ })).toHaveAttribute('href', 'https://github.com/rougier/numpy-100');
    expect(screen.getByText('Answer: np.eye(3)')).toBeInTheDocument();
    await user.click(run);
    expect(sent.some(x => x.quality)).toBe(false);                       // said no
    await user.click(run);
    await waitFor(() => expect(sent.some(x => x.quality)).toBe(true));
    expect(confirm.mock.calls[0][0]).toMatch(/spends up to \$0\.4/);
  });
});
