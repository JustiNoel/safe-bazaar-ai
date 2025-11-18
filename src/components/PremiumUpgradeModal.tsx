import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const PremiumUpgradeModal = ({ open, onClose }: PremiumUpgradeModalProps) => {
  const { upgradeToPremium } = useAuth();

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
      onClose();
    } catch (error) {
      console.error("Upgrade error:", error);
    }
  };

  const premiumFeatures = [
    "Unlimited product scans",
    "Full detailed risk breakdowns",
    "Advanced M-Pesa transaction checks",
    "Personalized recommendations",
    "Scan history & analytics",
    "Voice readout of results",
    "Ad-free experience",
    "Priority customer support",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock unlimited scans and advanced features for safer shopping
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">KES 200</div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>

          <div className="space-y-2">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
