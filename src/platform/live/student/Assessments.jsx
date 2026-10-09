import { Link } from 'react-router-dom';
import { usePlatform } from '../../data/store';
import { Card, Icon, PageHead, Pill } from '../../ui/kit';
import { fmtDate } from '../../ui/format';

export default function LiveAssessments() {
  const { data } = usePlatform();
  const a = data.assessment, r = data.reports[0];
  return (
    <>
      <PageHead eyebrow="Assessments" title="Check what you know">The career assessment is ready now. Weekly subject check-ins, marked with feedback, are coming.</PageHead>
      <div className="pf-grid g2">
        <Card>
          <div className="pf-row"><span className="pf-pill gold" style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}><Icon name="clipboard" size={22} /></span><div className="pf-grow"><b>Career assessment</b><div className="pf-small pf-muted">Interests, personality, abilities, emotional intelligence and values</div></div>
            <Pill tone={a.state === 'submitted' ? 'leaf' : a.state === 'in_progress' ? 'gold' : 'grey'}>{a.state === 'submitted' ? 'Done' : a.state === 'in_progress' ? 'In progress' : 'Not started'}</Pill></div>
          <p className="pf-small" style={{ margin: '12px 0' }}>{a.state === 'submitted' ? `Finished on ${fmtDate(String(a.completedAt).slice(0, 10))}${a.hollandCode ? `. Interest code ${a.hollandCode}.` : '.'}` : 'You can pause and carry on later. Your answers are saved as you go.'}</p>
          {a.state === 'submitted' && r ? <Link to={`/v4/results/${r.assessmentId}`} className="pf-btn sm">Open my report</Link> : <Link to="/v4" className="pf-btn gold sm"><Icon name="play" size={14} />{a.state === 'in_progress' ? 'Continue' : 'Start'}</Link>}
        </Card>
        <Card ai><span className="tag"><Icon name="sparkles" size={14} />Coming soon</span>
          <p style={{ margin: '8px 0 10px' }}>Short weekly check-ins on what you are studying, marked straight away with feedback on what to practise next. Results will shape your weekly plan.</p></Card>
      </div>
    </>
  );
}
