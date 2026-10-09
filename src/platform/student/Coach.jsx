import { useEffect, useRef, useState } from 'react';
import { usePlatform } from '../data/store';
import { Card, Icon, PageHead } from '../ui/kit';

const PROMPTS = ['Why is this week planned this way?', 'I only have 30 minutes today', 'Explain dot products simply', 'How am I doing on my goal?'];

function reply(q, data) {
  const t = q.toLowerCase();
  if (t.includes('30 minutes') || t.includes('short') || t.includes('little time')) return { text: 'With 30 minutes, do one thing well: the loops practice set. It is the gap your last quiz found, and a short focused block beats a long tired one.', add: { title: 'Loops practice (short)', subject: 'Python', type: 'Practice', start: '18:00', end: '18:30', date: new Date().toISOString().slice(0, 10) } };
  if (t.includes('dot')) return { text: 'A dot product multiplies matching parts of two vectors and adds them up. For (1, 2) and (3, 4): 1×3 + 2×4 = 11. It tells you how much two arrows point the same way, which is the core of how AI compares things.' };
  if (t.includes('goal') || t.includes('how am i')) return { text: `You are ${data.goal.progress}% of the way to your ${data.goal.title} goal. Python is rising and vectors are clicking. The next thing to build is steady practice, so keep your streak going.` };
  if (t.includes('why') || t.includes('week') || t.includes('plan')) return { text: data.aiPlan.why.map(w => w.text).join(' ') };
  return { text: 'I can help with your plan, explain a topic, or suggest what to do with the time you have. Try one of the suggestions below.' };
}

export default function Coach() {
  const { data, actions } = usePlatform();
  const [log, setLog] = useState([{ from: 'ai', text: `Hi ${data.me.firstName}. I know your goal, your plan and your recent scores. What would you like help with?` }]);
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }); }, [log.length]);
  const ask = q => { if (!q.trim()) return; setLog(l => [...l, { from: 'me', text: q }, { from: 'ai', ...reply(q, data) }]); setText(''); };
  return (
    <>
      <PageHead eyebrow="AI coach" title="Ask anything about your plan">Your coach explains topics, adjusts your week and helps when time is short.</PageHead>
      <Card>
        <div className="pf-chat" style={{ minHeight: 280, maxHeight: 420, overflowY: 'auto' }} role="log" aria-label="Conversation with the AI coach">
          {log.map((m, i) => <div key={i} className={`pf-msg ${m.from === 'me' ? 'me' : 'them'}`}>{m.text}
            {m.add && <div style={{ marginTop: 8 }}><button type="button" className="pf-btn sm gold" onClick={() => { actions.addBlock(m.add); setLog(l => [...l, { from: 'ai', text: 'Added to today in your plan.' }]); }}><Icon name="plus" size={14} />Add to my plan</button></div>}</div>)}
          <div ref={end} />
        </div>
        <div className="pf-chip-row" style={{ margin: '12px 0' }}>{PROMPTS.map(p => <button key={p} type="button" className="pf-chip" onClick={() => ask(p)}>{p}</button>)}</div>
        <form className="pf-row" onSubmit={e => { e.preventDefault(); ask(text); }}><input className="pf-input pf-grow" aria-label="Ask the coach" placeholder="Type a question" value={text} onChange={e => setText(e.target.value)} /><button type="submit" className="pf-btn" disabled={!text.trim()}><Icon name="send" size={16} />Ask</button></form>
        <p className="pf-small pf-faint" style={{ margin: '10px 0 0' }}>Sample coach: these replies come from simple rules, not a live AI model yet.</p>
      </Card>
    </>
  );
}
