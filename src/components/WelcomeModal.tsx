import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Scan, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("safebazaar_welcome_seen");
    if (!hasSeenWelcome) {
      // Small delay for smooth page load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("safebazaar_welcome_seen", "true");
    setIsOpen(false);
  };

  const steps = [
    {
      icon: Shield,
      title: "Karibu! Welcome to Safe Bazaar AI 🇰🇪",
      description:
        "Your AI-powered shopping guardian for safer online shopping in Kenya. We help you detect scams, counterfeits, and risky vendors before you buy.",
    },
    {
      icon: Scan,
      title: "3 Free Scans Every Day",
      description:
        "Upload a product image or paste a URL, and our AI will analyze it for safety. You get 3 free scans daily – they reset at midnight EAT!",
    },
    {
      icon: Sparkles,
      title: "Ready to Shop Safely?",
      description:
        "Start scanning products now and make informed purchasing decisions. Upgrade to Premium for unlimited scans and detailed reports!",
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center"
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Icon className="w-10 h-10 text-primary-foreground" />
                </motion.div>
              </div>
              <DialogTitle className="text-center text-xl">
                {currentStep.title}
              </DialogTitle>
              <DialogDescription className="text-center">
                {currentStep.description}
              </DialogDescription>
            </motion.div>
          </AnimatePresence>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === step
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step < steps.length - 1 ? (
            <>
              <Button variant="ghost" className="flex-1" onClick={handleClose}>
                Skip
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button className="w-full gap-2" onClick={handleClose}>
              <Sparkles className="w-4 h-4" />
              Start Scanning!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
