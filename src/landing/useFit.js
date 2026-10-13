import { useEffect, useRef, useState } from 'react';

/** Width of an element, kept up to date. The landing stages scale a fixed-size design to this width. */
export function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const read = () => setW(el.clientWidth);
    read();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', read); return () => window.removeEventListener('resize', read); }
    const ro = new ResizeObserver(read); ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function useViewport() {
  const read = () => ({ w: typeof window === 'undefined' ? 1280 : window.innerWidth, h: typeof window === 'undefined' ? 800 : window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => { const on = () => setV(read()); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  return v;
}

export function useMedia(query, fallback = false) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback);
  const [m, setM] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query); const on = () => setM(mq.matches);
    on(); mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, [query]);
  return m;
}
