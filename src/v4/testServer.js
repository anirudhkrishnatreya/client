// A small stand-in for the v4 API, used only in tests. It mimics the rules the player depends on (block order, deadlines,
// incomplete blocks, resume) and lets a test inject failures. The real rules are tested on the server; this keeps the
// screen tests honest about the shapes of requests and responses.
const ok = data => Promise.resolve({ data });
export const apiError = (status, code) => Promise.reject(Object.assign(new Error(code), { response: { status, data: { code, error: code } } }));
export const networkError = () => Promise.reject(new Error('Network Error'));

export function fakeServer({ blocks, sessionId = 'sess1', assessmentId = 'asmt1', now = () => Date.now() }) {
  const st = { started: {}, closed: {}, answers: {}, calls: [], failNext: {} };
  const rec = (name, args) => st.calls.push([name, ...args]);
  const stateOf = b => (st.closed[b.id] ? st.closed[b.id] : st.started[b.id] ? 'in_progress' : 'pending');
  const overview = () => {
    const list = blocks.map(b => ({ id: b.id, sessionId: b.sessionId || 'S1', format: b.format, itemCount: b.items.length, timeLimitSeconds: b.timeLimitSeconds || null, state: stateOf(b), startedAt: st.started[b.id] ? st.started[b.id].startedAt : null, deadline: st.started[b.id] ? st.started[b.id].deadline : null }));
    const nextB = list.find(b => !['submitted', 'expired'].includes(b.state));
    return { blocks: list, next: nextB ? nextB.id : null, allDone: !nextB, serverTime: now() };
  };
  const fail = name => { const f = st.failNext[name]; if (f && f.times > 0) { f.times -= 1; return f.make(); } return null; };

  const api = {
    start: () => { rec('start', []); return fail('start') || ok({ ...overview(), sessionId }); },
    session: () => ok({ ...overview(), sessionId }),
    startBlock: id => {
      rec('startBlock', [id]);
      const f = fail('startBlock'); if (f) return f;
      const b = blocks.find(x => x.id === id);
      if (!b) return apiError(404, 'UNKNOWN_BLOCK');
      if (st.closed[id]) return apiError(409, 'BLOCK_CLOSED');
      const o = overview();
      if (o.next !== id && !st.started[id]) return apiError(409, 'BLOCK_OUT_OF_ORDER');
      if (!st.started[id]) st.started[id] = { startedAt: now(), deadline: b.timeLimitSeconds ? now() + b.timeLimitSeconds * 1000 : null };
      const saved = {}; b.items.forEach(i => { if (st.answers[i.id] !== undefined) saved[i.id] = st.answers[i.id]; });
      return ok({ serverTime: now(), startedAt: st.started[id].startedAt, deadline: st.started[id].deadline, block: { id: b.id, format: b.format, responseScale: b.responseScale || null, timeLimitSeconds: b.timeLimitSeconds || null, items: b.items }, answers: saved });
    },
    saveAnswers: (blockId, answers) => {
      rec('saveAnswers', [blockId, answers]);
      const f = fail('saveAnswers'); if (f) return f;
      if (!st.started[blockId]) return apiError(409, 'BLOCK_NOT_STARTED');
      if (st.closed[blockId]) return apiError(409, 'BLOCK_CLOSED');
      answers.forEach(a => { st.answers[a.itemId] = a.value; });
      return ok({ serverTime: now(), saved: answers.length, rejected: [] });
    },
    submitBlock: id => {
      rec('submitBlock', [id]);
      const f = fail('submitBlock'); if (f) return f;
      const b = blocks.find(x => x.id === id);
      if (!st.started[id]) return apiError(409, 'BLOCK_NOT_STARTED');
      if (['likert', 'sjt'].includes(b.format) && b.items.some(i => st.answers[i.id] === undefined)) return apiError(409, 'INCOMPLETE');
      st.closed[id] = 'submitted';
      return ok({ ...overview(), sessionId });
    },
    submit: () => { rec('submit', []); return fail('submit') || ok({ success: true, assessmentId }); }
  };
  return { api, st, overview };
}

const labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
export const likertBlock = (id, n, extra = {}) => ({ id, format: 'likert', responseScale: { id: 'agreement', labels }, items: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i + 1}`, type: 'likert', text: `Statement ${id} ${i + 1}` })), ...extra });
export const mcqBlock = (id, n, extra = {}) => ({ id, format: 'mcq', timeLimitSeconds: 120, sessionId: 'S2', items: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i + 1}`, type: 'mcq', text: `Question ${id} ${i + 1}`, options: ['red', 'green', 'blue', 'grey'] })), ...extra });
export const pairBlock = (id, n, extra = {}) => ({ id, format: 'speeded', timeLimitSeconds: 180, sessionId: 'S2', items: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i + 1}`, type: 'speeded', text: 'Are the two codes exactly the same?', options: ['Same', 'Different'], pair: ['AB-1234', 'AB-1243'] })), ...extra });
export const sjtBlock = (id, n, extra = {}) => ({ id, format: 'sjt', items: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i + 1}`, type: 'sjt', text: `Situation ${i + 1}`, options: ['one', 'two', 'three', 'four'] })), ...extra });
