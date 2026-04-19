import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboard, retakeAssessment, getReportById } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import logoImg from '../assets/imenteo_logo.png';

// ── Helpers
function scoreBand(pct) {
  if (pct >= 75) return { label: 'Strong', color: '#047857', bg: '#D1FAE5' };
  if (pct >= 60) return { label: 'Good', color: '#B45309', bg: '#FEF3C7' };
  if (pct >= 45) return { label: 'Partial', color: '#4338CA', bg: '#EEF2FF' };
  return { label: 'Developing', color: '#9CA3AF', bg: '#F3F4F6' };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({ icon, iconBg, label, value, sub, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: '1px solid var(--border)', flex: 1, minWidth: 160,
      transition: 'box-shadow .2s, transform .2s', cursor: 'default'
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
        }}>{icon}</div>
        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <span style={{ fontSize: 12, color: accent || '#059669', fontWeight: 600 }}>{sub}</span>}
    </div>
  );
}

/* ── Trait Bar ──────────────────────────────────────── */
function TraitBar({ label, value, color }) {
  const pct = value || 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#6B7280', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color || '#6366F1', borderRadius: 100, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

/* ── Test Row Card ─────────────────────────────────── */
function TestRow({ test, onView, onDownload }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(test.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const b = scoreBand(test.cognitiveScore);

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid var(--border)',
      marginBottom: 10, overflow: 'hidden', transition: 'box-shadow .2s'
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.05)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Attempt badge */}
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `linear-gradient(135deg, ${test.attempt === 1 ? '#6366F1' : test.attempt === 2 ? '#8B5CF6' : '#A855F7'}, ${test.attempt === 1 ? '#818CF8' : test.attempt === 2 ? '#A78BFA' : '#C084FC'})`,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, flexShrink: 0
        }}>#{test.attempt}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>Assessment {test.attempt}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{date} {test.durationMinutes ? `· ${test.durationMinutes} min` : ''}</div>
        </div>

        {/* Score chips */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--navy)', color: '#fff', padding: '3px 9px', borderRadius: 6 }}>{test.hollandCode || '—'}</span>
          <span style={{ fontSize: 11, fontWeight: 600, background: b.bg, color: b.color, padding: '3px 9px', borderRadius: 6 }}>{test.cognitiveScore}%</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setExpanded(e => !e)}
            style={{
              background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '7px 12px',
              fontSize: 12, fontWeight: 600, color: 'var(--navy)', cursor: 'pointer', fontFamily: 'inherit'
            }}>
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={onView}
            style={{
              background: 'var(--navy)', border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit'
            }}>
            View
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '16px 18px', borderTop: '1px solid #F3F4F6', animation: 'fadeIn .25s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: '#9CA3AF', marginBottom: 10 }}>Personality</p>
              <TraitBar label="Openness" value={test.personality?.openness} color="#6366F1" />
              <TraitBar label="Conscientiousness" value={test.personality?.conscientiousness} color="#8B5CF6" />
              <TraitBar label="Extraversion" value={test.personality?.extraversion} color="#A855F7" />
              <TraitBar label="Agreeableness" value={test.personality?.agreeableness} color="#EC4899" />
              <TraitBar label="Neuroticism" value={test.personality?.neuroticism} color="#F59E0B" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: '#9CA3AF', marginBottom: 10 }}>Top Careers</p>
              {(test.top3Careers || []).map(c => {
                const cb = scoreBand(c.score_pct);
                return (
                  <div key={c.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 5,
                      background: c.rank === 1 ? '#F59E0B' : c.rank === 2 ? '#D1D5DB' : '#D97706',
                      color: c.rank === 1 ? '#fff' : '#374151',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, flexShrink: 0
                    }}>{c.rank}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.career}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{c.cluster}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cb.color }}>{c.score_pct}%</span>
                  </div>
                );
              })}
              {/* Score summary */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {[['Confidence', test.confidenceScore], ['Consistency', test.consistencyScore]].map(([l, v]) => (
                  <div key={l} style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   USER DASHBOARD
   ═══════════════════════════════════════════════════════ */
export default function UserDashboard() {
  const nav = useNavigate();
  const { user, clearSession } = useAuth();
  const { dispatch } = useAssessment();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(({ data: d }) => { setData(d); setLoading(false); })
      .catch(e => {
        if (e.response?.status === 401) { clearSession(); nav('/login'); return; }
        setError('Failed to load dashboard'); setLoading(false);
      });
  }, []);

  const handleRetake = async () => {
    if (!window.confirm('This will start a new assessment. Your current results are saved. Continue?')) return;
    setRetaking(true);
    try {
      await retakeAssessment();
      dispatch({ type: 'RESET' });
      nav('/assessment');
    } catch { setRetaking(false); }
  };

  const handleDownload = async (assessmentId, attempt) => {
    try {
      const { data: r } = await getReportById(assessmentId);
      const blob = new Blob([JSON.stringify(r.report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(user?.fullName || 'Student').replace(/\s+/g, '_')}_iMenteo_Test${attempt}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert('Could not download report'); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', flexDirection: 'column', gap: 14 }}>
      <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
      <p style={{ fontSize: 14, color: '#6B7280' }}>Loading your dashboard...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="error-msg" style={{ maxWidth: 400 }}>{error}</div>
    </div>
  );

  const { profile, inProgress, totalAssessments, pastTests } = data;
  const latestTest = pastTests?.[0];
  const bestCognitive = pastTests?.length > 0 ? Math.max(...pastTests.map(t => t.cognitiveScore || 0)) : 0;
  const totalTime = pastTests?.reduce((sum, t) => sum + (t.durationMinutes || 0), 0) || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* ─── Top Nav ─────────────────────────────────── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="iMenteo" style={{ height: 24 }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Notification bell */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          {/* Settings */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <button onClick={() => { clearSession(); dispatch({ type: 'RESET' }); nav('/'); }}
            style={{
              background: '#F3F4F6', border: 'none', color: '#6B7280',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer'
            }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px 60px' }}>
        {/* ─── Main Unified Card ─────────────────────── */}
        <div className="animate-fadeIn" style={{
          background: '#fff', borderRadius: 24, padding: '40px',
          border: '1px solid #E5E7EB', boxShadow: '0 10px 40px rgba(0,0,0,.04)'
        }}>
          {/* Greeting inside the card */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
              {getGreeting()}, {profile?.fullName?.split(' ')[0]}!
            </h1>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>Get an overview of your progress and career insights</p>
          </div>

          {/* Stat Cards Row */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
              iconBg="#EEF2FF"
              label="Total Assessments"
              value={totalAssessments}
              sub={totalAssessments > 0 ? `${totalTime} min total` : 'Not started'}
              accent={totalAssessments > 0 ? '#6366F1' : '#9CA3AF'}
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
              iconBg="#D1FAE5"
              label="Best Cognitive Score"
              value={bestCognitive > 0 ? `${bestCognitive}%` : '—'}
              sub={bestCognitive >= 75 ? 'Excellent' : bestCognitive >= 60 ? 'Good performance' : bestCognitive > 0 ? 'Room to grow' : 'Take assessment'}
              accent={bestCognitive >= 60 ? '#059669' : bestCognitive > 0 ? '#F59E0B' : '#9CA3AF'}
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
              iconBg="#FCE7F3"
              label="Holland Code"
              value={latestTest?.hollandCode || '—'}
              sub={latestTest?.topCareer ? `Top: ${latestTest.topCareer.name}` : 'Discover your type'}
              accent="#EC4899"
            />
          </div>

          <div style={{ height: '1px', background: '#F3F4FB', marginBottom: 32 }} />

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }} className="dashboard-grid">

            {/* LEFT COLUMN */}
            <div>
              {/* In-progress Banner */}
              {inProgress && (
                <div style={{
                  background: 'var(--mist)', borderLeft: '4px solid #F59E0B',
                  borderRadius: 14, padding: '18px 20px', marginBottom: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>Assessment in progress</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                      Section {inProgress.currentSection} · {inProgress.answeredCount.A + inProgress.answeredCount.B + inProgress.answeredCount.C} / 110 answered
                    </div>
                  </div>
                  <Link to="/assessment"
                    style={{
                      background: 'var(--navy)', color: '#fff', fontSize: 13,
                      fontWeight: 600, padding: '10px 20px', borderRadius: 10, textDecoration: 'none'
                    }}>
                    Continue →
                  </Link>
                </div>
              )}

              {/* History Section */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>Assessment History</h2>
                </div>

                {totalAssessments === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--mist)', borderRadius: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>🎯</div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>No assessments yet</h3>
                    <button onClick={handleRetake} style={{ background: 'var(--navy)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '11px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Start Assessment</button>
                  </div>
                ) : (
                  <div>
                    {pastTests.map(test => (
                      <TestRow
                        key={test.assessmentId}
                        test={test}
                        onView={() => nav(`/results/${test.assessmentId}`)}
                        onDownload={() => handleDownload(test.assessmentId, test.attempt)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleRetake} disabled={retaking} style={{ flex: 1, background: 'var(--navy)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>{retaking ? 'Starting...' : 'Retake Assessment'}</button>
                  <button onClick={() => nav('/')} style={{ flex: 1, background: 'var(--mist)', color: 'var(--navy)', fontSize: 13, fontWeight: 600, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>Back Home</button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ borderLeft: '1px solid #F3F4FB', paddingLeft: 40 }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 700, color: '#fff',
                  boxShadow: '0 0 0 4px #fff, 0 0 0 6px #EEF2FF'
                }}>{profile?.fullName?.[0]?.toUpperCase() || '?'}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>{profile?.fullName}</h2>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>@{profile?.username}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                {[
                  ['Tests', totalAssessments],
                  ['Avg', `${bestCognitive}%`],
                  ['Time', `${totalTime}m`]
                ].map(([l, v]) => (
                  <div key={l} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--mist)', borderRadius: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>

              <div>
                {[
                  { icon: '📧', label: 'Email', value: profile?.email },
                  { icon: '🎓', label: 'Education', value: profile?.educationLevel },
                  { icon: '📚', label: 'Field', value: profile?.fieldOfStudy },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4FB' }}>
                    <div style={{ fontSize: 16 }}>{row.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{row.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Responsive ──────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
        .dashboard-grid {
          grid-template-columns: 1fr 340px;
        }
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .dashboard-grid {
            gap: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
