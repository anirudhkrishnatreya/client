import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LikertItem from './LikertItem';
import ChoiceItem from './ChoiceItem';
import PairItem from './PairItem';
import Countdown from '../Countdown';
import SaveStatus from '../SaveStatus';
import { ServerClock } from '../clock';
import { svgToDataUri } from '../svg';

const LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

describe('LikertItem', () => {
  it('shows the statement and five labelled choices, and reports the chosen value', () => {
    const onChange = vi.fn();
    render(<LikertItem item={{ id: 'P1', text: 'I make friends easily.' }} labels={LABELS} value={null} onChange={onChange} />);
    expect(screen.getByText('I make friends easily.')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    fireEvent.click(screen.getByLabelText('Agree'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
  it('marks the current answer and asks for one when flagged', () => {
    const { rerender } = render(<LikertItem item={{ id: 'P1', text: 'T' }} labels={LABELS} value={2} onChange={() => {}} />);
    expect(screen.getByLabelText('Disagree')).toBeChecked();
    rerender(<LikertItem item={{ id: 'P1', text: 'T' }} labels={LABELS} value={null} onChange={() => {}} flagged />);
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose an answer');
  });
  it('is keyboard friendly: choices are real radios in one group', () => {
    render(<LikertItem item={{ id: 'P1', text: 'T' }} labels={LABELS} value={null} onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(new Set(radios.map(r => r.name)).size).toBe(1);
  });
});

describe('ChoiceItem', () => {
  it('text options report the option INDEX', () => {
    const onChange = vi.fn();
    render(<ChoiceItem item={{ id: 'C1', text: 'What is 2+2?', options: ['3', '4', '5', '6'] }} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('4'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
  it('picture options are images with the server alt text, and the stimulus image is shown', () => {
    const fig = { stimulus: { svg: '<svg xmlns="http://www.w3.org/2000/svg"/>', alt: 'A three by three grid' }, options: [0, 1, 2, 3].map(i => ({ svg: '<svg xmlns="http://www.w3.org/2000/svg"/>', alt: `Option ${'ABCD'[i]}: a shape` })) };
    const onChange = vi.fn();
    render(<ChoiceItem item={{ id: 'C2', text: 'Which figure completes the pattern?', options: ['A', 'B', 'C', 'D'], figure: fig }} value={null} onChange={onChange} />);
    expect(screen.getByAltText('A three by three grid')).toHaveAttribute('src', expect.stringMatching(/^data:image\/svg\+xml/));
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    fireEvent.click(screen.getByAltText('Option C: a shape'));
    expect(onChange).toHaveBeenCalledWith(2);
  });
  it('never injects drawing markup into the page (a hostile SVG cannot run script)', () => {
    const evil = '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__pwned=1"><script>window.__pwned=1</script></svg>';
    const { container } = render(<ChoiceItem item={{ id: 'C3', text: 'q', options: ['A', 'B'], figure: { stimulus: { svg: evil, alt: 'x' }, options: [{ svg: evil, alt: 'y' }, { svg: evil, alt: 'z' }] } }} value={null} onChange={() => {}} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(window.__pwned).toBeUndefined();
  });
  it('reflects the chosen option', () => {
    render(<ChoiceItem item={{ id: 'C1', text: 'q', options: ['a', 'b'] }} value={1} onChange={() => {}} />);
    expect(screen.getByLabelText('b')).toBeChecked();
  });
});

describe('PairItem', () => {
  const item = { id: 'S1', text: 'Are the two codes exactly the same?', options: ['Same', 'Different'], pair: ['KB-4821', 'KB-4281'] };
  it('shows both codes, and answers with the option index', () => {
    const onChange = vi.fn();
    render(<PairItem item={item} value={null} onChange={onChange} />);
    expect(screen.getByText('KB-4821')).toBeInTheDocument(); expect(screen.getByText('KB-4281')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Different' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
  it('gives screen readers the codes character by character', () => {
    render(<PairItem item={item} value={null} onChange={() => {}} />);
    expect(screen.getByLabelText(/Code one: K B - 4 8 2 1/)).toBeInTheDocument();
  });
});

describe('Countdown', () => {
  it('counts down against the server clock and expires exactly once', async () => {
    vi.useFakeTimers();
    let local = 0;
    const clock = new ServerClock(() => local);
    clock.observe(100_000, 0, 0);                                    // the server is 100 s ahead of this device
    const onExpire = vi.fn();
    render(<Countdown deadline={160_000} clock={clock} onExpire={onExpire} />);
    expect(screen.getByText(/1:00/)).toBeInTheDocument();           // 60 s left on the server's clock
    await act(async () => { local = 30_000; vi.advanceTimersByTime(250); });
    expect(screen.getByText(/0:30/)).toBeInTheDocument();
    await act(async () => { local = 61_000; vi.advanceTimersByTime(250); });
    await act(async () => { local = 70_000; vi.advanceTimersByTime(1000); });
    expect(onExpire).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('renders nothing for an untimed block', () => {
    const { container } = render(<Countdown deadline={null} clock={new ServerClock()} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('announces to screen readers at 1 minute, not every second', async () => {
    vi.useFakeTimers();
    let local = 0; const clock = new ServerClock(() => local);
    render(<Countdown deadline={90_000} clock={clock} onExpire={() => {}} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();            // 90 s left at the start: the 5-minute mark is not announced
    await act(async () => { local = 31_000; vi.advanceTimersByTime(250); });
    expect(screen.getByRole('status')).toHaveTextContent('0:59 left');
    vi.useRealTimers();
  });
});

describe('SaveStatus and svg', () => {
  it.each([
    [{ state: 'idle', pending: 0 }, /All answers saved/], [{ state: 'saving', pending: 3 }, /Saving/], [{ state: 'idle', pending: 2 }, /Saving/],
    [{ state: 'retrying', pending: 4 }, /Offline — your answers are kept/], [{ state: 'auth', pending: 1 }, /sign in again/]
  ])('%o', (queue, text) => { render(<SaveStatus queue={queue} />); expect(screen.getByRole('status')).toHaveTextContent(text); });
  it('svgToDataUri encodes characters that would break a URL', () => {
    const uri = svgToDataUri('<svg a="#1">100%</svg>');
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(uri).not.toMatch(/[<>"#]/);
    expect(decodeURIComponent(uri.split(',')[1])).toBe('<svg a="#1">100%</svg>');
  });
});
