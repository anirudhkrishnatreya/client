// Real data for the dashboards: calls the server (/api/v2/platform/...) and shapes what comes back for the screens.
import api from '../../api';
import { LIBRARY } from '../data/mock';
import { daysFromToday, fmtDate } from '../ui/format';

const get = url => api.get(`/v2/platform/${url}`).then(r => r.data);
const send = (method, url, body) => api[method](`/v2/platform/${url}`, body).then(r => r.data);

export const gradeLabel = g => (!g ? '' : /^\d+$/.test(g) ? `Class ${g}` : { ug1: 'College, year 1', ug2: 'College, year 2', ug3: 'College, year 3', ug4: 'College, year 4', pg: 'Postgraduate', diploma: 'Diploma' }[g] || g);
// first name for greetings; a leading title ("Dr. Neha Kapoor") is skipped
export const firstName = n => String(n || '').replace(/^(dr|mr|mrs|ms|miss|prof)\.?\s+/i, '').split(' ')[0];

const note = (id, icon, text, time) => ({ id, icon, text, time, unread: true });

/** Nudges worked out from tasks and sessions (no stored notifications yet). */
function nudges(tasks, session, who = '') {
  const out = [];
  for (const t of tasks.filter(x => x.status !== 'done')) {
    const d = daysFromToday(t.due);
    if (d < 0) out.push(note(`o${t.id}`, 'alert', `${who}Task overdue: ${t.title}`, `${-d} day${d === -1 ? '' : 's'} ago`));
    else if (d <= 1) out.push(note(`d${t.id}`, 'tasks', `${who}Task due ${d === 0 ? 'today' : 'tomorrow'}: ${t.title}`, fmtDate(t.due)));
  }
  if (session && daysFromToday(session.date) <= 3) out.push(note(`s${session.id}`, 'calendar', `${who}Mentor session ${fmtDate(session.date)}${session.time ? `, ${session.time}` : ''}`, 'Coming up'));
  return out.slice(0, 8);
}

export async function loadStudent() {
  const d = await get('student');
  return {
    live: true,
    me: { id: d.me.id, name: d.me.fullName, firstName: firstName(d.me.fullName), klass: gradeLabel(d.me.grade).replace('Class ', ''), gradeLabel: gradeLabel(d.me.grade), grade: d.me.grade, track: d.me.track, joined: d.me.joined,
      consent: d.me.consent, parent: d.me.parent, parentEmail: d.me.parentEmailMasked },
    goal: { title: d.me.goal },
    mentor: d.mentor, sessions: d.sessions, tasks: d.tasks, reports: d.reports, assessment: d.assessment,
    library: LIBRARY.map(x => ({ ...x, progress: 0 })),
    notifications: nudges(d.tasks, d.sessions.next)
  };
}

export async function loadMentor() {
  const d = await get('mentor');
  return {
    live: true,
    me: { id: d.me.id, name: d.me.fullName, firstName: firstName(d.me.fullName) },
    students: d.students, alerts: d.alerts, sessions: d.sessions,
    notifications: d.alerts.filter(a => a.level !== 'good').slice(0, 8).map(a => note(a.id, a.level === 'high' ? 'alert' : 'info', a.text, ''))
  };
}

export async function loadParent(childId) {
  const home = await get('parent');
  const base = { live: true, me: { id: home.me.id, name: home.me.fullName, firstName: firstName(home.me.fullName), email: home.me.email }, children: home.children };
  const id = home.children.find(c => String(c.id) === String(childId)) ? childId : home.children[0] && home.children[0].id;
  if (!id) return { ...base, child: null, tasks: [], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [], mentor: null, notifications: [] };
  const c = await get(`parent/children/${id}`);
  return { ...base, child: { ...c.child, firstName: firstName(c.child.name), gradeLabel: gradeLabel(c.child.grade) }, mentor: c.mentor, tasks: c.tasks, sessions: c.sessions, notes: c.notes, reports: c.reports,
    notifications: nudges(c.tasks, c.sessions.next, `${firstName(c.child.name)}: `) };
}

export const studentApi = {
  addTask: t => send('post', 'tasks', t),
  setTaskStatus: (id, status) => send('patch', `tasks/${id}`, { status }),
  setGoal: title => send('put', 'student/goal', { title })
};
export const mentorApi = {
  student: id => get(`mentor/students/${id}`),
  assignTask: (id, t) => send('post', `mentor/students/${id}/tasks`, t),
  setTaskStatus: (taskId, status) => send('patch', `tasks/${taskId}`, { status }),
  schedule: (id, s) => send('post', `mentor/students/${id}/sessions`, s),
  updateSession: (sessionId, body) => send('patch', `sessions/${sessionId}`, body),
  addNote: (id, n) => send('post', `mentor/students/${id}/notes`, n)
};

/** Reports are opened through the viewer's own route so each role reads them under its own access rule. */
export const reportApi = {
  mentor: (studentId, aid) => get(`mentor/students/${studentId}/reports/${aid}/full`),
  parent: (childId, aid) => get(`parent/children/${childId}/reports/${aid}/full`),
  pdf: (kind, personId, aid) => api.get(`/v2/platform/${kind === 'mentor' ? 'mentor/students' : 'parent/children'}/${personId}/reports/${aid}/pdf`, { responseType: 'blob' }).then(r => r.data)
};

export const errMessage = (e, fallback = 'Something went wrong. Please try again.') => {
  const d = e && e.response && e.response.data;
  if (d && d.details) return Object.values(d.details).flat().join('. ');
  return fallback;
};
