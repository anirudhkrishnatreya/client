import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthCtx = createContext(null);

const TOKEN_KEY = 'im_user_token';
const USER_KEY  = 'im_user';
const COOKIE_SESSION = 'cookie';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);   // true while verifying token on mount

  // ── On app mount: validate stored token by calling /api/auth/me
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }

    api.get('/auth/me', {
      headers: stored === COOKIE_SESSION ? {} : { Authorization: `Bearer ${stored}` }
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

  // ── Pick up a sign-in (or sign-out) that happened in another tab — the `storage` event only fires in tabs
  // other than the one that made the change, which is exactly the case this is for: a student opens the
  // "check your email" screen, clicks the confirmation link in a new tab, and this tab should notice.
  useEffect(() => {
    const onStorage = e => {
      if (e.key !== null && e.key !== TOKEN_KEY && e.key !== USER_KEY) return;
      const tok = localStorage.getItem(TOKEN_KEY);
      if (!tok) { setToken(null); setUser(null); return; }
      try { setUser(JSON.parse(localStorage.getItem(USER_KEY))); setToken(tok); } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Persist session
  const saveSession = useCallback((tok, userData) => {
    // in cookie-only mode the server returns no token: remember that the session is the cookie
    tok = tok || COOKIE_SESSION;
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  }, []);

  // ── Clear session
  const clearSession = useCallback(() => {
    api.post('/auth/logout').catch(() => {});          // clears the session cookies when there are any
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
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
