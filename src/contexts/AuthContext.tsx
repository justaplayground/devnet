import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, type AuthUser } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await api.me();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { user: created } = await api.signup({ email, password, username });
      setUser(created);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: loggedIn } = await api.login({ email, password });
      setUser(loggedIn);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    return user.isAdmin || user.isModerator;
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    checkAdminStatus,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
