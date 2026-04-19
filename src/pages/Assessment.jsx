import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions, saveProgress, submitAssessment, resumeProgress } from '../api';
import { useAssessment } from '../context/AssessmentContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/imenteo_logo.png';

const LIKERT_LABELS = ['Strongly\nDisagree','Disagree','Neutral','Agree','Strongly\nAgree'];
const SECTION_META = {
  A: { label: 'Personality',      desc: 'Rate each statement 1 (Strongly Disagree) → 5 (Strongly Agree). No right or wrong answers.', type: 'likert', count: 50 },
  B: { label: 'Career Interests', desc: 'Rate how much each statement reflects your genuine interests and preferences.', type: 'likert', count: 36 },
  C: { label: 'Cognitive Skills', desc: 'Choose the best answer. These questions have correct answers.', type: 'mcq', count: 24 }
};
const SECTION_ICONS = {
  A: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  B: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  C: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
};
const SAVE_DEBOUNCE_MS = 1500;

export default function Assessment() {
  const nav = useNavigate();
  const { state, dispatch, buildBehaviorPayload } = useAssessment();
  const { user, isLoggedIn } = useAuth();

  const [currentSection, setCurrentSection] = useState(state.currentSection || 'A');
  const [showIntro, setShowIntro]             = useState(true);
  const [loading, setLoading]                 = useState(true);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState('');
  const [flagged, setFlagged]                 = useState({});
  const [saveStatus, setSaveStatus]           = useState('');
  const [resumeRestored, setResumeRestored]   = useState(false);

  const sectionStartRef = useRef({});
  const saveTimerRef    = useRef(null);
  const bodyRef         = useRef();

  // ── Guard: must be logged in
  useEffect(() => {
    if (!isLoggedIn) { nav('/login'); return; }

    const init = async () => {
      try {
        if (!state.questions) {
          const { data } = await getQuestions();
          dispatch({ type: 'SET_QUESTIONS', questions: data.sections });
        }
        const { data: resumeData } = await resumeProgress();
        if (resumeData.status === 'completed') { nav(`/results?userId=${user.id}`); return; }
        if (resumeData.status === 'in_progress' && !resumeRestored) {
          const p = resumeData.progress;
          dispatch({
            type: 'RESTORE_PROGRESS',
            answersA: p.answersA, answersB: p.answersB, answersC: p.answersC,
            currentSection: p.currentSection, currentQuestionIndex: p.currentQuestionIndex,
            startedAt: p.startedAt, behaviorSnapshot: p.behaviorSnapshot
          });
          setCurrentSection(p.currentSection);
          const hasAnswers = Object.keys(p[`answers${p.currentSection}`] || {}).length > 0;
          if (hasAnswers) setShowIntro(false);
          setResumeRestored(true);
        }
      } catch (e) {
        if (e.response?.status === 401) { nav('/login'); return; }
        setError('Failed to load assessment. Please refresh the page.');
      } finally { setLoading(false); }
    };
    init();
  }, [isLoggedIn]);

  // ── Auto-save
  const triggerAutoSave = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const qs = state.questions?.[currentSection]?.questions;
        const currentIdx = qs ? qs.findIndex(q => state.answers[currentSection][q.id] === undefined) : 0;
        await saveProgress({
          currentSection,
          currentQuestionIndex: currentIdx >= 0 ? currentIdx : (qs?.length || 0),
          answersA: state.answers.A, answersB: state.answers.B, answersC: state.answers.C,
          behaviorSnapshot: {
            avgAnswerChanges: buildBehaviorPayload().avgAnswerChanges,
            sessionPauses: state.behavior.pauses,
            sectionTimes: state.behavior.sectionTimes,
            totalAnswered: Object.keys(state.answers.A).length + Object.keys(state.answers.B).length + Object.keys(state.answers.C).length
          },
          startedAt: state.startedAt
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch { setSaveStatus('error'); }
    }, SAVE_DEBOUNCE_MS);
  }, [currentSection, state.answers, state.behavior, state.startedAt]);

  useEffect(() => {
    const total = Object.keys(state.answers.A).length + Object.keys(state.answers.B).length + Object.keys(state.answers.C).length;
    if (total > 0) triggerAutoSave();
    return () => clearTimeout(saveTimerRef.current);
  }, [state.answers]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', flexDirection: 'column', gap: 16 }}>
      <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
      <p style={{ fontSize: 14, color: '#6B7280' }}>Loading your assessment...</p>
    </div>
  );

  if (error && !state.questions) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FAFAFA' }}>
      <div style={{ maxWidth: 400, textAlign: 'center', background: '#fff', padding: '40px 32px', borderRadius: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, fontSize: 14, marginBottom: 20, border: '1px solid #FEE2E2' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{
          padding: '14px 32px', backgroundColor: '#1A221E', color: 'white', border: 'none',
          borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
        }}>Reload Page</button>
      </div>
    </div>
  );

  if (!state.questions) return null;

  const qs   = state.questions[currentSection]?.questions || [];
  const meta = SECTION_META[currentSection];
  const totalAnswered = Object.keys(state.answers[currentSection]).length;
  const progress = Math.round((totalAnswered / qs.length) * 100);
  const globalAnswered = Object.keys(state.answers.A).length + Object.keys(state.answers.B).length + Object.keys(state.answers.C).length;
  const globalProgress = Math.round((globalAnswered / 110) * 100);

  const recordAnswer = (qid, val) => {
    dispatch({ type: 'RECORD_ANSWER', section: currentSection, qid, val });
    setFlagged(f => { const n = { ...f }; delete n[qid]; return n; });
  };

  const beginSection = () => {
    if (!state.startedAt) dispatch({ type: 'SET_STARTED' });
    sectionStartRef.current[currentSection] = Date.now();
    setShowIntro(false);
    setFlagged({});
    bodyRef.current?.scrollTo(0, 0);
  };

  const goNext = async () => {
    const unanswered = qs.filter(q => state.answers[currentSection][q.id] === undefined);
    if (unanswered.length > 0) {
      const flags = {};
      unanswered.forEach(q => { flags[q.id] = true; });
      setFlagged(flags);
      document.getElementById('card-' + unanswered[0].id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const start = sectionStartRef.current[currentSection];
    if (start) {
      const mins = parseFloat(((Date.now() - start) / 60000).toFixed(1));
      dispatch({ type: 'SET_SECTION_TIME', section: currentSection, minutes: mins });
    }
    if (currentSection === 'A') { dispatch({ type: 'SET_SECTION', section: 'B' }); setCurrentSection('B'); setShowIntro(true); }
    else if (currentSection === 'B') { dispatch({ type: 'SET_SECTION', section: 'C' }); setCurrentSection('C'); setShowIntro(true); }
    else { await handleSubmit(); }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    clearTimeout(saveTimerRef.current);
    try {
      const { data } = await submitAssessment({
        sectionA: state.answers.A, sectionB: state.answers.B, sectionC: state.answers.C,
        behaviorData: buildBehaviorPayload(), startedAt: state.startedAt
      });
      dispatch({ type: 'SET_RESULTS', results: data.results });
      nav('/results');
    } catch (e) {
      setError(e.response?.data?.error || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  /* ── Section Intro Screen ─────────────────────────── */
  if (showIntro) {
    const times = { A: 15, B: 12, C: 20 };
    const existingAnswers = Object.keys(state.answers[currentSection]).length;
    const sectionNumber = currentSection === 'A' ? 1 : currentSection === 'B' ? 2 : 3;
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
        {/* Minimal nav */}
        <div style={{ padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
          <img src={logoImg} alt="iMenteo" style={{ height: 28 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  width: n === sectionNumber ? 32 : 8, height: 4, borderRadius: 2,
                  background: n < sectionNumber ? '#1A221E' : n === sectionNumber ? '#1A221E' : '#E5E7EB',
                  transition: 'all .4s ease'
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
              {user?.fullName || state.fullName}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div className="animate-slideUp" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
            {/* Section badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1A221E', color: '#fff',
              fontSize: 12, fontWeight: 700, padding: '8px 20px', borderRadius: 100, marginBottom: 28,
              letterSpacing: '0.5px', textTransform: 'uppercase'
            }}>
              {SECTION_ICONS[currentSection]}
              Section {sectionNumber} · {meta.label}
            </div>

            {existingAnswers > 0 && (
              <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '12px 20px', marginBottom: 24, fontSize: 14, color: '#047857', fontWeight: 500 }}>
                ✓ Resuming — {existingAnswers} of {meta.count} answers saved
              </div>
            )}

            <h2 style={{ fontSize: 36, fontWeight: 600, color: '#1A221E', marginBottom: 16, lineHeight: 1.2 }}>
              {state.questions[currentSection]?.label}
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 40, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 40px' }}>{meta.desc}</p>

            <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginBottom: 40, background: '#F3F4F6', borderRadius: 14, overflow: 'hidden', maxWidth: 360, margin: '0 auto 40px' }}>
              {[['Questions', meta.count], ['Minutes', times[currentSection]], ['Format', meta.type === 'likert' ? '1–5 Scale' : 'MCQ']].map(([l,v]) => (
                <div key={l} style={{ flex: 1, background: '#fff', padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1A221E', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginTop: 6 }}>{l}</div>
                </div>
              ))}
            </div>

            <button onClick={beginSection} style={{
              padding: '16px 48px', backgroundColor: '#1A221E', color: '#fff', border: 'none',
              borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,.1)'
            }}
              onMouseOver={e => { e.target.style.backgroundColor = '#000'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.target.style.backgroundColor = '#1A221E'; e.target.style.transform = 'translateY(0)'; }}>
              {existingAnswers > 0 ? 'Continue Section →' : 'Begin Section →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Assessment View ─────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAFA' }}>
      {/* ── Professional Top Nav */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F3F4F6',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={logoImg} alt="iMenteo" style={{ height: 28 }} />
          <div style={{ width: 1, height: 24, background: '#F3F4F6' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A221E' }}>Assessment</span>
        </div>

        {/* Center: Section tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 12, padding: 3 }}>
          {['A','B','C'].map(s => {
            const done = Object.keys(state.answers[s]).length === SECTION_META[s].count;
            const active = s === currentSection;
            const answered = Object.keys(state.answers[s]).length;
            return (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                background: active ? '#1A221E' : 'transparent',
                color: active ? '#fff' : done ? '#059669' : '#6B7280',
                fontSize: 12, fontWeight: 600, transition: 'all .2s',
                cursor: 'default'
              }}>
                <span style={{ display: 'flex' }}>{SECTION_ICONS[s]}</span>
                <span className="assess-tab-label">{SECTION_META[s].label}</span>
                {done && !active && <span>✓</span>}
                {active && <span style={{ opacity: .7 }}>{answered}/{SECTION_META[s].count}</span>}
              </div>
            );
          })}
        </div>

        {/* Right: Status + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Save status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 60 }}>
            {saveStatus === 'saving' && <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}><span className="spinner-dark spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Saving</span>}
            {saveStatus === 'saved' && <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Saved</span>}
            {saveStatus === 'error' && <span style={{ fontSize: 11, color: '#DC2626' }}>⚠ Failed</span>}
          </div>
          {/* Progress ring */}
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <svg viewBox="0 0 36 36" style={{ width: 32, height: 32, transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#F3F4F6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1A221E" strokeWidth="3"
                strokeDasharray={`${globalProgress} ${100 - globalProgress}`}
                strokeLinecap="round" style={{ transition: 'stroke-dasharray .5s ease' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#1A221E' }}>{globalProgress}%</span>
          </div>
          {/* User */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#1A221E', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700
          }}>
            {(user?.fullName || state.fullName || '?')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Questions body */}
      <div ref={bodyRef} style={{ flex: 1, padding: '32px 24px 120px', width: '100%', margin: '0 auto' }}>
        {error && <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, fontSize: 14, marginBottom: 20, border: '1px solid #FEE2E2', maxWidth: 900, margin: '0 auto 20px' }}>{error}</div>}

        {/* Section banner */}
        <div style={{
          maxWidth: 900, margin: '0 auto 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', background: '#fff', borderRadius: 14,
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: '#1A221E', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{SECTION_ICONS[currentSection]}</div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1A221E' }}>Section {currentSection} — {meta.label}</span>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{totalAnswered} of {qs.length} completed</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, height: 6, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100, background: '#1A221E',
                width: `${progress}%`, transition: 'width .5s ease'
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A221E', minWidth: 36 }}>{progress}%</span>
          </div>
        </div>

        {/* Likert legend */}
        {meta.type === 'likert' && (
          <div style={{
            maxWidth: 900, margin: '0 auto 20px',
            display: 'flex', justifyContent: 'space-between', padding: '10px 24px',
            background: '#fff', borderRadius: 10, border: '1px solid #F3F4F6',
            fontSize: 12, fontWeight: 600, color: '#9CA3AF'
          }}>
            <span>1 — Strongly Disagree</span><span>3 — Neutral</span><span>5 — Strongly Agree</span>
          </div>
        )}

        {/* Question cards */}
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {qs.map((q, idx) => {
            const ans = state.answers[currentSection][q.id];
            const isFlagged = flagged[q.id];
            return (
              <div key={q.id} id={'card-' + q.id} className={`qcard${ans !== undefined ? ' answered' : ''}${isFlagged ? ' unanswered-flag' : ''}`}>
                {q.domain && (
                  <span className={`dbadge db-${q.domain}`}>
                    <span className={`ddot dd-${q.diff}`} />
                    {q.domain} · {q.diff === 'E' ? 'Easy' : q.diff === 'M' ? 'Med' : 'Hard'}
                  </span>
                )}
                <div className="qnum">Q{idx + 1}</div>
                <div className="qtext">{q.text}</div>
                {meta.type === 'likert' ? (
                  <div className="lrow">
                    {[1,2,3,4,5].map(v => (
                      <div key={v} className="lopt">
                        <input type="radio" id={`${q.id}_${v}`} name={q.id} value={v} checked={ans === v} onChange={() => recordAnswer(q.id, v)} />
                        <label htmlFor={`${q.id}_${v}`}>
                          <div className="lcirc">{v}</div>
                          <div className="ldesc">{LIKERT_LABELS[v-1]}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mopts">
                    {q.opts.map((opt, oi) => (
                      <div key={oi} className="mopt">
                        <input type="radio" id={`${q.id}_${oi}`} name={q.id} value={oi} checked={ans === oi} onChange={() => recordAnswer(q.id, oi)} />
                        <label htmlFor={`${q.id}_${oi}`}>
                          <div className="mkey">{String.fromCharCode(65+oi)}</div>{opt}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sticky Footer */}
      <div style={{
        background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #F3F4F6', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', bottom: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#6B7280' }}>
            <strong style={{ color: '#1A221E', fontWeight: 700 }}>{totalAnswered}</strong> / {qs.length} answered
          </span>
          {totalAnswered === qs.length && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '3px 10px', borderRadius: 100 }}>Section complete ✓</span>
          )}
        </div>
        <button onClick={goNext} disabled={submitting} style={{
          padding: '14px 36px', backgroundColor: '#1A221E', color: '#fff', border: 'none',
          borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all .2s',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,.1)',
          display: 'flex', alignItems: 'center', gap: 8
        }}
          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1A221E'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          {submitting ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Scoring...</> : currentSection === 'C' ? 'Submit & See Results →' : 'Next Section →'}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .assess-tab-label { display: none; }
        }
      `}</style>
    </div>
  );
}
