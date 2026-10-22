import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

let reply;
vi.mock('../api', () => ({ API_URL: 'https://api.example/api', default: { get: () => reply() } }));
import PublicPortfolio from './PublicPortfolio';

const at = path => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/p/:token" element={<PublicPortfolio />} /></Routes></MemoryRouter>);

describe('a shared portfolio', () => {
  it('shows the first name, the goal and the work, with photos from the public address', async () => {
    reply = () => Promise.resolve({ data: { portfolio: { name: 'Asha', goal: 'Architect', items: [{ source: 'levelup', levelTitle: 'Sketching', brief: 'Draw a façade.', text: 'Three ideas.', photos: ['/v2/portfolio/tok/photos/abc'], band: 'strong', feedback: 'Strong proportions.', link: null }] } } });
    at('/p/tokentokentok');
    expect(await screen.findByText('Asha’s work')).toBeInTheDocument();
    expect(screen.getByText('Architect')).toBeInTheDocument();
    expect(screen.getByAltText('Photo 1')).toHaveAttribute('src', 'https://api.example/api/v2/portfolio/tok/photos/abc');
  });
  it('says so when the link is not shared', async () => {
    reply = () => Promise.reject(Object.assign(new Error('nf'), { response: { status: 404 } }));
    at('/p/tokentokentok');
    expect(await screen.findByText('This portfolio is not shared')).toBeInTheDocument();
  });
});
