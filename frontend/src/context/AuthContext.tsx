import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types/api';
import {
  api,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.auth.getMe();
        setUser(currentUser);
        setStoredAuth(storedToken, currentUser);
      } catch (err) {
        console.warn('Stored token invalid or expired, resetting auth:', err);
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setStoredAuth(res.access_token, res.user);
    setToken(res.access_token);
    setUser(res.user);
  };

  const handleRegister = async (email: string, password: string) => {
    const res = await api.auth.register(email, password);
    setStoredAuth(res.access_token, res.user);
    setToken(res.access_token);
    setUser(res.user);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
