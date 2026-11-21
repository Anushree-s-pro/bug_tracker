import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);

const clearStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  // while a stored token is being verified we show a spinner instead of bouncing to /login
  const [checking, setChecking] = useState(() => !!localStorage.getItem('token'));

  // verify the saved session once on startup (page refresh / reopening the browser)
  useEffect(() => {
    if (!localStorage.getItem('token')) { setChecking(false); return; }
    api.get('/auth/me')
      .then((r) => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
      .catch((err) => {
        // only drop the session if the server really rejected it (not when the backend is just offline)
        if (err.response && [401, 403].includes(err.response.status)) { clearStorage(); setUser(null); }
      })
      .finally(() => setChecking(false));
  }, []);

  // axios interceptor fires this when a request comes back 401 (expired token)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const persist = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => persist((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => persist((await api.post('/auth/register', payload)).data);
  const logout = () => { clearStorage(); setUser(null); };

  return <AuthContext.Provider value={{ user, checking, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
