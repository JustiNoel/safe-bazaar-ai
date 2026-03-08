import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Shield, Bell, CreditCard, Copy, Check, Key, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, refreshProfile, subscription } = useAuth();
  const [copiedRef, setCopiedRef] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState({
    welcome: true,
    scan_summary: true,
    daily_digest: true,
    referral: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user?.profile) {
      const prefs = user.profile as any;
      if (prefs.email_preferences) {
        try {
          const parsed = typeof prefs.email_preferences === "string" 
            ? JSON.parse(prefs.email_preferences) 
            : prefs.email_preferences;
          setEmailPrefs(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    }
  }, [user]);

  const handleCopyReferral = () => {
    if (user?.profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${user.profile.referral_code}`);
      setCopiedRef(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePrefs = async () => {
    if (!user?.id) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ email_preferences: emailPrefs as any })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Preferences saved!");
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;
  const scansUsed = profile?.scans_today || 0;
  const scanLimit = profile?.scan_limit || 3;
  const scanPercent = Math.min((scansUsed / scanLimit) * 100, 100);

  const daysRemaining = profile?.premium_expires_at
    ? Math.max(0, Math.ceil((new Date(profile.premium_expires_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <PageHeader
          title="Profile & Settings"
          description="Manage your account, security, and preferences"
          breadcrumbs={[{ label: "Profile" }]}
        />

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Role</Label>
                    <p className="font-medium capitalize">{profile?.role || "Buyer"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone</Label>
                    <p className="font-medium">{profile?.phone || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Member Since</Label>
                    <p className="font-medium">
                      {profile ? new Date(profile.id ? (profile as any).created_at || Date.now() : Date.now()).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={profile?.premium ? "default" : "secondary"} className={profile?.premium ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : ""}>
                      {profile?.subscription_tier?.toUpperCase() || "FREE"}
                    </Badge>
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{daysRemaining} days remaining</p>
                    )}
                  </div>
                  {!profile?.premium && (
                    <Button size="sm" onClick={() => navigate("/premium")}>
                      Upgrade
                    </Button>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Scans today</span>
                    <span className="font-medium">{scansUsed} / {scanLimit}</span>
                  </div>
                  <Progress value={scanPercent} className="h-2" />
                </div>
                {profile?.bonus_scans !== undefined && profile.bonus_scans > 0 && (
                  <p className="text-sm text-muted-foreground">+ {profile.bonus_scans} bonus scans from referrals</p>
                )}
              </CardContent>
            </Card>

            {/* Referral Card */}
            {profile?.referral_code && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Referral Program
                  </CardTitle>
                  <CardDescription>Share your code to earn bonus scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={`${window.location.origin}/auth?ref=${profile.referral_code}`} className="text-sm" />
                    <Button size="icon" variant="outline" onClick={handleCopyReferral}>
                      {copiedRef ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {profile.referral_count || 0} referrals completed
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
                  {changingPassword ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Update Password</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Choose which emails you'd like to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "welcome", label: "Welcome emails", desc: "Onboarding tips and guides" },
                  { key: "scan_summary", label: "Scan summaries", desc: "Results of your scans via email" },
                  { key: "daily_digest", label: "Daily digest", desc: "Daily scam alerts and trends" },
                  { key: "referral", label: "Referral updates", desc: "When someone uses your referral" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={(emailPrefs as any)[key]}
                      onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, [key]: checked }))}
                    />
                  </div>
                ))}
                <Separator />
                <Button onClick={handleSavePrefs} disabled={savingPrefs} className="w-full">
                  {savingPrefs ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
