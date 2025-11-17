import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  premium: boolean;
  scansToday: number;
  scanLimit: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => void;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('safebazaar_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in production, call backend API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: 'user_' + Date.now(),
      email,
      role: 'buyer',
      premium: false,
      scansToday: 0,
      scanLimit: 5,
    };
    
    setUser(mockUser);
    localStorage.setItem('safebazaar_user', JSON.stringify(mockUser));
    toast.success('Welcome back! Karibu!');
  };

  const signup = async (email: string, password: string, phone: string, role: UserRole) => {
    // Mock signup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: 'user_' + Date.now(),
      email,
      phone,
      role,
      premium: false,
      scansToday: 0,
      scanLimit: 5,
    };
    
    setUser(mockUser);
    localStorage.setItem('safebazaar_user', JSON.stringify(mockUser));
    toast.success('Account created! Karibu tena!');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('safebazaar_user');
    toast.success('Logged out successfully');
  };

  const upgradeToPremium = () => {
    if (!user) return;
    
    const updatedUser = { ...user, premium: true, scanLimit: 999 };
    setUser(updatedUser);
    localStorage.setItem('safebazaar_user', JSON.stringify(updatedUser));
    toast.success('🎉 Upgraded to Premium!');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      upgradeToPremium,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
