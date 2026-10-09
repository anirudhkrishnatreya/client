import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadBundle } from './api';
import { iso } from './mock';

const Ctx = createContext(null);
export const usePlatform = () => useContext(Ctx);
const KEY = role => `imenteo-platform-sample-${role}-v1`;
const read = role => { try { return JSON.parse(localStorage.getItem(KEY(role))); } catch { return null; } };
const write = (role, v) => { try { localStorage.setItem(KEY(role), JSON.stringify(v)); } catch { /* storage may be blocked: the sample still works for this visit */ } };

/** Holds one role's data and the actions that change it. State is kept in the browser while the platform runs on sample data. */
export function PlatformProvider({ role, children, latency }) {
  const [data, setData] = useState(() => read(role));
  useEffect(() => {
    let alive = true;
    if (!data) loadBundle(role, { latency }).then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (data) write(role, data); }, [role, data]);

  const patch = useCallback(fn => setData(d => fn(JSON.parse(JSON.stringify(d)))), []);
  const actions = useMemo(() => ({
    reset: () => { try { localStorage.removeItem(KEY(role)); } catch { /* ignore */ } setData(null); loadBundle(role, { latency }).then(setData); },
    // student
    addBlock: block => patch(d => { d.week.push({ id: `b${Date.now()}`, done: false, why: 'Added by your AI coach.', resource: null, ...block }); return d; }),
    toggleBlock: id => patch(d => { const b = d.week.find(x => x.id === id); if (b) b.done = !b.done; return d; }),
    setTaskStatus: (id, status) => patch(d => { const t = d.tasks.find(x => x.id === id); if (t) t.status = status; return d; }),
    addTask: task => patch(d => { d.tasks.unshift({ id: `t${Date.now()}`, status: 'todo', priority: 'medium', est: 30, by: 'You', source: null, notes: '', ...task }); return d; }),
    finishQuiz: (id, result) => patch(d => {
      const u = d.assessments.upcoming.find(x => x.id === id);
      d.assessments.upcoming = d.assessments.upcoming.filter(x => x.id !== id);
      d.assessments.past.unshift({ id: `a${Date.now()}`, title: u ? u.title : 'Quiz', topic: u ? u.topic : '', date: iso(new Date()), kind: 'Quiz', mins: result.mins, score: result.score, max: 100, feedback: result.feedback });
      d.scoreTrend = [...d.scoreTrend.slice(-7), result.score];
      return d;
    }),
    sendMentorMessage: text => patch(d => { d.mentor.messages.push({ id: `m${Date.now()}`, from: 'me', at: `${iso(new Date())} ${new Date().toTimeString().slice(0, 5)}`, text }); return d; }),
    markRead: () => patch(d => { d.notifications = d.notifications.map(n => ({ ...n, unread: false })); return d; }),
    // mentor
    assignTask: (studentId, task) => patch(d => { const s = d.students.find(x => x.id === studentId); if (s) { s.tasksTotal += 1; s.currentTask = task.title; } d.assigned = [{ id: `as${Date.now()}`, studentId, ...task }, ...(d.assigned || [])]; return d; }),
    saveNote: (studentId, note) => patch(d => { d.notes = [{ id: `nt${Date.now()}`, studentId, at: iso(new Date()), ...note }, ...(d.notes || [])]; const x = d.sessions.find(s => s.studentId === studentId); if (x) x.prepped = true; return d; })
  }), [patch, role, latency]);

  const value = useMemo(() => ({ role, data, actions }), [role, data, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
