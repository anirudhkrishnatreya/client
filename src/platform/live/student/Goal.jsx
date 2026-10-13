import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, CardHead, Icon, PageHead } from '../../ui/kit';
import { errMessage } from '../liveApi';

export default function LiveGoal() {
  const { data, actions } = usePlatform();
  const [text, setText] = useState(data.goal.title || '');
  const [state, setState] = useState('');
  const save = async e => {
    e.preventDefault(); setState('');
    try { await actions.setGoal(text); setState('saved'); } catch (err) { setState(errMessage(err)); }
  };
  return (
    <>
      <PageHead eyebrow="My goal" title="Where do you want to get to?">A goal gives every week a direction. It can be a job, a course or just a field you want to explore. You can change it whenever you like.</PageHead>
      <div className="pf-grid g-main-r">
        <Card><CardHead title="Your goal" icon="target" />
          <form onSubmit={save}>
            <label className="pf-label" htmlFor="goal">In a few words</label>
            <input id="goal" className="pf-input" value={text} onChange={e => { setText(e.target.value); setState(''); }} maxLength={100} placeholder="For example: AI engineer, doctor, game designer" />
            <div className="pf-row" style={{ marginTop: 12 }}><button type="submit" className="pf-btn" disabled={text.trim().length < 2}>Save goal</button>
              {state === 'saved' ? <span className="pf-small" style={{ color: 'var(--leaf)' }} role="status">Saved.</span> : state ? <span className="pf-small" style={{ color: 'var(--coral)' }} role="alert">{state}</span> : null}</div>
          </form></Card>
        <Card ai><span className="tag"><Icon name="sparkles" size={14} />Not sure yet?</span>
          <p style={{ margin: '8px 0 10px' }}>The career assessment shows which fields fit your interests, personality and strengths. Many students find their goal there.</p>
          <Link to={data.assessment.state === 'submitted' ? '../reports' : '/v4'} className="pf-btn sm">{data.assessment.state === 'submitted' ? 'See my report' : 'Take the career assessment'}</Link></Card>
      </div>
      <p className="pf-small pf-faint" style={{ marginTop: 18 }}>A step-by-step roadmap and a weekly study plan built around your goal are being added next.</p>
    </>
  );
}
