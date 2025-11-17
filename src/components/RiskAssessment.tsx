import { AlertCircle, CheckCircle, TrendingUp, Shield, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RiskAssessmentProps {
  onNewScan: () => void;
  productImage?: string;
}

const RiskAssessment = ({ onNewScan, productImage }: RiskAssessmentProps) => {
  // Mock data - in production this would come from AI analysis
  const overallScore = 28;
  const verdict = overallScore >= 70 ? "safe" : overallScore >= 40 ? "caution" : "unsafe";
  
  const riskFactors = [
    {
      icon: Shield,
      name: "Vendor Trust",
      weight: "40%",
      score: 25,
      status: "High Risk",
      details: "60% negative reviews; Account created 30 days ago",
      color: "text-destructive",
    },
    {
      icon: Award,
      name: "Product Authenticity",
      weight: "30%",
      score: 35,
      status: "Suspicious",
      details: "Branding inconsistencies detected; Likely counterfeit",
      color: "text-warning",
    },
    {
      icon: Zap,
      name: "M-Pesa & Supply Chain",
      weight: "20%",
      score: 20,
      status: "Red Flag",
      details: "Vendor location flagged (Kisumu); No verifiable sourcing",
      color: "text-destructive",
    },
    {
      icon: TrendingUp,
      name: "Price Anomaly",
      weight: "10%",
      score: 45,
      status: "Below Market",
      details: "50% below Jumia average - potential fake",
      color: "text-warning",
    },
  ];

  const alternatives = [
    {
      name: "iPhone 13 Pro - Verified Seller",
      vendor: "TechHub Kenya (Jumia Official)",
      price: "KSh 89,999",
      trustScore: 95,
      savings: "+20%",
    },
    {
      name: "iPhone 13 Pro - Certified",
      vendor: "Kilimall Official Store",
      price: "KSh 92,500",
      trustScore: 92,
      savings: "+23%",
    },
    {
      name: "iPhone 13 Pro - Authentic",
      vendor: "Safaricom Shop",
      price: "KSh 94,999",
      trustScore: 98,
      savings: "+27%",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Risk Assessment Results
        </h1>
        <p className="text-muted-foreground">
          AI-powered analysis complete
        </p>
      </div>

      {/* Overall Score */}
      <Card className="p-8 shadow-medium">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Product Image */}
          {productImage && (
            <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={productImage} 
                alt="Scanned product" 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Score Circle */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
              verdict === "safe" ? "bg-success/20" : 
              verdict === "caution" ? "bg-warning/20" : "bg-destructive/20"
            }`}>
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  verdict === "safe" ? "text-success" : 
                  verdict === "caution" ? "text-warning" : "text-destructive"
                }`}>
                  {overallScore}
                </div>
                <div className="text-sm text-muted-foreground">/ 100</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              {verdict === "unsafe" ? (
                <div className="flex items-center gap-2 text-destructive font-semibold">
                  <AlertCircle className="w-5 h-5" />
                  HIGH RISK - AVOID
                </div>
              ) : verdict === "caution" ? (
                <div className="flex items-center gap-2 text-warning font-semibold">
                  <AlertCircle className="w-5 h-5" />
                  PROCEED WITH CAUTION
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  SAFE TO PROCEED
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">Verdict: High Scam Risk Detected</h2>
            <p className="text-muted-foreground mb-4">
              Our AI analysis indicates this product has multiple red flags. We strongly recommend 
              exploring the safer alternatives below from verified vendors.
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
                New Vendor
              </span>
              <span className="px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
                Counterfeit Risk
              </span>
              <span className="px-3 py-1 bg-warning/10 text-warning text-sm rounded-full">
                Below Market Price
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Risk Breakdown */}
      <Card className="p-6 md:p-8 shadow-medium">
        <h3 className="text-xl font-bold mb-6">Detailed Risk Breakdown</h3>
        <div className="space-y-6">
          {riskFactors.map((factor, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <factor.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{factor.name}</span>
                      <span className="text-xs text-muted-foreground">({factor.weight})</span>
                    </div>
                    <span className={`text-sm font-medium ${factor.color}`}>
                      {factor.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${factor.color}`}>
                    {factor.score}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
              <Progress value={factor.score} className="h-2" />
              <p className="text-sm text-muted-foreground pl-13">
                {factor.details}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Safer Alternatives */}
      <Card className="p-6 md:p-8 shadow-medium bg-success/5 border-success">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-6 h-6 text-success" />
          <h3 className="text-xl font-bold">Safer Alternatives from Verified Vendors</h3>
        </div>
        <div className="space-y-4">
          {alternatives.map((alt, index) => (
            <Card key={index} className="p-4 hover:shadow-medium transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{alt.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{alt.vendor}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        {alt.trustScore}% Trust Score
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alt.savings} more for authenticity
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {alt.price}
                  </div>
                  <Button size="sm" variant="default">
                    View Product
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="hero" size="lg" onClick={onNewScan}>
          Scan Another Product
        </Button>
        <Button variant="outline" size="lg">
          Save Report
        </Button>
      </div>
    </div>
  );
};

export default RiskAssessment;
