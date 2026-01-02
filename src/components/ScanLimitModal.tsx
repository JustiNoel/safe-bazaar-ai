import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, Clock, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScanLimitModalProps {
  open: boolean;
  onClose: () => void;
  scansUsed: number;
  scansLimit: number;
  nextResetTime?: string;
  isLimitReached: boolean;
}

const ScanLimitModal = ({ 
  open, 
  onClose, 
  scansUsed, 
  scansLimit, 
  nextResetTime,
  isLimitReached 
}: ScanLimitModalProps) => {
  const navigate = useNavigate();
  const scansRemaining = Math.max(0, scansLimit - scansUsed);
  const progressPercent = (scansUsed / scansLimit) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLimitReached ? (
              <>
                <Clock className="w-5 h-5 text-orange-500" />
                Daily Scan Limit Reached
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-primary" />
                Scan Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLimitReached 
              ? "You've used all your free scans for today." 
              : "Your product has been analyzed successfully."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scan Usage Display */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Daily Scans</span>
              <span className={`text-sm font-bold ${isLimitReached ? 'text-destructive' : 'text-primary'}`}>
                {scansUsed} / {scansLimit} used
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{scansRemaining} scan{scansRemaining !== 1 ? 's' : ''} remaining</span>
              {nextResetTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Resets at {nextResetTime}
                </span>
              )}
            </div>
          </div>

          {isLimitReached ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Upgrade to Premium</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get unlimited scans, detailed reports, and priority AI analysis
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Button 
                  onClick={() => {
                    onClose();
                    navigate('/premium');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Now - KSh 200/mo
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Wait Until Reset ({nextResetTime})
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {scansRemaining <= 1 && scansRemaining > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Only {scansRemaining} scan remaining today!
                  </p>
                </div>
              )}
              <Button onClick={onClose} className="w-full">
                Continue
              </Button>
              {scansRemaining <= 2 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onClose();
                    navigate('/premium');
                  }}
                  className="w-full"
                >
                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                  Get Unlimited Scans
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanLimitModal;
