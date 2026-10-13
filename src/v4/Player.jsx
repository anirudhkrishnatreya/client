import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v2 as defaultApi, errorCode } from './api';
import { ServerClock } from './clock';
import { AnswerQueue } from './answerQueue';
import { BLOCK_TITLES, instructionFor, isTimed, oneAtATime, pageItems, pageCount, firstOpen } from './blockInfo';
import LikertItem from './items/LikertItem';
import ChoiceItem from './items/ChoiceItem';
import PairItem from './items/PairItem';
import Countdown from './Countdown';
import SaveStatus from './SaveStatus';
import './v4.css';

const ACCOUNT_BLOCKS = ['CONSENT_REQUIRED', 'PROFILE_INCOMPLETE', 'TRACK_REQUIRED'];

/**
 * The test player. Walks the student through the blueprint's blocks in order:
 *   intro → (start block: items arrive, the server starts the clock) → answer → close block → next intro … → submit.
 * Answers go through an AnswerQueue (batched, saved offline, retried). A timed block ends when the SERVER's deadline passes.
 * Everything that talks to the server comes in as props, so the player can be tested without a network.
 */
export default function Player({ api = defaultApi, storage = (typeof window !== 'undefined' ? window.localStorage : null), onFinished = () => {}, onBlocked = () => {}, clock: clockProp, flushMs = 5000, drainMs = 30000, queueOptions = {} }) {
  const clock = useRef(clockProp || new ServerClock()).current;
  const queue = useRef(null);
  const closing = useRef(false);
  const shownAt = useRef(Date.now());
  const headingRef = useRef(null);

  const [phase, setPhase] = useState('loading');          // loading | intro | block | closing | blocked | finishing | error
  const [overview, setOverview] = useState(null);
  const [block, setBlock] = useState(null);               // the block being answered
  const [queueState, setQueueState] = useState({ state: 'idle', pending: 0 });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // every server call: measure the round trip so the countdown follows server time
  const call = useCallback(async (fn, ...args) => {
    const sent = Date.now();
    const res = await fn(...args);
    clock.observe(res && res.data && res.data.serverTime, sent, Date.now());
    return res.data;
  }, [clock]);

  const focusHeading = () => setTimeout(() => headingRef.current && headingRef.current.focus(), 0);

  const finishAll = useCallback(async () => {
    setPhase('finishing');
    try {
      const d = await call(api.submit);
      onFinished(d.assessmentId);
    } catch (e) {
      if (errorCode(e) === 'BLOCKS_REMAINING') return load();            // eslint-disable-line no-use-before-define
      setError('We could not finish your test just now. Your answers are safe. Please try again.');
      setPhase('error');
    }
  }, [api, call, onFinished]);                                            // eslint-disable-line react-hooks/exhaustive-deps

  const beginBlock = useCallback(async meta => {
    try {
      const d = await call(api.startBlock, meta.id);
      const queued = Object.fromEntries(Object.entries((queue.current && queue.current.items[meta.id]) || {}).map(([id, a]) => [id, a.value]));
      const answers = { ...(d.answers || {}), ...queued };                // what the server has + anything still waiting to be sent
      const items = d.block.items;
      const open = Math.max(0, firstOpen(items, answers));
      shownAt.current = Date.now();
      setBlock({ meta, payload: d.block, deadline: d.deadline, answers, index: oneAtATime(d.block.format) ? open : 0, page: d.block.format === 'likert' ? Math.floor(open / 10) : 0, flagged: {} });
      setNotice('');
      setPhase('block');
      focusHeading();
    } catch (e) {
      const code = errorCode(e);
      if (code === 'BLOCK_OUT_OF_ORDER' || code === 'BLOCK_CLOSED') return load();            // eslint-disable-line no-use-before-define
      setError('We could not open this section. Please check your connection and try again.');
      setPhase('error');
    }
  }, [api, call]);                                                         // eslint-disable-line react-hooks/exhaustive-deps

  const openNext = useCallback(async d => {
    setOverview(d);
    if (d.allDone) return finishAll();
    const next = d.blocks.find(b => b.id === d.next);
    if (next.state === 'in_progress') return beginBlock(next);            // a reload mid-block: carry straight on
    setPhase('intro'); focusHeading();
  }, [beginBlock, finishAll]);

  const load = useCallback(async () => {
    setPhase('loading'); setError('');
    try {
      const d = await call(api.start);
      if (!queue.current) {
        queue.current = new AnswerQueue({
          send: (blockId, answers) => call(api.saveAnswers, blockId, answers), storage, key: `im_v4_queue_${d.sessionId}`, flushMs, ...queueOptions,
          onChange: s => setQueueState(s),
          onDropped: ({ code }) => setNotice(code === 'TIME_EXPIRED' || code === 'BLOCK_CLOSED' ? 'Some answers could not be saved because the time for that section had ended.' : 'Some answers could not be saved.')
        });
        if (queue.current.pendingCount()) queue.current.flush();
      }
      await openNext(d);
    } catch (e) {
      const code = errorCode(e);
      if (ACCOUNT_BLOCKS.includes(code)) { onBlocked(code, e.response && e.response.data); setError(code); setPhase('account'); return; }
      setError('We could not load your test. Please check your connection and try again.');
      setPhase('error');
    }
  }, [api, call, openNext, storage, flushMs, onBlocked]);

  useEffect(() => { load(); return () => queue.current && queue.current.stop(); }, []);          // eslint-disable-line react-hooks/exhaustive-deps

  // a timed block is running: warn before the tab is closed
  useEffect(() => {
    if (phase !== 'block' || !isTimed(block && block.payload)) return undefined;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase, block]);

  // ── answering ─────────────────────────────────────────
  const closeBlock = useCallback(async () => {
    if (closing.current || !block) return;
    closing.current = true; setPhase('closing');
    const drained = await queue.current.drain(drainMs);
    if (!drained.ok) {
      closing.current = false;
      setNotice(drained.reason === 'auth' ? 'Your sign-in has expired. Sign in again; your answers are saved on this device.' : 'We could not reach the server. Your answers are kept on this device. Check your connection and try again.');
      setPhase('blocked'); return;
    }
    try {
      const d = await call(api.submitBlock, block.meta.id);
      closing.current = false;
      await openNext(d);
    } catch (e) {
      closing.current = false;
      if (errorCode(e) === 'INCOMPLETE') {
        // The server says answers are missing. Trust the server, not this screen: re-read what it actually has, then show exactly
        // what is missing (an answer may have been refused). Re-opening the block is safe and keeps its original clock.
        try {
          const d = await call(api.startBlock, block.meta.id);
          const queued = Object.fromEntries(Object.entries((queue.current && queue.current.items[block.meta.id]) || {}).map(([id, a]) => [id, a.value]));
          const answers = { ...(d.answers || {}), ...queued };
          const flagged = Object.fromEntries(block.payload.items.filter(i => answers[i.id] === undefined).map(i => [i.id, true]));
          const at = Math.max(0, firstOpen(block.payload.items, answers));
          setBlock(b => ({ ...b, answers, flagged, index: oneAtATime(b.payload.format) ? at : 0, page: b.payload.format === 'likert' ? Math.floor(at / 10) : 0 }));
          setNotice('Some answers are missing. Please answer the highlighted questions.');
          setPhase('block'); return;
        } catch { /* fall through to the generic message */ }
      }
      setError('We could not close this section. Your answers are safe. Please try again.');
      setPhase('error');
    }
  }, [api, block, call, openNext, drainMs]);

  const answer = useCallback((itemId, value) => {
    if (!block || closing.current) return;
    const rt = Date.now() - shownAt.current;
    shownAt.current = Date.now();
    queue.current.put(block.meta.id, itemId, value, rt);
    setBlock(b => ({ ...b, answers: { ...b.answers, [itemId]: value }, flagged: Object.fromEntries(Object.entries(b.flagged).filter(([id]) => id !== itemId)) }));
    // same/different: moving on straight away keeps the pace up
    if (block.payload.format === 'speeded') setBlock(b => ({ ...b, index: b.index + 1 }));
  }, [block]);

  // the speeded block ends when its last item is answered
  useEffect(() => { if (phase === 'block' && block && block.payload.format === 'speeded' && block.index >= block.payload.items.length) closeBlock(); }, [phase, block, closeBlock]);

  const nextOne = () => {
    const items = block.payload.items, item = items[block.index];
    if (block.payload.format === 'sjt' && block.answers[item.id] === undefined) { setBlock(b => ({ ...b, flagged: { [item.id]: true } })); return; }
    if (block.index + 1 >= items.length) return closeBlock();
    shownAt.current = Date.now();
    setBlock(b => ({ ...b, index: b.index + 1, flagged: {} }));
    focusHeading();
  };

  const nextPage = () => {
    const mine = pageItems(block.payload.items, block.page);
    const missing = mine.filter(i => block.answers[i.id] === undefined);
    if (missing.length) {
      setBlock(b => ({ ...b, flagged: Object.fromEntries(missing.map(i => [i.id, true])) }));
      const el = document.getElementById(`item-${missing[0].id}`);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (block.page + 1 >= pageCount(block.payload.items)) return closeBlock();
    shownAt.current = Date.now();
    setBlock(b => ({ ...b, page: b.page + 1, flagged: {} }));
    window.scrollTo && window.scrollTo(0, 0);
    focusHeading();
  };

  // ── progress across the whole test ────────────────────
  const progress = useMemo(() => {
    if (!overview) return 0;
    const total = overview.blocks.length;
    const done = overview.blocks.filter(b => b.state === 'submitted' || b.state === 'expired').length;
    let within = 0;
    if (block && phase === 'block') within = Object.keys(block.answers).length / block.payload.items.length;
    return Math.round(((done + within) / total) * 100);
  }, [overview, block, phase]);

  // ── screens ───────────────────────────────────────────
  if (phase === 'loading' || phase === 'finishing' || phase === 'closing') {
    return <Shell><p role="status">{phase === 'loading' ? 'Loading your test…' : phase === 'closing' ? 'Saving your answers…' : 'Working out your results…'}</p></Shell>;
  }
  if (phase === 'account') return <Shell><AccountBlock code={error} /></Shell>;
  if (phase === 'error') return <Shell><div className="v4-alert error" role="alert">{error}</div><button className="v4-btn" onClick={load}>Try again</button></Shell>;
  if (phase === 'blocked') {
    return (
      <Shell>
        <div className="v4-alert info" role="alert">{notice}</div>
        <button className="v4-btn" onClick={closeBlock}>Try again</button>
      </Shell>
    );
  }

  if (phase === 'intro') {
    const next = overview.blocks.find(b => b.id === overview.next);
    const first = overview.blocks.findIndex(b => b.id === next.id);
    const newSession = first > 0 && overview.blocks[first - 1].sessionId !== next.sessionId;
    return (
      <Shell progress={progress} queue={queueState}>
        <section className="v4-card" aria-labelledby="intro-title">
          {newSession && <div className="v4-alert info">This is the start of part 2. Take a short break if you need one.</div>}
          <h1 id="intro-title" className="v4-h1" tabIndex={-1} ref={headingRef}>{BLOCK_TITLES[next.id] || next.id}</h1>
          <p className="v4-muted" style={{ marginBottom: 12 }}>{next.itemCount} {next.format === 'sjt' ? 'situations' : 'questions'}{next.timeLimitSeconds ? ` · ${Math.round(next.timeLimitSeconds / 60)} minute${Math.round(next.timeLimitSeconds / 60) === 1 ? '' : 's'}` : ''}</p>
          <p style={{ marginBottom: 16 }}>{instructionFor(next)}</p>
          {next.timeLimitSeconds && <div className="v4-alert info">The timer starts when you press Start.</div>}
          <button className="v4-btn" onClick={() => beginBlock(next)}>Start</button>
        </section>
      </Shell>
    );
  }

  // phase === 'block'
  const { payload } = block;
  const total = payload.items.length;
  const timer = isTimed(payload) ? <Countdown deadline={block.deadline} clock={clock} onExpire={() => { setNotice('Time is up for this section.'); closeBlock(); }} /> : null;

  if (payload.format === 'likert') {
    const items = pageItems(payload.items, block.page);
    const last = block.page + 1 >= pageCount(payload.items);
    return (
      <Shell progress={progress} queue={queueState} timer={timer}>
        <h1 className="v4-h1" tabIndex={-1} ref={headingRef}>{BLOCK_TITLES[payload.id]} <span className="v4-muted">· page {block.page + 1} of {pageCount(payload.items)}</span></h1>
        {notice && <div className="v4-alert info" role="status">{notice}</div>}
        <div className="v4-card">
          {items.map(it => <LikertItem key={it.id} item={it} labels={payload.responseScale.labels} value={block.answers[it.id]} flagged={Boolean(block.flagged[it.id])} onChange={v => answer(it.id, v)} />)}
        </div>
        <Footer queue={queueState}>
          <button className="v4-btn" onClick={nextPage}>{last ? 'Finish this section' : 'Next'}</button>
        </Footer>
      </Shell>
    );
  }

  const item = payload.items[Math.min(block.index, total - 1)];
  const lastOne = block.index + 1 >= total;
  return (
    <Shell progress={progress} queue={queueState} timer={timer}>
      <h1 className="v4-h1" tabIndex={-1} ref={headingRef}>{BLOCK_TITLES[payload.id]} <span className="v4-muted">· {Math.min(block.index + 1, total)} of {total}</span></h1>
      {notice && <div className="v4-alert info" role="status">{notice}</div>}
      <div className="v4-card">
        {payload.format === 'speeded'
          ? <PairItem key={item.id} item={item} value={block.answers[item.id]} onChange={v => answer(item.id, v)} />
          : <ChoiceItem key={item.id} item={item} value={block.answers[item.id]} flagged={Boolean(block.flagged[item.id])} onChange={v => answer(item.id, v)} />}
      </div>
      {payload.format !== 'speeded' && (
        <Footer queue={queueState}>
          {payload.format === 'mcq' && block.answers[item.id] === undefined && !lastOne && <button className="v4-btn secondary" onClick={nextOne}>Skip</button>}
          <button className="v4-btn" onClick={nextOne}>{lastOne ? 'Finish this section' : 'Next'}</button>
        </Footer>
      )}
    </Shell>
  );
}

function Shell({ children, progress, queue, timer }) {
  return (
    <div className="v4-shell">
      <header className="v4-top">
        <strong>iMenteo</strong>
        <div className="v4-row" style={{ gap: 12 }}>{timer}{queue && <SaveStatus queue={queue} />}</div>
      </header>
      {progress != null && <div className="v4-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Test progress"><div style={{ width: `${progress}%` }} /></div>}
      <main className="v4-main">{children}</main>
    </div>
  );
}

function Footer({ children }) {
  return <div className="v4-footer"><div className="v4-footer-inner"><span /><div className="v4-row">{children}</div></div></div>;
}

function AccountBlock({ code }) {
  const text = {
    CONSENT_REQUIRED: 'Your parent or guardian needs to confirm before you can start. Check the dashboard for the details.',
    PROFILE_INCOMPLETE: 'We need your date of birth and your agreement to the terms before you can start. You can add them on the dashboard.',
    TRACK_REQUIRED: 'Choose your class or college year on the dashboard before you start.'
  }[code];
  return <div className="v4-card"><h1 className="v4-h1">Before you start</h1><p style={{ marginBottom: 16 }}>{text}</p><a className="v4-btn" href="#/v4">Go to the dashboard</a></div>;
}
