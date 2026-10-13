import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ctx } from '../data/store';
import { loadStudent, loadMentor, loadParent, studentApi, mentorApi } from './liveApi';

/** Same shape as the sample provider ({ role, data, actions }), but backed by the server. Every change is saved, then the screen reloads. */
export default function LiveProvider({ role, children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [childId, setChildId] = useState(() => { try { return sessionStorage.getItem('imenteo-child') || null; } catch { return null; } });
  const [read, setRead] = useState(() => new Set());

  const reload = useCallback(async (child = childId) => {
    try {
      const d = role === 'student' ? await loadStudent() : role === 'mentor' ? await loadMentor() : await loadParent(child);
      setData(d); setError(null);
    } catch (e) { setError(e); }
  }, [role, childId]);
  useEffect(() => { reload(); }, [reload]);

  // `run` performs a change on the server and then refreshes; the caller gets the server's answer (or its error).
  const run = useCallback(async fn => { const out = await fn(); await reload(); return out; }, [reload]);
  const actions = useMemo(() => ({
    reload,
    markRead: () => setRead(new Set((data ? data.notifications : []).map(n => n.id))),
    // student
    addTask: t => run(() => studentApi.addTask({ title: t.title, subject: t.subject, due: t.due, priority: t.priority })),
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

  const shown = useMemo(() => (data ? { ...data, notifications: data.notifications.map(n => ({ ...n, unread: n.unread && !read.has(n.id) })) } : null), [data, read]);
  const value = useMemo(() => ({ role, data: shown, actions, error, live: true }), [role, shown, actions, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
