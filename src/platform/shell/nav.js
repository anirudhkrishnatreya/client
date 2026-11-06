import { REC_ENABLED } from '../live/careers/config';
import { LOOP_ENABLED } from '../live/loop/config';
import { PAY_ENABLED } from '../../pay/payApi';

// Sidebar structure for each role.
export const NAV = {
  student: [
    { section: 'Learn', items: [
      { to: '', label: 'Overview', icon: 'home', end: true }, { to: 'goal', label: 'My goal', icon: 'target' }, { to: 'plan', label: 'Weekly plan', icon: 'calendar' },
      { to: 'tasks', label: 'Tasks', icon: 'tasks', badge: 'tasks' }, { to: 'assessments', label: 'Assessments', icon: 'clipboard' }, { to: 'library', label: 'Learning library', icon: 'book' }] },
    { section: 'Grow', items: [
      ...(LOOP_ENABLED ? [{ to: 'portfolio', label: 'My portfolio', icon: 'award' }] : []),
      ...(PAY_ENABLED ? [{ to: 'billing', label: 'My plan', icon: 'bolt' }] : []),
      { to: 'reports', label: 'Reports', icon: 'chart' }, { to: 'mentor', label: 'Mentor', icon: 'users', badge: 'messages' }, { to: 'coach', label: 'AI coach', icon: 'sparkles' }, { to: 'mentor-view', label: 'What my mentor sees', icon: 'eye' }] },
    ...(REC_ENABLED ? [{ section: 'Careers', items: [
      { to: 'careers', label: 'Suggested for you', icon: 'sparkles' }, { to: 'explore', label: 'Explore careers', icon: 'search' },
      { to: 'shortlist', label: 'My shortlist', icon: 'star' }, { to: 'situation', label: 'My situation', icon: 'info' }] }] : [])
  ],
  mentor: [
    { section: 'Mentoring', items: [
      { to: '', label: 'Overview', icon: 'home', end: true }, { to: 'command', label: 'Command centre', icon: 'brain' }, { to: 'students', label: 'My students', icon: 'users' }, { to: 'messages', label: 'Messages', icon: 'message', badge: 'messages' }, { to: 'sessions', label: 'Sessions', icon: 'calendar', badge: 'sessions' },
      { to: 'tasks', label: 'Tasks', icon: 'tasks' }, { to: 'assistant', label: 'Assistant', icon: 'sparkles' }, { to: 'insights', label: 'Insights', icon: 'chart' }] }
  ],
  parent: [
    { section: 'Your child', items: [
      { to: '', label: 'Overview', icon: 'home', end: true }, { to: 'progress', label: 'Progress', icon: 'trend' }, { to: 'tasks', label: 'Tasks and scores', icon: 'tasks' },
      { to: 'reports', label: 'Reports', icon: 'chart' }, { to: 'mentor', label: 'Mentor notes', icon: 'users' }] }
  ]
};
// a school's staff (role counsellor) work in the school console
NAV.school = [
  { section: 'School', items: [
    { to: '', label: 'Dashboard', icon: 'home', end: true }, { to: 'students', label: 'Students', icon: 'users' }, { to: 'classes', label: 'Classes', icon: 'layers' },
    { to: 'curriculum', label: 'Study plans', icon: 'book' }, { to: 'mentors', label: 'Mentors', icon: 'user' }, { to: 'settings', label: 'Settings', icon: 'settings' }] }
];
export const ROLE_LABEL = { student: 'Student', mentor: 'Mentor', parent: 'Parent', school: 'School' };
