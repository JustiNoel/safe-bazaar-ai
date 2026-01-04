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
  subscription_tier?: 'free' | 'premium' | 'premium_seller';
  voice_readout_enabled?: boolean;
  seller_verified?: boolean;
  api_key?: string;
  api_calls_today?: number;
  premium_expires_at?: string;
  referral_code?: string;
  referral_count?: number;
  bonus_scans?: number;
}

export interface SubscriptionStatus {
  subscribed: boolean;
  tier: 'premium' | 'premium_seller' | null;
  subscription_end: string | null;
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
  subscription: SubscriptionStatus | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => void;
  upgradeToPremium: () => void;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  createCheckout: (plan: 'premium' | 'premium_seller') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  checkMpesaPayment: (checkoutRequestId: string) => Promise<any>;
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
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

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

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      // First check local profile for M-Pesa subscriptions
      if (session.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
          setSubscription({
            subscribed: true,
            tier: profile.subscription_tier as 'premium' | 'premium_seller',
            subscription_end: profile.premium_expires_at || null,
          });
          setUser(prev => prev ? { ...prev, profile } : null);
          return;
        }
      }
      
      // Then check Stripe subscriptions
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      setSubscription(data as SubscriptionStatus);
      
      // Refresh profile after subscription check
      if (session.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setUser(prev => prev ? { ...prev, profile } : null);
        }
      }
    } catch (error) {
      console.error('Subscription check failed:', error);
    }
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
      
      // Update subscription status from profile
      if (profile.subscription_tier && profile.subscription_tier !== 'free') {
        setSubscription({
          subscribed: true,
          tier: profile.subscription_tier as 'premium' | 'premium_seller',
          subscription_end: profile.premium_expires_at || null,
        });
      }
    }
  };

  const checkMpesaPayment = async (checkoutRequestId: string) => {
    if (!session) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-mpesa-status', {
        body: { checkoutRequestId }
      });
      
      if (error) throw error;
      
      if (data?.transaction?.status === 'completed') {
        // Refresh profile and subscription
        await refreshProfile();
        await checkSubscription();
      }
      
      return data;
    } catch (error) {
      console.error('M-Pesa status check failed:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to prevent potential deadlock
          setTimeout(async () => {
            const profile = await fetchProfile(currentSession.user.id);
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email!,
              profile,
            });
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setSubscription(null);
          setIsLoading(false);
        }
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

    return () => authSubscription.unsubscribe();
  }, []);

  // Check subscription after session is established
  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session]);

  // Check for success param in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success('🎉 Subscription activated! Welcome to Premium!');
      checkSubscription();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast.info('Checkout canceled. You can try again anytime.');
      window.history.replaceState({}, '', window.location.pathname);
    }
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
    
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          phone,
          role,
          referral_code: referralCode,
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
      throw error;
    }
    
    // Send welcome email
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { email, referralCode }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    // Process referral if code exists
    if (referralCode && data.user) {
      try {
        await supabase.functions.invoke('process-referral', {
          body: { referredUserId: data.user.id, referralCode }
        });
      } catch (referralError) {
        console.error('Failed to process referral:', referralError);
      }
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
    setSubscription(null);
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

  const createCheckout = async (plan: 'premium' | 'premium_seller') => {
    if (!session) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast.error('Please log in to manage subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription portal.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session,
      isLoading,
      subscription,
      login,
      signup,
      logout,
      upgradeToPremium,
      refreshProfile,
      checkSubscription,
      createCheckout,
      openCustomerPortal,
      checkMpesaPayment,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
