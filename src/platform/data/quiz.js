// A short sample quiz and the rule-based feedback written from its answers. The real platform will draw questions from a
// reviewed bank and have the AI explain each answer; the shape of the result is what the screens rely on.
export const QUIZ = {
  title: 'Weekly check-in: Python and vectors',
  questions: [
    { id: 'q1', topic: 'Python loops', text: 'What does `for i in range(3): print(i)` print?', options: ['1 2 3', '0 1 2', '0 1 2 3', '3 3 3'], answer: 1, explain: 'range(3) gives 0, 1 and 2. It starts at zero and stops before 3.' },
    { id: 'q2', topic: 'Python loops', text: 'How many times does the loop body run in `for i in range(1, 6)`?', options: ['4', '5', '6', 'Forever'], answer: 1, explain: 'range(1, 6) gives 1 to 5, so the body runs 5 times.' },
    { id: 'q3', topic: 'Python functions', text: 'What does this return? `def double(x): return x * 2` then `double(4)`', options: ['4', '6', '8', '2'], answer: 2, explain: '4 times 2 is 8. The function hands back the result with return.' },
    { id: 'q4', topic: 'Vectors', text: 'What is the sum of the vectors (2, 3) and (1, 4)?', options: ['(3, 7)', '(2, 12)', '(3, 12)', '(1, 1)'], answer: 0, explain: 'Add each part: 2 + 1 = 3 and 3 + 4 = 7.' },
    { id: 'q5', topic: 'Vectors', text: 'What is the dot product of (1, 2) and (3, 4)?', options: ['(3, 8)', '10', '11', '14'], answer: 2, explain: 'Multiply matching parts and add: 1×3 + 2×4 = 3 + 8 = 11.' }
  ]
};

/** Marks the answers and writes feedback from which topics were right and wrong. */
export function markQuiz(answers) {
  const right = QUIZ.questions.filter(q => answers[q.id] === q.answer);
  const wrong = QUIZ.questions.filter(q => answers[q.id] !== q.answer);
  const score = Math.round((right.length / QUIZ.questions.length) * 100);
  const topics = list => [...new Set(list.map(q => q.topic))];
  const strengths = topics(right).filter(t => !topics(wrong).includes(t));
  const gaps = topics(wrong);
  const summary = score >= 80 ? 'A strong result. You are ready to move on.' : score >= 60 ? 'A solid result with a few gaps to close.' : 'This one was tough, and that is useful: it shows exactly where to practise.';
  return { score, right: right.length, total: QUIZ.questions.length, feedback: {
    summary,
    strengths: strengths.length ? strengths : ['You attempted every question'],
    gaps: gaps.length ? gaps : ['No gaps this time'],
    next: gaps.length ? gaps.map(t => `Add a short ${t.toLowerCase()} practice block this week`) : ['Move on to the next topic in your plan']
  } };
}
