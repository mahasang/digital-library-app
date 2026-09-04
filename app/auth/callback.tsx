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
    // lib/auth.ts จะ call setSession() เอง (flow อื่น เช่น Google sign-in)
    // callback screen นี้แค่รอแล้ว redirect ไปหน้าแรก
    const timer = setTimeout(async () => {
      // Supabase ใส่ token/type ไว้ใน URL fragment (#access_token=...&type=recovery)
      // Expo Router ไม่แยก param แต่ละตัวออกจาก fragment ให้ — รวมทั้งก้อนไว้ใน
      // param ชื่อ '#' ต้อง parse เองด้วย URLSearchParams (เหมือน lib/auth.ts)
      const rawHash = typeof params['#'] === 'string' ? params['#'] : '';
      const hashParams = new URLSearchParams(rawHash);
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') ?? '';

      if (type === 'recovery' && accessToken) {
        // reset password flow — set session จาก recovery token ก่อน แล้วค่อยไปหน้า
        // reset password (updateUser() ในหน้านั้นต้องมี session ที่ authenticate แล้ว)
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        router.replace('/(auth)/reset-password' as any);
        return;
      }

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
