import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlatformApp from './PlatformApp';
import { AuthProvider } from '../context/AuthContext';
import { markQuiz, QUIZ } from './data/quiz';

const go = path => render(<MemoryRouter initialEntries={[`/platform/preview/${path}`]}><AuthProvider><Routes><Route path="/platform/*" element={<PlatformApp />} /></Routes></AuthProvider></MemoryRouter>);
beforeEach(() => localStorage.clear());

const ROUTES = {
  student: ['', 'goal', 'plan', 'tasks', 'assessments', 'library', 'reports', 'mentor', 'coach'],
  mentor: ['', 'students', 'sessions', 'tasks', 'insights'],
  parent: ['', 'progress', 'tasks', 'reports', 'mentor']
};

describe('platform dashboards', () => {
  it('the preview library still shows its sample progress bars (only the live dashboard hides them)', async () => {
    go('student/library');
    expect(await screen.findAllByText('Your progress')).not.toHaveLength(0);
  });
  it('offers the three roles', () => {
    go('');
    for (const r of ['Student', 'Mentor', 'Parent']) expect(screen.getAllByText(r).length).toBeGreaterThan(0);
  });

  for (const [role, pages] of Object.entries(ROUTES)) {
    for (const p of pages) {
      it(`renders ${role}/${p || 'overview'} without crashing`, async () => {
        go(`${role}/${p}`);
        await waitFor(() => expect(screen.getAllByRole('heading').length).toBeGreaterThan(1), { timeout: 3000 });
        expect(screen.getByText(/sample data/i)).toBeTruthy();
      });
    }
  }

  it('marks a quiz and writes feedback from the wrong topics', () => {
    const allRight = Object.fromEntries(QUIZ.questions.map(q => [q.id, q.answer]));
    expect(markQuiz(allRight).score).toBe(100);
    const r = markQuiz({ ...allRight, q4: 3, q5: 0 });
    expect(r.score).toBe(60);
    expect(r.feedback.gaps).toEqual(['Vectors']);
    expect(r.feedback.strengths).toContain('Python loops');
  });

  it('lets a student take a quiz and see the result in their history', async () => {
    go('student/assessments');
    fireEvent.click(await screen.findByRole('button', { name: /start now/i }));
    for (let i = 0; i < QUIZ.questions.length; i++) {
      const q = QUIZ.questions[i];
      fireEvent.click(await screen.findByLabelText(q.options[q.answer]));
      fireEvent.click(screen.getByRole('button', { name: i === QUIZ.questions.length - 1 ? /finish and mark/i : /next/i }));
    }
    expect(await screen.findByText('100%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /save and finish/i }));
    fireEvent.click(await screen.findByRole('tab', { name: /results/i }));
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
  });

  it('lets a mentor assign a task and the choice persists', async () => {
    go('mentor/tasks');
    fireEvent.change(await screen.findByPlaceholderText(/what should they do/i), { target: { value: 'Read chapter 3' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2030-01-05' } });
    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByText('Read chapter 3')).toBeTruthy();
  });

  it('lets a mentor open a student and save a note', async () => {
    go('mentor/students');
    fireEvent.click(await screen.findByText('Kabir Singh'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('tab', { name: /notes/i }));
    fireEvent.change(within(dialog).getByLabelText(/new note/i), { target: { value: 'Call parents' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save note/i }));
    expect(await within(dialog).findByText('Call parents')).toBeTruthy();
  });

  it('answers a coach question and can add a block to the plan', async () => {
    go('student/coach');
    fireEvent.click(await screen.findByRole('button', { name: /only have 30 minutes/i }));
    fireEvent.click(await screen.findByRole('button', { name: /add to my plan/i }));
    expect(await screen.findByText(/added to today/i)).toBeTruthy();
  });
});
