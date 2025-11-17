import { Shield, Zap, Award, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import iconScan from "@/assets/icon-scan.jpg";
import iconAi from "@/assets/icon-ai.jpg";
import iconTrust from "@/assets/icon-trust.jpg";

const Features = () => {
  const features = [
    {
      icon: iconScan,
      title: "Quick Product Scan",
      description: "Upload an image or paste a URL. Our AI analyzes in under 5 seconds.",
      color: "text-primary",
    },
    {
      icon: iconAi,
      title: "AI Risk Assessment",
      description: "Multi-factor analysis: vendor trust, product authenticity, M-Pesa safety, and price anomalies.",
      color: "text-secondary",
    },
    {
      icon: iconTrust,
      title: "Safer Alternatives",
      description: "Get 3-5 verified vendor recommendations if a product seems risky.",
      color: "text-success",
    },
  ];

  const riskFactors = [
    {
      icon: Shield,
      title: "Vendor Trust Score",
      weight: "40%",
      description: "Reviews, account age, and reported scams",
    },
    {
      icon: Award,
      title: "Product Authenticity",
      weight: "30%",
      description: "Image analysis and brand verification",
    },
    {
      icon: Zap,
      title: "M-Pesa Safety",
      weight: "20%",
      description: "Payment patterns and geo-location flags",
    },
    {
      icon: TrendingUp,
      title: "Price Analysis",
      weight: "10%",
      description: "Market comparison and anomaly detection",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* How It Works */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="bg-gradient-primary bg-clip-text text-transparent">Safe Bazaar AI</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to protect your online shopping in Kenya
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Risk Assessment Breakdown */}
        <div className="bg-card rounded-2xl p-8 md:p-12 shadow-medium">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Our AI Risk Assessment Model
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multi-factor analysis powered by machine learning to give you comprehensive protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {riskFactors.map((factor, index) => (
              <div 
                key={index}
                className="flex gap-4 p-6 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <factor.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{factor.title}</h4>
                    <span className="text-sm font-medium text-primary">{factor.weight}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {factor.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
