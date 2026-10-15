import { useCallback, useEffect, useState } from 'react';
import { usePlatform } from '../../data/store';
import { rec, messageFor, codeOf } from './recApi';

/** The student's newest finished assessment, or null. */
export function useLatestAssessment() {
  const { data } = usePlatform();
  const list = (data && data.reports) || [];
  return list.slice().sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0] || null;
}

/** Loads something once and keeps its state: { data, error, loading }. A closed feature is `closed`, not an error. */
export function useLoad(load, deps) {
  const [s, setS] = useState({ data: null, error: null, closed: false, loading: true });
  useEffect(() => {
    let live = true;
    setS(x => ({ ...x, loading: true }));
    load().then(({ data }) => live && setS({ data, error: null, closed: false, loading: false }))
      .catch(e => live && setS({ data: null, error: e, closed: codeOf(e) === 'V5_DISABLED', loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return s;
}

/** The student's shortlist with save / drop that update the screen straight away. */
export function useShortlist() {
  const [items, setItems] = useState(null);
  const [closed, setClosed] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { rec.shortlist().then(({ data }) => setItems(data.shortlist)).catch(e => { setItems([]); setClosed(codeOf(e) === 'V5_DISABLED'); }); }, []);
  const active = (items || []).filter(i => i.status !== 'dropped');
  const has = id => active.some(i => i.occupationId === id);
  const toggle = useCallback(async (occupationId) => {
    setNotice('');
    try {
      if (active.some(i => i.occupationId === occupationId)) { await rec.remove(occupationId); setItems(xs => xs.filter(i => i.occupationId !== occupationId)); }
      else { const { data } = await rec.save(occupationId); setItems(xs => [...xs.filter(i => i.occupationId !== occupationId), data.item]); }
    } catch (e) { setNotice(messageFor(e)); }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const patch = useCallback(async (occupationId, body) => {
    setNotice('');
    try { const { data } = await rec.update(occupationId, body); setItems(xs => xs.map(i => (i.occupationId === occupationId ? data.item : i))); return true; }
    catch (e) { setNotice(messageFor(e)); return false; }
  }, []);
  return { items, active, has, toggle, patch, notice, closed, ready: items !== null };
}
