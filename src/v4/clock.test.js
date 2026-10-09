import { describe, it, expect } from 'vitest';
import { ServerClock, formatRemaining } from './clock';

describe('ServerClock', () => {
  it('uses server time even if the device clock is wrong', () => {
    let local = 1_000_000;
    const c = new ServerClock(() => local);
    // device is 10 minutes slow: server says 1_600_000 when the request was sent at 1_000_000 and answered at 1_000_200
    c.observe(1_600_100, 1_000_000, 1_000_200);
    expect(c.now()).toBe(1_600_000);
    local += 5000;
    expect(c.now()).toBe(1_605_000);
  });
  it('shows time left against the server deadline', () => {
    const c = new ServerClock(() => 1000);
    c.observe(5000, 1000, 1000);
    expect(c.remainingMs(65_000)).toBe(60_000);
    expect(c.remainingMs(4000)).toBe(0);                       // never negative
    expect(c.remainingMs(null)).toBe(Infinity);                // untimed block
  });
  it('trusts the measurement with the shortest round trip', () => {
    const c = new ServerClock(() => 0);
    c.observe(10_000, 0, 4000);     // slow round trip → offset 8000 (less reliable)
    c.observe(10_050, 0, 100);      // fast round trip → offset 10000
    c.observe(10_000, 0, 3000);
    expect(c.offset).toBe(10_000);
  });
  it('ignores nonsense measurements', () => {
    const c = new ServerClock(() => 0);
    c.observe(NaN, 0, 1); c.observe(1000, 5, 1);
    expect(c.offset).toBe(0);
  });
  it('keeps only the latest few samples', () => {
    const c = new ServerClock(() => 0);
    for (let i = 0; i < 10; i++) c.observe(1000 + i, 0, 10 + i);
    expect(c.samples).toHaveLength(5);
  });
});

describe('formatRemaining', () => {
  it.each([[0, '0:00'], [1000, '0:01'], [999, '0:01'], [125_000, '2:05'], [600_000, '10:00'], [3_725_000, '1:02:05'], [-5, '0:00']])('%p ms → %s', (ms, text) => {
    expect(formatRemaining(ms)).toBe(text);
  });
});
