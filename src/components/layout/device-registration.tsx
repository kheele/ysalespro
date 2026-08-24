
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { requestNotificationPermission } from '@/lib/firebase-messaging';
import { useToast } from '@/hooks/use-toast';
import { registerDeviceTokenAction } from '@/services/private/deviceService';

async function saveDeviceToken(userToken: string, fcmToken: string): Promise<void> {
  try {
    await registerDeviceTokenAction(userToken, fcmToken);
  } catch (error) {
    console.error('Error saving device token:', error);
    // Optionally, handle this error in the UI
  }
}

export function DeviceRegistration() {
  const { user, dbUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const registerDevice = async () => {
      // Only run if user is logged in and we have their DB record
      if (user && dbUser) {
        // Check if token has already been registered in this session
        const isTokenRegistered = sessionStorage.getItem('fcm_token_registered');
        if (isTokenRegistered) {
          return;
        }

        const fcmToken = await requestNotificationPermission();

        if (fcmToken) {
          const userToken = await user.getIdToken(true);
          await saveDeviceToken(userToken, fcmToken);
          // Mark token as registered for this session to avoid repeated DB calls
          sessionStorage.setItem('fcm_token_registered', 'true');
        } else {
          // Optional: Inform user if permission was denied
          if (Notification.permission === 'denied') {
            toast({
              title: "Desktop Notifications Disabled",
              description: "You have blocked notifications. To enable them, please update your browser settings for this site.",
              duration: 10000,
            });
          }
        }
      }
    };

    registerDevice();
  }, [user, dbUser, toast]);

  // This is a side-effect component, it doesn't render anything.
  return null;
}
