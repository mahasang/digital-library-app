import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';

/**
 * รับ deep link จากอีเมลยืนยันบัญชี (Supabase ส่ง access_token/refresh_token
 * มาให้) — ใช้ Linking.useURL() แล้ว parse เอง (ไม่ใช้ useLocalSearchParams())
 * เพราะ Supabase ส่ง token มาทาง URL fragment (#access_token=...) ไม่ใช่ query
 * string เสมอไป เหมือนกับที่ signInWithGoogle() ใน lib/auth.ts ต้องเช็คทั้ง
 * url.searchParams และ url.hash — ใช้วิธี parse แบบเดียวกันที่นี่เพื่อความ
 * สอดคล้องและมั่นใจว่าจับ token ได้ไม่ว่า Supabase จะส่งมารูปแบบไหน
 */
function parseAuthParams(url: string) {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));

  return {
    accessToken: parsed.searchParams.get('access_token') ?? hashParams.get('access_token'),
    refreshToken: parsed.searchParams.get('refresh_token') ?? hashParams.get('refresh_token'),
    errorDescription:
      parsed.searchParams.get('error_description') ?? hashParams.get('error_description'),
    error: parsed.searchParams.get('error') ?? hashParams.get('error'),
  };
}

export default function AuthCallbackScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const url = Linking.useURL();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!url) return;

    async function handleCallback(currentUrl: string) {
      const { accessToken, refreshToken, error } = parseAuthParams(currentUrl);

      if (error || !accessToken || !refreshToken) {
        setStatus('error');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setStatus('error');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      setStatus('success');
      setTimeout(() => router.replace('/(auth)/login?confirmed=1' as any), 1500);
    }

    handleCallback(url);
  }, [url]);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.text.secondary }]}>
            {t('auth_verifying')}
          </Text>
        </>
      )}
      {status === 'success' && (
        <Text style={[styles.text, { color: colors.primary }]}>{t('auth_verified')}</Text>
      )}
      {status === 'error' && (
        <Text style={[styles.text, { color: colors.error }]}>{t('auth_verify_failed')}</Text>
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    text: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.xl },
  });
}
