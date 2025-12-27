import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Default credentials from environment or hardcoded fallback
  const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin';
  const DEFAULT_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@matrixhub.io';

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('matrix_hub_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('matrix_hub_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    // Simple authentication check
    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      const userData: User = {
        username: DEFAULT_USERNAME,
        email: DEFAULT_EMAIL,
      };
      setUser(userData);
      localStorage.setItem('matrix_hub_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('matrix_hub_user');
    router.push('/login');
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
