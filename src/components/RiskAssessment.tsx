import { AlertCircle, CheckCircle, TrendingUp, Shield, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

interface RiskAssessmentProps {
  onNewScan: () => void;
  productImage?: string;
  assessmentData?: any;
}

const RiskAssessment = ({ onNewScan, productImage, assessmentData }: RiskAssessmentProps) => {
  const { user } = useAuth();
  const isPremium = user?.profile?.premium;
  const overallScore = assessmentData?.overall_score || 45;
  const verdict = assessmentData?.verdict || (overallScore >= 70 ? "safe" : overallScore >= 40 ? "caution" : "unsafe");
  
  const defaultRiskFactors = [
    { icon: Shield, name: "Vendor Trust", weight: "40%", score: 40, details: "Limited vendor history available" },
    { icon: Award, name: "Product Authenticity", weight: "30%", score: 55, details: "Unable to verify authenticity from image" },
    { icon: Zap, name: "M-Pesa & Supply Chain", weight: "20%", score: 45, details: "Payment and supply chain not verified" },
    { icon: TrendingUp, name: "Price Analysis", weight: "10%", score: 60, details: "Price within normal market range" },
  ];

  const riskFactors = assessmentData?.risk_factors?.map((factor: any, idx: number) => ({
    icon: [Shield, Award, Zap, TrendingUp][idx] || Shield,
    name: factor.name,
    weight: `${factor.weight}%`,
    score: factor.score,
    details: factor.details,
  })) || defaultRiskFactors;

  const alternatives = assessmentData?.safer_alternatives || [
    { name: "Verified Seller Alternative", platform: "Jumia Kenya", price: "KSh 89,999", trust_score: 85, reason: "Established vendor" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center"><h1 className="text-3xl md:text-4xl font-bold mb-2">Risk Assessment Results</h1><p className="text-muted-foreground">AI-powered analysis complete</p></div>
      
      <Card className="p-8 shadow-medium">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {productImage && <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border"><img src={productImage} alt="Product" className="w-full h-full object-cover" /></div>}
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${verdict === "safe" ? "bg-success/20" : verdict === "caution" ? "bg-warning/20" : "bg-destructive/20"}`}>
              <div className="text-center"><div className={`text-4xl font-bold ${verdict === "safe" ? "text-success" : verdict === "caution" ? "text-warning" : "text-destructive"}`}>{overallScore}</div><div className="text-sm text-muted-foreground">/ 100</div></div>
            </div>
            <div className="mt-4 text-center">{verdict === "unsafe" ? <AlertCircle className="w-6 h-6 text-destructive" /> : <CheckCircle className="w-6 h-6 text-success" />}<div className="font-bold mt-2">{verdict === "safe" ? "Safe to Proceed" : verdict === "caution" ? "Proceed with Caution" : "Unsafe - Avoid"}</div></div>
          </div>
          <div className="flex-1"><h3 className="text-xl font-semibold mb-3">Assessment Summary</h3><p className="text-muted-foreground mb-4">{verdict === "safe" ? "Product passes safety checks" : "Review details carefully before purchasing"}</p></div>
        </div>
      </Card>

      <Card className="p-6 shadow-medium">
        <h2 className="text-2xl font-bold mb-6">Risk Breakdown</h2>
        <div className="space-y-6">
          {riskFactors.map((factor: any, idx: number) => {
            const Icon = factor.icon;
            return <div key={idx} className="space-y-2"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Icon className="w-5 h-5" /></div><div><div className="font-semibold">{factor.name}</div><div className="text-sm text-muted-foreground">Weight: {factor.weight}</div></div></div><div className="text-right"><div className="font-bold">{factor.score}/100</div></div></div><Progress value={factor.score} className="h-2" /><p className="text-sm text-muted-foreground">{factor.details}</p></div>;
          })}
        </div>
      </Card>

      <Card className="p-6 shadow-medium">
        <h2 className="text-2xl font-bold mb-6">🛡️ Safer Alternatives</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt: any, idx: number) => (
            <Card key={idx} className="p-4"><div className="space-y-3"><div className="text-sm font-medium text-primary">{alt.platform}</div><h3 className="font-semibold">{alt.name}</h3><div className="text-lg font-bold">{alt.price}</div><p className="text-xs text-muted-foreground">{alt.reason}</p></div></Card>
          ))}
        </div>
      </Card>

      <div className="flex gap-4 justify-center"><Button onClick={onNewScan} size="lg">Scan Another Product</Button></div>
    </div>
  );
};

export default RiskAssessment;
