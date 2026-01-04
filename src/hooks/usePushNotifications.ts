import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  fcmToken: string | null;
  isLoading: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    fcmToken: null,
    isLoading: false,
  });

  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : null,
      }));
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        toast.success('Push notifications enabled!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Push notifications blocked. Please enable in browser settings.');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isSupported]);

  const saveFcmToken = useCallback(async (token: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setState(prev => ({ ...prev, fcmToken: token }));
      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }, [user?.id]);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [state.permission]);

  const sendPushNotification = useCallback(async (
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: { userId, title, body, data },
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    requestPermission,
    saveFcmToken,
    showLocalNotification,
    sendPushNotification,
  };
}

export default usePushNotifications;
