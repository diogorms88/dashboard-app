'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/lib/api';

interface User {
  id: number;
  username: string;
  nome: string;
  papel: 'admin' | 'manager' | 'operator' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token válido e buscar dados do usuário
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          // Primeiro verificar se o token é válido antes de tentar usar
          try {
            const userData = await authService.verifyToken();
            setToken(storedToken);
            setUser(userData);
          } catch (tokenError) {
            // Token inválido, limpar tudo
            authService.logout();
            setUser(null);
            setToken(null);
          }
        } else {
          // Não há token, limpar qualquer estado residual
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, senha: string): Promise<boolean> => {
    try {
      const response = await authService.login(username, senha);
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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