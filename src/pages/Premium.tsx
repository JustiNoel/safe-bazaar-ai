import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Clock, Star, Users, Crown, Sparkles, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const premiumFeatures = [
  {
    icon: Zap,
    title: "Unlimited Scans",
    description: "Scan as many products as you want without daily limits. Perfect for power shoppers and sellers.",
    free: "3 scans/day",
    premium: "Unlimited"
  },
  {
    icon: BarChart3,
    title: "Advanced Risk Reports",
    description: "Get detailed breakdowns of vendor history, price anomalies, and authenticity scores.",
    free: "Basic score",
    premium: "Full breakdown"
  },
  {
    icon: Clock,
    title: "Scan History",
    description: "Access your complete scan history to track vendors and products over time.",
    free: "Last 5 scans",
    premium: "Unlimited history"
  },
  {
    icon: Star,
    title: "Priority AI Analysis",
    description: "Your scans get processed first with our most advanced AI models.",
    free: "Standard queue",
    premium: "Priority access"
  },
  {
    icon: Users,
    title: "Seller Tools",
    description: "Access the seller dashboard to build trust scores and verify your products.",
    free: "Not available",
    premium: "Full access"
  },
  {
    icon: Shield,
    title: "Real-time Alerts",
    description: "Get notified when vendors you've scanned get flagged for suspicious activity.",
    free: "Not available",
    premium: "Instant alerts"
  }
];

const Premium = () => {
  const { user, subscription, createCheckout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: 'premium' | 'premium_seller') => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(true);
    try {
      await createCheckout(plan);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscription?.subscribed;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Premium Membership</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Shop Smarter with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                Premium
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock unlimited scans, advanced reports, and exclusive tools to protect every purchase.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Free:</span>
                        <span className="text-foreground">{feature.free}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">Premium:</span>
                        <span className="text-primary font-bold">{feature.premium}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="relative overflow-hidden border-primary/50 hover:border-primary transition-colors">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm rounded-bl-lg">
                  Popular
                </div>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <p className="text-muted-foreground">For smart shoppers</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">KES 200</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 text-left mb-6">
                    {["Unlimited product scans", "Advanced risk reports", "Full scan history", "Priority AI analysis"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleUpgrade('premium')}
                    disabled={loading || isPremium}
                  >
                    {isPremium ? "Current Plan" : "Upgrade Now"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Seller Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="relative overflow-hidden border-orange-500/50 hover:border-orange-500 transition-colors">
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-sm rounded-bl-lg">
                  For Sellers
                </div>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Premium Seller</CardTitle>
                  <p className="text-muted-foreground">For verified vendors</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">KES 500</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 text-left mb-6">
                    {["Everything in Premium", "Seller dashboard access", "Trust badge on products", "Real-time scam alerts"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600" 
                    size="lg"
                    onClick={() => handleUpgrade('premium_seller')}
                    disabled={loading}
                  >
                    Get Seller Tools
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Premium;
