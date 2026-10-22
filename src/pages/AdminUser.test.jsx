import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const sent = [];
vi.mock('../api', () => ({
  adminGetUser: () => Promise.resolve({ data: { user: { _id: 'u1', fullName: 'Anirudh Sharma', email: 'a@example.com', createdAt: '2026-10-01T00:00:00Z' }, assessment: null, ai: { used: 40, limit: 40, left: 0, unlimited: false, resetsAt: '2026-10-24T00:00:00.000Z', paused: false } } }),
  adminSetUserAi: (id, body) => { sent.push({ id, body }); return Promise.resolve({ data: { ai: body.reset ? { used: 0, limit: 40, left: 40, unlimited: false, resetsAt: '2026-10-24T00:00:00.000Z', paused: false } : { used: 0, limit: null, left: null, unlimited: true, resetsAt: '2026-10-24T00:00:00.000Z', paused: false } } }); }
}));
import AdminUser from './AdminUser';

describe('admin: a user’s AI limit', () => {
  it('shows today’s use, resets it, and can lift the limit for a tester', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/admin/user/u1']}><Routes><Route path="/admin/user/:id" element={<AdminUser />} /></Routes></MemoryRouter>);
    expect(await screen.findByText('40 of 40 (0 left)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset today’s limit' }));
    expect(await screen.findByText('0 of 40 (40 left)')).toBeInTheDocument();
    expect(sent[0]).toEqual({ id: 'u1', body: { reset: true } });
    await user.type(screen.getByLabelText('Daily AI limit for this account'), '-1');
    await user.click(screen.getByRole('button', { name: 'Set limit' }));
    expect(await screen.findByText('0 (no limit on this account)')).toBeInTheDocument();
    expect(sent[1]).toEqual({ id: 'u1', body: { dailyCalls: -1 } });
  });
});
