import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Shield, Clock, Crown, Zap, BellOff, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const scansRemaining = Math.max(0, scansLimit - scansUsed);
  const progressPercent = (scansUsed / scansLimit) * 100;
  
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current preferences when modal opens
  useEffect(() => {
    if (open && user?.id) {
      fetchPreferences();
    }
  }, [open, user?.id]);

  const fetchPreferences = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("email_preferences")
      .eq("user_id", user?.id)
      .single();
    
    if (data?.email_preferences) {
      const prefs = data.email_preferences as any;
      setEmailAlerts(prefs.limit_alerts_email ?? true);
      setSmsAlerts(prefs.limit_alerts_sms ?? true);
    }
  };

  const updatePreferences = async (emailEnabled: boolean, smsEnabled: boolean) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    // First fetch current preferences
    const { data: currentData } = await supabase
      .from("profiles")
      .select("email_preferences")
      .eq("user_id", user.id)
      .single();
    
    const currentPrefs = (currentData?.email_preferences as any) || {};
    
    const { error } = await supabase
      .from("profiles")
      .update({ 
        email_preferences: {
          ...currentPrefs,
          limit_alerts_email: emailEnabled,
          limit_alerts_sms: smsEnabled,
        }
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update preferences");
      console.error(error);
    } else {
      toast.success("Notification preferences updated");
    }
    
    setIsSaving(false);
  };

  const handleEmailToggle = (checked: boolean) => {
    setEmailAlerts(checked);
    updatePreferences(checked, smsAlerts);
  };

  const handleSmsToggle = (checked: boolean) => {
    setSmsAlerts(checked);
    updatePreferences(emailAlerts, checked);
  };

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

          {/* Quick Notification Toggle */}
          {user && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                  <span>Notification Settings</span>
                </div>
                {showNotificationSettings ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {showNotificationSettings && (
                <div className="border-t border-border p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email alerts when limit reached</span>
                    <Switch
                      checked={emailAlerts}
                      onCheckedChange={handleEmailToggle}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS alerts when limit reached</span>
                    <Switch
                      checked={smsAlerts}
                      onCheckedChange={handleSmsToggle}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
