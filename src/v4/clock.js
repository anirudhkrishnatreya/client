// The device clock cannot be trusted (it may be minutes off, or changed). Timed blocks end at a deadline the SERVER set,
// so the countdown runs on server time: offset = serverTime − local time, measured at the middle of the request.
// Of the last few measurements the one with the shortest round trip is the most accurate, so that one is used.
export class ServerClock {
  constructor(nowFn = () => Date.now()) { this.nowFn = nowFn; this.offset = 0; this.samples = []; }

  /** Call after any v2 response that carries `serverTime`. */
  observe(serverTime, sentAt, receivedAt) {
    if (!Number.isFinite(serverTime) || !(receivedAt >= sentAt)) return;
    this.samples.push({ rtt: receivedAt - sentAt, offset: serverTime - (sentAt + receivedAt) / 2 });
    if (this.samples.length > 5) this.samples.shift();
    this.offset = this.samples.reduce((best, s) => (s.rtt < best.rtt ? s : best)).offset;
  }

  now() { return this.nowFn() + this.offset; }
  remainingMs(deadline) { return deadline == null ? Infinity : Math.max(0, deadline - this.now()); }
}

/** 125000 → "2:05"; 3725000 → "1:02:05" */
export function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
