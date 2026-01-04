import { AlertCircle, CheckCircle, TrendingUp, Shield, Award, Zap, Lock, Crown, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import CircularGauge from "@/components/CircularGauge";
import ShareResults from "@/components/ShareResults";
import VoiceReadout from "@/components/VoiceReadout";
import { Link } from "react-router-dom";

interface RiskAssessmentProps {
  onNewScan: () => void;
  productImage?: string;
  assessmentData?: any;
}

const RiskAssessment = ({ onNewScan, productImage, assessmentData }: RiskAssessmentProps) => {
  const { user } = useAuth();
  const { 
    isPremium, 
    hasFullRiskBreakdown, 
    hasVoiceReadout, 
    hasMpesaChecks,
    hasPersonalizedRecommendations,
    subscriptionTier,
    daysRemaining 
  } = usePremiumFeatures();
  
  const overallScore = assessmentData?.overall_score || 45;
  const verdict = assessmentData?.verdict || (overallScore >= 70 ? "safe" : overallScore >= 40 ? "caution" : "unsafe");
  
  const defaultRiskFactors = [
    { icon: Shield, name: "Vendor Trust", weight: "40%", score: 40, details: "Limited vendor history available", premium: false },
    { icon: Award, name: "Product Authenticity", weight: "30%", score: 55, details: "Unable to verify authenticity from image", premium: false },
    { icon: Zap, name: "M-Pesa & Supply Chain", weight: "20%", score: 45, details: "Payment and supply chain not verified", premium: true },
    { icon: TrendingUp, name: "Price Analysis", weight: "10%", score: 60, details: "Price within normal market range", premium: true },
  ];

  const riskFactors = assessmentData?.risk_factors?.map((factor: any, idx: number) => ({
    icon: [Shield, Award, Zap, TrendingUp][idx] || Shield,
    name: factor.name,
    weight: `${factor.weight}%`,
    score: factor.score,
    details: factor.details,
    premium: idx >= 2, // Last 2 factors are premium
  })) || defaultRiskFactors;

  const alternatives = assessmentData?.safer_alternatives || [
    { name: "Verified Seller Alternative", platform: "Jumia Kenya", price: "KSh 89,999", trust_score: 85, reason: "Established vendor" },
  ];

  // Generate voice readout text
  const generateVoiceText = () => {
    let text = `Risk Assessment Results. Overall safety score: ${overallScore} out of 100. `;
    text += verdict === "safe" 
      ? "This product is safe to proceed with. " 
      : verdict === "caution" 
        ? "Proceed with caution. " 
        : "This product is unsafe. We recommend avoiding it. ";
    
    if (hasFullRiskBreakdown) {
      text += "Risk breakdown: ";
      riskFactors.forEach((factor: any) => {
        text += `${factor.name}: ${factor.score} out of 100. ${factor.details}. `;
      });
    }
    
    return text;
  };

  // Filter risk factors for non-premium users (show only first 2 with details)
  const visibleRiskFactors = hasFullRiskBreakdown 
    ? riskFactors 
    : riskFactors.map((factor: any, idx: number) => ({
        ...factor,
        details: idx < 2 ? factor.details : "Upgrade to Premium to see details",
        isLocked: idx >= 2,
      }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Premium Badge */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold">Risk Assessment Results</h1>
          {isPremium && (
            <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500">
              <Crown className="w-3 h-3 mr-1" />
              {subscriptionTier === 'premium_seller' ? 'Seller' : 'Premium'}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">AI-powered analysis complete</p>
        {isPremium && daysRemaining !== null && daysRemaining <= 7 && (
          <p className="text-sm text-warning mt-1">
            ⚠️ Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      {/* Main Score Card with Voice Readout */}
      <Card className="p-8 shadow-medium">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {productImage && (
            <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border">
              <img src={productImage} alt="Product" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col items-center">
            <CircularGauge score={overallScore} size={180} strokeWidth={14} />
            <div className="mt-4 text-center flex items-center gap-2">
              {verdict === "unsafe" ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : verdict === "caution" ? (
                <AlertCircle className="w-5 h-5 text-warning" />
              ) : (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
              <span className="font-bold">
                {verdict === "safe" ? "Safe to Proceed" : verdict === "caution" ? "Proceed with Caution" : "Unsafe - Avoid"}
              </span>
            </div>
            {/* Voice Readout Button */}
            <div className="mt-4">
              <VoiceReadout text={generateVoiceText()} />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold mb-3">Assessment Summary</h3>
            <p className="text-muted-foreground">
              {verdict === "safe" 
                ? "This product passes our safety checks. You can proceed with confidence!" 
                : verdict === "caution"
                ? "Review the risk factors below before making a purchase decision."
                : "We recommend avoiding this product due to significant risk factors."}
            </p>
            {hasMpesaChecks && assessmentData?.mpesa_verified && (
              <div className="mt-3 flex items-center gap-2 text-success">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">M-Pesa transaction verified</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Risk Breakdown Card */}
      <Card className="p-6 shadow-medium">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Risk Breakdown</h2>
          {!hasFullRiskBreakdown && (
            <Link to="/premium">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                <Lock className="w-3 h-3 mr-1" />
                Unlock Full Breakdown
              </Badge>
            </Link>
          )}
        </div>
        <div className="space-y-6">
          {visibleRiskFactors.map((factor: any, idx: number) => {
            const Icon = factor.icon;
            const isLocked = factor.isLocked && !hasFullRiskBreakdown;
            
            return (
              <div key={idx} className={`space-y-2 ${isLocked ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLocked ? 'bg-muted/50' : 'bg-muted'}`}>
                      {isLocked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {factor.name}
                        {factor.premium && !isPremium && (
                          <Badge variant="secondary" className="text-xs">Premium</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Weight: {factor.weight}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{isLocked ? '???' : `${factor.score}/100`}</div>
                  </div>
                </div>
                <Progress value={isLocked ? 0 : factor.score} className="h-2" />
                <p className={`text-sm ${isLocked ? 'text-muted-foreground italic' : 'text-muted-foreground'}`}>
                  {isLocked ? (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {factor.details}
                    </span>
                  ) : factor.details}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Premium Upsell for non-premium users */}
        {!isPremium && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Unlock Premium Features
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get full risk breakdown, M-Pesa checks, voice readout & more
                </p>
              </div>
              <Link to="/premium">
                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Upgrade - KES 200/mo
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-medium">
        <h2 className="text-2xl font-bold mb-6">🛡️ Safer Alternatives</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt: any, idx: number) => (
            <Card key={idx} className="p-4"><div className="space-y-3"><div className="text-sm font-medium text-primary">{alt.platform}</div><h3 className="font-semibold">{alt.name}</h3><div className="text-lg font-bold">{alt.price}</div><p className="text-xs text-muted-foreground">{alt.reason}</p></div></Card>
          ))}
        </div>
      </Card>

      <div className="flex gap-4 justify-center flex-wrap">
        <Button onClick={onNewScan} size="lg">Scan Another Product</Button>
        <ShareResults score={overallScore} verdict={verdict} />
      </div>
    </div>
  );
};

export default RiskAssessment;
