import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, wallet_address) => {
    const res = await api.post('/auth/login', { email, password, wallet_address });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password, wallet_address) => {
    const res = await api.post('/auth/register', { email, password, wallet_address });
    return res.data;
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
