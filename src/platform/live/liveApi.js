// Real data for the dashboards: calls the server (/api/v2/platform/...) and shapes what comes back for the screens.
import api from '../../api';
import { LIBRARY } from '../data/mock';

const get = url => api.get(`/v2/platform/${url}`).then(r => r.data);
const send = (method, url, body) => api[method](`/v2/platform/${url}`, body).then(r => r.data);

export const gradeLabel = g => (!g ? '' : /^\d+$/.test(g) ? `Class ${g}` : { ug1: 'College, year 1', ug2: 'College, year 2', ug3: 'College, year 3', ug4: 'College, year 4', pg: 'Postgraduate', diploma: 'Diploma' }[g] || g);
// first name for greetings; a leading title ("Dr. Neha Kapoor") is skipped
export const firstName = n => String(n || '').replace(/^(dr|mr|mrs|ms|miss|prof)\.?\s+/i, '').split(' ')[0];

export async function loadStudent() {
  const d = await get('student');
  return {
    live: true,
    me: { id: d.me.id, name: d.me.fullName, firstName: firstName(d.me.fullName), klass: gradeLabel(d.me.grade).replace('Class ', ''), gradeLabel: gradeLabel(d.me.grade), grade: d.me.grade, track: d.me.track, joined: d.me.joined,
      consent: d.me.consent, parent: d.me.parent, parentEmail: d.me.parentEmailMasked },
    goal: { title: d.me.goal },
    mentor: d.mentor, sessions: d.sessions, tasks: d.tasks, reports: d.reports, assessment: d.assessment, mentorNotes: d.mentorNotes || [],
    inbox: d.inbox || { unread: 0 }, mentorRequest: d.mentorRequest || null,
    library: LIBRARY.map(x => ({ ...x, progress: 0 }))
  };
}

export async function loadMentor() {
  const d = await get('mentor');
  return {
    live: true,
    me: { id: d.me.id, name: d.me.fullName, firstName: firstName(d.me.fullName), mentorCode: d.me.mentorCode || null, meetingUrl: d.me.meetingUrl || '', hoursSet: Boolean(d.me.hoursSet) },
    students: d.students, alerts: d.alerts, sessions: d.sessions, sessionRequests: d.sessionRequests || [], proposed: d.proposed || [], writeup: d.writeup || [], recentSessions: d.recentSessions || [],
    board: d.board || [], requests: d.requests || [], inbox: d.inbox || { unread: 0 }
  };
}

export async function loadParent(childId) {
  const home = await get('parent');
  const base = { live: true, me: { id: home.me.id, name: home.me.fullName, firstName: firstName(home.me.fullName), email: home.me.email }, children: home.children };
  const id = home.children.find(c => String(c.id) === String(childId)) ? childId : home.children[0] && home.children[0].id;
  if (!id) return { ...base, child: null, tasks: [], sessions: { next: null, upcoming: [], history: [] }, notes: [], reports: [], mentor: null };
  const c = await get(`parent/children/${id}`);
  return { ...base, child: { ...c.child, firstName: firstName(c.child.name), gradeLabel: gradeLabel(c.child.grade) }, mentor: c.mentor, loop: c.loop || null, tasks: c.tasks, sessions: c.sessions, notes: c.notes, reports: c.reports, messages: c.messages || [] };
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
  slots: () => get('student/slots'),
  addAgenda: (sessionId, text) => send('post', `sessions/${sessionId}/agenda`, { text }),
  setGoal: title => send('put', 'student/goal', { title })
};
export const mentorApi = {
  student: id => get(`mentor/students/${id}`),
  assignTask: (id, t) => send('post', `mentor/students/${id}/tasks`, t),
  setTaskStatus: (taskId, status) => send('patch', `tasks/${taskId}`, { status }),
  schedule: (id, s) => send('post', `mentor/students/${id}/sessions`, s),
  updateSession: (sessionId, body) => send('patch', `sessions/${sessionId}`, body),
  settings: () => get('mentor/settings'),
  saveSettings: body => send('put', 'mentor/settings', body),
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
  addAgenda: (sessionId, text) => send('post', `sessions/${sessionId}/agenda`, { text }),
  coach: id => get(`mentor/students/${id}/coach`)
};
/** The moves on a session, by either side (the server checks who may do what): accept, propose, decline, withdraw, respond,
 * reschedule, cancel, complete, missed, agenda. */
export const sessionApi = {
  act: (id, action, body = {}) => send('post', `sessions/${id}/${action}`, body),
  calendar: id => api.get(`/v2/platform/sessions/${id}/calendar.ics`, { responseType: 'blob' }).then(r => r.data)
};
/** The AI coach (students): chats that know the plan; actions and quizzes are checked by the server. */
const coach = (method, url = '', body) => api[method](`/v2/me/coach${url}`, body).then(r => r.data);
export const coachApi = {
  home: () => coach('get'),
  start: focus => coach('post', '/chats', focus ? { focus } : {}),
  get: id => coach('get', `/chats/${id}`),
  remove: id => coach('delete', `/chats/${id}`),
  send: (id, text) => coach('post', `/chats/${id}/messages`, { text }),
  act: (id, body) => coach('post', `/chats/${id}/act`, body),
  quiz: (id, index, answers) => coach('post', `/chats/${id}/quiz`, { index, answers }),
  feedback: (id, index, value) => coach('post', `/chats/${id}/feedback`, { index, value }),
  share: (id, note) => coach('post', `/chats/${id}/share`, note ? { note } : {}),
  apply: (id, index) => coach('post', `/chats/${id}/apply`, { index }),
  // Coach OS
  hq: () => coach('get', '/hq'),
  progress: () => coach('get', '/progress'),
  ritual: kind => coach('get', `/rituals/${kind}`),
  checkIn: (kind, body) => coach('post', `/rituals/${kind}`, body),
  applyCheckIn: id => coach('post', `/checkins/${id}/apply`),
  changes: changes => coach('post', '/changes', { changes }),
  undo: id => coach('post', `/changes/${id}/undo`),
  fixMissed: () => coach('post', '/fix/missed'),
  profile: () => coach('get', '/profile'),
  saveProfile: body => coach('put', '/profile', body),
  remember: text => coach('post', '/memory', { text }),
  forget: id => coach('delete', `/memory/${id}`),
  focusStart: body => coach('post', '/focus', body),
  focusFinish: (id, body) => coach('post', `/focus/${id}/finish`, body)
};
export const notificationsApi = {
  list: () => get('notifications'),
  read: ids => send('post', 'notifications/read', ids ? { ids } : {}),
  emails: on => send('put', 'me/emails', { on })
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
