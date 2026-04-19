import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthCtx = createContext(null);

const TOKEN_KEY = 'im_user_token';
const USER_KEY  = 'im_user';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);   // true while verifying token on mount

  // ── Keep axios header in sync with token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['X-User-Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['X-User-Authorization'];
    }
  }, [token]);

  // ── On app mount: validate stored token by calling /api/auth/me
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }

    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${stored}` }
    })
      .then(({ data }) => {
        setUser(data.user);
        setToken(stored);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        // Token expired or invalid — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Persist session
  const saveSession = useCallback((tok, userData) => {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
    api.defaults.headers.common['X-User-Authorization'] = `Bearer ${tok}`;
  }, []);

  // ── Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['X-User-Authorization'];
  }, []);

  // ── Update user state without full re-login (e.g. after onboarding)
  const refreshUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isLoggedIn = !!token && !!user;

  return (
    <AuthCtx.Provider value={{ user, token, isLoggedIn, loading, saveSession, clearSession, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
