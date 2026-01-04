import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PremiumFeatures {
  // Premium features (KES 200)
  hasUnlimitedScans: boolean;
  hasFullRiskBreakdown: boolean;
  hasMpesaChecks: boolean;
  hasPersonalizedRecommendations: boolean;
  hasScanHistory: boolean;
  hasVoiceReadout: boolean;
  isAdFree: boolean;
  hasPrioritySupport: boolean;
  
  // Premium Seller features (KES 500)
  hasSellerBadge: boolean;
  hasAutoOptimizations: boolean;
  hasAnalyticsDashboard: boolean;
  hasBulkScanning: boolean;
  hasApiAccess: boolean;
  hasDedicatedManager: boolean;
  
  // General
  isPremium: boolean;
  isPremiumSeller: boolean;
  subscriptionTier: 'free' | 'premium' | 'premium_seller';
  expiresAt: Date | null;
  daysRemaining: number | null;
}

export function usePremiumFeatures(): PremiumFeatures {
  const { user, subscription } = useAuth();

  return useMemo(() => {
    const tier = user?.profile?.subscription_tier || subscription?.tier || 'free';
    const isPremium = tier === 'premium' || tier === 'premium_seller';
    const isPremiumSeller = tier === 'premium_seller';
    
    const expiresAt = user?.profile?.premium_expires_at 
      ? new Date(user.profile.premium_expires_at)
      : subscription?.subscription_end 
        ? new Date(subscription.subscription_end) 
        : null;
    
    const daysRemaining = expiresAt 
      ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      // Premium features
      hasUnlimitedScans: isPremium,
      hasFullRiskBreakdown: isPremium,
      hasMpesaChecks: isPremium,
      hasPersonalizedRecommendations: isPremium,
      hasScanHistory: isPremium,
      hasVoiceReadout: isPremium && (user?.profile?.voice_readout_enabled ?? false),
      isAdFree: isPremium,
      hasPrioritySupport: isPremium,
      
      // Premium Seller features
      hasSellerBadge: isPremiumSeller && (user?.profile?.seller_verified ?? false),
      hasAutoOptimizations: isPremiumSeller,
      hasAnalyticsDashboard: isPremiumSeller,
      hasBulkScanning: isPremiumSeller,
      hasApiAccess: isPremiumSeller,
      hasDedicatedManager: isPremiumSeller,
      
      // General
      isPremium,
      isPremiumSeller,
      subscriptionTier: tier as 'free' | 'premium' | 'premium_seller',
      expiresAt,
      daysRemaining,
    };
  }, [user, subscription]);
}

export default usePremiumFeatures;
