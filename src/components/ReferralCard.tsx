import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Share2, Gift, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  bonusScans: number;
}

const ReferralCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralStats = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("referral_code, referral_count, bonus_scans")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setStats({
          referralCode: data.referral_code || "SAFE-XXXXX",
          referralCount: data.referral_count || 0,
          bonusScans: data.bonus_scans || 0
        });
      } catch (error) {
        console.error("Error fetching referral stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, [user]);

  const referralLink = stats?.referralCode 
    ? `${window.location.origin}/auth?ref=${stats.referralCode}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🛡️ Hey! I use Safe Bazaar AI to check if online products are safe before buying. Get 3 free scans daily!\n\nJoin with my link and we both get bonus scans: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `🛡️ Stay safe when shopping online in Kenya! @SafeBazaarAI helps detect scams & fraud. Join with my link:`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const getTierInfo = (count: number) => {
    if (count >= 25) return { name: "Diamond", color: "bg-cyan-500", next: null };
    if (count >= 10) return { name: "Gold", color: "bg-yellow-500", next: 25 };
    if (count >= 5) return { name: "Silver", color: "bg-gray-400", next: 10 };
    return { name: "Bronze", color: "bg-orange-600", next: 5 };
  };

  if (!user) return null;
  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = getTierInfo(stats?.referralCount || 0);

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Invite Friends
          </CardTitle>
          <Badge className={`${tier.color} text-white`}>
            {tier.name} Tier
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your code and earn <strong className="text-primary">+2 bonus scans</strong> for each friend who joins!
        </p>

        {/* Referral Code */}
        <div className="bg-background/80 border-2 border-dashed border-primary/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xl font-bold text-primary tracking-wider">
              {stats?.referralCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats?.referralCount || 0}</p>
            <p className="text-xs text-muted-foreground">Friends Invited</p>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{stats?.bonusScans || 0}</p>
            <p className="text-xs text-muted-foreground">Bonus Scans</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {tier.next && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to {tier.next === 5 ? "Silver" : tier.next === 10 ? "Gold" : "Diamond"}</span>
              <span>{stats?.referralCount || 0}/{tier.next}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${tier.color} transition-all duration-500`}
                style={{ width: `${Math.min(100, ((stats?.referralCount || 0) / tier.next) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Share Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shareViaWhatsApp}
            className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30 text-[#25D366]"
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareViaTwitter}
            className="flex-1 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border-[#1DA1F2]/30 text-[#1DA1F2]"
          >
            Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareViaFacebook}
            className="flex-1 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-[#1877F2]/30 text-[#1877F2]"
          >
            Facebook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
