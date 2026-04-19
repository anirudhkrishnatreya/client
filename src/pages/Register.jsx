import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authRegister, completeOnboarding } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import logoImg from '../assets/imenteo_logo.png';

const EDUCATION_OPTS = [
  'Class 10 (Secondary)', 'Class 12 (Higher Secondary)', 'Undergraduate (1st Year)',
  'Undergraduate (2nd Year)', 'Undergraduate (3rd/Final Year)', 'Graduate / Postgraduate',
  'Diploma', 'Working Professional'
];
const RESEARCH_OPTS = ['None', 'Some informal research', 'Talked to professionals', 'Formal counseling', 'Extensive self-research'];
const LIKERT_LABELS = ['Not at all', 'Slightly', 'Somewhat', 'Quite', 'Very much'];
const STEP_LABELS = ['Account', 'Academic', 'Reflection'];

/* ── Shared styles (matching Login) ─────────────────── */
const inputStyle = {
  width: '100%', padding: '14px 0', border: 'none', borderBottom: '2px solid #F3F4F6',
  fontSize: '15px', outline: 'none', transition: 'all 0.3s', backgroundColor: 'transparent',
  fontFamily: 'inherit'
};
const labelStyle = {
  fontSize: '12px', fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '4px'
};
const focusIn = (e) => e.target.style.borderBottomColor = '#1A221E';
const focusOut = (e) => e.target.style.borderBottomColor = '#F3F4F6';

const SLIDES = [
  { tag: 'Step 1: Identity', title: 'Build Your Profile', desc: 'Create your secure account to begin your personalized career intelligence journey.' },
  { tag: 'Step 2: Context', title: 'Share Your Story', desc: 'Tell us about your academic background so we can calibrate our career matching engine.' },
  { tag: 'Step 3: Insight', title: 'Reflect & Discover', desc: 'Honest self-reflection powers our AI to deliver career matches that truly resonate with you.' }
];

/* ── Password Strength ──────────────────────────────── */
function PasswordStrength({ pw }) {
  const checks = [
    { label: '8+ chars', ok: pw.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(pw) },
    { label: 'Lowercase', ok: /[a-z]/.test(pw) },
    { label: 'Number', ok: /[0-9]/.test(pw) }
  ];
  const score = checks.filter(c => c.ok).length;
  if (!pw) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 100,
            background: i < score ? (score <= 1 ? '#DC2626' : score <= 2 ? '#F59E0B' : '#059669') : '#F3F4F6',
            transition: 'background .3s'
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: 11, fontWeight: 600, color: c.ok ? '#059669' : '#D1D5DB' }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Scale Row (Full-page step 3 style) ──────────────── */
function ScaleRow({ label, name, value, onChange, index }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '20px 0',
      borderBottom: '1px solid #F3F4F6'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, color: '#1A221E', fontWeight: 500, lineHeight: 1.5 }}>
          <span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 8 }}>{String(index).padStart(2, '0')}</span>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none',
              background: value === v ? '#1A221E' : '#F9FAFB',
              color: value === v ? '#fff' : '#6B7280',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'all .15s ease', fontFamily: 'inherit',
              boxShadow: value === v ? '0 4px 12px rgba(26,34,30,.2)' : 'none'
            }}
            onMouseEnter={e => { if (value !== v) e.target.style.background = '#E5E7EB'; }}
            onMouseLeave={e => { if (value !== v) e.target.style.background = '#F9FAFB'; }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REGISTER PAGE
   ═══════════════════════════════════════════════════════ */
export default function Register() {
  const nav = useNavigate();
  const { user, saveSession, refreshUser } = useAuth();
  const { dispatch } = useAssessment();

  const isResumingOnboarding = !!user && !user.onboardingCompleted;

  const [step, setStep] = useState(isResumingOnboarding ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [auth, setAuth] = useState({ fullName: '', username: '', email: '', phone: '', password: '' });
  const setA = (k, v) => setAuth(f => ({ ...f, [k]: v }));

  const [form, setForm] = useState({
    educationLevel: '', fieldOfStudy: '', currentCareerPath: '',
    careerSatisfaction: 0, feelStuck: 0, confidenceInField: 0, wrongCareerConcern: 0,
    externalPressure: 0, motivationLevel: 0, careerClarity: 0, explorationReadiness: 0,
    priorResearch: '', shortTermGoal: '', biggestCareerFear: ''
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isResumingOnboarding && step === 1) setStep(2);
  }, [isResumingOnboarding, step]);

  const handleRegister = async () => {
    setError('');
    if (!auth.fullName.trim()) return setError('Full name is required');
    if (!auth.username.trim()) return setError('Username is required');
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(auth.username)) return setError('Username: 3–30 chars, letters/numbers/underscore only');
    if (!/^\S+@\S+\.\S+$/.test(auth.email)) return setError('Valid email is required');
    if (!/^[0-9+\-\s()]{7,15}$/.test(auth.phone)) return setError('Valid phone number is required');
    if (!auth.password) return setError('Password is required');
    setLoading(true);
    try {
      const { data } = await authRegister(auth);
      saveSession(data.token, data.user);
      dispatch({ type: 'SET_USER', id: data.user.id, name: data.user.fullName });
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleOnboarding = async () => {
    setError('');
    if (step === 2) {
      if (!form.educationLevel) return setError('Education level is required');
      if (!form.fieldOfStudy.trim()) return setError('Field of study is required');
      if (!form.currentCareerPath.trim()) return setError('Current career path is required');
      if (!form.priorResearch) return setError('Please select prior research level');
      setStep(3); return;
    }
    const scales = ['careerSatisfaction', 'feelStuck', 'confidenceInField', 'wrongCareerConcern', 'externalPressure', 'motivationLevel', 'careerClarity', 'explorationReadiness'];
    if (scales.some(k => form[k] === 0)) return setError('Please answer all scale questions (1–5)');
    setLoading(true);
    try {
      await completeOnboarding(form);
      refreshUser({
        onboardingCompleted: true, educationLevel: form.educationLevel,
        fieldOfStudy: form.fieldOfStudy.trim(), currentCareerPath: form.currentCareerPath.trim(),
        priorResearch: form.priorResearch, shortTermGoal: form.shortTermGoal.trim(),
        biggestCareerFear: form.biggestCareerFear.trim()
      });
      nav('/assessment');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save profile.');
    } finally { setLoading(false); }
  };

  const answeredScales = ['careerSatisfaction', 'feelStuck', 'confidenceInField', 'wrongCareerConcern', 'externalPressure', 'motivationLevel', 'careerClarity', 'explorationReadiness'].filter(k => form[k] > 0).length;

  /* ════════════════════════════════════════════════════
     STEP 3: Full-Page Reflection Layout
     ════════════════════════════════════════════════════ */
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
        {/* Top bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #F3F4F6',
          padding: '0 40px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <img src={logoImg} alt="iMenteo" style={{ height: 32 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Step 3 of 3</span>
              <div style={{ width: 120, height: 4, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: '#1A221E',
                  width: `${Math.round((answeredScales / 8) * 100)}%`,
                  transition: 'width .4s ease'
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#1A221E', fontWeight: 700 }}>{answeredScales}/8</span>
            </div>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
              {user?.fullName || auth.fullName}
            </span>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 32px 80px' }}>
          {/* Header */}
          <div className="reflection-fadein" style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#1A221E',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1A221E', lineHeight: 1.2 }}>Career Reflection</h1>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 2 }}>Rate each statement from 1 (Not at all) to 5 (Very much)</p>
              </div>
            </div>

            {/* Scale legend */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 20,
              padding: '12px 0', fontSize: 11, color: '#9CA3AF', fontWeight: 600
            }}>
              {LIKERT_LABELS.map((l, i) => (
                <span key={i} style={{ width: 44, textAlign: 'center' }}>{i + 1} = {l}</span>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: '14px 20px', borderRadius: 12, fontSize: 14, marginBottom: 24, border: '1px solid #FEE2E2' }}>
              {error}
            </div>
          )}

          {/* Questions */}
          <div className="reflection-fadein" style={{
            background: '#fff', borderRadius: 20, padding: '8px 32px',
            border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,.03)'
          }}>
            <ScaleRow label="How satisfied are you with your current career path?" name="careerSatisfaction" value={form.careerSatisfaction} onChange={v => setF('careerSatisfaction', v)} index={1} />
            <ScaleRow label="Do you feel stuck in your current career path?" name="feelStuck" value={form.feelStuck} onChange={v => setF('feelStuck', v)} index={2} />
            <ScaleRow label="How confident are you that you can excel in this field?" name="confidenceInField" value={form.confidenceInField} onChange={v => setF('confidenceInField', v)} index={3} />
            <ScaleRow label="How concerned are you about being in the wrong career?" name="wrongCareerConcern" value={form.wrongCareerConcern} onChange={v => setF('wrongCareerConcern', v)} index={4} />
            <ScaleRow label="How much external pressure shapes your career choice?" name="externalPressure" value={form.externalPressure} onChange={v => setF('externalPressure', v)} index={5} />
            <ScaleRow label="How motivated are you to pursue your career goals?" name="motivationLevel" value={form.motivationLevel} onChange={v => setF('motivationLevel', v)} index={6} />
            <ScaleRow label="How clear are you about what career you want?" name="careerClarity" value={form.careerClarity} onChange={v => setF('careerClarity', v)} index={7} />
            <ScaleRow label="How open are you to exploring different career paths?" name="explorationReadiness" value={form.explorationReadiness} onChange={v => setF('explorationReadiness', v)} index={8} />
          </div>

          {/* Optional text fields */}
          <div className="reflection-fadein" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '24px 28px',
              border: '1px solid #E5E7EB'
            }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1A221E', display: 'block', marginBottom: 8 }}>
                Short-term career goal <span style={{ color: '#D1D5DB', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea placeholder="e.g. Get into IIT, clear UPSC, land a tech internship..."
                value={form.shortTermGoal} onChange={e => setF('shortTermGoal', e.target.value)}
                style={{
                  width: '100%', border: 'none', borderBottom: '2px solid #F3F4F6', outline: 'none',
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 72,
                  padding: '10px 0', backgroundColor: 'transparent', transition: 'border-color .3s'
                }}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '24px 28px',
              border: '1px solid #E5E7EB'
            }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1A221E', display: 'block', marginBottom: 8 }}>
                Biggest career-related fear <span style={{ color: '#D1D5DB', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea placeholder="e.g. Failing exams, choosing wrong field..."
                value={form.biggestCareerFear} onChange={e => setF('biggestCareerFear', e.target.value)}
                style={{
                  width: '100%', border: 'none', borderBottom: '2px solid #F3F4F6', outline: 'none',
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 72,
                  padding: '10px 0', backgroundColor: 'transparent', transition: 'border-color .3s'
                }}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 40, gap: 16
          }}>
            <button onClick={() => { setError(''); setStep(2); }} style={{
              padding: '16px 32px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none',
              borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .15s'
            }}
              onMouseEnter={e => e.target.style.background = '#E5E7EB'}
              onMouseLeave={e => e.target.style.background = '#F3F4F6'}>
              ← Back
            </button>
            <button onClick={handleOnboarding} disabled={loading} style={{
              padding: '16px 48px', backgroundColor: '#1A221E', color: 'white', border: 'none',
              borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8
            }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#1A221E'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {loading ? 'Saving...' : 'Save & Start Assessment →'}
            </button>
          </div>
        </div>

        <style>{`
          .reflection-fadein {
            animation: reflectionIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes reflectionIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 640px) {
            .reflection-fadein div[style*="grid-template-columns"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEPS 1 & 2: Split-Panel Layout (matching Login)
     ════════════════════════════════════════════════════ */
  const stepTitle = ['', 'Create your account', 'Academic background'][step];
  const stepSub = ['', 'Join the career intelligence platform', 'Help us calibrate your career match'][step];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFFFF', padding: '12px' }}>

      {/* ── Left Section: Image & Slider ── */}
      <div style={{
        flex: '1.2', position: 'relative', borderRadius: '28px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
        padding: '80px 60px'
      }} className="register-brand-panel">
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')`,
          backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(to bottom, rgba(10, 20, 15, 0.9) 0%, rgba(10, 20, 15, 0.4) 40%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }} />
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '500px' }}>
          <div key={step} className="slide-entry">
            <span style={{
              display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)', color: '#FFFFFF', borderRadius: 100,
              fontSize: 11, fontWeight: 700, marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase'
            }}>{SLIDES[step - 1].tag}</span>
            <h2 style={{ fontSize: 48, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 24, fontWeight: 600 }}>
              {SLIDES[step - 1].title}
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 40 }}>
              {SLIDES[step - 1].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {STEP_LABELS.map((_, idx) => (
              <button key={idx} style={{
                width: idx === step - 1 ? 40 : 10, height: 6, borderRadius: 3, border: 'none',
                backgroundColor: idx === step - 1 ? '#fff' : 'rgba(255,255,255,0.3)',
                cursor: 'default', transition: 'all 0.4s ease'
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Section: Form ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fadeIn" key={step}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <img src={logoImg} alt="iMenteo" style={{ height: 60, width: 'auto', marginBottom: 28 }} />
            <h1 style={{ fontSize: 28, fontWeight: 600, color: '#111827', marginBottom: 10 }}>{stepTitle}</h1>
            <p style={{ color: '#6B7280', fontSize: 15 }}>{stepSub}</p>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginTop: 24 }}>
              {STEP_LABELS.map((label, i) => {
                const sn = i + 1;
                const isComplete = sn < step;
                const isActive = sn === step;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        background: isComplete || isActive ? '#1A221E' : '#F3F4F6',
                        color: isComplete || isActive ? '#fff' : '#9CA3AF',
                        transition: 'all .3s'
                      }}>{isComplete ? '✓' : sn}</div>
                      <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#1A221E' : '#9CA3AF' }}>{label}</span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div style={{ width: 40, height: 2, borderRadius: 2, margin: '0 6px', marginBottom: 18, background: isComplete ? '#1A221E' : '#F3F4F6', transition: 'background .3s' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, fontSize: 14, marginBottom: 24, border: '1px solid #FEE2E2', textAlign: 'center' }}>{error}</div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Full Name</label>
                <input placeholder="e.g. Priya Sharma" value={auth.fullName} onChange={e => setA('fullName', e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Username</label>
                <input placeholder="e.g. priya_sharma123" value={auth.username} onChange={e => setA('username', e.target.value.replace(/\s/g, ''))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                {auth.username && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Your handle: <strong style={{ color: '#1A221E' }}>@{auth.username.toLowerCase()}</strong></p>}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" placeholder="priya@email.com" value={auth.email} onChange={e => setA('email', e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Mobile Number</label>
                <input type="tel" placeholder="+91 98765 43210" value={auth.phone} onChange={e => setA('phone', e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, uppercase + number"
                    value={auth.password} onChange={e => setA('password', e.target.value)}
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    {showPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <PasswordStrength pw={auth.password} />
              </div>
              <button onClick={handleRegister} disabled={loading} style={{
                width: '100%', padding: 18, backgroundColor: '#1A221E', color: 'white', border: 'none',
                borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'inherit'
              }}
                onMouseOver={(e) => { e.target.style.backgroundColor = '#000'; e.target.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = '#1A221E'; e.target.style.transform = 'translateY(0)'; }}>
                {loading ? 'Creating account...' : 'Create Account & Continue →'}
              </button>
              <div style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
                <span style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 700 }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
              </div>
              <p style={{ textAlign: 'center', fontSize: 14, color: '#6B7280' }}>
                Already have an account? <Link to="/login" style={{ color: '#1A221E', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Current Education Level</label>
                <select value={form.educationLevel} onChange={e => setF('educationLevel', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} onFocus={focusIn} onBlur={focusOut}>
                  <option value="">Select level...</option>
                  {EDUCATION_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Field of Study</label>
                <input placeholder="e.g. Computer Science, Commerce, Arts..." value={form.fieldOfStudy} onChange={e => setF('fieldOfStudy', e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Current Career Path / Goal</label>
                <input placeholder="e.g. Engineering, Medicine, Not sure yet..." value={form.currentCareerPath} onChange={e => setF('currentCareerPath', e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div style={{ marginBottom: 36 }}>
                <label style={labelStyle}>Prior Career Research</label>
                <select value={form.priorResearch} onChange={e => setF('priorResearch', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} onFocus={focusIn} onBlur={focusOut}>
                  <option value="">Select...</option>
                  {RESEARCH_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {!isResumingOnboarding && (
                  <button onClick={() => { setError(''); setStep(1); }} style={{
                    flex: 1, padding: 16, backgroundColor: '#F3F4F6', color: '#374151', border: 'none',
                    borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                  }}>← Back</button>
                )}
                <button onClick={handleOnboarding} style={{
                  flex: isResumingOnboarding ? 1 : 2, padding: 16, backgroundColor: '#1A221E', color: 'white', border: 'none',
                  borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'inherit'
                }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#000'; e.target.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#1A221E'; e.target.style.transform = 'translateY(0)'; }}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .register-brand-panel { display: none !important; }
        }
        .slide-entry {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: slideUp 1s ease-out;
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 50px white inset !important;
        }
      `}</style>
    </div>
  );
}
