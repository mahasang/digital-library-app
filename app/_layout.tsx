import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { registerPushToken, savePushToken, clearPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    SplashScreen.hideAsync();

    // Register push token เมื่อ user login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const token = await registerPushToken();
          if (token) await savePushToken(token);
        }
        if (event === 'SIGNED_OUT') {
          await clearPushToken();
        }
      }
    );

    // Listener: notification received ขณะ app เปิด
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener: user กด notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // navigate ตาม data
      if (data?.research_slug) {
        router.push(`/research/${data.research_slug}` as any);
      } else if (data?.screen === 'notifications') {
        router.push('/notifications' as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="research/[slug]" />
          <Stack.Screen name="research/[slug]/pdf" />
          <Stack.Screen name="search" />
          <Stack.Screen name="history" />
          <Stack.Screen name="notifications" />
        </Stack>
      </ThemeProvider>
    </LanguageProvider>
  );
}
