import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';
import logoImg from '../assets/imenteo_logo.png';

export default function AdminLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await adminLogin(form);
      localStorage.setItem('im_admin_token', data.token);
      localStorage.setItem('im_admin', JSON.stringify(data.admin));
      nav('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#0F1F3D 0%,#1A3560 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card card-lg" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><img src={logoImg} alt="iMenteo Logo" style={{ height: '36px', width: 'auto' }} /></div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>Admin Portal</h1>
        <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 28 }}>Sign in to access the admin dashboard</p>
        {error && <div className="error-msg">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ textAlign: 'left' }}>
            <label>Email</label>
            <input type="email" placeholder="admin@imenteo.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>
          <div className="field" style={{ textAlign: 'left' }}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
          </button>
        </form>
        <button onClick={() => nav('/')} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--slate)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>← Back to Landing</button>
      </div>
    </div>
  );
}
