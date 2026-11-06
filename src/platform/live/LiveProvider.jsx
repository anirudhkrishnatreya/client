import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ctx } from '../data/store';
import { loadStudent, loadMentor, loadParent, loadSchool, studentApi, mentorApi, parentApi, notificationsApi } from './liveApi';
import { EventsCtx, useStream } from './events';

// what each kind of notification looks like under the bell
const ICON = { message: 'message', session: 'calendar', task: 'tasks', note: 'file', link: 'users' };
const ago = at => {
  const m = Math.round((Date.now() - new Date(at).getTime()) / 60000);
  if (m < 1) return 'Just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  return new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const shape = n => ({ id: n.id, icon: ICON[n.kind] || 'bell', text: n.title, sub: n.text, time: ago(n.at), unread: !n.read, link: n.link });

/**
 * Same shape as the sample provider ({ role, data, actions }), but backed by the server. Every change is saved, then the screen
 * reloads; changes made by someone else arrive through the live stream and reload it too.
 */
export default function LiveProvider({ role, children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [childId, setChildId] = useState(() => { try { return sessionStorage.getItem('imenteo-child') || null; } catch { return null; } });
  const [bell, setBell] = useState({ items: [], unread: 0, emails: true });
  const stream = useStream(true);

  const reload = useCallback(async (child = childId) => {
    try {
      const d = role === 'student' ? await loadStudent() : role === 'mentor' ? await loadMentor() : role === 'school' ? await loadSchool() : await loadParent(child);
      setData(d); setError(null);
    } catch (e) { setError(e); }
  }, [role, childId]);
  const loadBell = useCallback(() => notificationsApi.list().then(r => setBell({ items: (r.notifications || []).map(shape), unread: r.unread || 0, emails: r.emails !== false })).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { loadBell(); }, [loadBell]);

  // someone else changed something: fetch again (a burst of events becomes one reload)
  const timer = useRef(null);
  const later = useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(() => reload(), 400); }, [reload]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const { hub } = stream;
    let first = true;
    const offs = [
      ...['message.new', 'session.changed', 'task.changed', 'link.changed', 'note.shared'].map(t => hub.on(t, later)),
      hub.on('ready', () => { if (first) { first = false; return; } later(); loadBell(); }),      // back after a drop: catch up
      hub.on('notification.new', loadBell), hub.on('notification.read', loadBell)
    ];
    return () => offs.forEach(off => off());
  }, [stream, later, loadBell]);

  // `run` performs a change on the server and then refreshes; the caller gets the server's answer (or its error).
  const run = useCallback(async fn => { const out = await fn(); await reload(); return out; }, [reload]);
  const actions = useMemo(() => ({
    reload,
    markRead: () => { setBell(b => ({ ...b, unread: 0, items: b.items.map(n => ({ ...n, unread: false })) })); return notificationsApi.read().catch(() => {}); },
    readOne: id => { setBell(b => ({ ...b, unread: Math.max(0, b.unread - (b.items.find(n => n.id === id && n.unread) ? 1 : 0)), items: b.items.map(n => (n.id === id ? { ...n, unread: false } : n)) })); return notificationsApi.read([id]).catch(() => {}); },
    setEmails: on => { setBell(b => ({ ...b, emails: on })); return notificationsApi.emails(on).catch(() => setBell(b => ({ ...b, emails: !on }))); },
    // student
    addTask: t => run(() => (role === 'parent' ? parentApi.addTask(data.child.id, t) : studentApi.addTask({ title: t.title, subject: t.subject, due: t.due, priority: t.priority, notes: t.notes }))),
    updateTask: (id, body) => run(() => (role === 'mentor' ? mentorApi.updateTask(id, body) : role === 'parent' ? parentApi.updateTask(id, body) : studentApi.updateTask(id, body))),
    deleteTask: id => run(() => (role === 'mentor' ? mentorApi.deleteTask(id) : role === 'parent' ? parentApi.deleteTask(id) : studentApi.deleteTask(id))),
    setTaskStatus: (id, status) => { setData(d => d && ({ ...d, tasks: d.tasks.map(t => (t.id === id ? { ...t, status } : t)) })); return run(() => (role === 'mentor' ? mentorApi.setTaskStatus(id, status) : studentApi.setTaskStatus(id, status))); },
    setGoal: title => run(() => studentApi.setGoal(title)),
    // mentor
    loadStudent: id => mentorApi.student(id),
    assignTask: (id, t) => run(() => mentorApi.assignTask(id, t)),
    schedule: (id, s) => run(() => mentorApi.schedule(id, s)),
    updateSession: (sid, body) => run(() => mentorApi.updateSession(sid, body)),
    addNote: (id, n) => mentorApi.addNote(id, n),
    // parent
    selectChild: id => { setChildId(id); try { sessionStorage.setItem('imenteo-child', id); } catch { /* ignore */ } setData(null); }
  }), [reload, run, role, data]);

  const shown = useMemo(() => (data ? { ...data, notifications: bell.items, notificationsUnread: bell.unread, emails: bell.emails } : null), [data, bell]);
  const value = useMemo(() => ({ role, data: shown, actions, error, live: true }), [role, shown, actions, error]);
  return <EventsCtx.Provider value={stream}><Ctx.Provider value={value}>{children}</Ctx.Provider></EventsCtx.Provider>;
}
