// ════════════════════════════════════════════════════════
// AnswerQueue — keeps a student's answers safe on a bad connection.
//  • answers are batched (every few seconds, or when enough have piled up) and sent per block, ≤ 100 at a time
//  • the queue is saved in localStorage, so closing the tab or losing Wi-Fi loses nothing
//  • temporary failures (offline, 5xx, rate limit) retry with growing delays; the answers stay queued
//  • permanent refusals (block closed, time expired, invalid) drop those answers and report why
//  • a 401 stops sending but keeps everything queued, so signing in again resumes
//  • changing an answer while a save is in flight is never lost (each answer carries a version)
// ════════════════════════════════════════════════════════
const BACKOFF = [1000, 2000, 4000, 8000, 16000, 30000];

export class AnswerQueue {
  constructor({ send, storage = null, key = 'im_v4_queue', flushMs = 5000, maxBatch = 10, maxChunk = 100, backoff = BACKOFF, onChange = () => {}, onDropped = () => {} }) {
    Object.assign(this, { send, storage, key, flushMs, maxBatch, maxChunk, backoff, onChange, onDropped });
    this.items = {};          // { blockId: { itemId: { value, rtMs, seq } } }
    this.seq = 0;
    this.state = 'idle';      // idle | saving | retrying | auth
    this.failures = 0;
    this.timer = null;
    this.running = null;
    this.again = false;
    this.stopped = false;
    this.hydrate();
  }

  hydrate() {
    try {
      const raw = this.storage && this.storage.getItem(this.key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      for (const [b, items] of Object.entries(saved)) for (const [id, a] of Object.entries(items)) { (this.items[b] = this.items[b] || {})[id] = { ...a, seq: ++this.seq }; }
    } catch { /* a corrupt queue is ignored rather than blocking the test */ }
  }

  persist() {
    try {
      if (!this.storage) return;
      const clean = Object.fromEntries(Object.entries(this.items).filter(([, v]) => Object.keys(v).length).map(([b, v]) => [b, Object.fromEntries(Object.entries(v).map(([id, a]) => [id, { value: a.value, rtMs: a.rtMs }]))]));
      if (Object.keys(clean).length) this.storage.setItem(this.key, JSON.stringify(clean)); else this.storage.removeItem(this.key);
    } catch { /* storage full or unavailable: still send from memory */ }
  }

  pendingCount(blockId) {
    const blocks = blockId ? [blockId] : Object.keys(this.items);
    return blocks.reduce((n, b) => n + Object.keys(this.items[b] || {}).length, 0);
  }

  setState(state) { if (this.state !== state) { this.state = state; this.onChange(this.snapshot()); } }
  snapshot() { return { state: this.state, pending: this.pendingCount(), failures: this.failures }; }

  put(blockId, itemId, value, rtMs = null) {
    if (this.stopped) return;
    (this.items[blockId] = this.items[blockId] || {})[itemId] = { value, rtMs, seq: ++this.seq };   // the latest answer for an item replaces the earlier one
    this.persist();
    this.onChange(this.snapshot());
    if (this.pendingCount(blockId) >= this.maxBatch) this.flush(); else this.schedule(this.flushMs);
  }

  schedule(ms) {
    if (this.stopped || this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; this.flush(); }, ms);
  }

  stop() { this.stopped = true; if (this.timer) clearTimeout(this.timer); this.timer = null; }

  /** Sends everything queued now. Never overlaps with itself: a call during a save runs again afterwards. */
  flush() {
    if (this.running) { this.again = true; return this.running; }
    this.running = this.run().finally(() => {
      this.running = null;
      if (this.again && !this.stopped) { this.again = false; return this.flush(); }
    });
    return this.running;
  }

  async run() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    for (const blockId of Object.keys(this.items)) {
      while (Object.keys(this.items[blockId] || {}).length) {
        const chunk = Object.entries(this.items[blockId]).slice(0, this.maxChunk).map(([itemId, a]) => ({ itemId, value: a.value, rtMs: a.rtMs, seq: a.seq }));
        this.setState('saving');
        let res;
        try {
          res = await this.send(blockId, chunk.map(({ itemId, value, rtMs }) => ({ itemId, value, ...(rtMs != null ? { rtMs } : {}) })));
        } catch (err) {
          const status = err && err.response && err.response.status;
          const code = err && err.response && err.response.data && err.response.data.code;
          if (status === 401) { this.setState('auth'); return; }                                    // keep everything; resume after sign-in
          const permanent = status && status >= 400 && status < 500 && status !== 429 && status !== 408;
          if (permanent) { this.drop(blockId, chunk.map(c => c.itemId), code || `HTTP_${status}`); continue; }
          this.failures += 1; this.setState('retrying');
          this.schedule(this.backoff[Math.min(this.failures - 1, this.backoff.length - 1)]);       // offline / server trouble: try again later
          return;
        }
        this.failures = 0;
        const rejected = new Set(((res && res.rejected) || []).map(r => r.itemId));
        for (const c of chunk) {
          const current = this.items[blockId] && this.items[blockId][c.itemId];
          if (current && current.seq === c.seq) delete this.items[blockId][c.itemId];               // keep it if the student changed it meanwhile
        }
        if (rejected.size) this.onDropped({ blockId, code: 'REJECTED', itemIds: [...rejected] });
        this.persist();
      }
      delete this.items[blockId];
    }
    this.persist();
    this.setState('idle');
  }

  drop(blockId, itemIds, code) {
    for (const id of itemIds) if (this.items[blockId]) delete this.items[blockId][id];
    this.persist();
    this.onDropped({ blockId, code, itemIds });
  }

  /**
   * Waits until everything is saved (used before closing a block). Resolves { ok:true } when the queue is empty,
   * or { ok:false, reason } if the connection did not come back within maxWaitMs or the session needs signing in again.
   */
  async drain(maxWaitMs = 30000, sleep = ms => new Promise(r => setTimeout(r, ms))) {
    const start = Date.now();
    for (;;) {
      await this.flush();
      if (!this.pendingCount()) return { ok: true };
      if (this.state === 'auth') return { ok: false, reason: 'auth' };
      if (Date.now() - start >= maxWaitMs) return { ok: false, reason: 'offline' };
      await sleep(Math.min(this.backoff[Math.min(this.failures, this.backoff.length - 1)] || 1000, 2000));
    }
  }
}
