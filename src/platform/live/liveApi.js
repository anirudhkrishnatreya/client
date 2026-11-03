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

const recent = (at, days = 7) => at && Date.now() - new Date(at).getTime() < days * 86400000;
/** What the mentor did that the student should hear about: messages, feedback, a summary, an answer to a session request. */
function mentorNudges(d) {
  const out = [];
  const unread = (d.inbox && d.inbox.unread) || 0;
  if (unread) out.push(note('msg', 'message', `${unread} new message${unread > 1 ? 's' : ''} from your mentor`, 'Mentor'));
  for (const t of d.tasks.filter(x => x.feedback && recent(x.feedback.at))) out.push(note(`fb${t.id}`, 'check', `Your mentor gave feedback on “${t.title}”`, fmtDate(String(t.feedback.at).slice(0, 10))));
  for (const n of (d.mentorNotes || []).filter(x => x.kind === 'summary' && recent(x.at))) out.push(note(`sum${n.id}`, 'file', `Your mentor sent a weekly summary: ${n.title || 'this week'}`, fmtDate(n.at)));
  for (const s of ((d.sessions && d.sessions.declined) || [])) out.push(note(`dec${s.id}`, 'calendar', `Your mentor could not do ${fmtDate(s.date)}${s.note ? `: ${s.note}` : ''}`, 'Session'));
  if (d.mentorRequest && d.mentorRequest.status === 'pending') out.push(note('req', 'users', `Waiting for ${d.mentorRequest.mentor ? d.mentorRequest.mentor.name : 'the mentor'} to accept your request`, 'Mentor'));
  return out;
}

export async function loadStudent() {
  const d = await get('student');
  return {
    live: true,
    me: { id: d.me.id, name: d.me.fullName, firstName: firstName(d.me.fullName), klass: gradeLabel(d.me.grade).replace('Class ', ''), gradeLabel: gradeLabel(d.me.grade), grade: d.me.grade, track: d.me.track, joined: d.me.joined,
      consent: d.me.consent, parent: d.me.parent, parentEmail: d.me.parentEmailMasked },
    goal: { title: d.me.goal },
    mentor: d.mentor, sessions: d.sessions, tasks: d.tasks, reports: d.reports, assessment: d.assessment, mentorNotes: d.mentorNotes || [],
    inbox: d.inbox || { unread: 0 }, mentorRequest: d.mentorRequest || null,
    library: LIBRARY.map(x => ({ ...x, progress: 0 })),
    notifications: [...mentorNudges(d), ...nudges(d.tasks, d.sessions.next)].slice(0, 10)
  };
}

export async function loadMentor() {
  const d = await get('mentor');
  return {
    live: true,
    me: { id: d.me.id, name: d.me.fullName, firstName: firstName(d.me.fullName), mentorCode: d.me.mentorCode || null },
    students: d.students, alerts: d.alerts, sessions: d.sessions, sessionRequests: d.sessionRequests || [], board: d.board || [], requests: d.requests || [], inbox: d.inbox || { unread: 0 },
    notifications: d.alerts.filter(a => a.level !== 'good').slice(0, 8).map(a => note(a.id, a.level === 'high' ? 'alert' : 'info', a.text, ''))
  };
}

export async function loadParent(childId) {
  const home = await get('parent');
  const base = { live: true, me: { id: home.me.id, name: home.me.fullName, firstName: firstName(home.me.fullName), email: home.me.email }, children: home.children };
  const id = home.children.find(c => String(c.id) === String(childId)) ? childId : home.children[0] && home.children[0].id;
  if (!id) return { ...base, child: null, tasks: [], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [], mentor: null, notifications: [] };
  const c = await get(`parent/children/${id}`);
  return { ...base, child: { ...c.child, firstName: firstName(c.child.name), gradeLabel: gradeLabel(c.child.grade) }, mentor: c.mentor, loop: c.loop || null, tasks: c.tasks, sessions: c.sessions, notes: c.notes, reports: c.reports, messages: c.messages || [],
    notifications: nudges(c.tasks, c.sessions.next, `${firstName(c.child.name)}: `) };
}

export const studentApi = {
  addTask: t => send('post', 'tasks', t),
  setTaskStatus: (id, status) => send('patch', `tasks/${id}`, { status }),
  updateTask: (id, body) => send('patch', `tasks/${id}`, body),
  deleteTask: id => send('delete', `tasks/${id}`),
  messages: () => get('student/messages'),
  sendMessage: (text, ref) => send('post', 'student/messages', { text, ...(ref ? { ref } : {}) }),
  requestMentor: (code, note) => send('post', 'student/mentor-request', { code, note }),
  cancelMentorRequest: () => send('delete', 'student/mentor-request'),
  requestSession: body => send('post', 'student/sessions', body),
  cancelSession: id => send('delete', `student/sessions/${id}`),
  addAgenda: (sessionId, text) => send('post', `sessions/${sessionId}/agenda`, { text }),
  setGoal: title => send('put', 'student/goal', { title })
};
export const mentorApi = {
  student: id => get(`mentor/students/${id}`),
  assignTask: (id, t) => send('post', `mentor/students/${id}/tasks`, t),
  setTaskStatus: (taskId, status) => send('patch', `tasks/${taskId}`, { status }),
  schedule: (id, s) => send('post', `mentor/students/${id}/sessions`, s),
  updateSession: (sessionId, body) => send('patch', `sessions/${sessionId}`, body),
  addNote: (id, n) => send('post', `mentor/students/${id}/notes`, n),
  replyLoop: (id, feedbackId, text) => send('post', `mentor/students/${id}/loop-feedback/${feedbackId}`, { text }),
  updateTask: (taskId, body) => send('patch', `tasks/${taskId}`, body),
  deleteTask: taskId => send('delete', `tasks/${taskId}`),
  allTasks: () => get('mentor/tasks'),
  bulkAssign: body => send('post', 'mentor/tasks', body),
  digest: id => get(`mentor/students/${id}/digest`),
  draftSummary: id => send('post', `mentor/students/${id}/summary/draft`),
  assistant: messages => send('post', 'mentor/assistant', { messages }),
  act: action => send('post', 'mentor/assistant/act', { action }),
  code: () => get('mentor/code'),
  newCode: () => send('post', 'mentor/code'),
  decide: (requestId, accept) => send('post', `mentor/requests/${requestId}`, { accept }),
  inbox: () => get('mentor/inbox'),
  thread: id => get(`mentor/students/${id}/messages`),
  sendMessage: (id, text) => send('post', `mentor/students/${id}/messages`, { text }),
  addAgenda: (sessionId, text) => send('post', `sessions/${sessionId}/agenda`, { text })
};
export const parentApi = {
  addTask: (childId, t) => send('post', `parent/children/${childId}/tasks`, t),
  updateTask: (taskId, body) => send('patch', `tasks/${taskId}`, body),
  deleteTask: taskId => send('delete', `tasks/${taskId}`)
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
