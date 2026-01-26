import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    if (isStandalone) {
      return;
    }

    // Check session storage for this session's dismissal
    const isDismissedThisSession = sessionStorage.getItem("pwa_banner_dismissed_session");
    
    if (isDismissedThisSession) {
      return;
    }

    // For iOS, show manual install instructions
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, capture the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Show banner anyway for browsers that support PWA
    const fallbackTimer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers without beforeinstallprompt
      window.open(window.location.href, '_blank');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowBanner(false);
      localStorage.setItem("pwa_installed", "true");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa_banner_dismissed_session", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="p-4 shadow-strong border-primary/20 bg-card/95 backdrop-blur-sm">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Install Safe Bazaar AI</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {isIOS 
                  ? "Add to your home screen for the best experience!"
                  : "Install our app for faster access and offline support."}
              </p>
              
              {/* Always show download button */}
              <Button 
                size="sm" 
                className="gap-2 w-full" 
                onClick={isIOS ? undefined : handleInstall}
              >
                <Download className="w-4 h-4" />
                {isIOS ? "How to Install" : "Install App"}
              </Button>
              
              {isIOS && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Steps to install:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tap the Share button <span className="font-medium">⬆️</span></li>
                    <li>Select "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA;
