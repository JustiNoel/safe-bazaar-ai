import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Phone, Loader2, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface EmailPreferences {
  welcome: boolean;
  scan_summary: boolean;
  referral: boolean;
  daily_digest: boolean;
  limit_alerts_email: boolean;
  limit_alerts_sms: boolean;
  push_notifications: boolean;
}

const defaultPreferences: EmailPreferences = {
  welcome: true,
  scan_summary: true,
  referral: true,
  daily_digest: true,
  limit_alerts_email: true,
  limit_alerts_sms: true,
  push_notifications: false,
};

export default function NotificationPreferences() {
  const { user, refreshProfile } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isSupported, permission, requestPermission, isLoading: isPushLoading } = usePushNotifications();

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("email_preferences")
      .eq("user_id", user?.id)
      .single();

    if (error) {
      console.error("Error fetching preferences:", error);
    } else if (data?.email_preferences) {
      setPreferences({
        ...defaultPreferences,
        ...(data.email_preferences as Partial<EmailPreferences>),
      });
    }
    setIsLoading(false);
  };

  const updatePreference = async (key: keyof EmailPreferences, value: boolean) => {
    setIsSaving(true);
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from("profiles")
      .update({ email_preferences: newPreferences })
      .eq("user_id", user?.id);

    if (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
      setPreferences(preferences); // Revert on error
    } else {
      toast.success("Preferences updated");
      refreshProfile?.();
    }
    setIsSaving(false);
  };

  const handleEnablePush = async () => {
    const granted = await requestPermission();
    if (granted) {
      await updatePreference("push_notifications", true);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive alerts and updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Push Notifications
            </h3>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Browser/PWA Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant alerts on your device
                    </p>
                  </div>
                </div>
                {isSupported ? (
                  permission === "granted" ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={preferences.push_notifications}
                        onCheckedChange={(checked) => updatePreference("push_notifications", checked)}
                        disabled={isSaving}
                      />
                    </div>
                  ) : permission === "denied" ? (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Blocked</span>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleEnablePush}
                      disabled={isPushLoading}
                    >
                      {isPushLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Enable"
                      )}
                    </Button>
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">Not supported</span>
                )}
              </div>
              
              {permission === "granted" && preferences.push_notifications && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Push notifications are active</span>
                </div>
              )}
              
              {permission === "denied" && (
                <p className="text-xs text-muted-foreground">
                  To enable notifications, update your browser settings for this site.
                </p>
              )}
            </div>
          </div>

          {/* Limit Alerts Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Scan Limit Alerts
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="limit-email" className="font-medium">
                      Email Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified via email when you reach your daily limit
                    </p>
                  </div>
                </div>
                <Switch
                  id="limit-email"
                  checked={preferences.limit_alerts_email}
                  onCheckedChange={(checked) => updatePreference("limit_alerts_email", checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="limit-sms" className="font-medium">
                      SMS Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get SMS notifications when you reach your daily limit
                    </p>
                  </div>
                </div>
                <Switch
                  id="limit-sms"
                  checked={preferences.limit_alerts_sms}
                  onCheckedChange={(checked) => updatePreference("limit_alerts_sms", checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Other Notifications Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Other Notifications
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="scan-summary" className="font-medium">
                      Scan Summary Emails
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive detailed scan results via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="scan-summary"
                  checked={preferences.scan_summary}
                  onCheckedChange={(checked) => updatePreference("scan_summary", checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="daily-digest" className="font-medium">
                      Daily Digest
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Daily summary of your scanning activity (8 AM EAT)
                    </p>
                  </div>
                </div>
                <Switch
                  id="daily-digest"
                  checked={preferences.daily_digest}
                  onCheckedChange={(checked) => updatePreference("daily_digest", checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="referral" className="font-medium">
                      Referral Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when friends join using your code
                    </p>
                  </div>
                </div>
                <Switch
                  id="referral"
                  checked={preferences.referral}
                  onCheckedChange={(checked) => updatePreference("referral", checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
