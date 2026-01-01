import { motion } from "framer-motion";
import { Check, Zap, Shield, Crown, Loader2, CreditCard, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MpesaPaymentModal from "@/components/MpesaPaymentModal";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "KES 0",
    period: "forever",
    description: "Perfect for trying out Safe Bazaar AI",
    icon: Shield,
    features: [
      "5 scans per day",
      "Basic risk score",
      "Summary breakdown",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
    gradient: "from-muted/50 to-muted",
  },
  {
    id: "premium",
    name: "Premium",
    price: "KES 200",
    period: "/month",
    description: "For savvy shoppers who want full protection",
    icon: Zap,
    features: [
      "Unlimited scans",
      "Full risk breakdown",
      "M-Pesa transaction checks",
      "Personalized recommendations",
      "Scan history",
      "Voice readout",
      "Ad-free experience",
      "Priority support",
    ],
    cta: "Upgrade Now",
    popular: true,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    id: "premium_seller",
    name: "Premium Seller",
    price: "KES 500",
    period: "/month",
    description: "For verified sellers building trust",
    icon: Crown,
    features: [
      "Everything in Premium",
      "Seller verification badge",
      "Product auto-optimizations",
      "Analytics dashboard",
      "Bulk product scanning",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-accent/20 to-accent/5",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function Pricing() {
  const { isAuthenticated, subscription, createCheckout, openCustomerPortal } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [mpesaModal, setMpesaModal] = useState<{ open: boolean; plan: 'premium' | 'premium_seller'; amount: number }>({
    open: false,
    plan: 'premium',
    amount: 200,
  });

  const handlePlanClick = async (planId: string) => {
    if (planId === "free") {
      if (!isAuthenticated) {
        navigate("/auth");
      } else {
        navigate("/scan");
      }
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    // If already subscribed to this plan, open portal
    if (subscription?.subscribed && subscription.tier === planId) {
      await openCustomerPortal();
      return;
    }

    setLoadingPlan(planId);
    try {
      await createCheckout(planId as 'premium' | 'premium_seller');
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonText = (plan: typeof plans[0]) => {
    if (plan.id === "free") {
      return isAuthenticated ? "Current Plan" : "Get Started";
    }
    
    if (subscription?.subscribed && subscription.tier === plan.id) {
      return "Manage Plan";
    }
    
    if (subscription?.subscribed) {
      return "Switch Plan";
    }
    
    return plan.cta;
  };

  const isCurrentPlan = (planId: string) => {
    if (planId === "free" && (!subscription?.subscribed || !subscription?.tier)) {
      return isAuthenticated;
    }
    return subscription?.tier === planId;
  };

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Protection Level
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're a casual shopper or a business seller, we have a plan
            that fits your needs. All plans include our AI-powered fraud detection.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Pay with card via Stripe or M-Pesa mobile money.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {plans.map((plan) => {
            const Icon = plan.icon;
            const current = isCurrentPlan(plan.id);
            
            return (
              <motion.div key={plan.name} variants={cardVariants}>
                <Card
                  className={`relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/20 scale-105 z-10"
                      : "border-border hover:border-primary/50"
                  } ${current ? "ring-2 ring-green-500" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {current && (
                    <div className="absolute top-0 left-0">
                      <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-br-lg">
                        Your Plan
                      </div>
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} pointer-events-none`} />
                  
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/20" : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 + 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`rounded-full p-0.5 ${plan.popular ? "bg-primary/20" : "bg-muted"}`}>
                            <Check className={`h-3.5 w-3.5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="relative pt-4 flex-col gap-2">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                      variant={plan.popular ? "default" : "secondary"}
                      onClick={() => handlePlanClick(plan.id)}
                      disabled={loadingPlan === plan.id || (plan.id === "free" && current)}
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {getButtonText(plan)}
                        </>
                      )}
                    </Button>
                    {plan.id !== "free" && !current && (
                      <Button
                        variant="outline"
                        className="w-full border-success/50 text-success hover:bg-success/10"
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate("/auth");
                            return;
                          }
                          setMpesaModal({
                            open: true,
                            plan: plan.id as 'premium' | 'premium_seller',
                            amount: plan.id === 'premium' ? 200 : 500,
                          });
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Pay with M-Pesa
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          All prices in Kenyan Shillings. Cancel anytime. Payments via Stripe (card) or M-Pesa.
        </motion.p>
      </div>

      <MpesaPaymentModal
        isOpen={mpesaModal.open}
        onClose={() => setMpesaModal(prev => ({ ...prev, open: false }))}
        plan={mpesaModal.plan}
        amount={mpesaModal.amount}
      />
    </section>
  );
}
