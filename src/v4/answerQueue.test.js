import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnswerQueue } from './answerQueue';

const memoryStorage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), _m: m }; };
const httpError = (status, code) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data: { code } } });
const networkError = () => new Error('Network Error');

let sent, behaviour, storage, dropped;
const make = (opts = {}) => new AnswerQueue({ send: async (blockId, answers) => { sent.push({ blockId, answers }); return behaviour(blockId, answers); }, storage, key: 'q', onDropped: d => dropped.push(d), ...opts });

beforeEach(() => { vi.useFakeTimers(); sent = []; dropped = []; storage = memoryStorage(); behaviour = async () => ({ saved: 1, rejected: [] }); });
afterEach(() => vi.useRealTimers());

describe('batching', () => {
  it('sends after the flush interval, not on every answer', async () => {
    const q = make();
    q.put('b1', 'I1', 3); q.put('b1', 'I2', 4);
    expect(sent).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(sent).toEqual([{ blockId: 'b1', answers: [{ itemId: 'I1', value: 3 }, { itemId: 'I2', value: 4 }] }]);
    expect(q.pendingCount()).toBe(0);
  });
  it('sends at once when enough answers have piled up', async () => {
    const q = make({ maxBatch: 3 });
    q.put('b1', 'I1', 1); q.put('b1', 'I2', 1);
    expect(sent).toHaveLength(0);
    q.put('b1', 'I3', 1);
    await vi.advanceTimersByTimeAsync(0);
    expect(sent).toHaveLength(1);
    expect(sent[0].answers).toHaveLength(3);
  });
  it('the latest answer for an item replaces the earlier one', async () => {
    const q = make();
    q.put('b1', 'I1', 2); q.put('b1', 'I1', 5);
    await vi.advanceTimersByTimeAsync(5000);
    expect(sent[0].answers).toEqual([{ itemId: 'I1', value: 5 }]);
  });
  it('keeps blocks separate and splits large batches into chunks of 100', async () => {
    const q = make({ maxBatch: 1000 });
    for (let i = 0; i < 230; i++) q.put('big', `I${i}`, 1);
    q.put('other', 'X1', 2);
    await q.flush();
    expect(sent.map(s => [s.blockId, s.answers.length])).toEqual([['big', 100], ['big', 100], ['big', 30], ['other', 1]]);
  });
  it('sends response time only when it was measured', async () => {
    const q = make();
    q.put('b', 'I1', 3, 1800); q.put('b', 'I2', 3);
    await q.flush();
    expect(sent[0].answers).toEqual([{ itemId: 'I1', value: 3, rtMs: 1800 }, { itemId: 'I2', value: 3 }]);
  });
});

describe('offline and retry', () => {
  it('keeps answers when the network fails and retries with growing delays', async () => {
    let calls = 0;
    behaviour = async () => { calls += 1; if (calls <= 2) throw networkError(); return { saved: 1, rejected: [] }; };
    const q = make();
    q.put('b', 'I1', 4);
    await vi.advanceTimersByTimeAsync(5000);                         // 1st attempt fails
    expect(q.state).toBe('retrying'); expect(q.pendingCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(999); expect(calls).toBe(1);   // first retry waits 1 s
    await vi.advanceTimersByTimeAsync(1);   expect(calls).toBe(2);   // fails again
    await vi.advanceTimersByTimeAsync(1999); expect(calls).toBe(2);  // then waits 2 s
    await vi.advanceTimersByTimeAsync(1);   expect(calls).toBe(3);
    expect(q.pendingCount()).toBe(0); expect(q.state).toBe('idle'); expect(q.failures).toBe(0);
  });
  it('treats server errors and rate limits as temporary', async () => {
    for (const status of [500, 502, 503, 429, 408]) {
      sent = []; storage = memoryStorage();
      let n = 0; behaviour = async () => { if (!n++) throw httpError(status); return { saved: 1, rejected: [] }; };
      const q = make(); q.put('b', 'I1', 1);
      await q.flush();
      expect(q.pendingCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(q.pendingCount()).toBe(0);
      q.stop();
    }
  });
  it('the retry delay is capped at 30 s', async () => {
    behaviour = async () => { throw networkError(); };
    const q = make({ backoff: [10, 20, 30] });
    q.put('b', 'I1', 1);
    for (let i = 0; i < 6; i++) { await vi.advanceTimersByTimeAsync(5000); }
    expect(q.pendingCount()).toBe(1);
    expect(q.failures).toBeGreaterThan(3);
  });
  it('survives a reload: queued answers are restored from storage and sent', async () => {
    behaviour = async () => { throw networkError(); };
    const q1 = make(); q1.put('b', 'I1', 2); q1.put('b', 'I2', 5);
    await q1.flush(); q1.stop();
    behaviour = async () => ({ saved: 2, rejected: [] });
    const q2 = make();                                                 // a new page load
    expect(q2.pendingCount()).toBe(2);
    await q2.flush();
    expect(sent.at(-1).answers).toEqual([{ itemId: 'I1', value: 2 }, { itemId: 'I2', value: 5 }]);
    expect(storage._m.has('q')).toBe(false);                           // cleared once saved
  });
  it('a corrupt stored queue is ignored', () => {
    storage.setItem('q', '{not json');
    expect(make().pendingCount()).toBe(0);
  });
  it('still works if storage throws', async () => {
    const bad = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('full'); }, removeItem: () => { throw new Error('x'); } };
    const q = make({ storage: bad });
    q.put('b', 'I1', 3);
    await q.flush();
    expect(sent).toHaveLength(1);
  });
});

describe('permanent refusals', () => {
  it('drops answers for a closed or expired block and says why, without retrying forever', async () => {
    behaviour = async () => { throw httpError(409, 'TIME_EXPIRED'); };
    const q = make(); q.put('b', 'I1', 1); q.put('b', 'I2', 2);
    await q.flush();
    expect(dropped).toEqual([{ blockId: 'b', code: 'TIME_EXPIRED', itemIds: ['I1', 'I2'] }]);
    expect(q.pendingCount()).toBe(0);
    expect(sent).toHaveLength(1);
  });
  it('reports individual answers the server rejected', async () => {
    behaviour = async () => ({ saved: 1, rejected: [{ itemId: 'I2', reason: 'invalid value' }] });
    const q = make(); q.put('b', 'I1', 1); q.put('b', 'I2', 9);
    await q.flush();
    expect(dropped).toEqual([{ blockId: 'b', code: 'REJECTED', itemIds: ['I2'] }]);
    expect(q.pendingCount()).toBe(0);
  });
  it('a refusal for one block does not stop other blocks being saved', async () => {
    behaviour = async blockId => { if (blockId === 'old') throw httpError(409, 'BLOCK_CLOSED'); return { saved: 1, rejected: [] }; };
    const q = make(); q.put('old', 'A', 1); q.put('new', 'B', 1);
    await q.flush();
    expect(dropped.map(d => d.blockId)).toEqual(['old']);
    expect(sent.map(s => s.blockId)).toEqual(['old', 'new']);
  });
  it('an expired sign-in keeps every answer queued and stops sending until the student signs in again', async () => {
    behaviour = async () => { throw httpError(401); };
    const q = make(); q.put('b', 'I1', 1);
    await q.flush();
    expect(q.state).toBe('auth'); expect(q.pendingCount()).toBe(1); expect(dropped).toEqual([]);
    expect(storage._m.has('q')).toBe(true);
    behaviour = async () => ({ saved: 1, rejected: [] });
    await q.flush();
    expect(q.pendingCount()).toBe(0);
  });
});

describe('answers changed while saving', () => {
  it('a change made during an in-flight save is not lost, and is sent straight afterwards', async () => {
    let release, call = 0;
    behaviour = () => (++call === 1 ? new Promise(res => { release = () => res({ saved: 1, rejected: [] }); }) : Promise.resolve({ saved: 1, rejected: [] }));
    const q = make();
    q.put('b', 'I1', 2);
    const flushing = q.flush();
    await vi.advanceTimersByTimeAsync(0);
    q.put('b', 'I1', 5);                                              // student changes their mind mid-save
    release();
    await flushing;
    expect(sent.map(s => s.answers[0].value)).toEqual([2, 5]);        // the old value was saved, then the newer one followed
    expect(q.pendingCount()).toBe(0);
  });
  it('never runs two saves at once', async () => {
    let active = 0, maxActive = 0;
    behaviour = async () => { active++; maxActive = Math.max(maxActive, active); await new Promise(r => setTimeout(r, 50)); active--; return { saved: 1, rejected: [] }; };
    const q = make({ maxBatch: 1 });
    q.put('b', 'A', 1); q.put('b', 'B', 1); q.put('b', 'C', 1);
    await vi.advanceTimersByTimeAsync(500);
    expect(maxActive).toBe(1);
    expect(q.pendingCount()).toBe(0);
  });
});

describe('drain (before closing a block)', () => {
  it('resolves ok once everything is saved', async () => {
    const q = make(); q.put('b', 'I1', 1);
    expect(await q.drain(1000, async () => {})).toEqual({ ok: true });
  });
  it('gives up with "offline" if the connection does not come back in time', async () => {
    behaviour = async () => { throw networkError(); };
    const q = make({ backoff: [1] }); q.put('b', 'I1', 1);
    vi.useRealTimers();
    const r = await q.drain(60, ms => new Promise(res => setTimeout(res, ms)));
    expect(r).toEqual({ ok: false, reason: 'offline' });
    expect(q.pendingCount()).toBe(1);                                 // nothing was lost
    q.stop();
  });
  it('reports "auth" when the student must sign in again', async () => {
    behaviour = async () => { throw httpError(401); };
    const q = make(); q.put('b', 'I1', 1);
    expect(await q.drain(1000, async () => {})).toEqual({ ok: false, reason: 'auth' });
  });
});

describe('state reporting', () => {
  it('tells the screen what is happening', async () => {
    const states = [];
    const q = make({ onChange: s => states.push(s.state) });
    q.put('b', 'I1', 1);
    await q.flush();
    expect(states).toContain('saving'); expect(states.at(-1)).toBe('idle');
  });
  it('does nothing after stop()', async () => {
    const q = make(); q.stop(); q.put('b', 'I1', 1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sent).toHaveLength(0);
  });
});
