// src/context/AuthContext.jsx
// CUCEI MART - Contexto de autenticacion | NEXCODE

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((tokenValue, userData) => {
    localStorage.setItem('cuceimart_token', tokenValue);
    localStorage.setItem('cuceimart_user',  JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('cuceimart_token');
    localStorage.removeItem('cuceimart_user');
    setToken(null);
    setUser(null);
  }, []);

  // Restaurar sesion al montar
  useEffect(() => {
    const savedToken = localStorage.getItem('cuceimart_token');
    const savedUser  = localStorage.getItem('cuceimart_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        clearSession();
      }
    }
    setLoading(false);

    // Escuchar evento de logout global (401)
    const handleLogout = () => clearSession();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [clearSession]);

  const loginCliente = async (identificador, contrasena) => {
    const res = await authAPI.loginCliente({ identificador, contrasena });
    setSession(res.data.token, res.data.user);
    return res.data;
  };

  const loginEmprendedor = async (identificador, contrasena) => {
    const res = await authAPI.loginEmprendedor({ identificador, contrasena });
    setSession(res.data.token, res.data.user);
    return res.data;
  };

  const registrarCliente = async (datos) => {
    const res = await authAPI.registrarCliente(datos);
    setSession(res.data.token, res.data.user);
    return res.data;
  };

  const registrarEmprendedor = async (datos) => {
    const res = await authAPI.registrarEmprendedor(datos);
    setSession(res.data.token, res.data.user);
    return res.data;
  };

  const logout = () => clearSession();

  const isCliente      = user?.tipo === 'cliente';
  const isEmprendedor  = user?.tipo === 'emprendedor';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      loginCliente, loginEmprendedor,
      registrarCliente, registrarEmprendedor,
      logout,
      isAuthenticated, isCliente, isEmprendedor,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
