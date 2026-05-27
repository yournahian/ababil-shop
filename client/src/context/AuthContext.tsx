import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'buyer' | 'seller';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dummyWallet: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void; // Mock login
  signup: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const isLoggedIn = !!user;

  const generateWallet = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const login = (email: string) => {
    // Mock login: create a dummy user based on email domain or just default to buyer
    const role: UserRole = email.includes('seller') ? 'seller' : 'buyer';
    setUser({
      id: Math.random().toString(36).substring(7),
      name: email.split('@')[0],
      email,
      role,
      dummyWallet: generateWallet()
    });
  };

  const signup = (name: string, email: string, role: UserRole) => {
    setUser({
      id: Math.random().toString(36).substring(7),
      name,
      email,
      role,
      dummyWallet: generateWallet()
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, logout }}>
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
