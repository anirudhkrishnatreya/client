import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import logoImg from '../assets/imenteo_logo.png';

export default function Login() {
  const nav = useNavigate();
  const { saveSession } = useAuth();
  const { dispatch } = useAssessment();

  // Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: "Deep Discovery",
      desc: "Our psychometric engine maps your personality traits and cognitive abilities to 50+ career paths.",
      tag: "Phase 1: Assessment"
    },
    {
      title: "AI Career Engine",
      desc: "Your personal 'Career GPS' that processes behavioral patterns to map your future potential.",
      tag: "Phase 2: Intelligence"
    },
    {
      title: "Expert Mentorship",
      desc: "Connect with industry professionals for structured guidance and real-world accountability.",
      tag: "Phase 3: Connection"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    if (!identifier.trim() || !password) return setError('Username/email and password are required');

    setLoading(true);
    try {
      const { data } = await authLogin({ identifier, password });
      saveSession(data.token, data.user);
      dispatch({ type: 'SET_USER', id: data.user.id, name: data.user.fullName });

      if (data.user.assessmentCompleted) { nav('/dashboard'); return; }
      if (!data.user.onboardingCompleted) { nav('/register'); return; }
      if (data.resumeState?.hasProgress) { nav('/assessment'); return; }
      nav('/assessment');
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFFFF', padding: '12px' }}>

      {/* ── Left Section: Professional Image & Slider ── */}
      <div style={{
        flex: '1.2',
        position: 'relative',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // Shifted from 'flex-end' to 'flex-start'
        padding: '80px 60px' // Slightly increased top padding for better breathing room
      }} className="login-brand-panel">

        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />

        {/* Adjusted Gradient: Now darkens the TOP for text readability */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(to bottom, rgba(10, 20, 15, 0.9) 0%, rgba(10, 20, 15, 0.4) 40%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }} />

        {/* Content Box (Now at the top) */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '500px' }}>
          <div key={activeSlide} className="slide-entry">
            <span style={{
              display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)', color: '#FFFFFF', borderRadius: '100px',
              fontSize: '11px', fontWeight: 700, marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase'
            }}>
              {slides[activeSlide].tag}
            </span>
            <h2 style={{ fontSize: '48px', color: '#FFFFFF', lineHeight: 1.1, marginBottom: '24px', fontWeight: 600 }}>
              {slides[activeSlide].title}
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, marginBottom: '40px' }}>
              {slides[activeSlide].desc}
            </p>
          </div>

          {/* Slider Controls (Now follows the text at the top) */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                style={{
                  width: idx === activeSlide ? '40px' : '10px', height: '6px', borderRadius: '3px', border: 'none',
                  backgroundColor: idx === activeSlide ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer', transition: 'all 0.4s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Section: Login Form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>

        <div style={{ width: '100%', maxWidth: '400px' }} className="animate-fadeIn">

          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="flex justify-center"  >
              <img
                src={logoImg}
                alt="iMenteo"
                style={{ height: '72px', width: 'auto', marginBottom: '32px' }}
              />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>
              Sign in to your account
            </h1>
            <p style={{ color: '#6B7280', fontSize: '15px' }}>Welcome back to the closed-loop mentoring system.</p>
          </div>

          {error && <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: '14px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px', border: '1px solid #FEE2E2', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Username or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: '100%', padding: '16px 0', border: 'none', borderBottom: '2px solid #F3F4F6',
                  fontSize: '16px', outline: 'none', transition: 'all 0.3s', backgroundColor: 'transparent'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#1A221E'}
                onBlur={(e) => e.target.style.borderBottomColor = '#F3F4F6'}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '16px 0', border: 'none', borderBottom: '2px solid #F3F4F6',
                    fontSize: '16px', outline: 'none', transition: 'all 0.3s', backgroundColor: 'transparent'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#1A221E'}
                  onBlur={(e) => e.target.style.borderBottomColor = '#F3F4F6'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                  {showPw ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '40px' }}>
              <Link to="/forgot" style={{ fontSize: '13px', color: '#1A221E', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '18px', backgroundColor: '#1A221E', color: 'white', border: 'none',
              borderRadius: '100px', fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
              onMouseOver={(e) => { e.target.style.backgroundColor = '#000000'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = '#1A221E'; e.target.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#F3F4F6' }} />
              <span style={{ fontSize: '12px', color: '#D1D5DB', fontWeight: 700 }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#F3F4F6' }} />
            </div>

            {/* <button type="button" className="social-btn" style={{
              width: '100%', padding: '14px', backgroundColor: 'white', border: '1px solid #E5E7EB',
              borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', fontSize: '15px', color: '#374151', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Continue with Google
            </button> */}
          </form>

          <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '14px', color: '#6B7280' }}>
            New to iMenteo? <Link to="/register" style={{ color: '#1A221E', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .login-brand-panel { display: none !important; }
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
        .social-btn:hover {
            background-color: #F9FAFB !important;
            border-color: #D1D5DB !important;
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 50px white inset !important;
        }
      `}</style>
    </div>
  );
}