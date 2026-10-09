// Sidebar structure for each role.
export const NAV = {
  student: [
    { section: 'Learn', items: [
      { to: '', label: 'Overview', icon: 'home', end: true }, { to: 'goal', label: 'My goal', icon: 'target' }, { to: 'plan', label: 'Weekly plan', icon: 'calendar' },
      { to: 'tasks', label: 'Tasks', icon: 'tasks', badge: 'tasks' }, { to: 'assessments', label: 'Assessments', icon: 'clipboard' }, { to: 'library', label: 'Learning library', icon: 'book' }] },
    { section: 'Grow', items: [
      { to: 'reports', label: 'Reports', icon: 'chart' }, { to: 'mentor', label: 'Mentor', icon: 'users' }, { to: 'coach', label: 'AI coach', icon: 'sparkles' }] }
  ],
  mentor: [
    { section: 'Mentoring', items: [
      { to: '', label: 'Overview', icon: 'home', end: true }, { to: 'students', label: 'My students', icon: 'users' }, { to: 'sessions', label: 'Sessions', icon: 'calendar', badge: 'sessions' },
      { to: 'tasks', label: 'Assign tasks', icon: 'tasks' }, { to: 'insights', label: 'Insights', icon: 'chart' }] }
  ],
  parent: [
    { section: 'Your child', items: [
      { to: '', label: 'Overview', icon: 'home', end: true }, { to: 'progress', label: 'Progress', icon: 'trend' }, { to: 'tasks', label: 'Tasks and scores', icon: 'tasks' },
      { to: 'reports', label: 'Reports', icon: 'chart' }, { to: 'mentor', label: 'Mentor notes', icon: 'users' }] }
  ]
};
export const ROLE_LABEL = { student: 'Student', mentor: 'Mentor', parent: 'Parent' };
