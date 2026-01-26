import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminAction[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!user?.profile?.is_admin) return;

    const channel = supabase
      .channel("admin_actions_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_actions",
        },
        (payload) => {
          const action = payload.new as AdminAction;
          setNotifications((prev) => [action, ...prev].slice(0, 50));

          // Show toast for new actions
          const actionMessages: Record<string, string> = {
            ban_user: "🚫 User has been banned",
            unban_user: "✅ User has been unbanned",
            upgrade_premium: "👑 User upgraded to Premium",
            revoke_premium: "⬇️ Premium status revoked",
            issue_scan_tokens: "🎁 Bonus scans issued",
            reset_scans: "🔄 Daily scans reset",
          };

          const message = actionMessages[action.action_type] || `Admin action: ${action.action_type}`;
          toast.info(message, {
            description: `Action performed at ${new Date(action.created_at).toLocaleTimeString()}`,
          });
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.profile?.is_admin]);

  return { notifications, isSubscribed };
}

export function useUserBanNotification() {
  const { user, refreshProfile } = useAuth();
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user_ban_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as any;
          
          if (newProfile.banned && !isBanned) {
            setIsBanned(true);
            toast.error("Your account has been suspended", {
              description: newProfile.banned_reason || "Contact support for more information",
              duration: 10000,
            });
          } else if (!newProfile.banned && isBanned) {
            setIsBanned(false);
            toast.success("Your account has been restored!", {
              description: "Welcome back to SafeBazaar",
            });
          }

          // Refresh profile to update local state
          await refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isBanned, refreshProfile]);

  return { isBanned };
}

export function usePremiumChangeNotification() {
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user_premium_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as any;
          const oldProfile = payload.old as any;
          
          // Check for premium status change
          if (newProfile.premium && !oldProfile?.premium) {
            toast.success("🎉 Welcome to Premium!", {
              description: "You now have unlimited scans and exclusive features",
              duration: 8000,
            });
          } else if (!newProfile.premium && oldProfile?.premium) {
            toast.warning("Premium subscription ended", {
              description: "Upgrade again to continue enjoying premium features",
            });
          }

          // Refresh profile to update local state
          await refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshProfile]);
}
