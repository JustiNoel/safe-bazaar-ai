import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  phone?: string;
  role: UserRole;
  premium: boolean;
  scans_today: number;
  scan_limit: number;
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => void;
  upgradeToPremium: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as UserProfile;
  };

  const refreshProfile = async () => {
    if (!session?.user) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        profile,
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          const profile = await fetchProfile(currentSession.user.id);
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email!,
            profile,
          });
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then(profile => {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email!,
            profile,
          });
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message);
      throw error;
    }
    
    toast.success('Welcome back! Karibu!');
  };

  const signup = async (email: string, password: string, phone: string, role: UserRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          phone,
          role,
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
      throw error;
    }
    
    toast.success('Account created! Karibu tena!');
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
      throw error;
    }
    
    setUser(null);
    setSession(null);
    toast.success('Logged out successfully');
  };

  const upgradeToPremium = async () => {
    if (!user?.profile) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ premium: true, scan_limit: 999 })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to upgrade to premium');
      throw error;
    }
    
    await refreshProfile();
    toast.success('🎉 Upgraded to Premium!');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      signup,
      logout,
      upgradeToPremium,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
