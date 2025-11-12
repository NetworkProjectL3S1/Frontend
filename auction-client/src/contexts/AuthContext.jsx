import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, register as authRegister, getToken, getUser, verifyToken } from '../utils/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const storedUser = getUser();

      if (token && storedUser) {
        const verification = await verifyToken();
        if (verification.valid) {
          setUser(verification.user || storedUser);
          setIsAuthenticated(true);
        } else {
          authLogout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    const result = await authLogin(username, password);
    
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: result.error };
    }
  };

  const register = async (username, password, email, role) => {
    setLoading(true);
    const result = await authRegister(username, password, email, role);
    
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: result.error };
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

