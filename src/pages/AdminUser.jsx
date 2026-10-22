import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminGetUser, adminSetUserAi } from '../api';

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '7px 0', borderBottom: '1px solid var(--mist)', fontSize: 13 }}>
      <span style={{ minWidth: 200, color: 'var(--slate)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{value ?? '—'}</span>
    </div>
  );
}

/** Today's AI use for this account, a reset, and the account's own daily limit (for testers or students who need more). */
function AiLimit({ id, ai: start }) {
  const [ai, setAi] = useState(start);
  const [custom, setCustom] = useState('');
  const [msg, setMsg] = useState('');
  const run = async (body, done) => { setMsg(''); try { const r = await adminSetUserAi(id, body); setAi(r.data.ai); setMsg(done); } catch (e) { setMsg(e.response?.data?.details ? Object.values(e.response.data.details)[0] : 'That did not work.'); } };
  if (!ai) return null;
  const btn = { padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--white)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };
  return (
    <Section title="✨ AI use today">
      <Row label="Used today" value={ai.unlimited ? `${ai.used} (no limit on this account)` : `${ai.used} of ${ai.limit} (${ai.left} left)`} />
      <Row label="Resets" value={new Date(ai.resetsAt).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })} />
      {ai.paused && <Row label="Budget" value="Today's or this month's AI budget is spent: AI is paused for everyone." />}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
        <button type="button" style={btn} onClick={() => run({ reset: true }, 'Reset: today’s count starts again from now.')}>Reset today’s limit</button>
        <input aria-label="Daily AI limit for this account" type="number" min="-1" max="1000" placeholder="Own daily limit" value={custom} onChange={e => setCustom(e.target.value)} style={{ width: 150, padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
        <button type="button" style={btn} disabled={custom === ''} onClick={() => run({ dailyCalls: Number(custom) }, 'Saved this account’s own limit.')}>Set limit</button>
        <button type="button" style={btn} onClick={() => run({ dailyCalls: null }, 'Back to the default limit.')}>Use default</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 8 }}>-1 means no daily limit (for the team’s own testing). The spending caps for the whole app still apply.</p>
      {msg && <p role="status" style={{ fontSize: 13, marginTop: 6 }}>{msg}</p>}
    </Section>
  );
}

function ScoreChip({ label, value, unit = '' }) {
  return (
    <div style={{ background: 'var(--mist)', borderRadius: 9, padding: '12px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--slate)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{value}<span style={{ fontSize: 11, color: 'var(--slate)' }}>{unit}</span></div>
    </div>
  );
}

export default function AdminUser() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetUser(id).then(({ data: d }) => { setData(d); setLoading(false); })
      .catch(e => {
        if (e.response?.status === 401) { localStorage.removeItem('im_admin_token'); nav('/admin/login'); }
        else setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>User not found</div>;

  const { user, assessment } = data;
  const a = assessment;

  const downloadJSON = () => {
    if (!a) return;
    const report = { student_name: user.fullName, email: user.email, assessment_date: a.completedAt, onboarding: user, personality: a.personality, interests: a.interests, cognitive: a.cognitive, behavioral: a.behavioral, top_10_career_recommendations: a.topCareers, all_50_careers_ranked: a.allCareersRanked };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = `${user.fullName.replace(/\s+/g,'_')}_iMenteo_Report.json`;
    document.body.appendChild(el); el.click(); document.body.removeChild(el); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Nav */}
      <div style={{ background: 'var(--navy)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/admin" style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, textDecoration: 'none' }}>← Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,.3)' }}>/</span>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{user.fullName}</span>
      </div>

      <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{user.fullName}</h1>
            <p style={{ fontSize: 13, color: 'var(--slate)' }}>{user.email} · {user.phone}</p>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Registered: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {a && <button className="btn-base btn-green" onClick={downloadJSON} style={{ padding: '10px 20px' }}>📥 Download JSON Report</button>}
            <span style={{ background: user.assessmentCompleted ? 'var(--green-lt)' : 'var(--amber-lt)', color: user.assessmentCompleted ? 'var(--green)' : '#8A5200', fontSize: 12, fontWeight: 700, padding: '10px 16px', borderRadius: 9, display: 'flex', alignItems: 'center' }}>
              {user.assessmentCompleted ? '✓ Completed' : '⏳ Pending'}
            </span>
          </div>
        </div>

        <AiLimit id={id} ai={data.ai} />

        {/* Onboarding Data */}
        <Section title="📋 Onboarding Information">
          <Row label="Education Level" value={user.educationLevel} />
          <Row label="Field of Study" value={user.fieldOfStudy} />
          <Row label="Current Career Path" value={user.currentCareerPath} />
          <Row label="Prior Research" value={user.priorResearch} />
          <Row label="Short-term Goal" value={user.shortTermGoal} />
          <Row label="Biggest Career Fear" value={user.biggestCareerFear} />
        </Section>

        <Section title="🧭 Self-Assessment Scores (1–5 Scale)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            <ScoreChip label="Career Satisfaction" value={user.careerSatisfaction} unit="/5" />
            <ScoreChip label="Feel Stuck" value={user.feelStuck} unit="/5" />
            <ScoreChip label="Confidence in Field" value={user.confidenceInField} unit="/5" />
            <ScoreChip label="Wrong Career Concern" value={user.wrongCareerConcern} unit="/5" />
            <ScoreChip label="External Pressure" value={user.externalPressure} unit="/5" />
            <ScoreChip label="Motivation Level" value={user.motivationLevel} unit="/5" />
            <ScoreChip label="Career Clarity" value={user.careerClarity} unit="/5" />
            <ScoreChip label="Exploration Readiness" value={user.explorationReadiness} unit="/5" />
          </div>
        </Section>

        {a ? (
          <>
            {/* Assessment Scores */}
            <Section title="🧠 Assessment Results">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
                <ScoreChip label="Holland Code" value={a.interests?.holland_code || '—'} />
                <ScoreChip label="Cognitive" value={a.cognitive?.composite_score || 0} unit="/100" />
                <ScoreChip label="Confidence" value={a.behavioral?.confidence_score || 0} unit="/100" />
                <ScoreChip label="Consistency" value={a.behavioral?.consistency_score || 0} unit="/100" />
                <ScoreChip label="Engagement" value={a.behavioral?.engagement_index || 0} unit="%" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', letterSpacing: '.7px', marginBottom: 10 }}>Personality (Big Five)</p>
                  {a.personality && Object.entries({ Openness: a.personality.openness, Conscientiousness: a.personality.conscientiousness, Extraversion: a.personality.extraversion, Agreeableness: a.personality.agreeableness, Neuroticism: a.personality.neuroticism }).map(([k,v]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ color: 'var(--slate)' }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
                      <div style={{ height: 5, background: 'var(--mist)', borderRadius: 100, overflow: 'hidden' }}><div style={{ height: '100%', width: `${v}%`, background: 'var(--amber)', borderRadius: 100 }} /></div>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', letterSpacing: '.7px', marginBottom: 10 }}>Cognitive Scores</p>
                  {a.cognitive && Object.entries({ 'Logical Reasoning': a.cognitive.logical_reasoning, 'Numerical Ability': a.cognitive.numerical_ability, 'Verbal Reasoning': a.cognitive.verbal_reasoning, 'Pattern Reasoning': a.cognitive.pattern_reasoning }).map(([k,v]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ color: 'var(--slate)' }}>{k}</span><span style={{ fontWeight: 700 }}>{v}%</span></div>
                      <div style={{ height: 5, background: 'var(--mist)', borderRadius: 100, overflow: 'hidden' }}><div style={{ height: '100%', width: `${v}%`, background: '#3355CC', borderRadius: 100 }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Top 10 Careers */}
            <Section title="🏆 Top 10 Career Recommendations">
              {(a.topCareers || []).map(c => (
                <div key={c.id || c.career} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--mist)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: c.rank <= 3 ? 'var(--amber)' : 'var(--mist)', color: c.rank <= 3 ? 'var(--navy)' : 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{c.rank}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{c.career}</div><div style={{ fontSize: 11, color: 'var(--slate)' }}>{c.cluster}</div></div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{c.score_pct}%</div>
                </div>
              ))}
            </Section>
          </>
        ) : (
          <div style={{ background: 'var(--amber-lt)', border: '1.5px solid var(--amber)', borderRadius: 12, padding: 24, textAlign: 'center', color: '#8A5200' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>⏳ Assessment Not Completed</div>
            <div style={{ fontSize: 13 }}>This user has not yet completed the assessment. Results will appear here once they finish.</div>
          </div>
        )}
      </div>
    </div>
  );
}
