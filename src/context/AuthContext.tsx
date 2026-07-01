'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuthSession, loginSession, logoutSession } from '@/services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth session once on mount
  useEffect(() => {
    // Optimistic mount check: if cache flag is active, render immediately to bypass spinner
    const localAuth = typeof window !== 'undefined' && localStorage.getItem('crm_authenticated') === 'true';
    if (localAuth) {
      const timer = setTimeout(() => {
        setIsAuthenticated(true);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    async function initAuth() {
      const isAuth = await checkAuthSession();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        localStorage.setItem('crm_authenticated', 'true');
      } else {
        localStorage.removeItem('crm_authenticated');
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  // Handle instant client-side route redirection without blocking API calls
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [pathname, isAuthenticated, isLoading, router]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    const result = await loginSession(username, password);
    if (result.success) {
      localStorage.setItem('crm_authenticated', 'true');
      setIsAuthenticated(true);
      router.replace('/');
    }
    setIsLoading(false);
    return result;
  };

  const logout = async () => {
    setIsLoading(true);
    const success = await logoutSession();
    if (success) {
      localStorage.removeItem('crm_authenticated');
      setIsAuthenticated(false);
      router.replace('/login');
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
