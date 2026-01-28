import { useEffect } from "react";
import { useRealtimeNotifications, useUserBanNotification, usePremiumChangeNotification } from "@/hooks/useRealtimeNotifications";
import { useAuth } from "@/contexts/AuthContext";

const RealtimeNotificationProvider = () => {
  const { user } = useAuth();
  
  // Admin notifications for admin actions
  useRealtimeNotifications();
  
  // User notifications for ban status
  useUserBanNotification();
  
  // User notifications for premium changes  
  usePremiumChangeNotification();

  return null; // This is a provider component, renders nothing
};

export default RealtimeNotificationProvider;
