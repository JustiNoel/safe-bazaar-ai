import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Search, Layers, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "safebazaar_onboarding_done";

const steps = [
  {
    icon: Search,
    title: "Paste a product URL",
    description: "Enter a link from Jumia, Jiji, or any Kenyan marketplace to scan for scams.",
  },
  {
    icon: Layers,
    title: "Choose your scan mode",
    description: "Switch between Product, Link, or Image analysis depending on what you want to verify.",
  },
  {
    icon: BarChart3,
    title: "Get instant results",
    description: "See a trust score, risk breakdown, and AI-powered recommendations in seconds.",
  },
];

const OnboardingTour = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setVisible(true);
  }, []);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-5 relative">
          <button onClick={finish} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Step {step + 1} of {steps.length}</p>
              <h3 className="font-semibold mb-1">{current.title}</h3>
              <p className="text-sm text-muted-foreground">{current.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            {step < steps.length - 1 ? (
              <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
