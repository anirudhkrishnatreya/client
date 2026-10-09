// Sample data for the dashboards. Every name and number here is made up; the shapes are what the real API will return,
// so the screens do not change when the data source does. See api.js for the (async) functions the screens call.
const DAY = 86400000;
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const today = () => startOfDay(new Date());
const mondayOf = d => { const x = startOfDay(d); const k = (x.getDay() + 6) % 7; return new Date(x.getTime() - k * DAY); };
export const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(startOfDay(d).getTime() + n * DAY);
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

export const LIBRARY = [
  { id: 'r1', title: 'CS50’s Introduction to Programming with Python', provider: 'Harvard (CS50)', kind: 'Course', topic: 'Python', level: 'Beginner', hours: 30, free: true, url: 'https://cs50.harvard.edu/python/', why: 'The clearest free way to build real Python skill before machine learning.' },
  { id: 'r2', title: 'Linear Algebra', provider: 'Khan Academy', kind: 'Course', topic: 'Mathematics', level: 'Beginner', hours: 20, free: true, url: 'https://www.khanacademy.org/math/linear-algebra', why: 'Vectors and matrices are the language of every machine-learning model.' },
  { id: 'r3', title: 'Essence of Linear Algebra', provider: '3Blue1Brown', kind: 'Video series', topic: 'Mathematics', level: 'Beginner', hours: 3, free: true, url: 'https://www.3blue1brown.com/topics/linear-algebra', why: 'Builds the picture in your head, so the formulas make sense.' },
  { id: 'r4', title: 'Python for beginners', provider: 'Kaggle Learn', kind: 'Practice', topic: 'Python', level: 'Beginner', hours: 5, free: true, url: 'https://www.kaggle.com/learn/python', why: 'Short exercises you can run in the browser, with instant checks.' },
  { id: 'r5', title: 'Intro to Machine Learning', provider: 'Kaggle Learn', kind: 'Practice', topic: 'Machine learning', level: 'Beginner', hours: 4, free: true, url: 'https://www.kaggle.com/learn/intro-to-machine-learning', why: 'Your first real models, trained on real data.' },
  { id: 'r6', title: 'Practical Deep Learning for Coders', provider: 'fast.ai', kind: 'Course', topic: 'Machine learning', level: 'Intermediate', hours: 40, free: true, url: 'https://course.fast.ai', why: 'A hands-on route into deep learning once Python feels comfortable.' },
  { id: 'r7', title: 'Mathematics, Class 11 and 12 textbooks', provider: 'NCERT', kind: 'Book', topic: 'School exams', level: 'Beginner', hours: 60, free: true, url: 'https://ncert.nic.in/textbook.php', why: 'The base for your board exams and for JEE and CUET.' },
  { id: 'r8', title: 'Probability and Statistics', provider: 'NPTEL', kind: 'Course', topic: 'Mathematics', level: 'Intermediate', hours: 40, free: true, url: 'https://nptel.ac.in', why: 'Statistics is the second pillar of machine learning, taught by IIT faculty.' },
  { id: 'r9', title: 'Build a small project', provider: 'Your mentor', kind: 'Project', topic: 'Projects', level: 'Beginner', hours: 12, free: true, url: '', why: 'A project turns knowledge into proof you can show.' }
];

const BLOCK = { learn: 'learn', practice: 'practice', assess: 'assess', project: 'project', revise: 'revise', rest: 'rest' };

export function buildStudent() {
  const monday = mondayOf(today());
  const day = i => iso(addDays(monday, i));
  const blocks = [
    // [dayIndex, start, end, title, subject, type, resource id, why]
    [0, '17:00', '18:15', 'Vectors and dot products', 'Mathematics', 'learn', 'r3', 'You asked for a picture first, so we start with the video series.'],
    [0, '18:30', '19:15', 'Python: loops practice set', 'Python', 'practice', 'r4', 'Your last quiz showed loops need one more round.'],
    [1, '17:00', '18:00', 'Physics: Class 11 chapter work', 'School', 'revise', 'r7', 'Keeps your school marks steady while you build the new skills.'],
    [1, '18:15', '19:00', 'CS50 Python: functions', 'Python', 'learn', 'r1', 'Next lecture in your course.'],
    [2, '17:00', '18:15', 'Matrices: multiplying and transforming', 'Mathematics', 'learn', 'r2', 'Follows Monday’s vectors.'],
    [2, '18:30', '19:00', 'Weekly check-in quiz: Python and vectors', 'Assessment', 'assess', null, 'A short quiz to see what has stuck.'],
    [3, '17:00', '18:30', 'Mini project: number-guessing game', 'Projects', 'project', 'r9', 'Uses loops and functions together.'],
    [4, '17:00', '17:45', 'Chemistry revision', 'School', 'revise', 'r7', ''],
    [4, '18:00', '19:00', 'Kaggle: first data exercise', 'Python', 'practice', 'r4', 'Introduces working with a table of data.'],
    [5, '10:00', '11:30', 'Probability: first look', 'Mathematics', 'learn', 'r8', 'Weekend deep-dive slot.'],
    [5, '16:00', '17:00', 'Project: add a score table', 'Projects', 'project', 'r9', ''],
    [6, '10:00', '10:45', 'Plan next week with your mentor notes', 'Reflection', 'revise', null, 'Ten minutes to look back, then plan.'],
    [6, '17:00', '17:45', 'Rest and a walk', 'Rest', 'rest', null, 'Rest is part of the plan.']
  ];
  const done = new Set([0, 1, 2, 3, 4].slice(0, Math.max(0, (new Date().getDay() + 6) % 7)));
  const week = blocks.map(([d, start, end, title, subject, type, res, why], i) => ({ id: `b${i}`, date: day(d), day: d, start, end, title, subject, type: BLOCK[type], resource: res, why, done: done.has(d) && type !== 'assess' && i % 5 !== 3 }));

  const tasks = [
    { id: 't1', title: 'Finish CS50 Python lecture 2 and the problem set', subject: 'Python', due: iso(addDays(today(), 1)), status: 'doing', priority: 'high', est: 90, by: 'AI plan', source: 'r1', notes: 'Submit the three small programs from the problem set.' },
    { id: 't2', title: 'Solve 20 vector questions from Khan Academy', subject: 'Mathematics', due: iso(addDays(today(), 2)), status: 'todo', priority: 'high', est: 60, by: 'Mentor', source: 'r2', notes: 'Aim for 80% or more. Write the ones you missed in your notebook.' },
    { id: 't3', title: 'Write 5 lines on what you learned about matrices', subject: 'Mathematics', due: iso(addDays(today(), 3)), status: 'todo', priority: 'medium', est: 15, by: 'Mentor', source: null, notes: 'In your own words. Your mentor will read it on Saturday.' },
    { id: 't4', title: 'Number-guessing game: first version', subject: 'Projects', due: iso(addDays(today(), 4)), status: 'todo', priority: 'medium', est: 90, by: 'AI plan', source: 'r9', notes: 'Computer picks a number, you guess, it says higher or lower.' },
    { id: 't5', title: 'Class 11 Physics: Chapter 4 notes', subject: 'School', due: iso(addDays(today(), 1)), status: 'review', priority: 'medium', est: 45, by: 'School', source: 'r7', notes: 'Waiting for your mentor’s tick.' },
    { id: 't6', title: 'Kaggle Python: exercises 1 to 4', subject: 'Python', due: iso(addDays(today(), -1)), status: 'done', priority: 'medium', est: 50, by: 'AI plan', source: 'r4', notes: '' },
    { id: 't7', title: 'Watch: Essence of Linear Algebra, chapters 1 to 3', subject: 'Mathematics', due: iso(addDays(today(), -2)), status: 'done', priority: 'low', est: 30, by: 'AI plan', source: 'r3', notes: '' },
    { id: 't8', title: 'Set up Python on your laptop', subject: 'Python', due: iso(addDays(today(), -5)), status: 'done', priority: 'low', est: 20, by: 'Mentor', source: null, notes: '' }
  ];

  const past = [
    { id: 'a1', title: 'Python basics check-in', topic: 'Python', date: iso(addDays(today(), -9)), score: 62, max: 100, mins: 25, kind: 'Quiz', feedback: { summary: 'Good start. You understand variables and printing well. Loops are where marks were lost.', strengths: ['Variables and data types', 'Reading error messages'], gaps: ['For loops with ranges', 'Off-by-one mistakes'], next: ['Do the loops practice set on Monday', 'Re-take a short loops quiz on Wednesday'] } },
    { id: 'a2', title: 'Algebra and functions review', topic: 'Mathematics', date: iso(addDays(today(), -6)), score: 78, max: 100, mins: 30, kind: 'Quiz', feedback: { summary: 'Strong algebra. You are ready to move to vectors.', strengths: ['Solving equations', 'Graphing functions'], gaps: ['Word problems with two unknowns'], next: ['Start vectors with the 3Blue1Brown series'] } },
    { id: 'a3', title: 'Python and vectors check-in', topic: 'Python and Mathematics', date: iso(addDays(today(), -2)), score: 74, max: 100, mins: 28, kind: 'Quiz', feedback: { summary: 'Up twelve points on Python since your first check-in. Vectors are clicking.', strengths: ['Loops are much steadier', 'Adding and scaling vectors'], gaps: ['Dot product by hand'], next: ['Add a dot-product practice block on Tuesday'] } }
  ].reverse(); // newest first
  const upcoming = [
    { id: 'u1', title: 'Weekly check-in: Python and vectors', topic: 'Python and Mathematics', due: iso(addDays(today(), 1)), mins: 25, questions: 5, kind: 'Quiz' },
    { id: 'u2', title: 'Project review: number-guessing game', topic: 'Projects', due: iso(addDays(monday, 5)), mins: 15, questions: 0, kind: 'Project review' },
    { id: 'u3', title: 'Monthly skills check', topic: 'Mathematics, Python', due: iso(addDays(monday, 12)), mins: 45, questions: 12, kind: 'Skills check' }
  ];

  const r = rng(11);
  const heat = Array.from({ length: 84 }, (_, i) => (i % 7 === 6 && r() < 0.5 ? 0 : Math.round((r() < 0.18 ? 0 : 20 + r() * 80) / 5) * 5));

  return {
    me: { id: 'stu_1', name: 'Aarav Mehta', firstName: 'Aarav', klass: '11', school: 'Delhi Public School, Vidyut Nagar', board: 'CBSE', stream: 'Science (PCM)', streak: 12, xp: 3420, level: 'Builder', joined: iso(addDays(today(), -48)) },
    goal: { title: 'AI Engineer', pathway: 'B.Tech in Computer Science (AI) → Machine Learning Engineer', targetYear: 2031, why: 'I want to build systems that help doctors read scans faster.', progress: 34 },
    pillars: [
      { id: 'math', label: 'Mathematics for AI', pct: 42, tone: '' }, { id: 'python', label: 'Python programming', pct: 56, tone: 'leaf' },
      { id: 'ml', label: 'Machine learning basics', pct: 14, tone: 'gold' }, { id: 'projects', label: 'Projects', pct: 20, tone: 'coral' }, { id: 'school', label: 'School marks', pct: 78, tone: 'leaf' }
    ],
    skills: [
      { skill: 'Maths', now: 48, target: 85 }, { skill: 'Python', now: 56, target: 85 }, { skill: 'Data', now: 22, target: 80 },
      { skill: 'ML', now: 14, target: 80 }, { skill: 'Projects', now: 20, target: 75 }, { skill: 'Communication', now: 60, target: 70 }
    ],
    roadmap: [
      { id: 'p1', title: 'Foundations', period: 'Class 11', status: 'current', note: 'Python, linear algebra, first projects.', items: [{ t: 'Install Python and write first programs', done: true }, { t: 'Finish a Python course', done: false }, { t: 'Learn vectors and matrices', done: false }, { t: 'Build 2 small projects', done: false }] },
      { id: 'p2', title: 'Build', period: 'Class 12', status: 'next', note: 'Statistics, first machine-learning models, a portfolio project.', items: [{ t: 'Probability and statistics', done: false }, { t: 'Train 3 models on real data', done: false }, { t: 'Portfolio project with a write-up', done: false }, { t: 'Board exams: aim for 90%+', done: false }] },
      { id: 'p3', title: 'Entrance and admission', period: 'Class 12 to 2027', status: 'next', note: 'JEE Main, CUET and college shortlisting.', items: [{ t: 'Choose exams with your counsellor', done: false }, { t: 'Plan the exam calendar', done: false }, { t: 'Shortlist 8 colleges', done: false }] },
      { id: 'p4', title: 'College', period: '2027 to 2031', status: 'later', note: 'B.Tech in computer science with an AI focus, internships and research.', items: [{ t: 'Internship in year 2 or 3', done: false }, { t: 'Research or capstone project', done: false }] }
    ],
    week, tasks, assessments: { past, upcoming },
    library: LIBRARY.map((x, i) => ({ ...x, progress: [64, 38, 100, 30, 0, 0, 55, 0, 25][i] })),
    heat,
    weekMinutes: [{ label: 'Mon', value: 95 }, { label: 'Tue', value: 70 }, { label: 'Wed', value: 85 }, { label: 'Thu', value: 110 }, { label: 'Fri', value: 40 }, { label: 'Sat', value: 0 }, { label: 'Sun', value: 0 }],
    scoreTrend: [62, 68, 71, 70, 74, 78, 76, 82],
    mentor: { id: 'men_1', name: 'Dr. Neha Kapoor', role: 'Machine-learning researcher', since: iso(addDays(today(), -48)), next: { date: iso(addDays(today(), 3)), time: '18:30', topic: 'Review the check-in quiz and plan the first project' },
      history: [
        { id: 's3', date: iso(addDays(today(), -4)), title: 'Week 6 session', notes: 'Aarav is keen but rushes through practice sets. We agreed on ten slow minutes each day with a notebook of mistakes.', actions: ['Keep a mistakes notebook', 'Finish CS50 lecture 2'] },
        { id: 's2', date: iso(addDays(today(), -11)), title: 'Week 5 session', notes: 'Talked about why AI. Strong motivation. Agreed to start with Python before any maths-heavy topics.', actions: ['Install Python', 'Watch linear algebra series'] },
        { id: 's1', date: iso(addDays(today(), -18)), title: 'Week 4 session', notes: 'First session after the career report. Interests: computing and science; strong logic. Goal set: AI engineer.', actions: ['Read the career report with parents'] }
      ],
      messages: [
        { id: 'm1', from: 'mentor', at: iso(addDays(today(), -1)) + ' 20:10', text: 'Nice work on the Kaggle set. Try the loops practice before Wednesday’s quiz.' },
        { id: 'm2', from: 'me', at: iso(addDays(today(), -1)) + ' 20:40', text: 'Will do. I found the range() part confusing.' },
        { id: 'm3', from: 'mentor', at: iso(addDays(today(), 0)) + ' 08:05', text: 'Good question. Think of range(5) as 0,1,2,3,4. We will go through it on Saturday.' }
      ] },
    reports: [
      { id: 'rp1', title: 'Weekly progress report', date: iso(addDays(monday, -1)), kind: 'Weekly', summary: 'Python up 12 points. Vectors started. 4 of 5 study days completed.' },
      { id: 'rp2', title: 'Career Discovery Report', date: iso(addDays(today(), -20)), kind: 'Career', summary: 'Interest code IRC. Strongest in logical and numerical reasoning. Top fields: Computer Science and IT, Engineering, Maths and Data.', link: '/v4' },
      { id: 'rp3', title: 'Monthly review: September', date: iso(addDays(today(), -9)), kind: 'Monthly', summary: 'Goal progress 34%. School marks steady at 78%. Next focus: Python loops and dot products.' }
    ],
    notifications: [
      { id: 'n1', icon: 'tasks', text: 'Task due tomorrow: CS50 lecture 2 problem set', time: '2h ago', unread: true },
      { id: 'n2', icon: 'message', text: 'Dr. Kapoor replied to your question about range()', time: 'Today 8:05', unread: true },
      { id: 'n3', icon: 'sparkles', text: 'Your plan for next week is ready to review', time: 'Yesterday', unread: false },
      { id: 'n4', icon: 'award', text: 'You reached a 12-day streak', time: '2 days ago', unread: false }
    ],
    aiPlan: {
      week: iso(monday), why: [
        { icon: 'trend', text: 'Your Python score rose from 62 to 74, so loops now get one practice block, not three.' },
        { icon: 'target', text: 'Vectors come before matrices, because your quiz showed dot products as the gap.' },
        { icon: 'clock', text: 'Evenings are short on Fridays, so only light revision is planned.' }
      ]
    }
  };
}

export function buildMentor() {
  const r = rng(5);
  const students = [
    ['Aarav Mehta', '11', 'AI Engineer', 34, 12, 'on', 5, 74, 'Dr. loops practice'], ['Anika Rao', '12', 'Doctor', 61, 21, 'on', 6, 81, 'Biology mock'], ['Kabir Singh', '10', 'Game Developer', 22, 3, 'risk', 2, 58, 'Maths worksheet'],
    ['Meera Iyer', '12', 'Data Scientist', 48, 8, 'on', 4, 69, 'Statistics set'], ['Rohan Das', '11', 'Entrepreneur', 29, 0, 'risk', 1, 52, 'Business plan draft'], ['Sara Khan', '10', 'Architect', 41, 15, 'on', 5, 77, 'Sketch portfolio'],
    ['Vihaan Gupta', '12', 'Civil Services', 55, 6, 'watch', 3, 66, 'Current affairs quiz'], ['Ishita Nair', '11', 'Designer', 37, 9, 'watch', 3, 71, 'Poster project']
  ].map(([name, klass, goal, progress, streak, status, done, score, task], i) => ({
    id: `s${i + 1}`, name, klass, goal, progress, streak, status, tasksDone: done, tasksTotal: 6, score,
    lastActive: ['today', 'today', '5 days ago', 'yesterday', '9 days ago', 'today', '2 days ago', 'yesterday'][i], nextSession: ['Thu 6:30 pm', 'Thu 7:15 pm', 'Fri 5:00 pm', 'Fri 6:00 pm', 'Sat 10:00 am', 'Sat 11:00 am', 'Sun 5:30 pm', 'Sun 6:15 pm'][i], currentTask: task,
    trend: Array.from({ length: 8 }, (_, k) => Math.round(score - 14 + k * 2 + (r() * 6 - 3))), mood: ['good', 'great', 'low', 'good', 'low', 'great', 'ok', 'good'][i]
  }));
  return {
    me: { id: 'men_1', name: 'Dr. Neha Kapoor', role: 'Mentor', field: 'Machine learning and data science' },
    students,
    sessions: [
      { id: 'x1', studentId: 's1', when: 'Thu 6:30 pm', topic: 'Quiz review and first project', prepped: true }, { id: 'x2', studentId: 's2', when: 'Thu 7:15 pm', topic: 'Biology mock and NEET plan', prepped: true },
      { id: 'x3', studentId: 's3', when: 'Fri 5:00 pm', topic: 'Re-start routine after missed week', prepped: false }, { id: 'x4', studentId: 's4', when: 'Fri 6:00 pm', topic: 'Statistics problem set', prepped: false },
      { id: 'x5', studentId: 's5', when: 'Sat 10:00 am', topic: 'Check in: no activity for 9 days', prepped: false }
    ],
    alerts: [
      { id: 'al1', studentId: 's5', level: 'high', text: 'Rohan has not logged in for 9 days and has 4 overdue tasks.' },
      { id: 'al2', studentId: 's3', level: 'high', text: 'Kabir missed all three study blocks this week; his last quiz was 58%.' },
      { id: 'al3', studentId: 's7', level: 'medium', text: 'Vihaan’s quiz scores dipped for two weeks in a row.' },
      { id: 'al4', studentId: 's2', level: 'good', text: 'Anika hit a 21-day streak and her mock score rose to 81%.' }
    ],
    weekly: [{ label: 'Mon', value: 6 }, { label: 'Tue', value: 7 }, { label: 'Wed', value: 5 }, { label: 'Thu', value: 8 }, { label: 'Fri', value: 4 }, { label: 'Sat', value: 3 }, { label: 'Sun', value: 2 }]
  };
}

export function buildParent() {
  const s = buildStudent();
  return {
    me: { id: 'par_1', name: 'Rhea Mehta', relation: 'Mother' },
    child: s.me, goal: s.goal, week: s.week, tasks: s.tasks, assessments: s.assessments, scoreTrend: s.scoreTrend, weekMinutes: s.weekMinutes, heat: s.heat, mentor: { name: s.mentor.name, role: s.mentor.role, next: s.mentor.next },
    digest: { headline: 'A steady week with one thing to watch', points: [
      { tone: 'leaf', text: '4 of 5 planned study days completed. That is the best week this term.' },
      { tone: 'leaf', text: 'Python quiz score rose from 62 to 74.' },
      { tone: 'gold', text: 'Practice sets are sometimes rushed. His mentor has set up a short mistakes notebook.' },
      { tone: 'coral', text: 'One task is due tomorrow: CS50 lecture 2 problem set.' }
    ] },
    mentorNotes: [
      { id: 'pn1', date: s.mentor.history[0].date, text: 'Aarav is keen and curious. We are working on slowing down during practice so mistakes teach him more.' },
      { id: 'pn2', date: s.mentor.history[1].date, text: 'He has a clear reason for choosing AI. We started with Python, because it gives quick wins.' }
    ],
    notifications: [
      { id: 'pnn1', icon: 'tasks', text: 'Aarav completed 3 tasks this week', time: 'Today', unread: true },
      { id: 'pnn2', icon: 'chart', text: 'New weekly report is ready', time: 'Yesterday', unread: true },
      { id: 'pnn3', icon: 'calendar', text: 'Mentor session on Thursday at 6:30 pm', time: '2 days ago', unread: false }
    ],
    reports: s.reports
  };
}
