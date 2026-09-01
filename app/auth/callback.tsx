import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';

export default function AuthCallback() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  useEffect(() => {
    // รอให้ supabase handle session จาก URL fragment
    // lib/auth.ts จะ call setSession() เอง
    // callback screen นี้แค่รอแล้ว redirect ไปหน้าแรก
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      } else if (params.confirmed) {
        router.replace('/(auth)/login?confirmed=1' as any);
      } else {
        router.replace('/(tabs)');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
