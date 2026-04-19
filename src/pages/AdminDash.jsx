import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminGetUsers, adminGetStats } from '../api';
import logoImg from '../assets/imenteo_logo.png';

function StatChip({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', borderLeft: `4px solid ${color || 'var(--amber)'}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDash() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const admin = JSON.parse(localStorage.getItem('im_admin') || '{}');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filter !== '') params.completed = filter;
      const [usersRes, statsRes] = await Promise.all([adminGetUsers(params), adminGetStats()]);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setStats(statsRes.data.stats);
    } catch (e) {
      if (e.response?.status === 401) { localStorage.removeItem('im_admin_token'); nav('/admin/login'); }
    } finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { load(1); }, []);
  const handleSearch = (e) => { e.preventDefault(); load(1); };
  const logout = () => { localStorage.removeItem('im_admin_token'); localStorage.removeItem('im_admin'); nav('/admin/login'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Nav */}
      <div style={{ background: 'var(--navy)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="iMenteo Logo" style={{ height: '32px', width: 'auto' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.5)', marginLeft: 8 }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>👤 {admin.username || 'Admin'}</span>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 7, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 28 }}>Overview of all assessments and users</p>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 36 }}>
            <StatChip label="Total Users" value={stats.total_users} color="var(--amber)" />
            <StatChip label="Completed" value={stats.completed_assessments} sub={`${stats.completion_rate}% completion rate`} color="var(--green)" />
            <StatChip label="Avg Cognitive" value={stats.average_scores ? `${Math.round(stats.average_scores.avgCognitive)}%` : '—'} color="#3355CC" />
            <StatChip label="Avg Confidence" value={stats.average_scores ? `${Math.round(stats.average_scores.avgConfidence)}` : '—'} sub="out of 100" color="#884488" />
          </div>
        )}

        {/* Top careers */}
        {stats?.top_career_recommendations?.length > 0 && (
          <div style={{ background: 'var(--white)', borderRadius: 12, padding: 24, border: '1.5px solid var(--border)', marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>🏆 Most Recommended Careers (Rank #1)</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.top_career_recommendations.map(c => (
                <div key={c._id} style={{ background: 'var(--amber-lt)', border: '1px solid var(--amber)', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                  {c._id} <span style={{ color: 'var(--amber)', marginLeft: 6 }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ background: 'var(--white)', borderRadius: 12, padding: 24, border: '1.5px solid var(--border)', marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate)', marginBottom: 6 }}>Search</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email..." style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: 'var(--navy)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate)', marginBottom: 6 }}>Status</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: 'var(--navy)', outline: 'none', background: 'var(--white)' }}>
                <option value="">All Users</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>
            <button type="submit" className="btn-base btn-navy" style={{ padding: '10px 24px' }}>Search</button>
          </form>
        </div>

        {/* Users table */}
        <div style={{ background: 'var(--white)', borderRadius: 12, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Users <span style={{ color: 'var(--slate)', fontWeight: 400 }}>({pagination.total})</span></span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" style={{ width: 28, height: 28 }} /></div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)', fontSize: 14 }}>No users found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--mist)' }}>
                    {['Name','Email','Education','Status','Registered','Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--slate)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--cream)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{u.fullName}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--slate)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.educationLevel}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.assessmentCompleted ? 'var(--green-lt)' : 'var(--amber-lt)', color: u.assessmentCompleted ? 'var(--green)' : '#8A5200', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                          {u.assessmentCompleted ? '✓ Done' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate)', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`/admin/user/${u._id}`} style={{ background: 'var(--mist)', color: 'var(--navy)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 7, textDecoration: 'none', display: 'inline-block' }}>View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => load(p)} style={{ width: 36, height: 36, borderRadius: 7, border: `1.5px solid ${p === pagination.page ? 'var(--navy)' : 'var(--border)'}`, background: p === pagination.page ? 'var(--navy)' : 'var(--white)', color: p === pagination.page ? '#fff' : 'var(--navy)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
