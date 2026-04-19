import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { useAuth } from '../context/AuthContext';
import { getUserReport, getReportById } from '../api';

function band(pct) {
  if (pct >= 75) return { cls: 'strong', label: 'Strong Alignment', fill: 'fill-strong' };
  if (pct >= 60) return { cls: 'good', label: 'Good Fit', fill: 'fill-good' };
  if (pct >= 45) return { cls: 'partial', label: 'Partial Fit', fill: 'fill-partial' };
  return { cls: 'weak', label: 'Developing', fill: 'fill-weak' };
}

function ScoreBar({ label, value, color }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, letterSpacing: '.3px', color: 'var(--slate)', marginBottom: 4 }}>
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

function CareerCard({ c, showRank, showGap }) {
  const b = band(c.score_pct);
  const br = c.breakdown || {};
  return (
    <div style={{
      background: c.score_pct >= 60 ? '#F0FDF4' : 'var(--white)',
      border: `1px solid ${c.score_pct >= 60 ? '#A7F3D0' : 'var(--border)'}`,
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showRank && (
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: c.rank === 1 ? '#F59E0B' : c.rank === 2 ? '#D1D5DB' : c.rank === 3 ? '#D97706' : 'var(--navy)',
            color: c.rank <= 3 ? (c.rank === 2 ? 'var(--navy)' : '#fff') : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, flexShrink: 0
          }}>{c.rank}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.career}</div>
          <div style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 500, marginTop: 1 }}>{c.cluster}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{c.score_pct}%</div>
          <div className={`band-${b.cls}`} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.3px' }}>{b.label}</div>
          <div style={{ height: 4, width: 72, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginTop: 4 }}>
            <div className={b.fill} style={{ height: '100%', width: `${c.score_pct}%`, borderRadius: 100 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ScoreBar label="Interest" value={br.interest_fit || 0} color="#4338CA" />
        <ScoreBar label="Skills" value={br.skill_fit || 0} color="#059669" />
        <ScoreBar label="Personality" value={br.personality_fit || 0} color="#F59E0B" />
        <ScoreBar label="Behavior" value={br.behavior_fit || 0} color="#7C3AED" />
      </div>
      {showGap && c.gap_analysis?.length > 0 && (
        <div style={{ background: 'var(--red-lt)', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>Development Areas:</strong>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {c.gap_analysis.map((g, i) => <li key={i}>↑ {g.cat}: {g.dim} — you: {g.student}%, need: {g.need}%</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const nav = useNavigate();
  const { assessmentId: routeAssessmentId } = useParams();
  const { state, dispatch } = useAssessment();
  const { user, clearSession } = useAuth();

  const [results, setResults] = useState(state.results);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(!state.results);

  useEffect(() => {
    if (state.results) return;
    setLoading(true);
    const fetcher = routeAssessmentId ? getReportById(routeAssessmentId) : getUserReport();
    fetcher
      .then(({ data }) => {
        setResults({
          personality: data.report.personality,
          interests: data.report.interests,
          cognitive: data.report.cognitive,
          behavioral: data.report.behavioral,
          student_vector: data.report.student_vector,
          top_10_careers: data.report.top_10_career_recommendations,
          all_50_careers_ranked: data.report.all_50_careers_ranked
        });
      })
      .catch(e => {
        if (e.response?.status === 401) { clearSession(); nav('/login'); return; }
        nav('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [routeAssessmentId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
    </div>
  );
  if (!results) return null;

  const { personality, interests, cognitive, behavioral, top_10_careers = [], all_50_careers_ranked = [] } = results;
  const hollandCode = interests?.holland_code || '—';

  const fullReport = {
    student_name: user?.fullName || state.fullName || 'Student',
    username: user?.username || '',
    assessment_version: '3.0',
    platform: 'iMenteo',
    personality, interests, cognitive, behavioral,
    student_vector: results.student_vector,
    top_10_career_recommendations: top_10_careers,
    all_50_careers_ranked
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(user?.fullName || 'Student').replace(/\s+/g, '_')}_iMenteo_Report.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', padding: '32px 16px 60px', display: 'flex', justifyContent: 'center' }}>
      <div className="animate-fadeIn" style={{ background: 'var(--white)', borderRadius: 20, padding: '40px 36px', maxWidth: '100%', width: '100%', border: '1px solid var(--border)', boxShadow: 'var(--sh-lg)' }}>

        {/* Back link */}
        <div style={{ marginBottom: 24 }}>
          <Link to="/dashboard" style={{ fontSize: 13, color: 'var(--slate)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: '#059669', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>
            {routeAssessmentId ? 'Past Assessment Results' : 'Assessment Complete!'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.7 }}>
            {routeAssessmentId ? 'Viewing a past assessment result' : `Great work, `}
            {!routeAssessmentId && <><strong>{user?.fullName || state.fullName || 'Student'}</strong>! Your Career Intelligence Profile is ready. </>}
            Holland Code: <strong style={{ color: 'var(--navy)' }}>{hollandCode}</strong>
          </p>
        </div>

        {/* Score chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 28 }}>
          {[
            ['Holland Code', hollandCode, ''],
            ['Cognitive', `${cognitive?.composite_score ?? 0}`, '/100'],
            ['Engagement', `${behavioral?.engagement_index ?? 0}`, '%'],
            ['Consistency', `${behavioral?.consistency_score ?? 0}`, '/100']
          ].map(([l, v, u]) => (
            <div key={l} style={{ background: 'var(--mist)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--slate)', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{v}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate)' }}>{u}</span></div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {[
            ['strong', '#D1FAE5', '#047857', '≥75% Strong'],
            ['good', '#FEF3C7', '#B45309', '60–74% Good'],
            ['partial', '#EEF2FF', '#4338CA', '45–59% Partial'],
            ['weak', '#F3F4F6', '#9CA3AF', '<45% Developing']
          ].map(([k, bg, c, l]) => (
            <span key={k} style={{ background: bg, color: c, padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>{l}</span>
          ))}
        </div>

        {/* Top 10 */}
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>
          Top 10 Career Matches
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--slate)', marginLeft: 8 }}>cluster-diversified</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {top_10_careers.map(c => <CareerCard key={c.id || c.career} c={c} showRank showGap={c.rank <= 3} />)}
        </div>

        {/* All 50 toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--navy)', borderRadius: 10, padding: '12px 16px',
          marginBottom: showAll ? 12 : 24
        }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>All 50 Careers — Full Rankings</span>
          <button onClick={() => setShowAll(s => !s)} style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
            color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', transition: 'all .15s'
          }}>
            {showAll ? 'Hide ▲' : 'Show All ▼'}
          </button>
        </div>
        {showAll && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
            {all_50_careers_ranked.map((c, idx) => (
              <div key={c.id || c.career} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'var(--white)', borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: 'var(--mist)',
                  color: 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, flexShrink: 0
                }}>{idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.career}</div>
                  <div style={{ fontSize: 10, color: 'var(--slate)' }}>{c.cluster}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 72 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>{c.score_pct}%</div>
                  <div style={{ height: 3, width: 72, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginTop: 3 }}>
                    <div className={band(c.score_pct).fill} style={{ height: '100%', width: `${c.score_pct}%`, borderRadius: 100 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {/* <button className="btn-primary btn-green" style={{ marginBottom: 10 }} onClick={downloadReport}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Full JSON Report
        </button> */}
        <Link to="/dashboard"
          style={{
            display: 'block', textAlign: 'center', width: '100%',
            background: 'transparent', color: 'var(--slate)', fontFamily: 'inherit', fontSize: 13,
            fontWeight: 500, padding: 13, border: '1px solid var(--border)', borderRadius: 10,
            cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box', transition: 'all .15s'
          }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
