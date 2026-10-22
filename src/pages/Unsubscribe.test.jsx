import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const calls = [];
let reply = () => Promise.resolve({ data: { success: true } });
vi.mock('../api', () => ({ default: { post: (...a) => { calls.push(a); return reply(); } } }));
import Unsubscribe from './Unsubscribe';

const at = path => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/unsubscribe" element={<Unsubscribe />} /></Routes></MemoryRouter>);

describe('stop reminder emails from the link', () => {
  beforeEach(() => { calls.length = 0; });
  it('sends the signed link and confirms', async () => {
    reply = () => Promise.resolve({ data: { success: true } });
    at('/unsubscribe?u=abc&t=def');
    expect(await screen.findByText('Reminders turned off')).toBeInTheDocument();
    expect(calls[0]).toEqual(['/v2/loop/unsubscribe', { u: 'abc', t: 'def' }]);
  });
  it('says so when the link is wrong', async () => {
    reply = () => Promise.reject(Object.assign(new Error('bad link'), { response: { status: 400 } }));
    at('/unsubscribe?u=abc&t=bad');
    expect(await screen.findByText('That link did not work')).toBeInTheDocument();
  });
});
