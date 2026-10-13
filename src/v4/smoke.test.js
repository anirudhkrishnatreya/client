import { describe, it, expect } from 'vitest';

describe('test setup', () => {
  it('runs with a DOM and localStorage', () => {
    localStorage.setItem('k', 'v');
    expect(document.body).toBeDefined();
    expect(localStorage.getItem('k')).toBe('v');
  });
});
