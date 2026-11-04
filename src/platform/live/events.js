// Live updates from the server: one stream per signed-in tab (Server-Sent Events). The server only says "this changed"; screens
// then fetch what they need. When the stream is down, screens fall back to checking now and then, and everything is fetched
// again when it comes back.
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { API_URL } from '../../api';

export const TYPES = ['ready', 'message.new', 'message.read', 'session.changed', 'task.changed', 'link.changed', 'note.shared', 'notification.new', 'notification.read'];

function createHub() {
  const subs = new Map();
  return {
    on(type, fn) { if (!subs.has(type)) subs.set(type, new Set()); subs.get(type).add(fn); return () => subs.get(type).delete(fn); },
    emit(type, data) { for (const fn of subs.get(type) || []) { try { fn(data, type); } catch { /* one screen's handler must not stop the others */ } } }
  };
}

export const EventsCtx = createContext({ hub: null, status: 'off' });

/** Opens the stream while `enabled`, reconnecting with a fresh ticket after a drop (1 s, doubling up to 30 s). */
export function useStream(enabled) {
  const hub = useMemo(createHub, []);
  const [status, setStatus] = useState('off');                       // off · connecting · open · down
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof window.EventSource !== 'function') return undefined;
    let es = null; let stopped = false; let retry = 1000; let timer = null;
    const schedule = () => { if (stopped) return; clearTimeout(timer); timer = setTimeout(connect, retry); retry = Math.min(retry * 2, 30000); };
    async function connect() {
      if (stopped || es) return;
      setStatus(s => (s === 'open' ? s : 'connecting'));
      try {
        const { ticket } = (await api.post('/v2/live/ticket')).data;
        if (stopped) return;
        es = new window.EventSource(`${API_URL}/v2/live?ticket=${encodeURIComponent(ticket)}`);
        for (const t of TYPES) {
          es.addEventListener(t, e => {
            let d = {}; try { d = JSON.parse(e.data); } catch { /* keep {} */ }
            if (t === 'ready') { retry = 1000; setStatus('open'); }
            hub.emit(t, d);
          });
        }
        es.onerror = () => { if (es) es.close(); es = null; setStatus('down'); schedule(); };
      } catch { setStatus('down'); schedule(); }
    }
    const wake = () => { if (document.visibilityState !== 'hidden' && !es && !stopped) { retry = 1000; clearTimeout(timer); connect(); } };
    connect();
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    return () => { stopped = true; clearTimeout(timer); if (es) es.close(); document.removeEventListener('visibilitychange', wake); window.removeEventListener('online', wake); };
  }, [enabled, hub]);
  return useMemo(() => ({ hub, status }), [hub, status]);
}

/** Calls `handler(data, type)` for each event of the given type(s) while the component is on screen. */
export function useLiveEvent(types, handler) {
  const { hub } = useContext(EventsCtx);
  const ref = useRef(handler);
  ref.current = handler;
  const key = [].concat(types).join(',');
  useEffect(() => {
    if (!hub) return undefined;
    const offs = key.split(',').map(t => hub.on(t, (d, ty) => ref.current(d, ty)));
    return () => offs.forEach(off => off());
  }, [hub, key]);
}

/** 'open' when updates arrive by themselves; anything else means screens should check now and then. */
export const useLiveStatus = () => useContext(EventsCtx).status;
