import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getFavoritesCount } from '@/lib/profile';

export default function TabsLayout() {
  const { colors } = useTheme();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    return () => subscription.unsubscribe();
  }, []);

  // toggle favorite เกิดขึ้นที่ /research/[slug] ซึ่งอยู่นอกกลุ่ม (tabs) — ต้องรีเฟรช
  // ยอดนับใหม่ทุกครั้งที่กลับเข้ามาที่ (tabs) ไม่ใช่แค่ตอน session เปลี่ยน
  useFocusEffect(
    useCallback(() => {
      if (session) {
        getFavoritesCount().then(setFavCount);
      }
    }, [session])
  );

  if (session === undefined) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ຫນ້າທຳອິດ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: 'ງານວິໄຈ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
          tabBarBadge: favCount > 0 ? favCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'ບັນຊີ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
